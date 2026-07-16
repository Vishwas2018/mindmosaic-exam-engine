import { hashJson } from "../provenance";

/**
 * Mints a fresh, deterministic candidate id for a revision successor,
 * distinct from generation's `gen-` prefix, Mission 2A's `ing-` prefix, and
 * Mission 3A's `man-` prefix (a sibling identity scheme, never derived from
 * or colliding with any of them — mirrors `manual-ingestion/identity.ts`'s
 * `mintManualCandidateId` exactly). Identical
 * `(parentCandidateId, revisionRequestId, revisedContentHash)` always mints
 * the same id — an identical resubmission of the same winning request
 * mints the same id and therefore replays cleanly through
 * `FactoryRepository.create()`'s own existing duplicate-detection, exactly
 * as ordinary ingestion already does. `revisionRequestId` is included (not
 * just `revisedContentHash`) so a byte-identical correction submitted under
 * a genuinely different request id is still distinguishable — defence in
 * depth alongside the `supersededBy` conflict rules in `revise.ts`, which
 * already refuse a second request against a claimed parent before this
 * function is ever reached for it.
 */
export function mintRevisionCandidateId(params: {
  readonly parentCandidateId: string;
  readonly revisionRequestId: string;
  readonly revisedContentHash: string;
}): string {
  const seed = hashJson({
    parentCandidateId: params.parentCandidateId,
    revisionRequestId: params.revisionRequestId,
    revisedContentHash: params.revisedContentHash,
  });
  return `rev-${seed.slice(0, 24)}`;
}
