import { z } from "zod";

import { ALLOWED_QUESTION_TYPES, ALLOWED_VISUAL_TYPES } from "./allowed-types";
import { FACTORY_LIMITS } from "./limits";
import { getWorkspaceRoot } from "./paths";
import { PUBLICATION_CONTROLLED_FILES } from "./publication-file-registry";
import { DEFAULT_REPOSITORY_MODE, repositoryModeSchema } from "./repository-mode";
import { FACTORY_THRESHOLDS } from "./thresholds";
import { FACTORY_VERSIONS } from "./versions";

const unitInterval = z.number().min(0).max(1);

const limitsSchema = z.record(z.string(), z.number().int().positive());

const thresholdsSchema = z.object({
  MAX_REVISIONS: z.number().int().min(0).max(10),
  PRODUCTION_REVIEW_CONFIDENCE: unitInterval,
  NEAR_DUPLICATE_SIMILARITY: unitInterval,
  STRUCTURALLY_SIMILAR_SIMILARITY: unitInterval,
  DIFFICULTY_MATCH_TOLERANCE: unitInterval,
  MIN_DIFFICULTY_ESTIMATE_CONFIDENCE: unitInterval,
});

const versionsSchema = z.record(z.string(), z.string().min(1));

/**
 * The complete shape of the factory's central configuration. Every gate,
 * generator, reviewer, and CLI command reads from this rather than
 * declaring its own threshold or path.
 */
export const factoryConfigSchema = z.object({
  repositoryMode: repositoryModeSchema,
  workspaceRoot: z.string().min(1),
  limits: limitsSchema,
  thresholds: thresholdsSchema,
  versions: versionsSchema,
  allowedQuestionTypes: z.array(z.string()).min(1),
  allowedVisualTypes: z.array(z.string()).min(1),
  publicationControlledFiles: z.record(z.string(), z.string().min(1)),
});

export type FactoryConfig = z.infer<typeof factoryConfigSchema>;

function buildFactoryConfig(): FactoryConfig {
  const raw = {
    repositoryMode: DEFAULT_REPOSITORY_MODE,
    workspaceRoot: getWorkspaceRoot(),
    limits: FACTORY_LIMITS,
    thresholds: FACTORY_THRESHOLDS,
    versions: FACTORY_VERSIONS,
    allowedQuestionTypes: [...ALLOWED_QUESTION_TYPES],
    allowedVisualTypes: [...ALLOWED_VISUAL_TYPES],
    publicationControlledFiles: PUBLICATION_CONTROLLED_FILES,
  };

  const result = factoryConfigSchema.safeParse(raw);
  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid factory configuration:\n${detail}`);
  }
  return result.data;
}

/** Validated once at module load - a config error fails fast, not at first use. */
export const factoryConfig: FactoryConfig = Object.freeze(buildFactoryConfig());
