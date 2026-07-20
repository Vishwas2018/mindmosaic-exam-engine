import { z } from "zod";

import type { CandidateQuestion, ReviewQuestion } from "@/features/exam-engine/types";

import type { ExamResult } from "./exam-report";

/**
 * Request/response contract for the server-authoritative exam endpoints
 * (docs/ASSESSMENT_SECURITY_MODEL.md, Phase 0 addendum). Client-safe:
 * only zod schemas and types live here — never a question bank import.
 */

export const examSelectionConfigSchema = z.object({
  yearLevel: z.union([z.literal(3), z.literal(5), z.literal("mixed")]),
  examStyle: z.enum(["naplan_style", "icas_style", "mixed"]),
  subject: z.enum(["numeracy", "reading", "language", "mixed"]),
  questionCount: z.union([
    z.literal(10),
    z.literal(20),
    z.literal(30),
    z.literal("full"),
  ]),
  timing: z.enum(["timed", "untimed"]),
});

export const examBankIdSchema = z.enum(["curated", "practice"]);

/*
 * No seed field: the server generates the seed for signed-in sessions, so
 * a client can neither choose nor predict its own question selection.
 * Sessions are created at exam start, before the student sees a question.
 */
export const createSessionRequestSchema = z.object({
  config: examSelectionConfigSchema,
  bankId: examBankIdSchema.default("curated"),
});

export type CreateSessionRequest = z.infer<typeof createSessionRequestSchema>;

export interface CreateSessionResponse {
  sessionId: string;
  questions: CandidateQuestion[];
}

/*
 * Responses are candidate answers keyed by question id. Shapes vary by
 * question type and are deliberately validated loosely here: scoring
 * treats anything malformed as unanswered/incorrect, and nothing in a
 * response can alter how it is scored — the server recomputes questions
 * and marks from its own stored session, never from client input.
 */
export const submitSessionRequestSchema = z.object({
  responses: z.record(z.string(), z.unknown()),
  submissionReason: z.enum(["user_submitted", "timer_expired"]).default("user_submitted"),
});

export type SubmitSessionRequest = z.infer<typeof submitSessionRequestSchema>;

/**
 * The server-computed result plus the full questions for the review
 * screen. Revealing answer keys and explanations here — after submission,
 * never before — is the one sanctioned reveal the ReviewQuestion type
 * exists to mark; a signed-in client has no bank of its own to recompute
 * review content from.
 */
export interface SubmitSessionResponse {
  result: ExamResult;
  reviewQuestions: ReviewQuestion[];
}

/**
 * Debounced in-progress autosave (POST /api/exam/session/:id/responses).
 * Same "responses are opaque, loosely validated" stance as
 * submitSessionRequestSchema — nothing here can affect scoring, this is
 * pure persistence for resume-after-refresh.
 */
export const autosaveRequestSchema = z.object({
  responses: z.record(z.string(), z.unknown()),
  currentQuestionIndex: z.number().int().min(0),
  flaggedQuestionIds: z.array(z.string()).default([]),
});

export type AutosaveRequest = z.infer<typeof autosaveRequestSchema>;

export interface AutosaveResponse {
  savedAt: string;
}

/**
 * Resume lookup (GET /api/exam/session/active). A browser refresh wipes
 * the client's in-memory session id along with everything else, so resume
 * cannot start from "submit responses for session X" — it has to start by
 * asking "what, if anything, is this signed-in student's active session?"
 * Answer-stripped questions only, same as CreateSessionResponse.
 */
export interface ActiveSessionResponse {
  sessionId: string;
  bankId: z.infer<typeof examBankIdSchema>;
  config: z.infer<typeof examSelectionConfigSchema>;
  questions: CandidateQuestion[];
  responses: Record<string, unknown>;
  currentQuestionIndex: number;
  flaggedQuestionIds: string[];
  /** ISO timestamp — exam_sessions.created_at, the authoritative start instant. */
  startedAt: string;
  durationSeconds: number | null;
}
