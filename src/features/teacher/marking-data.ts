import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  fetchManualMarks,
  fetchManualReviewSittings,
} from "@/server/assessment/read-dispatch";

import type { ManualMarkRow, SittingForMarking } from "./marking-queue";

/**
 * Read-side Supabase queries for the essay/manual-review marking queue.
 * Every query runs as the signed-in teacher through the anon-key server
 * client (same as src/features/teacher/data.ts), and since §12.7 step 8 they
 * go through the shared resolution views rather than naming a model's tables:
 * `visible_sitting_questions` for what needs marking and
 * `visible_manual_marks` for what has been marked. Both carry the teacher
 * predicate the base policies carry, so RLS is still the enforcement
 * mechanism and the marking screen no longer has to know which model a
 * sitting is on. Pure derivation logic (deriveMarkingQueue) lives in
 * ./marking-queue so it can be unit-tested without a "server-only" import
 * getting in the way.
 *
 * Both models are listed now. Step 8 filtered this to legacy origin because a
 * target sitting had no write path to clear it with; 20260816100000 added one,
 * which is what §12.7 step 8's "verified on the target model before its legacy
 * reader is removed" was waiting on.
 */

type Supabase = SupabaseClient;

/**
 * Sittings belonging to the given students that contain at least one
 * manual-review response, from whichever model created them. RLS re-checks
 * every row against the teacher's own classes, so an out-of-class student id
 * simply yields nothing for it.
 */
export async function listManualReviewSittings(
  supabase: Supabase,
  studentIds: readonly string[],
): Promise<SittingForMarking[]> {
  const sittings = await fetchManualReviewSittings(supabase, studentIds);

  return sittings.map((sitting) => ({
    id: sitting.sessionId,
    origin: sitting.origin,
    studentId: sitting.studentId,
    submittedAt: sitting.submittedAt,
    manualReviewQuestions: sitting.questions.map((question) => ({
      questionId: question.questionKey,
      availableMarks: question.availableMarks,
      sessionItemId: question.sessionItemId,
    })),
  }));
}

/**
 * Marks already awarded for these sittings, from whichever model holds them.
 *
 * Keyed on the SITTING throughout — `essay_marks` hangs off the legacy attempt
 * and `manual_marks` off the target session, and the session is the identity
 * both have. The attempt-id round trip this function used to make existed only
 * because the queue above still spoke attempt ids; it does not any more.
 */
export async function listManualMarks(
  supabase: Supabase,
  sessionIds: readonly string[],
): Promise<ManualMarkRow[]> {
  if (sessionIds.length === 0) return [];

  const marks = await fetchManualMarks(supabase, sessionIds);

  return marks.map((mark) => ({
    sessionId: mark.sessionId,
    questionId: mark.questionKey,
    markedBy: mark.markedBy,
    awardedMarks: mark.awardedMarks,
    maxMarks: mark.maxMarks,
    feedback: mark.feedback,
    markedAt: mark.markedAt,
  }));
}
