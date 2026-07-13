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
  CONTENT_WORKSPACE_RELATIVE_PATH,
  GENERATED_QUESTIONS_RELATIVE_PATH,
  PRODUCTION_QUESTIONS_RELATIVE_PATH,
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
