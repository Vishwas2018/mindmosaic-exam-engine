import { z } from "zod";

import { FACTORY_LIMITS } from "../config";
import { factoryIdentifierSchema } from "../shared/identifiers";
import { generatorAdapterSchema } from "./generator";
import { reviewRecordSchema } from "./review-record";

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
  schemaVersion: z.string().trim().min(1).max(FACTORY_LIMITS.PROVENANCE_MAX_VERSION_LENGTH),
  taxonomyVersion: z.string().trim().min(1).max(FACTORY_LIMITS.PROVENANCE_MAX_VERSION_LENGTH),
  contentHash: z.string().trim().min(1).max(FACTORY_LIMITS.PROVENANCE_MAX_HASH_LENGTH),
  parentCandidateId: factoryIdentifierSchema.optional(),
  reviewRecords: z
    .array(reviewRecordSchema)
    .max(FACTORY_LIMITS.PROVENANCE_MAX_REVIEW_RECORDS)
    .default([]),
});

export type CandidateProvenance = z.infer<typeof candidateProvenanceSchema>;
export type CandidateProvenanceInput = z.input<typeof candidateProvenanceSchema>;
