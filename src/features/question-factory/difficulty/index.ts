/**
 * Governed difficulty-review gate (Mission 3D): deterministic structural-
 * proxy difficulty estimation compared against the blueprint's own
 * declared difficulty. Deliberately narrow exports, mirroring
 * `correctness/index.ts`'s convention: the pure verifier, the repository
 * orchestration function, and their contracts are public;
 * `estimate-difficulty.ts`'s individual signal primitives remain internal
 * — tests may still import them directly by file path.
 */
export { boundMessage, buildDifficultyEvidence, computeDifficultyFingerprint } from "./evidence";
export type { DifficultyEvidenceInput, DifficultyFingerprintFacts } from "./evidence";
export { computeDifficultyDeviation, DIFFICULTY_ESTIMATOR_VERSION, estimateDifficulty } from "./estimate-difficulty";
export type { DifficultyEstimate, DifficultyEstimateInput } from "./estimate-difficulty";
export {
  buildDifficultyReportId,
  orchestrateDifficultyReview,
} from "./orchestrate-difficulty-review";
export type {
  DifficultyOrchestrationOutcome,
  OrchestrateDifficultyReviewOptions,
  StoredDifficultyReport,
} from "./orchestrate-difficulty-review";
export {
  DIFFICULTY_BANDS,
  DIFFICULTY_ISSUE_CODES,
} from "./types";
export type {
  DifficultyBand,
  DifficultyEvidence,
  DifficultyIssue,
  DifficultyIssueCode,
  DifficultyIssueSummary,
  DifficultyOutcome,
  DifficultyResult,
  DifficultySignals,
  DifficultyVerificationContext,
  QuestionFactoryCandidate,
} from "./types";
export { validateCachedDifficultyReplay } from "./validate-cached-replay";
export type { CachedDifficultyReplayContext, CachedDifficultyReplayValidationOutcome } from "./validate-cached-replay";
export { verifyCandidateDifficulty } from "./verify-candidate-difficulty";
