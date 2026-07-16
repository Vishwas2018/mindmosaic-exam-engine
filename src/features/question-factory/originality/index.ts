/**
 * Governed originality-review gate (Mission 3D): deterministic
 * duplicate/near-duplicate detection against the factory's own production
 * corpus. Deliberately narrow exports, mirroring `correctness/index.ts`'s
 * convention: the pure verifier, the repository orchestration function,
 * and their contracts are public; `similarity.ts`'s individual
 * tokenisation/shingle primitives remain internal — tests may still
 * import them directly by file path.
 */
export { boundMessage, buildOriginalityEvidence, computeOriginalityFingerprint } from "./evidence";
export type { OriginalityEvidenceInput, OriginalityFingerprintFacts } from "./evidence";
export {
  buildOriginalityReportId,
  computeCurrentOriginalityCorpusFingerprint,
  orchestrateOriginalityReview,
} from "./orchestrate-originality-review";
export type {
  OrchestrateOriginalityReviewOptions,
  OriginalityOrchestrationOutcome,
  StoredOriginalityReport,
} from "./orchestrate-originality-review";
export { computeSimilarity, extractComparableText, ORIGINALITY_CHECKER_VERSION, ORIGINALITY_NORMALISATION_VERSION } from "./similarity";
export {
  ORIGINALITY_CLASSIFICATIONS,
  ORIGINALITY_ISSUE_CODES,
} from "./types";
export type {
  OriginalityClassification,
  OriginalityCorpusScope,
  OriginalityEvidence,
  OriginalityIssue,
  OriginalityIssueCode,
  OriginalityIssueSummary,
  OriginalityMatch,
  OriginalityResult,
  OriginalityVerificationContext,
  QuestionFactoryCandidate,
} from "./types";
export { validateCachedOriginalityReplay } from "./validate-cached-replay";
export type { CachedOriginalityReplayContext, CachedOriginalityReplayValidationOutcome } from "./validate-cached-replay";
export { validateUpstreamCorrectnessEvidence } from "./validate-upstream-correctness-evidence";
export type { UpstreamCorrectnessEvidenceContext, UpstreamCorrectnessEvidenceOutcome } from "./validate-upstream-correctness-evidence";
export { verifyCandidateOriginality } from "./verify-candidate-originality";
