import type { ReviewRecord } from "../provenance";
import { verifyReviewChain } from "../provenance";

/**
 * P0-B. Publication manifests must carry the candidate's full review chain,
 * so published content stays post-hoc auditable.
 *
 * **The defect this closes.** `compartmentForState("published")` returns
 * `undefined` — the candidate record, and with it
 * `provenance.reviewRecords`, is consumed at publish time and
 * `review-queue/` is gitignored and never committed. The 2026-07-30
 * post-hoc audit therefore could not run `verifyReviewChain` on a single
 * one of the 288 published questions (§D2), and could recover a reviewer
 * identity for only 62 of them, from local artefacts a workspace clean
 * would have destroyed. The factory's tamper-evidence guarantees stopped at
 * the publication boundary, which is precisely where an auditor needs them.
 */

/** Manifests written before P0-B carry no version field at all. */
export const MANIFEST_SCHEMA_VERSION_LEGACY = 1;
/** Manifests written by a P0-B-aware publish, carrying a verifiable chain. */
export const MANIFEST_SCHEMA_VERSION_CURRENT = 2;

/**
 * Where a manifest's review chain was rooted.
 *
 * - `in_pipeline` — the ordinary case: the chain accumulated across the
 *   candidate's gates before publication and is carried through intact.
 * - `retroactive_post_publication` — a chain rooted *after* publication,
 *   because the pre-publication chain no longer exists to extend (the
 *   candidate record was consumed). It is anchored to the manifest's own
 *   published `contentHash`/`revision` rather than to a live candidate
 *   record, which is the only thing still authoritative about what was
 *   actually published. Genuinely tamper-evident from its own genesis
 *   forward; it simply cannot speak to anything before the anchor.
 */
export type ChainOrigin = "in_pipeline" | "retroactive_post_publication";

/**
 * Evidence rescued from ingest-side artefacts for content published before
 * P0-B. **Never a review-chain entry.** These are review *response
 * envelopes* — they have no `previousReviewHash`/`reviewHash`, were never
 * produced by `appendReviewRecord`, and can never satisfy
 * `verifyReviewChain`. They live under their own top-level manifest key so
 * no reader can mistake one for a chain record even by accident, and each
 * one states its own unverifiability inline.
 */
export interface RecoveredReviewEvidence {
  readonly candidateId: string;
  /** Always `"none"`. A constant, so the record itself says what it is worth. */
  readonly verifiability: "none";
  readonly recoveredAt: string;
  /** Repo-relative artefact this was rescued from, e.g. `reports/review-responses-…/…json`. */
  readonly sourceArtefact: string;
  /** The commit that rescued these records into tracked form. */
  readonly recoveryCommit: string;
  readonly reviewerModelDeclared: string;
  readonly reviewerVersion?: string;
  readonly reviewedAt?: string;
  readonly result?: string;
  readonly confidence?: number;
  readonly ambiguityStatus?: string;
  /** The content hash/revision the rescued review was bound to. */
  readonly reviewBoundContentHash: string;
  readonly reviewBoundRevision: number;
}

/** How the published question's correctness was established. */
export type CorrectnessBasis = "deterministic" | "independent_semantic_review";

export interface ManifestReviewEvidence {
  /** Absent on every manifest written before P0-B; treated as legacy. */
  readonly manifestSchemaVersion?: number;
  readonly correctnessBasis?: CorrectnessBasis;
  readonly chainOrigin?: ChainOrigin;
  readonly reviewChain?: readonly ReviewRecord[];
  readonly recoveredEvidence?: readonly RecoveredReviewEvidence[];
  /**
   * Explicit "nothing was recoverable for this pre-P0-B manifest". Required
   * when a legacy manifest has no `recoveredEvidence`, so absence of
   * evidence is always a recorded statement rather than an ambiguous gap —
   * a legacy manifest is never allowed to be silent about its own era.
   */
  readonly noChainRecovered?: true;
}

export interface ManifestValidationIssue {
  readonly path: string;
  readonly message: string;
}

export type ManifestValidationResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly issues: readonly ManifestValidationIssue[] };

function issue(path: string, message: string): ManifestValidationIssue {
  return { path, message };
}

/** Absent version field means a manifest written before P0-B existed. */
export function manifestSchemaVersionOf(manifest: { manifestSchemaVersion?: unknown }): number {
  const raw = manifest.manifestSchemaVersion;
  return typeof raw === "number" ? raw : MANIFEST_SCHEMA_VERSION_LEGACY;
}

/**
 * Validates a manifest's review evidence against the rules for its own era.
 *
 * Current-version manifests must carry a chain that `verifyReviewChain`
 * accepts, bound to the manifest's published content hash and revision, and
 * must declare where that chain was rooted. Legacy manifests must instead
 * declare, explicitly, either what was recovered or that nothing was —
 * "no manifest may be ambiguous about its era".
 */
export function validateManifestReviewEvidence(
  manifest: ManifestReviewEvidence & { candidateId: string; contentHash: string; revision: number },
): ManifestValidationResult {
  const issues: ManifestValidationIssue[] = [];
  const version = manifestSchemaVersionOf(manifest);

  // `recoveredEvidence` must never contain chain-shaped records, whatever
  // the era — this is the structural separation P0-B turns on.
  for (const [index, record] of (manifest.recoveredEvidence ?? []).entries()) {
    const asUnknown = record as unknown as Record<string, unknown>;
    if ("reviewHash" in asUnknown || "previousReviewHash" in asUnknown) {
      issues.push(
        issue(
          `recoveredEvidence[${index}]`,
          "Recovered evidence must never carry chain fields (reviewHash/previousReviewHash) — it is not a review-chain record and must not be shaped like one.",
        ),
      );
    }
    if (record.verifiability !== "none") {
      issues.push(issue(`recoveredEvidence[${index}].verifiability`, "Recovered evidence must declare verifiability 'none'."));
    }
    if (typeof record.recoveryCommit !== "string" || record.recoveryCommit.length === 0) {
      issues.push(issue(`recoveredEvidence[${index}].recoveryCommit`, "Recovered evidence must name the commit that rescued it."));
    }
    if (typeof record.sourceArtefact !== "string" || record.sourceArtefact.length === 0) {
      issues.push(issue(`recoveredEvidence[${index}].sourceArtefact`, "Recovered evidence must name the artefact it was rescued from."));
    }
  }

  if (version >= MANIFEST_SCHEMA_VERSION_CURRENT) {
    const chain = manifest.reviewChain;
    // The chain field must always be *present* — a current-version manifest
    // is never silent about its review evidence. Whether it may be empty
    // depends on how correctness was established: content the correctness
    // gate proved deterministically legitimately has no semantic review to
    // record (every numeracy question is in this class), whereas content
    // whose correctness rests on independent judgement must carry the
    // record that judgement lives in. Demanding a non-empty chain
    // unconditionally would block all deterministically-verifiable
    // publication outright — the same trap P0-A avoided with
    // `review_required`.
    if (chain === undefined) {
      issues.push(issue("reviewChain", "A current-version manifest must carry the candidate's review chain, even when it is empty."));
      return { ok: false, issues };
    }
    if (manifest.correctnessBasis !== "deterministic" && manifest.correctnessBasis !== "independent_semantic_review") {
      issues.push(issue("correctnessBasis", "A current-version manifest must record how correctness was established."));
    }
    if (manifest.correctnessBasis === "independent_semantic_review" && chain.length === 0) {
      issues.push(
        issue(
          "reviewChain",
          "Correctness rests on independent semantic review, so the manifest must carry the review chain that evidence lives in — an empty chain is not acceptable here.",
        ),
      );
      return { ok: false, issues };
    }
    if (manifest.chainOrigin !== "in_pipeline" && manifest.chainOrigin !== "retroactive_post_publication") {
      issues.push(issue("chainOrigin", "A current-version manifest must declare where its review chain was rooted."));
    }
    const verification = verifyReviewChain(chain);
    if (!verification.valid) {
      for (const chainIssue of verification.issues) {
        issues.push(issue(`reviewChain[${chainIssue.index}]`, `${chainIssue.code}: ${chainIssue.message}`));
      }
    }
    for (const [index, record] of chain.entries()) {
      if (record.candidateId !== manifest.candidateId) {
        issues.push(issue(`reviewChain[${index}].candidateId`, "Review chain contains a record belonging to a different candidate."));
      }
    }
    // The anchor: a retroactive chain is only meaningful if it is bound to
    // the content that was actually published.
    if (manifest.chainOrigin === "retroactive_post_publication") {
      const anchored = chain.some(
        (record) =>
          record.evidenceBinding.candidateContentHash === manifest.contentHash &&
          record.evidenceBinding.candidateRevision === manifest.revision,
      );
      if (!anchored) {
        issues.push(
          issue(
            "reviewChain",
            "A retroactive_post_publication chain must contain at least one record anchored to the manifest's published contentHash and revision.",
          ),
        );
      }
    }
    return issues.length === 0 ? { ok: true } : { ok: false, issues };
  }

  // Legacy era.
  const hasRecovered = (manifest.recoveredEvidence ?? []).length > 0;
  if (!hasRecovered && manifest.noChainRecovered !== true) {
    issues.push(
      issue(
        "recoveredEvidence",
        "A legacy manifest must declare either recovered evidence or noChainRecovered: true — absence of evidence must be stated, never left ambiguous.",
      ),
    );
  }
  if (hasRecovered && manifest.noChainRecovered === true) {
    issues.push(issue("noChainRecovered", "A legacy manifest cannot both carry recovered evidence and declare that none was recovered."));
  }
  return issues.length === 0 ? { ok: true } : { ok: false, issues };
}
