import { z } from "zod";

/**
 * Request/response shapes shared by the writing route handlers and the client
 * components that call them. Nothing in a request can choose a deadline, a
 * ceiling, a marker or a total: those are derived by the database
 * (supabase/migrations/20261013090000_timed_writing_parent_marking.sql).
 */

const MAX_TEXT = 20000;

export const startWritingAttemptRequestSchema = z.object({
  taskId: z.string().min(1).max(120),
  mode: z.enum(["timed", "untimed"]),
});

export const saveWritingDraftRequestSchema = z.object({
  text: z.string().max(MAX_TEXT),
});

export const submitWritingAttemptRequestSchema = z.object({
  /** Omitted when the caller has nothing newer than the last autosave. */
  text: z.string().max(MAX_TEXT).optional(),
  /** Advisory only: past the deadline the server records `timer_expired` regardless. */
  reason: z.enum(["user_submitted", "timer_expired"]),
});

export const paperWritingAttemptRequestSchema = z.object({
  childId: z.string().uuid(),
  taskId: z.string().min(1).max(120),
  text: z.string().min(1).max(MAX_TEXT),
  /** Minutes the child actually took, if the parent timed it. */
  durationMinutes: z.number().int().min(1).max(60).optional(),
});

export const markWritingAttemptRequestSchema = z.object({
  rubricId: z.string().min(1),
  rubricVersion: z.number().int().min(1),
  scores: z.record(z.string(), z.number().int()),
  comments: z.record(z.string(), z.string().max(500)).optional(),
  feedback: z.string().max(2000).optional(),
});

export interface WritingAttemptDto {
  id: string;
  taskId: string;
  mode: "timed" | "untimed" | "paper";
  durationSeconds: number | null;
  startedAt: string;
  /** Epoch milliseconds; null when untimed. */
  deadlineAt: number | null;
  responseText: string;
  responseSource: "student_typed" | "parent_typed";
  submittedAt: string | null;
  submissionReason: "user_submitted" | "timer_expired" | null;
  /** The server's clock when this was produced, so the client can correct for device clock skew. */
  serverNow: number;
}

export interface WritingMarkDto {
  attemptId: string;
  rubricId: string;
  rubricVersion: number;
  awardedMarks: number;
  maxMarks: number;
  feedback: string | null;
  markedAt: string;
  criteria: { criterionId: string; score: number; comment: string | null }[];
}

export type WritingErrorCode =
  | "unauthenticated"
  | "not_configured"
  | "invalid_request"
  | "unknown_task"
  | "not_found"
  | "already_submitted"
  | "not_submitted"
  | "expired"
  | "server_error";
