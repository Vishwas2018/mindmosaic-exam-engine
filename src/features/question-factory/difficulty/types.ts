import { DIFFICULTY_ISSUE_CODES, type DifficultyIssueCode } from "../config";
import type { QuestionFactoryCandidate } from "../validation";

/** Re-exported so orchestration callers never need to reach into `../validation` themselves. */
export type { QuestionFactoryCandidate };

export const DIFFICULTY_BANDS = ["easy", "medium", "challenging"] as const;
export type DifficultyBand = (typeof DIFFICULTY_BANDS)[number];

/**
 * The issue-code catalogue itself lives in `config/mission3d-issue-codes.ts`
 * (the single source of truth, mirroring `revision/types.ts`'s
 * `RevisionIssueCode` import from `../config`) — re-exported here so every
 * other difficulty module can import it from `./types` without reaching
 * into `../config` directly.
 */
export { DIFFICULTY_ISSUE_CODES };
export type { DifficultyIssueCode };

export interface DifficultyIssue {
  readonly code: DifficultyIssueCode;
  readonly path: string;
  readonly message: string;
  readonly severity: "error" | "review_required";
}

export interface DifficultyIssueSummary {
  readonly errorCount: number;
  readonly codes: readonly DifficultyIssueCode[];
}

export interface DifficultySignals {
  readonly wordCount: number;
  readonly readingLoadScore: number;
  readonly vocabularyComplexityScore: number;
  readonly reasoningStepScore: number;
}

/**
 * `declaredDifficulty` is always read from the resolved bound blueprint's
 * own `difficulty` field — never from `candidate.question.metadata.difficulty`
 * (the author's own claim). This is what makes the gate a genuine check
 * rather than the candidate grading its own homework; see the Mission 3D
 * plan §4b's "author-declared difficulty is never trusted" note.
 */
export interface DifficultyEvidence {
  readonly candidateId: string;
  readonly candidateRevision: number;
  readonly candidateContentHash: string;
  readonly blueprintHash: string;
  readonly checkerVersion: string;
  readonly declaredDifficulty: DifficultyBand;
  readonly estimatedDifficulty: DifficultyBand;
  readonly estimateConfidence: number;
  readonly deviation: number;
  readonly signals: DifficultySignals;
  readonly outcome: "passed" | "failed" | "quarantined";
  readonly issues: readonly DifficultyIssue[];
  readonly issueSummary: DifficultyIssueSummary;
  readonly validatedAt: string;
  readonly difficultyFingerprint: string;
}

/**
 * Everything the pure verifier needs, supplied entirely by the caller —
 * no I/O, no wall-clock read, no randomness inside
 * `verifyCandidateDifficulty` itself. `declaredDifficulty` and
 * `blueprintHash` are the orchestrator's already-resolved bound-blueprint
 * values (via `resolveBoundBlueprint`, reused verbatim).
 */
export interface DifficultyVerificationContext {
  readonly validatedAt: string;
  readonly declaredDifficulty: DifficultyBand;
  readonly blueprintHash: string;
}

export type DifficultyOutcome = "confirmed" | "mismatch" | "insufficient_evidence";

export type DifficultyResult =
  | { readonly status: "passed"; readonly outcome: "confirmed"; readonly evidence: DifficultyEvidence }
  | { readonly status: "failed"; readonly outcome: "mismatch"; readonly issues: readonly DifficultyIssue[]; readonly evidence: DifficultyEvidence }
  | { readonly status: "quarantined"; readonly outcome: "insufficient_evidence"; readonly issues: readonly DifficultyIssue[]; readonly evidence: DifficultyEvidence };
