import { z } from "zod";

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
  .max(120)
  .regex(
    /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/,
    "Use lower-case letters, numbers, hyphens or underscores.",
  );

export type FactoryIdentifier = z.infer<typeof factoryIdentifierSchema>;
