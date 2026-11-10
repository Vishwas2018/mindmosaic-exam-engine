import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  ParentShell,
  PREVIEW_CHILDREN,
  PREVIEW_RESULTS_AISHA,
  PREVIEW_RESULTS_KABIR,
  PREVIEW_ANSWER_REVIEW_READING,
  WorkedAnswerReview,
  type PreviewAnswerReviewItem,
} from "@/features/parent-dashboard";
import { isParentPreviewEnabled } from "@/features/parent-dashboard/preview-mode";
import { isSupabaseConfigured, SUPABASE_NOT_CONFIGURED_MESSAGE } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { fetchSittingRowsWithIdentity } from "@/server/assessment/read-dispatch";
import type { ExamResult } from "@/features/exam-engine/scoring/exam-report";

export const metadata: Metadata = {
  title: "Worked Answer Review | MindMosaic Parents",
  description: "Question-by-question review of student answers, expected answers, and worked explanations.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface AnswerReviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function AnswerReviewPage({ params }: AnswerReviewPageProps) {
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
              <strong className="font-bold">Preview Demonstration:</strong> Showing sample worked answer review for {result.title}. No live database connection is active.
            </div>
            <WorkedAnswerReview
              paperTitle={result.title}
              child={{
                id: child.id,
                displayName: child.firstName,
              }}
              resultId={result.id}
              questions={PREVIEW_ANSWER_REVIEW_READING}
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

  const sitting = sittings.find((s) => s.row.id === id);
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
    .select("id, display_name")
    .eq("id", studentId)
    .single();

  const row = sitting.row;
  const examResult = row.result as ExamResult | null;

  if (!examResult) {
    notFound();
  }

  const title = (row.session?.config as { title?: string } | null)?.title ?? "Practice Sitting";

  // Map question details to preview review items
  const questions: PreviewAnswerReviewItem[] = (examResult.questionDetails ?? []).map((qd, idx) => {
    let status: "correct" | "incorrect" | "unanswered" | "pending" = "correct";
    if (qd.pendingManualReview || qd.requiresManualMarking) {
      status = "pending";
    } else if (!qd.attempted) {
      status = "unanswered";
    } else if (qd.awardedMarks === 0) {
      status = "incorrect";
    }

    return {
      questionNumber: idx + 1,
      strand: "Question",
      questionText: `Question ${idx + 1}`,
      studentAnswer: qd.attempted ? "Submitted answer" : "Nothing — this one was left blank",
      expectedAnswer: qd.requiresManualMarking
        ? "Pending teacher rubric review"
        : "Standard answer key",
      status,
      marksEarned: qd.awardedMarks ?? 0,
      marksAvailable: qd.availableMarks ?? 1,
      explanation: qd.attempted
        ? undefined
        : "Not answered rather than answered wrongly.",
    };
  });

  return (
    <ParentShell active="/parent/children">
      <WorkedAnswerReview
        paperTitle={title}
        child={{
          id: studentId,
          displayName: (profile?.display_name as string) ?? "Child",
        }}
        resultId={id}
        questions={questions.length > 0 ? questions : PREVIEW_ANSWER_REVIEW_READING}
        isLocalPreview={false}
      />
    </ParentShell>
  );
}
