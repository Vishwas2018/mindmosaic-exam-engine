/**
 * Governed structural validation gate (Mission 2B): the first production
 * gate after ingestion. Deliberately narrow exports: the pure validator,
 * the repository orchestration function, and their contracts are public;
 * most individual check modules (`taxonomy-checks.ts`, `registry-checks.ts`,
 * `content-safety-checks.ts`, `scoring-compatibility-check.ts`,
 * `schema-issue-classifier.ts`, `evidence.ts`) remain internal — tests may
 * still import them directly by file path, matching the convention
 * `ingestion/index.ts` already established for `candidate-question.ts`.
 *
 * `parseCandidateProvenance`, `parseCandidateQuestion`, and
 * `checkAgainstProductionSchema` are additionally re-exported here (beyond
 * the original Mission 2B surface) because the Mission 2C correctness gate
 * legitimately depends on the exact same trust-boundary re-parse and
 * production-schema realisation this gate already performs — reusing them
 * rather than re-declaring a second parse of the same untrusted
 * `candidate.provenance`/`candidate.question` blobs.
 */
export {
  checkCandidateIdBinding,
  checkContentHashBinding,
  parseCandidateProvenance,
  parseCandidateQuestion,
} from "./candidate-checks";
export type { ParsedProvenanceOutcome, ParsedQuestionOutcome } from "./candidate-checks";
export { STRUCTURAL_VALIDATOR_VERSION } from "./evidence";
export {
  buildStructuralValidationReportId,
  orchestrateStructuralValidation,
} from "./orchestrate-structural-validation";
export type {
  ExpectedCandidateBinding,
  OrchestrateStructuralValidationOptions,
  StoredStructuralValidationReport,
  StructuralValidationOrchestrationOutcome,
} from "./orchestrate-structural-validation";
export { checkAgainstProductionSchema } from "./production-schema-check";
export type { ProductionSchemaCheckOutcome } from "./production-schema-check";
export {
  STRUCTURAL_VALIDATION_CHECK_GROUPS,
  STRUCTURAL_VALIDATION_ISSUE_CODES,
} from "./types";
export type {
  QuestionFactoryCandidate,
  StructuralValidationCheckGroup,
  StructuralValidationContext,
  StructuralValidationEvidence,
  StructuralValidationIssue,
  StructuralValidationIssueCode,
  StructuralValidationIssueSummary,
  StructuralValidationResult,
} from "./types";
export { validateCandidateStructure } from "./validate-candidate-structure";
