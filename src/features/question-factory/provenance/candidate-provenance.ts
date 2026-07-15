import { z } from "zod";

import { FACTORY_LIMITS } from "../config";
import { factoryIdentifierSchema } from "../shared/identifiers";
import { generatorAdapterSchema } from "./generator";
import { persistedReviewRecordSchema } from "./review-record";

export const candidateProvenanceSchema = z.object({
  candidateId: factoryIdentifierSchema,
  blueprintId: factoryIdentifierSchema,
  batchId: factoryIdentifierSchema,
  pipelineRunId: factoryIdentifierSchema,
  revision: z.number().int().nonnegative(),
  generatedAt: z.iso.datetime(),
  generatorAdapter: generatorAdapterSchema,
  generatorVersion: z.string().trim().min(1).max(FACTORY_LIMITS.PROVENANCE_MAX_VERSION_LENGTH),
  promptVersion: z.string().trim().min(1).max(FACTORY_LIMITS.PROVENANCE_MAX_VERSION_LENGTH),
  /**
   * PD-7 (Mission 3 prerequisite decisions): optional, additive companion
   * to `promptVersion` — records the hash of the actual generation prompt
   * pack (`hashJson(promptPack)`, see `generation/prompt-builder.ts`) a
   * candidate was produced or ingested against, mirroring the existing
   * `reviewPromptHash` field on `reviewRecordSchema`. Optional because
   * every provenance record created before this field existed remains
   * valid, and not every generator class issues a prompt pack (e.g. a
   * future `live_provider` adapter might not).
   */
  promptHash: z.string().trim().min(1).max(FACTORY_LIMITS.PROVENANCE_MAX_HASH_LENGTH).optional(),
  schemaVersion: z.string().trim().min(1).max(FACTORY_LIMITS.PROVENANCE_MAX_VERSION_LENGTH),
  taxonomyVersion: z.string().trim().min(1).max(FACTORY_LIMITS.PROVENANCE_MAX_VERSION_LENGTH),
  contentHash: z.string().trim().min(1).max(FACTORY_LIMITS.PROVENANCE_MAX_HASH_LENGTH),
  parentCandidateId: factoryIdentifierSchema.optional(),
  reviewRecords: z
    .array(persistedReviewRecordSchema)
    .max(FACTORY_LIMITS.PROVENANCE_MAX_REVIEW_RECORDS)
    .default([]),
});

export type CandidateProvenance = z.infer<typeof candidateProvenanceSchema>;
export type CandidateProvenanceInput = z.input<typeof candidateProvenanceSchema>;
