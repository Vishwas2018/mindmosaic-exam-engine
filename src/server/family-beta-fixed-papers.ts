import "server-only";

import { publishedExamBank } from "@/content/questions/practice-bank";
import { scoreExam, type ExamScore } from "@/features/exam-engine/scoring";
import { reconcileResumedSession, type ResumableSession } from "@/features/exam-engine/state/resume";
import type {
  AuthoringQuestion,
  CandidateQuestion,
  ExamResponses,
} from "@/features/exam-engine/types";
import { toCandidateQuestions } from "@/features/exam-engine/types";
import { hashJson } from "@/features/question-factory/provenance/content-hash";
import type { Question } from "@/schemas/question.schema";

import pinnedData from "./family-beta-pinned-data.json";

/**
 * Proposed Year 3 and Year 5 Fixed Numeracy Papers for Family Beta.
 *
 * All questions are pinned by exact ID, slot position, and canonical SHA-256 hash.
 * Answer keys are held strictly server-side and never cross into candidate delivery.
 *
 * Fail-closed: this preview is disabled by default and requires explicit environment
 * configuration (FAMILY_BETA_FIXED_PAPERS_PREVIEW === "enabled") to be activated.
 * In production or when the flag is absent, all functions refuse to serve the papers.
 */

export const FAMILY_BETA_NOTICE = "Family Beta Practice Paper — Pending Human Verification";

export interface PinnedFixedQuestion {
  readonly slot: number;
  readonly id: string;
  readonly canonicalSha256: string;
  readonly type: string;
  readonly marks: number;
}

export type FamilyBetaPaperKind = "year3" | "year5";

export interface FamilyBetaPaperConfig {
  readonly paperId: string;
  readonly title: string;
  readonly yearLevel: 3 | 5;
  readonly questionCount: number;
  readonly timeMinutes: number;
  readonly durationSeconds: number;
  readonly pinnedQuestions: readonly PinnedFixedQuestion[];
}

export const FAMILY_BETA_YEAR_3_PINNED: readonly PinnedFixedQuestion[] = Object.freeze(
  pinnedData.year3 as PinnedFixedQuestion[],
);

export const FAMILY_BETA_YEAR_5_PINNED: readonly PinnedFixedQuestion[] = Object.freeze(
  pinnedData.year5 as PinnedFixedQuestion[],
);

export const FAMILY_BETA_YEAR_3_CONFIG: FamilyBetaPaperConfig = Object.freeze({
  paperId: "family-beta-y3-numeracy-fixed",
  title: "NAPLAN-style Year 3 Numeracy — Family Beta Fixed Paper",
  yearLevel: 3,
  questionCount: 36,
  timeMinutes: 45,
  durationSeconds: 45 * 60,
  pinnedQuestions: FAMILY_BETA_YEAR_3_PINNED,
});

export const FAMILY_BETA_YEAR_5_CONFIG: FamilyBetaPaperConfig = Object.freeze({
  paperId: "family-beta-y5-numeracy-fixed",
  title: "NAPLAN-style Year 5 Numeracy — Family Beta Fixed Paper",
  yearLevel: 5,
  questionCount: 42,
  timeMinutes: 50,
  durationSeconds: 50 * 60,
  pinnedQuestions: FAMILY_BETA_YEAR_5_PINNED,
});

type Env = Readonly<Record<string, string | undefined>>;

export function getFamilyBetaPaperConfig(paper: FamilyBetaPaperKind): FamilyBetaPaperConfig {
  return paper === "year3" ? FAMILY_BETA_YEAR_3_CONFIG : FAMILY_BETA_YEAR_5_CONFIG;
}

/**
 * Guard check: fail-closed by default. Papers are only accessible when the flag
 * is explicitly set to "enabled", and never in production deployments.
 */
export function isFamilyBetaFixedPapersEnabled(env: Env = process.env): boolean {
  if (env.FAMILY_BETA_FIXED_PAPERS_PREVIEW !== "enabled") return false;
  if (env.VERCEL_TARGET_ENV === "production") return false;
  return true;
}

/**
 * Loads the complete server-authoritative questions for a fixed paper.
 * Validates every question against its pinned canonical hash.
 * If any question has drifted or is missing, fails closed with an error.
 * Returns an empty array if the feature flag is disabled.
 */
export function loadFamilyBetaFixedPaperQuestions(
  paper: FamilyBetaPaperKind,
  env: Env = process.env,
): readonly AuthoringQuestion[] {
  if (!isFamilyBetaFixedPapersEnabled(env)) {
    return Object.freeze([]) as readonly AuthoringQuestion[];
  }

  const config = getFamilyBetaPaperConfig(paper);
  const bankById = new Map<string, AuthoringQuestion>(
    publishedExamBank.map((q: Question) => [q.id, q as AuthoringQuestion]),
  );

  const questions: AuthoringQuestion[] = [];
  for (const pinned of config.pinnedQuestions) {
    const question = bankById.get(pinned.id);
    if (!question) {
      throw new Error(
        `[family-beta-fixed-papers] Missing question '${pinned.id}' for slot ${pinned.slot} in publishedExamBank`,
      );
    }
    const actualHash = hashJson(question);
    if (actualHash !== pinned.canonicalSha256) {
      throw new Error(
        `[family-beta-fixed-papers] Integrity hash mismatch for '${pinned.id}' (slot ${pinned.slot}): expected ${pinned.canonicalSha256}, got ${actualHash}`,
      );
    }
    questions.push(question);
  }

  return Object.freeze(questions);
}

/**
 * Candidate delivery: strips answer keys and explanations using `toCandidateQuestions`.
 * Never leaks answer keys to the caller.
 */
export function deliverFamilyBetaCandidateQuestions(
  paper: FamilyBetaPaperKind,
  env: Env = process.env,
): readonly CandidateQuestion[] {
  const authoringQuestions = loadFamilyBetaFixedPaperQuestions(paper, env);
  if (authoringQuestions.length === 0) {
    return Object.freeze([]) as readonly CandidateQuestion[];
  }
  return Object.freeze(toCandidateQuestions(authoringQuestions));
}

export interface CreateFixedSessionOptions {
  readonly sessionId?: string;
  readonly startedAt?: number;
}

/**
 * Creates an in-memory exam session for a fixed paper using candidate-safe questions.
 */
export function createFamilyBetaFixedSession(
  paper: FamilyBetaPaperKind,
  options?: CreateFixedSessionOptions,
  env: Env = process.env,
): ResumableSession {
  if (!isFamilyBetaFixedPapersEnabled(env)) {
    throw new Error(
      "[family-beta-fixed-papers] Cannot create session: family beta fixed papers are disabled pending approval",
    );
  }

  const config = getFamilyBetaPaperConfig(paper);
  const candidates = deliverFamilyBetaCandidateQuestions(paper, env);
  if (candidates.length !== config.questionCount) {
    throw new Error(
      `[family-beta-fixed-papers] Candidate delivery length mismatch: expected ${config.questionCount}, got ${candidates.length}`,
    );
  }

  const startedAt = options?.startedAt ?? Date.now();
  return {
    sessionId: options?.sessionId ?? `family-beta-${paper}-${startedAt}`,
    bankId: "curated",
    config: {
      yearLevel: config.yearLevel,
      examStyle: "naplan_style",
      subject: "numeracy",
      questionCount: config.questionCount,
      timing: "timed",
    },
    questions: candidates,
    startedAt,
    durationSeconds: config.durationSeconds,
    responses: {},
    currentQuestionIndex: 0,
    flaggedQuestionIds: [],
  };
}

/**
 * Reconciles and resumes an in-progress session, preserving candidate responses
 * and recomputing timer / deadline bounds.
 */
export function resumeFamilyBetaFixedSession(
  session: ResumableSession,
  now: number = Date.now(),
): ReturnType<typeof reconcileResumedSession> {
  return reconcileResumedSession(session, now);
}

/**
 * Server-authoritative scoring: evaluates candidate responses against the pinned
 * authoring questions. Answer keys never leave the server.
 */
export function scoreFamilyBetaFixedPaper(
  paper: FamilyBetaPaperKind,
  responses: ExamResponses,
  env: Env = process.env,
): ExamScore {
  if (!isFamilyBetaFixedPapersEnabled(env)) {
    throw new Error(
      "[family-beta-fixed-papers] Cannot score paper: family beta fixed papers are disabled pending approval",
    );
  }

  const authoringQuestions = loadFamilyBetaFixedPaperQuestions(paper, env);
  return scoreExam(authoringQuestions, responses);
}
