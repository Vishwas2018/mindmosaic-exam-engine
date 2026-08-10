import { z } from "zod";
import { yearLevelSchema } from "@/schemas/question.schema";

import type { CandidateQuestion, ReviewQuestion } from "@/features/exam-engine/types";

import type { ExamResult } from "./exam-report";

/**
 * Request/response contract for the server-authoritative exam endpoints
 * (docs/ASSESSMENT_SECURITY_MODEL.md, Phase 0 addendum). Client-safe:
 * only zod schemas and types live here — never a question bank import.
 */

export const examSelectionConfigSchema = z.object({
  yearLevel: z.union([yearLevelSchema, z.literal("mixed")]),
  examStyle: z.enum(["naplan_style", "icas_style", "mixed"]),
  /* The full SubjectFilter vocabulary, matching
     selection/selection-config.ts. Science, Digital Technologies and
     Spelling were missing, so a signed-in student could not create a session
     for any of them; the ICAS simulations need all three. */
  subject: z.enum([
    "numeracy",
    "reading",
    "language",
    "science",
    "digital_technologies",
    "spelling",
    "mixed",
  ]),
  /* Any positive count, not just the configurator's three fixed options: an
     exam simulation sits a paper of the official size (36, 39, 42, 45, 50,
     52). Bounded so a client cannot ask the server to select a pathological
     number of questions. */
  questionCount: z.union([z.int().positive().max(200), z.literal("full")]),
  timing: z.enum(["timed", "untimed"]),
  /* Present only for an exam simulation; see ExamSelectionConfig. Both must
     be declared here or `safeParse` would strip them from a stored session's
     config, and a resumed or server-scored simulation would silently lose
     its time limit and its shortened-paper labelling. */
  patternId: z.string().min(1).optional(),
  shortened: z.boolean().optional(),
});

export const examBankIdSchema = z.enum(["curated", "published", "practice"]);

/*
 * No seed field: the server generates the seed for signed-in sessions, so
 * a client can neither choose nor predict its own question selection.
 * Sessions are created at exam start, before the student sees a question.
 *
 * Two ways in, exactly one per request:
 *
 * - `config` — the configurator's own filters, unchanged.
 * - `patternId` — an exam simulation. The client sends only the id; the
 *   server resolves the pattern from the same registry and derives the
 *   config itself, so a client cannot claim a paper shape of its own
 *   invention (a 200-question "NAPLAN Year 3 Numeracy", say).
 */
export const createSessionRequestSchema = z
  .object({
    config: examSelectionConfigSchema.optional(),
    patternId: z.string().min(1).optional(),
    /* Draw the reduced practice module instead of failing when the bank
       cannot satisfy the full-length pattern (exam-patterns.md §6). */
    asPracticeModule: z.boolean().default(false),
    /* Stable form partitioning, so repeat sittings can be disjoint. Bounded
       here; the server clamps against what the bank actually supports. */
    form: z.int().min(0).max(2).default(0),
    formCount: z.int().min(1).max(3).default(1),
    bankId: examBankIdSchema.default("curated"),
  })
  .refine(
    (request) => (request.config === undefined) !== (request.patternId === undefined),
    { message: "Provide exactly one of config or patternId." },
  );

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
