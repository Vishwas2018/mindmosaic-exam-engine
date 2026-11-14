import "server-only";

import { requireRole } from "@/features/auth/require-role";
import { requireAdminAccess } from "@/server/admin-access";
import { getExamBank } from "@/server/exam-bank";
import { getPublicationEligibility } from "@/server/publication-evidence";
import type {
  AdminWorkspaceData,
  AdminMetric,
  AdminQuestionSummary,
  AdminApprovalItem,
  AdminPaperSummary,
  AdminActivityItem,
} from "@/features/admin/types";

/**
 * Server-only authenticated DEV data adapter.
 *
 * Enforces admin authorization, connects to verified DEV Supabase views/tables,
 * reads authentic exam banks and draft catalogues, and provides honest
 * unavailable states for unbuilt services without ever fabricating data.
 */
export async function getAuthenticatedDevAdminData(): Promise<AdminWorkspaceData> {
  const auth = await requireRole("admin", "/admin");
  const access = await requireAdminAccess();

  const reviewerName = auth.configured ? `Admin (${auth.userId.slice(0, 8)})` : "Authorized Admin";
  const reviewerEmail = undefined;

  // 1. Publication Manifest & Bank
  const publicationEligibility = getPublicationEligibility();
  const practiceBank = getExamBank("practice");

  // Default metrics
  let totalAttempts = 0;
  let activeStudents = 0;
  let approvalsCount = 0;
  const approvalsList: AdminApprovalItem[] = [];
  const activityList: AdminActivityItem[] = [];

  // 2. Load authentic database records if Supabase is connected
  if (access.status === "ok") {
    const supabase = access.supabase;

    // Platform totals view
    const { data: totals } = await supabase.from("admin_platform_totals").select("*").maybeSingle();
    if (totals) {
      totalAttempts = typeof totals.total_attempts === "number" ? totals.total_attempts : 0;
      activeStudents = typeof totals.active_students === "number" ? totals.active_students : 0;
    }

    // Draft review approvals table
    const { data: approvals } = await supabase
      .from("admin_draft_review_approvals")
      .select("question_id, content_hash, approved_by, approved_at, checks")
      .order("approved_at", { ascending: false });

    if (approvals && Array.isArray(approvals)) {
      approvalsCount = approvals.length;
      for (const row of approvals) {
        /* The row holds question id, content hash, approver, time and the three fixed review checks. Year, subject,
           author and any other check are not recorded here, so they are left out rather than assumed (D-013). */
        approvalsList.push({
          id: row.question_id,
          title: `Draft Question ${row.question_id}`,
          tamperEvidentHash: row.content_hash,
          isApproved: true,
          approvedBy: row.approved_by,
          approvedAt: row.approved_at,
        });

        activityList.push({
          id: `ACT-${row.content_hash.slice(0, 8)}`,
          actor: `Reviewer (${row.approved_by.slice(0, 8)}...)`,
          action: "Human sign-off approved (Rule #8)",
          target: `${row.question_id}`,
          timestamp: new Date(row.approved_at).toLocaleString("en-AU", { timeZone: "Australia/Sydney" }),
          badgeTone: "success",
          hash: row.content_hash,
        });
      }
    }
  }

  // 3. Draft items awaiting publication review
  const pendingCount = publicationEligibility.pendingPublication.length;

  // Add system activity for publication manifest
  /* Reports what was read, not a verification: nothing here recomputes a hash. */
  const evidenceProblems = publicationEligibility.problems.length;
  activityList.push({
    id: "ACT-SYS-MANIFEST",
    actor: "Publication evidence",
    action: "Publication records read at page load",
    target: `${publicationEligibility.questions.length} questions with publication records${
      evidenceProblems ? `, ${evidenceProblems} problems` : ""
    }`,
    timestamp: "This page load",
    badgeTone: evidenceProblems ? "warning" : "info",
    hash: "not-computed",
  });

  // 4. Map Bank questions to question summaries
  const questions: AdminQuestionSummary[] = practiceBank.slice(0, 100).map((q) => ({
    id: q.id,
    title: q.prompt.slice(0, 80),
    yearLevel: q.yearLevel,
    subject: q.metadata.subject,
    status: "published",
    author: "Not recorded",
    lastUpdated: "Not recorded",
    hasVisual: !!(q.visuals && q.visuals.length > 0),
    prompt: q.prompt,
  }));

  // 5. Authentic metrics
  const metrics: AdminMetric[] = [
    {
      label: "Draft questions in review",
      count: pendingCount,
      change: `${pendingCount} awaiting publication`,
      trend: "neutral",
      detail: "Pending publication pipeline or in /admin/review",
    },
    {
      /* Every row in the approvals table is a sign-off, so a count of "awaiting" items from it was always 0. */
      label: "Recorded draft sign-offs",
      count: approvalsCount,
      change: "Rows in the draft review approvals table",
      trend: "neutral",
      detail: "Rule #8 mandatory human gate before publication",
    },
    {
      label: "Active student attempts (DEV)",
      count: totalAttempts,
      change: `${activeStudents} active learners`,
      trend: "neutral",
      detail: "Aggregated platform totals view",
    },
    {
      label: "Questions with publication records",
      count: publicationEligibility.questions.length,
      change: evidenceProblems ? `${evidenceProblems} evidence problems` : "No evidence problems reported",
      trend: evidenceProblems ? "warning" : "neutral",
      detail: "Read from the publication manifests and approval records",
    },
  ];

  // 6. Paper readiness
  /* Only what the practice bank and the publication evidence say. The two scholarship "draft papers" that were here
     (40 items, 45 minutes, "staged") existed nowhere else, and every practice item was counted as approved. */
  const withPublicationRecord = new Set(publicationEligibility.questions.map((q) => (typeof q === "string" ? q : q.id)));
  const practicePaper = (yearLevel: 3 | 5): AdminPaperSummary => {
    const items = practiceBank.filter((q) => q.yearLevel === yearLevel);
    const approved = items.filter((q) => withPublicationRecord.has(q.id)).length;
    return {
      code: `P-PUB-Y${yearLevel}-NUM`,
      title: `Year ${yearLevel} Practice Bank Numeracy`,
      items: items.length,
      durationMinutes: 40,
      status: items.length > 0 && approved === items.length ? "ready" : "in_review",
      approvedItemsCount: approved,
    };
  };
  const papers: AdminPaperSummary[] = [practicePaper(3), practicePaper(5)];

  return {
    source: "dev",
    reviewer: {
      name: reviewerName,
      role: "Authorized Administrator",
      email: reviewerEmail,
    },
    metrics,
    questions,
    approvals: approvalsList,
    papers,
    writing: {
      items: [],
      availability: {
        isAvailable: false,
        reason:
          "Admin writing marking queue requires a server-side double-blind anonymisation RPC to prevent student identity exposure.",
        requiredDependency: "Awaiting migration: admin_redacted_writing_queue",
      },
    },
    support: {
      items: [],
      availability: {
        isAvailable: false,
        reason:
          "Question problem report triage table is not yet deployed on DEV Supabase. Direct child profiles remain restricted per privacy guardrails.",
        requiredDependency: "Awaiting migration: student_question_reports",
      },
    },
    activity: activityList,
    /* No publication time or root hash is recorded for the live set, so neither is shown. The previous values were
       the page-load time and a constant. */
    manifest: {
      id: "DEV-MANIFEST-CURRENT",
      liveQuestionsCount: publicationEligibility.questions.length,
    },
  };
}
