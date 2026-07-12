import { identitiesAreIndependent, type NormalisedIdentity } from "../config/identity-normalisation";
import { verifyReviewChain } from "./review-chain";
import type { ReviewRecord } from "./review-record";

export interface CandidateEvidenceSnapshot {
  readonly candidateId: string;
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
 * Everything a caller must present to claim a review record as
 * production-grade evidence. There is deliberately no way to hand
 * `isProductionGradeIndependentReview` a bare `ReviewRecord` any more — a
 * directly constructed, standalone record (the exact shape of the review-
 * chain-integrity defect this closes) cannot satisfy this shape, because
 * `reviewHash` must actually be found inside a `chain` that
 * `verifyReviewChain` accepts, and that chain must end at the hash the
 * caller independently expects.
 *
 * - `chain`: the candidate's full `reviewRecords[]`, in append order, as
 *   read from trusted storage (e.g. `CandidateProvenance.reviewRecords`) —
 *   never a hand-picked subset or a single detached record.
 * - `reviewHash`: which record in that chain is being claimed as evidence.
 * - `expectedTerminalReviewHash`: the hash the caller independently
 *   believes the chain currently ends at (e.g. a value obtained from the
 *   same trusted read as `chain`, captured before any further review may
 *   have been appended). A mismatch means the presented chain is shorter,
 *   longer, or otherwise not the one the caller thinks it is — including a
 *   truncated chain that would otherwise still verify internally.
 */
export interface VerifiedReviewChainEvidence {
  readonly chain: readonly ReviewRecord[];
  readonly reviewHash: string;
  readonly expectedTerminalReviewHash: string;
}

/**
 * A review counts as production-grade independent semantic-review
 * evidence only when all of:
 *
 * 1. `chain` is a non-empty, tamper-evident-verified review chain
 *    (`verifyReviewChain` — catches edited, deleted, reordered, or
 *    otherwise forged records anywhere in the chain).
 * 2. `chain`'s last record's `reviewHash` equals
 *    `expectedTerminalReviewHash` (catches a truncated or otherwise
 *    unexpected chain being substituted for the real one).
 * 3. `reviewHash` identifies a record that is actually present in `chain`
 *    (never a hash borrowed from elsewhere) and that record's
 *    `candidateId` matches `current.candidateId` (a genuinely valid
 *    record from a *different* candidate's chain is rejected here, even
 *    though every hash check above it passed).
 * 4. Reviewer independence, accepted result, confidence at/above the
 *    threshold, at least one evidence reference, no unresolved ambiguity.
 * 5. The evidence binding (`isReviewStillValid`) still matches the
 *    candidate's current content hash, blueprint hash, and revision.
 */
export function isProductionGradeIndependentReview(
  generatorIdentity: NormalisedIdentity,
  evidence: VerifiedReviewChainEvidence,
  current: CandidateEvidenceSnapshot,
  minimumConfidence: number,
): boolean {
  const { chain, reviewHash, expectedTerminalReviewHash } = evidence;

  if (chain.length === 0) {
    return false;
  }

  if (!verifyReviewChain(chain).valid) {
    return false;
  }

  const terminalRecord = chain[chain.length - 1]!;
  if (terminalRecord.reviewHash !== expectedTerminalReviewHash) {
    return false;
  }

  const review = chain.find((record) => record.reviewHash === reviewHash);
  if (!review || review.candidateId !== current.candidateId) {
    return false;
  }

  return (
    isIndependentReview(generatorIdentity, review) &&
    review.result === "passed" &&
    review.confidence >= minimumConfidence &&
    review.evidenceReferences.length > 0 &&
    review.ambiguityStatus !== "unresolved" &&
    isReviewStillValid(review, current)
  );
}
