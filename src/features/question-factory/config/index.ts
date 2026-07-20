export { ALLOWED_QUESTION_TYPES, ALLOWED_VISUAL_TYPES } from "./allowed-types";
export { factoryConfig, factoryConfigSchema } from "./factory-config";
export type { FactoryConfig } from "./factory-config";
export {
  IDENTITY_PROVIDERS,
  INTERACTION_MODES,
  identitiesAreIndependent,
  normalisedIdentitySchema,
  normaliseIdentity,
  normaliseIdentityOrThrow,
} from "./identity-normalisation";
export type {
  IdentityProvider,
  InteractionMode,
  NormalisedIdentity,
} from "./identity-normalisation";
export { CORRECTNESS_LIMITS } from "./correctness-limits";
export { FACTORY_LIMITS } from "./limits";
export {
  MANUAL_INGESTION_SOURCES,
  manualIngestionSourceSchema,
} from "./manual-ingestion-config";
export type { ManualIngestionSource } from "./manual-ingestion-config";
export {
  GENERATION_ISSUE_CODES,
  INGESTION_ISSUE_CODES,
  MISSION_3A_ISSUE_CODES,
  PROMPT_ISSUE_CODES,
} from "./mission3a-issue-codes";
export type {
  GenerationIssueCode,
  IngestionIssueCode,
  Mission3AIssueCode,
  PromptIssueCode,
} from "./mission3a-issue-codes";
export {
  DETERMINISTIC_REVIEW_ISSUE_CODES,
  MISSION_3B_ISSUE_CODES,
  REVIEW_INGESTION_ISSUE_CODES,
  REVIEW_PROMPT_ISSUE_CODES,
} from "./mission3b-issue-codes";
export type {
  DeterministicReviewIssueCode,
  Mission3BIssueCode,
  ReviewIngestionIssueCode,
  ReviewPromptIssueCode,
} from "./mission3b-issue-codes";
export {
  MISSION_3C_ISSUE_CODES,
  PIPELINE_ISSUE_CODES,
  REVISION_ISSUE_CODES,
} from "./mission3c-issue-codes";
export type {
  Mission3CIssueCode,
  PipelineIssueCode,
  RevisionIssueCode,
} from "./mission3c-issue-codes";
export {
  DIFFICULTY_ISSUE_CODES,
  MISSION_3D_ISSUE_CODES,
  ORIGINALITY_ISSUE_CODES,
} from "./mission3d-issue-codes";
export type {
  DifficultyIssueCode,
  Mission3DIssueCode,
  OriginalityIssueCode,
} from "./mission3d-issue-codes";
export {
  MISSION_3E_ISSUE_CODES,
  PUBLICATION_ISSUE_CODES,
  STAGING_ISSUE_CODES,
} from "./mission3e-issue-codes";
export type {
  Mission3EIssueCode,
  PublicationIssueCode,
  StagingIssueCode,
} from "./mission3e-issue-codes";
export {
  CONTENT_WORKSPACE_RELATIVE_PATH,
  GENERATED_QUESTIONS_RELATIVE_PATH,
  PRODUCTION_QUESTIONS_RELATIVE_PATH,
  getInboxRoot,
  getProductionQuestionsRoot,
  getWorkspaceRoot,
} from "./paths";
export {
  PUBLICATION_CONTROLLED_FILES,
} from "./publication-file-registry";
export type { PublicationControlledFileKey } from "./publication-file-registry";
export {
  DEFAULT_REPOSITORY_MODE,
  REPOSITORY_MODES,
  repositoryModeSchema,
} from "./repository-mode";
export type { RepositoryMode } from "./repository-mode";
export { FACTORY_THRESHOLDS } from "./thresholds";
export { FACTORY_VERSIONS } from "./versions";
