/**
 * Pure derivation logic for the essay/manual-review marking queue — no
 * Supabase import, so this can be unit-tested directly (mirrors
 * src/features/teacher/analytics.ts vs data.ts: pure logic here, Supabase
 * reads in marking-data.ts).
 *
 * exam_attempts.result is immutable (docs/DATA_MODEL_AND_ROLES.md) and
 * already marks each essay-type response with `pendingManualReview`
 * (src/features/exam-engine/scoring/exam-report.ts). Marking never rewrites
 * that jsonb blob; instead essay_marks holds one row per (attempt, question)
 * once a teacher has recorded a mark. "Pending" is therefore never a stored
 * status — deriveMarkingQueue is the single place that computes it by
 * diffing a question flagged pendingManualReview against the presence of an
 * essay_marks row.
 */

export interface AttemptForMarking {
  id: string;
  studentId: string;
  submittedAt: string;
  /** Only the questions this attempt actually flagged for manual review. */
  manualReviewQuestions: { questionId: string; availableMarks: number }[];
}

export interface EssayMarkRow {
  attemptId: string;
  questionId: string;
  markedBy: string;
  awardedMarks: number;
  maxMarks: number;
  feedback: string | null;
  markedAt: string;
}

export type MarkingStatus = "pending" | "marked";

export interface MarkingQueueItem {
  attemptId: string;
  studentId: string;
  submittedAt: string;
  questionId: string;
  availableMarks: number;
  status: MarkingStatus;
  awardedMarks: number | null;
  feedback: string | null;
  markedAt: string | null;
}

export interface MarkingQueueAttempt {
  attemptId: string;
  studentId: string;
  submittedAt: string;
  items: MarkingQueueItem[];
  /** True once every manual-review question on this attempt has been marked. */
  fullyMarked: boolean;
}

/**
 * Pure derivation of the marking queue: one MarkingQueueItem per
 * manual-review question, 'pending' unless a matching essay_marks row
 * exists. Grouped per attempt so the UI can drop an attempt from the
 * "needs marking" list the moment its last item is marked.
 */
export function deriveMarkingQueue(
  attempts: readonly AttemptForMarking[],
  marks: readonly EssayMarkRow[],
): MarkingQueueAttempt[] {
  const markByKey = new Map(
    marks.map((mark) => [`${mark.attemptId}:${mark.questionId}`, mark]),
  );

  return attempts.map((attempt) => {
    const items: MarkingQueueItem[] = attempt.manualReviewQuestions.map((question) => {
      const mark = markByKey.get(`${attempt.id}:${question.questionId}`);
      return {
        attemptId: attempt.id,
        studentId: attempt.studentId,
        submittedAt: attempt.submittedAt,
        questionId: question.questionId,
        availableMarks: question.availableMarks,
        status: mark ? "marked" : "pending",
        awardedMarks: mark?.awardedMarks ?? null,
        feedback: mark?.feedback ?? null,
        markedAt: mark?.markedAt ?? null,
      };
    });

    return {
      attemptId: attempt.id,
      studentId: attempt.studentId,
      submittedAt: attempt.submittedAt,
      items,
      fullyMarked: items.every((item) => item.status === "marked"),
    };
  });
}
