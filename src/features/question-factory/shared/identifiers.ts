import { z } from "zod";

import { FACTORY_LIMITS } from "../config";

/**
 * Pattern shared with the storage layer's own defensive candidate-id
 * check (`storage/fs-factory-repository.ts`), so path-traversal safety
 * and schema validation can never drift apart.
 */
export const FACTORY_IDENTIFIER_PATTERN = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

/**
 * Shape shared by every factory-domain identifier (blueprintId, batchId,
 * candidateId, pipelineRunId, publicationId, reviewId, revisionId, ...).
 * Deliberately narrower than taxonomy ids: no dots, since taxonomy ids are
 * namespaced curriculum paths and factory identifiers are opaque tokens.
 */
export const factoryIdentifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(FACTORY_LIMITS.IDENTIFIER_MAX_LENGTH)
  .regex(FACTORY_IDENTIFIER_PATTERN, "Use lower-case letters, numbers, hyphens or underscores.");

export type FactoryIdentifier = z.infer<typeof factoryIdentifierSchema>;
