import { z } from "zod";

import { FACTORY_LIMITS } from "../config";
import { normalisedIdentitySchema } from "../config/identity-normalisation";
import { factoryIdentifierSchema } from "../shared/identifiers";
import { CANDIDATE_STATES, SEMANTIC_CLASSIFICATIONS } from "../workflow";

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
  /**
   * PD-2 (Mission 3 prerequisite decisions), 3B-implementation-time
   * refinement: the candidate's `SemanticClassification` at the moment
   * this review ran, stamped purely for audit/diagnostic visibility —
   * never load-bearing on its own. Optional/additive: classification is
   * already implied by `candidateContentHash` (any classification-
   * determining field change already changes the content hash and
   * therefore already invalidates this binding via
   * `isReviewStillValid`), so this field's only purpose is to make a
   * fingerprint mismatch diagnosable as "classification changed" rather
   * than only a generic content-hash mismatch.
   */
  semanticClassification: z.enum(SEMANTIC_CLASSIFICATIONS).optional(),
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
  /**
   * Mission 3B (contract §9): concrete corrections the reviewer
   * recommends, feeding the (out-of-scope-for-3B) revision workflow's
   * "reviewer findings" input. Optional/additive — every record created
   * before this field existed remains schema-valid; a deterministic-rule
   * or fixture review may legitimately have nothing to recommend.
   */
  recommendedCorrections: z
    .array(z.string().trim().min(1).max(FACTORY_LIMITS.REVIEW_MAX_FINDING_LENGTH))
    .max(FACTORY_LIMITS.MAX_RECOMMENDED_CORRECTIONS)
    .optional(),
  /**
   * Mission 3B P1-2 remediation: the external submission id this record
   * was created from (`review-ingest.ts`'s `reviewIngestionInputSchema.reviewId`),
   * stamped directly onto the durable record so idempotency/conflict
   * detection can be reconstructed from the chain itself — never from a
   * separate sidecar report whose write could fail independently of the
   * chain append (the exact crash window this field closes). Optional:
   * every record created before this field existed (or produced by a
   * reviewer that has no external submission id at all, e.g.
   * `DeterministicRuleReviewer`) remains schema-valid without it, and is
   * simply never matched by a reviewId scan.
   */
  reviewId: factoryIdentifierSchema.optional(),
  /**
   * `hashJson` over the submission's own content-bearing fields
   * (excluding `reviewedAt`) — see `review-ingest.ts`'s
   * `computeReviewResultFingerprint`. Stored alongside `reviewId` so a
   * resubmission under the same `reviewId` can be classified as an
   * idempotent replay (fingerprint matches) or a genuine conflict
   * (fingerprint differs) by scanning this candidate's own chain, with
   * no separate index required. Optional for the same reason `reviewId`
   * is.
   */
  reviewResultFingerprint: z.string().trim().min(1).max(FACTORY_LIMITS.PROVENANCE_MAX_HASH_LENGTH).optional(),
  evidenceBinding: reviewEvidenceBindingSchema,
  previousReviewHash: z.string().trim().min(1).max(FACTORY_LIMITS.PROVENANCE_MAX_HASH_LENGTH),
  reviewHash: z.string().trim().min(1).max(FACTORY_LIMITS.PROVENANCE_MAX_HASH_LENGTH),
});

export type ReviewRecord = z.infer<typeof reviewRecordSchema>;
