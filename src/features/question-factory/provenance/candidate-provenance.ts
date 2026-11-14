import { z } from "zod";

import { FACTORY_LIMITS } from "../config";
import { factoryIdentifierSchema } from "../shared/identifiers";
import { knownGeneratorAdapterSchema } from "./generator";
import { originalGenerationUnverifiedSchema, repositoryImportSchema } from "./legacy-import";
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

export const knownCandidateProvenanceSchema = z.object({
  candidateId: factoryIdentifierSchema,
  blueprintId: factoryIdentifierSchema,
  batchId: factoryIdentifierSchema,
  pipelineRunId: factoryIdentifierSchema,
  revision: z.number().int().nonnegative(),
  generatedAt: z.iso.datetime(),
  generatorAdapter: knownGeneratorAdapterSchema,
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
  // Reserved discriminators cannot be stripped and laundered into a v1 record.
  provenanceVersion: z.literal(1).optional(),
  kind: z.literal("generated").optional(),
  originalGeneration: z.never().optional(),
  repositoryImport: z.never().optional(),
});

export const legacyCandidateProvenanceSchema = knownCandidateProvenanceSchema.extend({
  provenanceVersion: z.literal(2), kind: z.literal("legacy_import"),
  revision: z.literal(0), generatedAt: z.null(), generatorVersion: z.null(),
  promptVersion: z.null(), promptHash: z.null(),
  generatorAdapter: z.object({ class: z.literal("legacy_import"), identity: z.null() }).strict(),
  originalGeneration: originalGenerationUnverifiedSchema,
  repositoryImport: repositoryImportSchema,
  // Legacy authoring cannot be relabelled through the existing revision adapter.
  parentCandidateId: z.never().optional(), supersededBy: z.never().optional(),
}).strict().superRefine((value, ctx) => {
  if (value.contentHash !== value.repositoryImport.candidateHash)
    ctx.addIssue({ code: "custom", path: ["contentHash"], message: "Legacy content hash must equal the verified import candidate hash" });
  if (value.blueprintId !== value.repositoryImport.blueprint.id)
    ctx.addIssue({ code: "custom", path: ["blueprintId"], message: "Legacy blueprint identity mismatch" });
  const entry = value.repositoryImport;
  if (entry.transformations.length === 0 ? entry.candidateHash !== entry.sourceCandidateHash : entry.transformations[0].beforeCandidateHash !== entry.sourceCandidateHash || entry.transformations[0].afterCandidateHash !== entry.candidateHash)
    ctx.addIssue({ code: "custom", path: ["repositoryImport", "transformations"], message: "Transformation must bind exact before/after candidate hashes" });
});

export const candidateProvenanceSchema = z.discriminatedUnion("kind", [legacyCandidateProvenanceSchema, knownCandidateProvenanceSchema]);

export function isLegacyProvenance(value: CandidateProvenance): value is z.infer<typeof legacyCandidateProvenanceSchema> {
  return value.kind === "legacy_import";
}

export type CandidateProvenance = z.infer<typeof candidateProvenanceSchema>;
export type CandidateProvenanceInput = z.input<typeof candidateProvenanceSchema>;
export type KnownCandidateProvenanceInput = z.input<typeof knownCandidateProvenanceSchema>;
