import { hashJson } from "./content-hash";
import type { ReviewRecord } from "./review-record";

/**
 * Explicit sentinel for "there is no prior record" — the first review
 * record in a candidate's chain always has `previousReviewHash` set to
 * this value, never an empty string or `null`, so a genesis record and a
 * corrupted/missing-field record can never be confused.
 */
export const REVIEW_CHAIN_GENESIS_HASH = "genesis";

/** Everything needed to construct a review record, before it joins the chain. */
export type ReviewRecordDraft = Omit<ReviewRecord, "previousReviewHash" | "reviewHash">;

/**
 * The exact, stable payload a review record's hash is computed over: every
 * field named in the Shared Governance tamper-evidence requirement
 * (candidate id, candidate revision, candidate content hash, blueprint
 * hash, stage, reviewer identity, reviewer version, result, confidence,
 * findings + evidence references, reviewed timestamp, previous review
 * hash). `findings`/`evidenceReferences` are included directly rather than
 * pre-digested separately — `hashJson`'s stable-key-order, newline-
 * normalised hashing already binds their exact contents just as strongly.
 */
function reviewHashPayload(record: Omit<ReviewRecord, "reviewHash">): unknown {
  return {
    candidateId: record.candidateId,
    candidateRevision: record.evidenceBinding.candidateRevision,
    candidateContentHash: record.evidenceBinding.candidateContentHash,
    blueprintHash: record.evidenceBinding.blueprintHash,
    stage: record.stage,
    reviewerIdentity: record.reviewerIdentity,
    reviewerVersion: record.reviewerVersion,
    result: record.result,
    confidence: record.confidence,
    findings: record.findings,
    evidenceReferences: record.evidenceReferences,
    ambiguityStatus: record.ambiguityStatus,
    reviewedAt: record.reviewedAt,
    reviewPromptVersion: record.reviewPromptVersion,
    reviewPromptHash: record.reviewPromptHash,
    previousReviewHash: record.previousReviewHash,
    // Mission 3B additive fields: included only when present, so a
    // record that never sets them (every fixture/golden-vector test
    // written before Mission 3B, and any record that legitimately omits
    // them) hashes identically to before — see `review-record.ts`'s doc
    // comments on both fields for why they are optional and non-load-bearing.
    ...(record.recommendedCorrections !== undefined
      ? { recommendedCorrections: record.recommendedCorrections }
      : {}),
    ...(record.evidenceBinding.semanticClassification !== undefined
      ? { semanticClassification: record.evidenceBinding.semanticClassification }
      : {}),
    // Mission 3B P1-2: `reviewId`/`reviewResultFingerprint` are the
    // durable idempotency mechanism (see `review-record.ts`'s doc
    // comments) — tampering with either must break chain verification
    // exactly like tampering with any other content-bearing field.
    // Included only when present, for the same backward-compatibility
    // reason as the two fields above.
    ...(record.reviewId !== undefined ? { reviewId: record.reviewId } : {}),
    ...(record.reviewResultFingerprint !== undefined
      ? { reviewResultFingerprint: record.reviewResultFingerprint }
      : {}),
  };
}

/**
 * Deterministic hash of a review record (minus its own `reviewHash`,
 * which this computes). Same stable-JSON + LF-normalised hashing as every
 * other content hash in the factory domain, so it is reproducible
 * regardless of key insertion order or CRLF/LF checkout.
 */
export function computeReviewHash(record: Omit<ReviewRecord, "reviewHash">): string {
  return hashJson(reviewHashPayload(record));
}

/**
 * The only sanctioned way to add a record to a candidate's review chain:
 * takes the existing chain (in append order) and a draft of the new
 * record, and returns the new record with `previousReviewHash` (the prior
 * record's `reviewHash`, or the explicit genesis value for the first
 * record) and `reviewHash` correctly computed. Never construct a
 * `ReviewRecord` with these two fields filled in by hand.
 */
export function appendReviewRecord(
  existingChain: readonly ReviewRecord[],
  draft: ReviewRecordDraft,
): ReviewRecord {
  const previousReviewHash =
    existingChain.length > 0
      ? existingChain[existingChain.length - 1]!.reviewHash
      : REVIEW_CHAIN_GENESIS_HASH;

  const withPrevious: Omit<ReviewRecord, "reviewHash"> = { ...draft, previousReviewHash };
  const reviewHash = computeReviewHash(withPrevious);

  return { ...withPrevious, reviewHash };
}

export type ReviewChainIssueCode = "previous_hash_mismatch" | "review_hash_mismatch" | "duplicate_review_id";

export interface ReviewChainIssue {
  readonly index: number;
  readonly code: ReviewChainIssueCode;
  readonly message: string;
}

export interface ReviewChainVerificationResult {
  readonly valid: boolean;
  readonly issues: readonly ReviewChainIssue[];
}

/**
 * Verifies a candidate's full review chain: the first record must chain
 * from the genesis value, every later record's `previousReviewHash` must
 * equal the *stored* `reviewHash` of the record immediately before it, and
 * every record's own `reviewHash` must match what its content recomputes
 * to. Continuing the walk from each record's *stored* (not recomputed)
 * hash means a single tampered record is reported once, at its own index,
 * rather than cascading a false mismatch onto every record after it —
 * editing, deleting, reordering, or replacing any one record still always
 * produces at least one issue somewhere in the chain, it just stays
 * precisely localised.
 *
 * **Mission 3B P1 remediation.** Also enforces that every non-`undefined`
 * `reviewId` appears at most once across the whole chain. Replay/conflict
 * resolution (`review-ingest.ts`'s `resolveIdempotency`) takes the *first*
 * chain record matching a given `reviewId` — correct only if `reviewId` is
 * actually unique. A chain with two validly-hashed records sharing one
 * `reviewId` (however they got there — hand-construction, a bug, a
 * tampered restore) would let first-match resolution silently ignore
 * durable replay evidence in the second record, identical or conflicting
 * fingerprint alike. Detected here, at the trusted full-chain-verification
 * boundary every caller already checks before doing anything
 * idempotency-sensitive, so the whole chain is rejected before any replay
 * resolution is attempted against it — never a first-match or last-match
 * fallback.
 */
export function verifyReviewChain(records: readonly ReviewRecord[]): ReviewChainVerificationResult {
  const issues: ReviewChainIssue[] = [];
  let expectedPreviousHash: string = REVIEW_CHAIN_GENESIS_HASH;
  const seenReviewIds = new Set<string>();

  records.forEach((record, index) => {
    if (record.previousReviewHash !== expectedPreviousHash) {
      issues.push({
        index,
        code: "previous_hash_mismatch",
        message: `Record ${index} (candidate '${record.candidateId}') previousReviewHash does not match the prior record's reviewHash — the chain has been edited, reordered, or had a record inserted or deleted.`,
      });
    }

    const recomputed = computeReviewHash(record);
    if (recomputed !== record.reviewHash) {
      issues.push({
        index,
        code: "review_hash_mismatch",
        message: `Record ${index} (candidate '${record.candidateId}') reviewHash does not match its recomputed content hash — the record was edited after being appended.`,
      });
    }

    if (record.reviewId !== undefined) {
      if (seenReviewIds.has(record.reviewId)) {
        issues.push({
          index,
          code: "duplicate_review_id",
          message: `Record ${index} (candidate '${record.candidateId}') reuses reviewId '${record.reviewId}', which already appears earlier in this chain — every reviewId must be unique regardless of whether the reviewResultFingerprint values match.`,
        });
      } else {
        seenReviewIds.add(record.reviewId);
      }
    }

    expectedPreviousHash = record.reviewHash;
  });

  return { valid: issues.length === 0, issues };
}
