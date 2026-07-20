import "server-only";

import { z } from "zod";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { AttemptForMarking, EssayMarkRow } from "./marking-queue";

/**
 * Read-side Supabase queries for the essay/manual-review marking queue.
 * Every query here runs as the signed-in teacher through the anon-key
 * server client (same as src/features/teacher/data.ts), so RLS on
 * exam_attempts and essay_marks is the enforcement mechanism. Pure
 * derivation logic (deriveMarkingQueue) lives in ./marking-queue so it can
 * be unit-tested without a "server-only" import getting in the way.
 */

type Supabase = SupabaseClient;

const questionDetailForMarkingSchema = z.object({
  questionId: z.string(),
  pendingManualReview: z.boolean(),
  availableMarks: z.number(),
});

const resultForMarkingSchema = z.object({
  questionDetails: z.array(questionDetailForMarkingSchema).default([]),
});

const attemptRowSchema = z.object({
  id: z.uuid(),
  student_id: z.uuid(),
  submitted_at: z.string(),
  result: z.unknown(),
});

/**
 * Attempts belonging to the given students that contain at least one
 * manual-review response. RLS re-checks every row against the teacher's own
 * classes, so an out-of-class student id simply yields nothing for it.
 */
export async function listManualReviewAttempts(
  supabase: Supabase,
  studentIds: readonly string[],
): Promise<AttemptForMarking[]> {
  if (studentIds.length === 0) return [];
  const { data, error } = await supabase
    .from("exam_attempts")
    .select("id, student_id, submitted_at, result")
    .in("student_id", [...studentIds])
    .order("submitted_at", { ascending: false });
  if (error) throw new Error(`manual review attempts query failed: ${error.message}`);

  return z
    .array(attemptRowSchema)
    .parse(data ?? [])
    .flatMap((row) => {
      const parsedResult = resultForMarkingSchema.safeParse(row.result);
      if (!parsedResult.success) return [];
      const manualReviewQuestions = parsedResult.data.questionDetails
        .filter((detail) => detail.pendingManualReview)
        .map((detail) => ({
          questionId: detail.questionId,
          availableMarks: detail.availableMarks,
        }));
      if (manualReviewQuestions.length === 0) return [];
      return [
        {
          id: row.id,
          studentId: row.student_id,
          submittedAt: row.submitted_at,
          manualReviewQuestions,
        },
      ];
    });
}

const essayMarkRowSchema = z.object({
  attempt_id: z.uuid(),
  question_id: z.string(),
  marked_by: z.uuid(),
  awarded_marks: z.number(),
  max_marks: z.number(),
  feedback: z.string().nullable(),
  marked_at: z.string(),
});

export async function listEssayMarks(
  supabase: Supabase,
  attemptIds: readonly string[],
): Promise<EssayMarkRow[]> {
  if (attemptIds.length === 0) return [];
  const { data, error } = await supabase
    .from("essay_marks")
    .select("attempt_id, question_id, marked_by, awarded_marks, max_marks, feedback, marked_at")
    .in("attempt_id", [...attemptIds]);
  if (error) throw new Error(`essay marks query failed: ${error.message}`);
  return z
    .array(essayMarkRowSchema)
    .parse(data ?? [])
    .map((row) => ({
      attemptId: row.attempt_id,
      questionId: row.question_id,
      markedBy: row.marked_by,
      awardedMarks: row.awarded_marks,
      maxMarks: row.max_marks,
      feedback: row.feedback,
      markedAt: row.marked_at,
    }));
}
