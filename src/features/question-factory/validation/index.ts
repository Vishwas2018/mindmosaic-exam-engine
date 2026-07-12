/**
 * Governed structural validation gate (Mission 2B): the first production
 * gate after ingestion. Deliberately narrow exports: the pure validator,
 * the repository orchestration function, and their contracts are public;
 * the individual check modules (`candidate-checks.ts`, `taxonomy-checks.ts`,
 * `registry-checks.ts`, `content-safety-checks.ts`,
 * `production-schema-check.ts`, `scoring-compatibility-check.ts`,
 * `schema-issue-classifier.ts`, `evidence.ts`) are internal implementation
 * and are not re-exported — tests may still import them directly by file
 * path, matching the convention `ingestion/index.ts` already established
 * for `candidate-question.ts`.
 */
export { STRUCTURAL_VALIDATOR_VERSION } from "./evidence";
export {
  orchestrateStructuralValidation,
} from "./orchestrate-structural-validation";
export type {
  ExpectedCandidateBinding,
  OrchestrateStructuralValidationOptions,
  StructuralValidationOrchestrationOutcome,
} from "./orchestrate-structural-validation";
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
