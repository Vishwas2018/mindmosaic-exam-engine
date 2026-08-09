import { createHash } from "node:crypto";

import { hashJson } from "../provenance";
import type { SemanticClassification } from "../workflow";

/**
 * Mission 3D third audit remediation. Governed, append-only evidence that
 * the semantic-review gate's own workflow (`attemptSemanticReviewTransition`)
 * legitimately completed for a candidate — distinct from, and additional
 * to, the `correctness_check_passed -> semantic_review_passed` lifecycle
 * transition itself. Before this record existed, nothing durable
 * distinguished a candidate whose semantic review genuinely ran (either
 * legitimately skipped, for deterministically-computable content the
 * correctness gate already proved correct, or genuinely backed by an
 * independent reviewer chain) from one whose `state` field was simply
 * written directly — lifecycle state alone can never establish semantic
 * completion, including for the deterministic-skip path, which previously
 * had no evidence trail of any kind.
 *
 * Stored under a distinct id namespace (`sr-`) in the shared `reports`
 * compartment, written only via `create()` (never `update()`) — the same
 * append-only, fingerprint-based replay discipline every other gate's
 * evidence already follows.
 */
export interface SemanticCompletionEvidence {
  readonly candidateId: string;
  readonly candidateRevision: number;
  readonly candidateContentHash: string;
  readonly blueprintHash: string;
  /** The candidate's `SemanticClassification` at the moment this evidence was minted — cross-checked at read time against a *freshly recomputed* classification, never trusted on its own. */
  readonly semanticClassification: SemanticClassification;
  /**
   * `"deterministic_skip"`: content classified `deterministically_computable`
   * — the correctness gate's own deterministic pass already proves
   * correctness, so `canAdvanceToSemanticReviewPassed` requires no
   * independent evidence for this classification (see
   * `workflow/policies.ts`). `"independent_review"`: `semantic_objective`/
   * `manual_review_writing` content, genuinely backed by a qualifying
   * record in the candidate's own review chain.
   */
  readonly completionPath: "deterministic_skip" | "independent_review";
  /** Only present for `"independent_review"` — the exact chain record's `reviewHash` that independently satisfied the production-confidence threshold. */
  readonly satisfyingReviewHash?: string;
  /** Observational wall-clock read, excluded from `semanticCompletionFingerprint`. */
  readonly completedAt: string;
  readonly semanticCompletionFingerprint: string;
}

export interface SemanticCompletionFingerprintFacts {
  readonly candidateId: string;
  readonly candidateRevision: number;
  readonly candidateContentHash: string;
  readonly blueprintHash: string;
  readonly semanticClassification: SemanticClassification;
  readonly completionPath: "deterministic_skip" | "independent_review";
  readonly satisfyingReviewHash?: string;
}

/** The single authoritative semantic-completion-fingerprint algorithm. */
export function computeSemanticCompletionFingerprint(facts: SemanticCompletionFingerprintFacts): string {
  return hashJson({
    candidateId: facts.candidateId,
    candidateRevision: facts.candidateRevision,
    candidateContentHash: facts.candidateContentHash,
    blueprintHash: facts.blueprintHash,
    semanticClassification: facts.semanticClassification,
    completionPath: facts.completionPath,
    ...(facts.satisfyingReviewHash !== undefined ? { satisfyingReviewHash: facts.satisfyingReviewHash } : {}),
  });
}

export interface SemanticCompletionEvidenceInput {
  readonly candidateId: string;
  readonly candidateRevision: number;
  readonly candidateContentHash: string;
  readonly blueprintHash: string;
  readonly semanticClassification: SemanticClassification;
  readonly completionPath: "deterministic_skip" | "independent_review";
  readonly satisfyingReviewHash?: string;
  readonly completedAt: string;
}

export function buildSemanticCompletionEvidence(input: SemanticCompletionEvidenceInput): SemanticCompletionEvidence {
  const semanticCompletionFingerprint = computeSemanticCompletionFingerprint({
    candidateId: input.candidateId,
    candidateRevision: input.candidateRevision,
    candidateContentHash: input.candidateContentHash,
    blueprintHash: input.blueprintHash,
    semanticClassification: input.semanticClassification,
    completionPath: input.completionPath,
    satisfyingReviewHash: input.satisfyingReviewHash,
  });
  return {
    candidateId: input.candidateId,
    candidateRevision: input.candidateRevision,
    candidateContentHash: input.candidateContentHash,
    blueprintHash: input.blueprintHash,
    semanticClassification: input.semanticClassification,
    completionPath: input.completionPath,
    ...(input.satisfyingReviewHash !== undefined ? { satisfyingReviewHash: input.satisfyingReviewHash } : {}),
    completedAt: input.completedAt,
    semanticCompletionFingerprint,
  };
}

/** Distinct id namespace from every other gate's report key (`sv-`, `cv-`, `cva-`, `og-`) so semantic-completion evidence can never collide in the shared `reports` compartment. */
export function buildSemanticCompletionReportId(candidateId: string): string {
  const digest = createHash("sha256").update(candidateId, "utf8").digest("hex").slice(0, 40);
  return `sr-${digest}`;
}
