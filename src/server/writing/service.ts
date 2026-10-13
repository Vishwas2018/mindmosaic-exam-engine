import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { WritingAttemptDto, WritingErrorCode, WritingMarkDto } from "@/features/writing/contracts";

/**
 * Thin wrappers over the writing RPCs. They add no rules of their own: the
 * deadline, the one-open-attempt rule, who may mark whom and the mark total
 * are all decided in Postgres, and this layer only maps rows to DTOs and
 * database error codes to HTTP-shaped outcomes.
 */

export interface WritingAttemptRow {
  id: string;
  task_id: string;
  mode: "timed" | "untimed" | "paper";
  duration_seconds: number | null;
  started_at: string;
  deadline_at: string | null;
  response_text: string;
  response_source: "student_typed" | "parent_typed" | "paper_only";
  submitted_at: string | null;
  submission_reason: "user_submitted" | "timer_expired" | null;
}

export function toAttemptDto(row: WritingAttemptRow, serverNow: number = Date.now()): WritingAttemptDto {
  return {
    id: row.id,
    taskId: row.task_id,
    mode: row.mode,
    durationSeconds: row.duration_seconds,
    startedAt: row.started_at,
    deadlineAt: row.deadline_at ? new Date(row.deadline_at).getTime() : null,
    responseText: row.response_text,
    responseSource: row.response_source,
    submittedAt: row.submitted_at,
    submissionReason: row.submission_reason,
    serverNow,
  };
}

export type WritingOutcome<T> =
  | { ok: true; value: T }
  | { ok: false; status: 400 | 404 | 409 | 500; code: WritingErrorCode };

interface DbError {
  code?: string;
  message?: string;
}

/** MM310-MM313 are defined in the writing migration. */
export function mapWritingDbError(error: DbError): { status: 400 | 404 | 409 | 500; code: WritingErrorCode } {
  switch (error.code) {
    case "MM310":
      return { status: 404, code: "not_found" };
    case "MM311":
      return /not been submitted/.test(error.message ?? "")
        ? { status: 409, code: "not_submitted" }
        : { status: 409, code: "already_submitted" };
    case "MM312":
      return { status: 400, code: "invalid_request" };
    case "MM313":
      return { status: 409, code: "expired" };
    default:
      return { status: 500, code: "server_error" };
  }
}

async function call<T>(
  run: () => PromiseLike<{ data: T | null; error: DbError | null }>,
): Promise<WritingOutcome<T>> {
  const { data, error } = await run();
  if (error) return { ok: false, ...mapWritingDbError(error) };
  if (data === null) return { ok: false, status: 500, code: "server_error" };
  return { ok: true, value: data };
}

export function startWritingAttempt(
  supabase: SupabaseClient,
  input: { taskId: string; mode: "timed" | "untimed"; durationSeconds: number | null },
) {
  return call<WritingAttemptRow>(() =>
    supabase.rpc("start_writing_attempt", {
      p_task_id: input.taskId,
      p_mode: input.mode,
      p_duration_seconds: input.durationSeconds,
    }),
  );
}

export function saveWritingDraft(supabase: SupabaseClient, attemptId: string, text: string) {
  return call<string>(() => supabase.rpc("save_writing_draft", { p_attempt_id: attemptId, p_text: text }));
}

export function submitWritingAttempt(
  supabase: SupabaseClient,
  attemptId: string,
  input: { text?: string; reason: "user_submitted" | "timer_expired" },
) {
  return call<WritingAttemptRow>(() =>
    supabase.rpc("submit_writing_attempt", {
      p_attempt_id: attemptId,
      p_text: input.text ?? null,
      p_reason: input.reason,
    }),
  );
}

export function recordPaperWritingAttempt(
  supabase: SupabaseClient,
  input: { childId: string; taskId: string; text: string | null; durationSeconds: number | null },
) {
  return call<WritingAttemptRow>(() =>
    supabase.rpc("record_paper_writing_attempt", {
      p_child: input.childId,
      p_task_id: input.taskId,
      p_text: input.text,
      p_duration_seconds: input.durationSeconds,
    }),
  );
}

export function recordMarkedPaperAttempt(
  supabase: SupabaseClient,
  input: {
    childId: string;
    taskId: string;
    text: string | null;
    durationSeconds: number | null;
    rubricId: string;
    rubricVersion: number;
    scores: Record<string, number>;
    comments: Record<string, string>;
    feedback: string | null;
  },
) {
  return call<WritingAttemptRow>(() =>
    supabase.rpc("record_marked_paper_attempt", {
      p_child: input.childId,
      p_task_id: input.taskId,
      p_text: input.text,
      p_duration_seconds: input.durationSeconds,
      p_rubric_id: input.rubricId,
      p_rubric_version: input.rubricVersion,
      p_scores: input.scores,
      p_comments: input.comments,
      p_feedback: input.feedback,
    }),
  );
}

export function markWritingAttempt(
  supabase: SupabaseClient,
  attemptId: string,
  input: {
    rubricId: string;
    rubricVersion: number;
    scores: Record<string, number>;
    comments: Record<string, string>;
    feedback: string | null;
  },
) {
  return call<{ id: string }>(() =>
    supabase.rpc("mark_writing_attempt", {
      p_attempt_id: attemptId,
      p_rubric_id: input.rubricId,
      p_rubric_version: input.rubricVersion,
      p_scores: input.scores,
      p_comments: input.comments,
      p_feedback: input.feedback,
    }),
  );
}

interface MarkJoinRow {
  attempt_id: string;
  rubric_id: string;
  rubric_version: number;
  awarded_marks: number | string;
  max_marks: number | string;
  feedback: string | null;
  marked_at: string;
  writing_mark_criteria: { criterion_id: string; score: number; comment: string | null }[];
}

export function toMarkDto(row: MarkJoinRow): WritingMarkDto {
  return {
    attemptId: row.attempt_id,
    rubricId: row.rubric_id,
    rubricVersion: row.rubric_version,
    awardedMarks: Number(row.awarded_marks),
    maxMarks: Number(row.max_marks),
    feedback: row.feedback,
    markedAt: row.marked_at,
    criteria: (row.writing_mark_criteria ?? []).map((c) => ({
      criterionId: c.criterion_id,
      score: c.score,
      comment: c.comment,
    })),
  };
}

export const MARK_SELECT =
  "attempt_id, rubric_id, rubric_version, awarded_marks, max_marks, feedback, marked_at, writing_mark_criteria(criterion_id, score, comment)";
