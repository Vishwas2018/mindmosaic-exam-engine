/**
 * Pure derivation logic for the essay/manual-review marking queue — no
 * Supabase import, so this can be unit-tested directly (mirrors
 * src/features/teacher/analytics.ts vs data.ts: pure logic here, Supabase
 * reads in marking-data.ts).
 *
 * "Pending" is never a stored status on either model. The scorer flags a
 * question as needing a person — `pendingManualReview` inside the immutable
 * `exam_attempts.result` on the legacy side, `session_responses.score_status =
 * 'manual_review'` on the target side — and a mark is a separate row that
 * appears once a teacher records one. deriveMarkingQueue is the single place
 * that computes pending by diffing the flag against the presence of that row.
 *
 * THE QUEUE IS KEYED ON THE SITTING, not on the legacy attempt. It used to be
 * keyed on `exam_attempts.id`, which is an identity only one of the two models
 * has: a target sitting has no attempt, so a queue that spoke attempt ids could
 * only ever list legacy work (ADR-005 Amendment B4). The session id is the
 * identity the resolution rule is expressed in and the one both models carry,
 * so it is what the queue, the deep link and the write path all use now. Which
 * TABLE the mark lands in is decided from `origin`, in one place — the marking
 * route — rather than by the identity travelling through the UI.
 */

export interface ManualReviewQuestionForMarking {
  questionId: string;
  availableMarks: number;
  /**
   * The served-item id `record_manual_mark` writes against. Null on a legacy
   * sitting, whose marks are keyed by the bare question id because that is the
   * only per-question identity that model ever recorded.
   */
  sessionItemId: string | null;
}

export interface SittingForMarking {
  /** The session id, on both models. */
  id: string;
  origin: "legacy" | "version_pinned";
  studentId: string;
  submittedAt: string;
  /** Only the questions this sitting actually flagged for manual review. */
  manualReviewQuestions: ManualReviewQuestionForMarking[];
}

export interface ManualMarkRow {
  sessionId: string;
  questionId: string;
  markedBy: string;
  awardedMarks: number;
  maxMarks: number;
  feedback: string | null;
  markedAt: string;
}

export type MarkingStatus = "pending" | "marked";

export interface MarkingQueueItem {
  sessionId: string;
  origin: "legacy" | "version_pinned";
  studentId: string;
  submittedAt: string;
  questionId: string;
  sessionItemId: string | null;
  availableMarks: number;
  status: MarkingStatus;
  awardedMarks: number | null;
  feedback: string | null;
  markedAt: string | null;
}

export interface MarkingQueueSitting {
  sessionId: string;
  origin: "legacy" | "version_pinned";
  studentId: string;
  submittedAt: string;
  items: MarkingQueueItem[];
  /** True once every manual-review question on this sitting has been marked. */
  fullyMarked: boolean;
}

/**
 * Pure derivation of the marking queue: one MarkingQueueItem per
 * manual-review question, 'pending' unless a matching mark exists. Grouped per
 * sitting so the UI can drop one from the "needs marking" list the moment its
 * last item is marked.
 */
export function deriveMarkingQueue(
  sittings: readonly SittingForMarking[],
  marks: readonly ManualMarkRow[],
): MarkingQueueSitting[] {
  const markByKey = new Map(
    marks.map((mark) => [`${mark.sessionId}:${mark.questionId}`, mark]),
  );

  return sittings.map((sitting) => {
    const items: MarkingQueueItem[] = sitting.manualReviewQuestions.map((question) => {
      const mark = markByKey.get(`${sitting.id}:${question.questionId}`);
      return {
        sessionId: sitting.id,
        origin: sitting.origin,
        studentId: sitting.studentId,
        submittedAt: sitting.submittedAt,
        questionId: question.questionId,
        sessionItemId: question.sessionItemId,
        availableMarks: question.availableMarks,
        status: mark ? "marked" : "pending",
        awardedMarks: mark?.awardedMarks ?? null,
        feedback: mark?.feedback ?? null,
        markedAt: mark?.markedAt ?? null,
      };
    });

    return {
      sessionId: sitting.id,
      origin: sitting.origin,
      studentId: sitting.studentId,
      submittedAt: sitting.submittedAt,
      items,
      fullyMarked: items.every((item) => item.status === "marked"),
    };
  });
}
