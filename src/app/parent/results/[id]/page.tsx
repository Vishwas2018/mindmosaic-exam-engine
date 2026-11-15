import { skillLabel } from "@/features/parent-dashboard/skill-label";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  PaperResultView,
  ParentShell,
  PREVIEW_CHILDREN,
  PREVIEW_RESULTS_AISHA,
  PREVIEW_RESULTS_KABIR,
  type PreviewPaperResult,
} from "@/features/parent-dashboard";
import { isParentPreviewEnabled } from "@/features/parent-dashboard/preview-mode";
import { isSupabaseConfigured, SUPABASE_NOT_CONFIGURED_MESSAGE } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { fetchSittingRowsWithIdentity } from "@/server/assessment/read-dispatch";
import type { ExamResult } from "@/features/exam-engine/scoring/exam-report";

export const metadata: Metadata = {
  title: "Assessment Result | MindMosaic Parents",
  description: "Marked scores, pending questions, time taken, and strand breakdown for this sitting.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface ResultPageProps {
  params: Promise<{ id: string }>;
}

export default async function ResultPage({ params }: ResultPageProps) {
  const { id } = await params;

  // Local loopback preview demonstration mode
  if (!isSupabaseConfigured) {
    if (await isParentPreviewEnabled()) {
      const allResults = [...PREVIEW_RESULTS_AISHA, ...PREVIEW_RESULTS_KABIR];
      const result =
        allResults.find((r) => r.id === id) ??
        PREVIEW_RESULTS_AISHA.find((r) => r.id === "res-reading-301") ??
        PREVIEW_RESULTS_AISHA[0];

      if (!result) {
        notFound();
      }

      const child =
        PREVIEW_CHILDREN.find((c) => c.id === result.childId) ?? PREVIEW_CHILDREN[0];

      return (
        <ParentShell active="/parent/children">
          <div className="space-y-6">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-xs font-medium text-amber-900">
              <strong className="font-bold">Preview Demonstration:</strong> Showing sample paper result for {result.title}. No live database connection is active.
            </div>
            <PaperResultView
              result={result}
              child={{
                id: child.id,
                displayName: child.firstName,
                yearLevel: child.yearLevel,
              }}
              isLocalPreview={true}
            />
          </div>
        </ParentShell>
      );
    }

    return (
      <ParentShell active="/parent/children">
        <div className="p-8 text-center text-muted">
          <p className="font-bold text-ink">Database Not Configured</p>
          <p className="mt-2 text-sm">{SUPABASE_NOT_CONFIGURED_MESSAGE}</p>
        </div>
      </ParentShell>
    );
  }

  // Authenticated Production/Dev Mode with Supabase
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  // Load attempt sitting row
  const sittings = await fetchSittingRowsWithIdentity(supabase, {
    limit: 500,
  });

  // Links use the sitting's row id; an attempt id (as in a support message) resolves to the same sitting.
  const sitting = sittings.find((s) => s.row.id === id || s.attemptId === id);
  if (!sitting) {
    notFound();
  }

  const studentId = sitting.studentId;

  // Authorization check: Verify that this student is linked to the parent
  const { data: link, error: linkError } = await supabase
    .from("parent_children")
    .select("child_id")
    .eq("parent_id", user.id)
    .eq("child_id", studentId)
    .maybeSingle();

  if (linkError || !link) {
    notFound();
  }

  // Load child profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, year_level")
    .eq("id", studentId)
    .single();

  const row = sitting.row;
  const examResult = row.result as ExamResult | null;

  if (!examResult) {
    notFound();
  }

  const title = (row.session?.config as { title?: string } | null)?.title ?? "Practice Sitting";
  const subject = (row.session?.config as { subject?: string } | null)?.subject ?? "numeracy";
  const submittedDate = row.submitted_at
    ? new Date(row.submitted_at).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })
    : "Recent";

  const isAwaiting = (examResult.manualReviewQuestions ?? 0) > 0;

  // Extract strands
  const strands: Array<{ name: string; marksEarned: number; marksAvailable: number; papersCount?: number }> = [];
  if (examResult.breakdowns?.bySkill) {
    for (const [skillKey, rowStats] of Object.entries(examResult.breakdowns.bySkill)) {
      strands.push({
        name: skillLabel(skillKey),
        marksEarned: rowStats.objectiveMarksEarned,
        marksAvailable: rowStats.objectiveMarksAvailable,
        papersCount: 1,
      });
    }
  }

  const paperResult: PreviewPaperResult = {
    id: row.id as string,
    childId: studentId,
    title,
    subject: subject as "numeracy" | "reading" | "language" | "writing",
    date: submittedDate,
    timed: (row.session?.config as { timing?: string } | null)?.timing === "timed",
    durationMinutes: Math.round((examResult.timeTakenSeconds ?? 0) / 60),
    allowedMinutes: null,
    marksEarned: examResult.objectiveMarksEarned ?? 0,
    marksAvailable: examResult.objectiveMarksAvailable ?? 0,
    questionsAnswered: examResult.attemptedQuestions ?? 0,
    totalQuestions: examResult.totalQuestions ?? 0,
    pendingQuestions: examResult.manualReviewQuestions ?? 0,
    pendingMarks: examResult.pendingManualMarks ?? 0,
    status: isAwaiting ? "awaiting_person" : "finished",
    statusLabel: isAwaiting ? `${examResult.manualReviewQuestions} awaiting a person` : "Complete",
    strands,
  };

  return (
    <ParentShell active="/parent/children">
      <PaperResultView
        result={paperResult}
        child={{
          id: studentId,
          displayName: (profile?.display_name as string) ?? "Child",
          yearLevel: (profile?.year_level as number | null) ?? 3,
        }}
        isLocalPreview={false}
      />
    </ParentShell>
  );
}
