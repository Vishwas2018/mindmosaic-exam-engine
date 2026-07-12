import { z } from "zod";

import { FACTORY_LIMITS } from "../config";
import { normalisedIdentitySchema } from "../config/identity-normalisation";
import { factoryIdentifierSchema } from "../shared/identifiers";
import { CANDIDATE_STATES } from "../workflow";

export const REVIEW_RESULTS = ["passed", "failed", "warning", "uncertain"] as const;
export type ReviewResult = (typeof REVIEW_RESULTS)[number];

export const AMBIGUITY_STATUSES = ["none", "resolved", "unresolved"] as const;
export type AmbiguityStatus = (typeof AMBIGUITY_STATUSES)[number];

/**
 * Binds a review to the exact candidate revision and blueprint it
 * reviewed, per the Shared Governance evidence-binding policy. Any
 * candidate change after review invalidates the review (the stored
 * candidateContentHash no longer matches) and forces the semantic-review
 * stage to run again.
 */
export const reviewEvidenceBindingSchema = z.object({
  candidateContentHash: z.string().trim().min(1).max(FACTORY_LIMITS.PROVENANCE_MAX_HASH_LENGTH),
  blueprintHash: z.string().trim().min(1).max(FACTORY_LIMITS.PROVENANCE_MAX_HASH_LENGTH),
  candidateRevision: z.number().int().nonnegative(),
  reviewResultHash: z.string().trim().min(1).max(FACTORY_LIMITS.PROVENANCE_MAX_HASH_LENGTH),
});

export type ReviewEvidenceBinding = z.infer<typeof reviewEvidenceBindingSchema>;

/**
 * A single review pass against a candidate. `findings` and
 * `evidenceReferences` are bounded in count and length: concise evidence
 * only, never chain-of-thought.
 *
 * `previousReviewHash`/`reviewHash` form an append-only tamper-evident
 * chain over one candidate's `reviewRecords[]` — see `./review-chain.ts`
 * for the only sanctioned way to append to or verify that chain. A record
 * must never be constructed by hand with these two fields filled in;
 * `appendReviewRecord` computes them.
 */
export const reviewRecordSchema = z.object({
  candidateId: factoryIdentifierSchema,
  stage: z.enum(CANDIDATE_STATES),
  reviewerIdentity: normalisedIdentitySchema,
  reviewerVersion: z.string().trim().min(1).max(FACTORY_LIMITS.PROVENANCE_MAX_VERSION_LENGTH),
  result: z.enum(REVIEW_RESULTS),
  confidence: z.number().min(0).max(1),
  findings: z
    .array(z.string().trim().min(1).max(FACTORY_LIMITS.REVIEW_MAX_FINDING_LENGTH))
    .max(FACTORY_LIMITS.REVIEW_MAX_FINDINGS),
  evidenceReferences: z
    .array(z.string().trim().min(1).max(FACTORY_LIMITS.REVIEW_MAX_EVIDENCE_REFERENCE_LENGTH))
    .max(FACTORY_LIMITS.REVIEW_MAX_EVIDENCE_REFERENCES),
  ambiguityStatus: z.enum(AMBIGUITY_STATUSES),
  reviewedAt: z.iso.datetime(),
  reviewPromptVersion: z.string().trim().min(1).max(FACTORY_LIMITS.PROVENANCE_MAX_VERSION_LENGTH),
  reviewPromptHash: z.string().trim().min(1).max(FACTORY_LIMITS.PROVENANCE_MAX_HASH_LENGTH),
  evidenceBinding: reviewEvidenceBindingSchema,
  previousReviewHash: z.string().trim().min(1).max(FACTORY_LIMITS.PROVENANCE_MAX_HASH_LENGTH),
  reviewHash: z.string().trim().min(1).max(FACTORY_LIMITS.PROVENANCE_MAX_HASH_LENGTH),
});

export type ReviewRecord = z.infer<typeof reviewRecordSchema>;
