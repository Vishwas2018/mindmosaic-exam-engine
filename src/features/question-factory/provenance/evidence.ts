import { identitiesAreIndependent, type NormalisedIdentity } from "../config/identity-normalisation";
import type { ReviewRecord } from "./review-record";

export interface CandidateEvidenceSnapshot {
  readonly contentHash: string;
  readonly blueprintHash: string;
  readonly revision: number;
}

/**
 * A review is evidence for exactly the candidate revision and blueprint it
 * was run against. Any change since then - a new content hash, a
 * different blueprint, a bumped revision - invalidates it, per the
 * evidence-binding policy.
 */
export function isReviewStillValid(
  review: ReviewRecord,
  current: CandidateEvidenceSnapshot,
): boolean {
  return (
    review.evidenceBinding.candidateContentHash === current.contentHash &&
    review.evidenceBinding.blueprintHash === current.blueprintHash &&
    review.evidenceBinding.candidateRevision === current.revision
  );
}

/**
 * A review only counts as independent evidence if the reviewer's
 * normalised identity differs from the generator's - generator
 * self-approval is always ignored, per Shared Governance.
 */
export function isIndependentReview(
  generatorIdentity: NormalisedIdentity,
  review: ReviewRecord,
): boolean {
  return identitiesAreIndependent(generatorIdentity, review.reviewerIdentity);
}

/**
 * A review counts as production-grade independent semantic-review
 * evidence only when all of: reviewer independence, accepted result,
 * confidence at/above the threshold, at least one evidence reference, no
 * unresolved ambiguity, and the evidence binding still matches the
 * candidate's current state.
 */
export function isProductionGradeIndependentReview(
  generatorIdentity: NormalisedIdentity,
  review: ReviewRecord,
  current: CandidateEvidenceSnapshot,
  minimumConfidence: number,
): boolean {
  return (
    isIndependentReview(generatorIdentity, review) &&
    review.result === "passed" &&
    review.confidence >= minimumConfidence &&
    review.evidenceReferences.length > 0 &&
    review.ambiguityStatus !== "unresolved" &&
    isReviewStillValid(review, current)
  );
}
