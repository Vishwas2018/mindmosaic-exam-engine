import { z } from "zod";

import { normalisedIdentitySchema } from "../config/identity-normalisation";
import { CANDIDATE_STATES } from "../workflow";

export const REVIEW_RESULTS = ["passed", "failed", "warning", "uncertain"] as const;
export type ReviewResult = (typeof REVIEW_RESULTS)[number];

export const AMBIGUITY_STATUSES = ["none", "resolved", "unresolved"] as const;
export type AmbiguityStatus = (typeof AMBIGUITY_STATUSES)[number];

const MAX_FINDINGS = 15;
const MAX_FINDING_LENGTH = 400;
const MAX_EVIDENCE_REFERENCES = 15;
const MAX_EVIDENCE_REFERENCE_LENGTH = 300;

/**
 * Binds a review to the exact candidate revision and blueprint it
 * reviewed, per the Shared Governance evidence-binding policy. Any
 * candidate change after review invalidates the review (the stored
 * candidateContentHash no longer matches) and forces the semantic-review
 * stage to run again.
 */
export const reviewEvidenceBindingSchema = z.object({
  candidateContentHash: z.string().trim().min(1).max(128),
  blueprintHash: z.string().trim().min(1).max(128),
  candidateRevision: z.number().int().nonnegative(),
  reviewResultHash: z.string().trim().min(1).max(128),
});

export type ReviewEvidenceBinding = z.infer<typeof reviewEvidenceBindingSchema>;

/**
 * A single review pass against a candidate. `findings` and
 * `evidenceReferences` are bounded in count and length: concise evidence
 * only, never chain-of-thought.
 */
export const reviewRecordSchema = z.object({
  stage: z.enum(CANDIDATE_STATES),
  reviewerIdentity: normalisedIdentitySchema,
  reviewerVersion: z.string().trim().min(1).max(60),
  result: z.enum(REVIEW_RESULTS),
  confidence: z.number().min(0).max(1),
  findings: z.array(z.string().trim().min(1).max(MAX_FINDING_LENGTH)).max(MAX_FINDINGS),
  evidenceReferences: z
    .array(z.string().trim().min(1).max(MAX_EVIDENCE_REFERENCE_LENGTH))
    .max(MAX_EVIDENCE_REFERENCES),
  ambiguityStatus: z.enum(AMBIGUITY_STATUSES),
  reviewedAt: z.iso.datetime(),
  reviewPromptVersion: z.string().trim().min(1).max(40),
  reviewPromptHash: z.string().trim().min(1).max(128),
  evidenceBinding: reviewEvidenceBindingSchema,
});

export type ReviewRecord = z.infer<typeof reviewRecordSchema>;
