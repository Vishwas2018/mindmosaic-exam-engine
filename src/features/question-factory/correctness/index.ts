/**
 * Governed correctness-verification gate (Mission 2C): the second
 * production gate, running only against candidates already at
 * `structural_validation_passed`. Deliberately narrow exports: the pure
 * verifier, the repository orchestration function, and their contracts
 * are public; the individual derivation/comparison modules
 * (`arithmetic-expression.ts`, `numeric.ts`, `fraction-decimal.ts`,
 * `money.ts`, `measurement.ts`, `visual-lookup.ts`, `derive-answer.ts`,
 * `derived-value.ts`, `canonical-response.ts`,
 * `explanation-consistency.ts`, `evidence.ts`) remain internal — tests may
 * still import them directly by file path, matching the convention
 * `validation/index.ts` already established.
 */
export {
  boundMessage,
  buildCorrectnessEvidence,
  computeCorrectnessVerificationFingerprint,
  CORRECTNESS_SCORER_VERSION,
  CORRECTNESS_VERIFIER_VERSION,
} from "./evidence";
export type { CorrectnessFingerprintFacts } from "./evidence";
export {
  buildCorrectnessReportId,
  orchestrateCorrectnessVerification,
} from "./orchestrate-correctness-verification";
export type {
  CorrectnessOrchestrationOutcome,
  OrchestrateCorrectnessVerificationOptions,
  StoredCorrectnessVerificationReport,
} from "./orchestrate-correctness-verification";
export {
  CORRECTNESS_CAPABILITIES,
  CORRECTNESS_CHECK_CATALOGUE,
  CORRECTNESS_VERIFICATION_ISSUE_CODES,
} from "./types";
export type {
  AnswerRepresentation,
  CorrectnessCapability,
  CorrectnessCheckGroup,
  CorrectnessVerificationContext,
  CorrectnessVerificationEvidence,
  CorrectnessVerificationIssue,
  CorrectnessVerificationIssueCode,
  CorrectnessVerificationIssueSummary,
  CorrectnessVerificationResult,
  QuestionFactoryCandidate,
  ScoringOutcomeSummary,
  ScoringStatusSummary,
} from "./types";
export { validateCachedCorrectnessReplay } from "./validate-cached-replay";
export type { CachedReplayContext, CachedReplayValidationOutcome } from "./validate-cached-replay";
export { verifyCandidateCorrectness } from "./verify-candidate-correctness";
