"use server";

import { z } from "zod";

import { requireRole } from "@/features/auth/require-role";
import {
  REVIEW_DECISION_KINDS,
  reviewBankIdSchema,
  reviewChecksSchema,
  type ReviewDecisionRecord,
} from "@/features/admin-review/contracts";
import {
  getKnownDefectiveRevision,
  validateHumanReviewerName,
} from "@/features/admin-review/pool-classification";
import { createClient } from "@/lib/supabase/server";
import {
  computeReviewEvidenceFingerprint,
  loadAdminReviewCatalogue,
} from "@/server/admin-review";

const legacyApprovalSchema = z
  .object({
    questionId: z.string().min(1).max(100),
    contentHash: z.string().regex(/^[a-f0-9]{64}$/),
    checks: z
      .object({
        correctness: z.literal(true),
        originality: z.literal(true),
        ageAppropriateness: z.literal(true),
      })
      .strict(),
  })
  .strict();

const decisionInputSchema = z
  .object({
    bankId: reviewBankIdSchema,
    questionId: z.string().min(1).max(100),
    contentHash: z.string().regex(/^[a-f0-9]{64}$/),
    publishedContentHash: z.string().regex(/^[a-f0-9]{64}$/),
    decision: z.enum(REVIEW_DECISION_KINDS),
    checks: reviewChecksSchema,
    blindSolved: z.boolean(),
    notes: z.string().max(4000).default(""),
    reviewerName: z.string().trim().max(120).optional(),
  })
  .strict();

// A Server Action has its own authenticated boundary; the layout is insufficient.
// Next also checks the request Origin for Server Actions.
export async function approveDraft(
  input: unknown,
): Promise<{ error?: string; approvedAt?: string; approvedBy?: string }> {
  const access = await requireRole("admin", "/admin/review");
  if (!access.configured) return { error: "Sign-in is unavailable." };
  const parsed = legacyApprovalSchema.safeParse(input);
  if (!parsed.success)
    return { error: "Confirm every approval check before recording approval." };
  const { questionId, contentHash, checks } = parsed.data;
  const catalogue = await loadAdminReviewCatalogue();
  const supabase = await createClient();
  if (
    catalogue.extendedDecisionsAvailable &&
    typeof supabase.auth?.getUser === "function"
  ) {
    return {
      error:
        "Extended human review decisions are active. Use the full 5-check decision workflow in /admin/review.",
    };
  }
  const current = catalogue.entries.find(
    (entry) => entry.question.id === questionId,
  );
  if (!current || current.contentHash !== contentHash)
    return {
      error:
        "This draft revision has changed or is unavailable. Reload and review it again.",
    };
  const knownDefect = getKnownDefectiveRevision(questionId, contentHash);
  if (knownDefect) {
    return {
      error: `Approval is blocked for known defective revision (${knownDefect.defectId}): ${knownDefect.reason}`,
    };
  }
  const { data, error } = await supabase
    .from("admin_draft_review_approvals")
    .insert({
      question_id: questionId,
      content_hash: contentHash,
      approved_by: access.userId,
      checks,
    })
    .select("approved_at, approved_by")
    .single();
  if (error)
    return {
      error:
        "Approval could not be recorded. Check the review migration and access permissions; no publication was requested.",
    };
  return { approvedAt: data.approved_at, approvedBy: data.approved_by };
}

/**
 * Records an explicit, revision-bound human review decision (`approve`, `revise`
 * or `reject`) into `public.admin_draft_review_decisions`.
 *
 * Security & governance invariants:
 * 1. Re-enforces `requireRole("admin", "/admin/review")` at the Server Action boundary.
 * 2. Derives `reviewer_id` and `reviewer_email` exclusively from the authenticated
 *    Supabase session — never from client input.
 * 3. Rejects AI/bot/automated/single-word reviewer names via `validateHumanReviewerName`.
 * 4. Re-loads the draft bank server-side and verifies both D1 (`contentHash`) and
 *    D3 (`publishedContentHash`) before writing.
 * 5. Never publishes content, never writes to student attempts or production banks.
 */
export async function recordReviewDecision(input: unknown): Promise<{
  error?: string;
  decision?: ReviewDecisionRecord;
}> {
  const access = await requireRole("admin", "/admin/review");
  if (!access.configured) return { error: "Sign-in is unavailable." };

  const parsed = decisionInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error:
        "Review submission is incomplete. Check your decision, reviewer full name and required checks.",
    };
  }

  const {
    bankId,
    questionId,
    contentHash,
    publishedContentHash,
    decision,
    checks,
    blindSolved,
    notes,
    reviewerName: rawReviewerName,
  } = parsed.data;

  const trimmedNotes = notes.trim();
  if (rawReviewerName !== undefined && rawReviewerName.length > 0) {
    const clientNameCheck = validateHumanReviewerName(rawReviewerName);
    if (!clientNameCheck.ok) {
      return { error: clientNameCheck.error };
    }
  }

  if (decision === "approve") {
    const knownDefect = getKnownDefectiveRevision(questionId, contentHash);
    if (knownDefect) {
      return {
        error: `Approval is blocked for known defective revision (Defect ${knownDefect.defectId}): ${knownDefect.reason} Record 'Request revision' or 'Reject' instead.`,
      };
    }
    const allChecked =
      checks.correctness &&
      checks.originality &&
      checks.ageAppropriateness &&
      checks.editorialInterpretation &&
      checks.difficultyCalibrated;
    if (!allChecked) {
      return {
        error:
          "Confirm all five governance checks before recording human approval.",
      };
    }
  } else if (trimmedNotes.length < 10) {
    return {
      error:
        "Provide at least 10 characters of clear review notes when requesting a revision or rejecting an item.",
    };
  }

  const catalogue = await loadAdminReviewCatalogue({ bankId });
  const current = catalogue.entries.find(
    (entry) => entry.question.id === questionId,
  );
  if (
    !current ||
    current.contentHash !== contentHash ||
    current.publishedContentHash !== publishedContentHash
  ) {
    return {
      error:
        "This draft revision has changed or is unavailable. Reload and review the current revision again.",
    };
  }

  const supabase = await createClient();
  const authResult = await supabase.auth?.getUser?.();
  const authUser = authResult?.data?.user;
  const reviewerEmail = authUser?.email?.trim() ?? "";
  if (!authUser || authUser.id !== access.userId || !reviewerEmail) {
    return {
      error:
        "Authenticated reviewer session could not be verified. Sign in again before recording a decision.",
    };
  }

  // Authoritative server-side reviewer identity (fail closed):
  // reviewer_id and reviewer_email come exclusively from supabase.auth.getUser(),
  // and reviewer_name comes exclusively from public.profiles.display_name (also
  // enforced in Postgres RLS). Clients can NEVER supply or impersonate another name.
  const profileResult = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", access.userId)
    .single();
  if (profileResult.error || !profileResult.data) {
    return {
      error:
        "Authenticated reviewer profile could not be verified. Reload or sign in again before recording a decision.",
    };
  }
  const serverDisplayName =
    typeof profileResult.data.display_name === "string"
      ? profileResult.data.display_name
      : null;
  const serverNameCheck = validateHumanReviewerName(serverDisplayName);
  if (!serverNameCheck.ok) {
    return {
      error:
        "Your authenticated admin profile must have a verified full human name (first and last name) before recording review decisions. Update your profile display name; AI, automated or single-word names are refused.",
    };
  }
  if (rawReviewerName && rawReviewerName.trim().length > 0) {
    const normalizedClient = rawReviewerName.trim().replace(/\s+/g, " ");
    if (
      normalizedClient.toLowerCase() !==
      serverNameCheck.normalized.toLowerCase()
    ) {
      return {
        error:
          "Reviewer name must match your authenticated admin profile name. Reviewer identity is bound server-side and cannot be impersonated.",
      };
    }
  }
  const effectiveReviewerName = serverNameCheck.normalized;

  const resolvedBatchId = current.batchId ?? current.source;
  const resolvedItemKind = current.itemKind ?? "question";
  const resolvedPool = current.pool ?? "practice";
  const resolvedRevisionNumber = current.revisionNumber ?? 0;
  const sourceRevision =
    current.sourceRevision ?? `${bankId}@v${resolvedRevisionNumber}`;
  const evidenceFingerprint = computeReviewEvidenceFingerprint({
    bankId,
    batchId: resolvedBatchId,
    questionId,
    itemKind: resolvedItemKind,
    pool: resolvedPool,
    sourceRevision,
    revisionNumber: resolvedRevisionNumber,
    contentHash,
    candidateHash: current.candidateHash ?? null,
    publishedContentHash,
    decision,
    checks,
    blindSolved,
    notes: trimmedNotes,
    reviewerId: access.userId,
    reviewerName: effectiveReviewerName,
    reviewerEmail,
  });

  const { data, error } = await supabase
    .from("admin_draft_review_decisions")
    .insert({
      bank_id: bankId,
      batch_id: resolvedBatchId,
      question_id: questionId,
      item_kind: resolvedItemKind,
      pool: resolvedPool,
      source_revision: sourceRevision,
      revision_number: resolvedRevisionNumber,
      content_hash: contentHash,
      candidate_hash: current.candidateHash ?? null,
      published_content_hash: publishedContentHash,
      decision,
      checks,
      blind_solved: blindSolved,
      notes: trimmedNotes,
      reviewer_id: access.userId,
      reviewer_name: effectiveReviewerName,
      reviewer_email: reviewerEmail,
      question_snapshot:
        resolvedItemKind === "writing_prompt" && current.writingTask
          ? { question: current.question, writingTask: current.writingTask }
          : current.question,
      evidence_fingerprint: evidenceFingerprint,
    })
    .select("id, decided_at, reviewer_id, reviewer_name, reviewer_email, evidence_fingerprint")
    .single();

  if (error || !data) {
    const code = (error as { code?: string } | null)?.code;
    if (code === "23505") {
      return {
        error:
          "You have already recorded an approval for this exact question revision.",
      };
    }
    return {
      error:
        "Review decision could not be recorded. Confirm the DEV admin review decisions migration is applied and your admin account is active; no publication was requested.",
    };
  }

  return {
    decision: {
      id: data.id,
      decision,
      approvedBy: data.reviewer_id,
      reviewerName: data.reviewer_name,
      reviewerEmail: data.reviewer_email,
      decidedAt: data.decided_at,
      contentHash,
      publishedContentHash,
      sourceRevision,
      revisionNumber: resolvedRevisionNumber,
      notes: trimmedNotes,
      blindSolved,
      checks,
      evidenceFingerprint: data.evidence_fingerprint,
      matchesCurrentRevision: true,
      isLegacyApproval: false,
    },
  };
}

/**
 * One draft's identity and independent-review findings for the approval screen.
 * Lives beside the approval actions so the private catalogue reader keeps its
 * strict importer boundary. Admin only; returns no question content.
 */
export async function getDraftForApproval(questionId: string): Promise<{
  contentHash: string;
  sourceRevision?: string;
  findings?: NonNullable<
    Awaited<ReturnType<typeof loadAdminReviewCatalogue>>["entries"][number]["findings"]
  >;
  approval?: { approvedBy: string; approvedAt: string };
} | null> {
  const access = await requireRole("admin", "/admin/review");
  if (!access.configured) return null;
  if (
    typeof questionId !== "string" ||
    questionId.length === 0 ||
    questionId.length > 100
  )
    return null;
  const primary = await loadAdminReviewCatalogue();
  let entry = primary.entries.find((e) => e.question.id === questionId);
  if (!entry && questionId.startsWith("vihaan-")) {
    const vihaan = await loadAdminReviewCatalogue({
      bankId: "vihaan-scholarship-500",
    });
    entry = vihaan.entries.find((e) => e.question.id === questionId);
  }
  if (!entry) return null;
  return {
    contentHash: entry.contentHash,
    sourceRevision: entry.sourceRevision,
    findings: entry.findings,
    approval: entry.approval
      ? {
          approvedBy: entry.approval.reviewerName ?? entry.approval.approvedBy,
          approvedAt: entry.approval.approvedAt,
        }
      : undefined,
  };
}
