import { z } from "zod";

import type { CandidateQuestion } from "@/features/exam-engine/types";

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

export const createSessionRequestSchema = z.object({
  config: examSelectionConfigSchema,
  bankId: examBankIdSchema.default("curated"),
  /*
   * Phase 0 residual: signed-in sessions are created at submission time by
   * ServerAuthoritativeScoringService, which must reproduce the questions
   * the client-side session already showed — so the client's seed is
   * accepted here. Once exam *start* goes through this endpoint (next
   * phase of the security model), omit the seed and the server generates
   * one the client never chooses.
   */
  seed: z.string().min(1).max(128).optional(),
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

export type SubmitSessionResponse = ExamResult;
