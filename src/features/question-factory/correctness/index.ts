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
 *
 * Mission 3D governed-authority remediation: `buildCorrectnessAttestation`
 * (the `cva-*` builder/minter) and `governed-attestation-writer.ts` (the
 * only module that can actually persist one) are deliberately **not**
 * exported here, even by file path from `attestation.ts` alone being
 * "available" — the write itself is refused by
 * `storage/fs-factory-repository.ts` for any caller without a governed
 * capability, which only `orchestrate-correctness-verification.ts` ever
 * holds. `buildCorrectnessAttestationId` (a pure id/locator, not a write)
 * and `computeCorrectnessAttestationFingerprint`/the `CorrectnessPassAttestation`
 * type (needed to *read and validate* an existing attestation, e.g. by
 * `originality/validate-upstream-correctness-evidence.ts`) remain public.
 */
export { buildCorrectnessAttestationId, computeCorrectnessAttestationFingerprint } from "./attestation";
export type { CorrectnessAttestationFingerprintFacts, CorrectnessPassAttestation } from "./attestation";
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
export { validateCorrectnessAttestationBinding } from "./validate-correctness-attestation-binding";
export type {
  CorrectnessAttestationBindingFacts,
  CorrectnessAttestationBindingOutcome,
  CorrectnessAttestationProblem,
  CorrectnessAttestationProblemKind,
} from "./validate-correctness-attestation-binding";
export { verifyCandidateCorrectness } from "./verify-candidate-correctness";
