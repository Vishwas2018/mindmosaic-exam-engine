import { z } from "zod";

import { FACTORY_LIMITS } from "../config";
import { factoryIdentifierSchema } from "../shared/identifiers";
import { generatorAdapterSchema } from "./generator";
import { persistedReviewRecordSchema } from "./review-record";

/**
 * Mission 3C: durable, at-most-once evidence that a `needs_revision`
 * candidate's replay/conflict "slot" has been claimed by a specific
 * revision request. Stamped onto the **parent's own** `CandidateProvenance`
 * (never a separate sidecar index — see `revision/revise.ts`'s doc comment
 * for why, directly applying the Mission 3B P1-2 lesson) the first time a
 * revision request for this parent version durably lands. A parent can
 * carry at most one `supersededBy` claim, ever — the schema shape itself
 * (a single optional object, not an array) is what makes "only one
 * canonical successor per parent" structural rather than merely convention.
 */
export const supersessionClaimSchema = z.object({
  candidateId: factoryIdentifierSchema,
  revisionRequestId: factoryIdentifierSchema,
  revisionFingerprint: z.string().trim().min(1).max(FACTORY_LIMITS.PROVENANCE_MAX_HASH_LENGTH),
  claimedAt: z.iso.datetime(),
});

export type SupersessionClaim = z.infer<typeof supersessionClaimSchema>;

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
  /**
   * Mission 3C: present only on a `needs_revision` parent once a revision
   * request for it has durably landed (`revision/revise.ts`). Optional and
   * additive — every provenance record created before this field existed
   * (i.e. every pre-Mission-3C candidate) remains schema-valid without it.
   */
  supersededBy: supersessionClaimSchema.optional(),
});

export type CandidateProvenance = z.infer<typeof candidateProvenanceSchema>;
export type CandidateProvenanceInput = z.input<typeof candidateProvenanceSchema>;
