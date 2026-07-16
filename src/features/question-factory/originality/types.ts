import { ORIGINALITY_ISSUE_CODES, type OriginalityIssueCode } from "../config";
import type { QuestionFactoryCandidate } from "../validation";

/** Re-exported so orchestration callers never need to reach into `../validation` themselves. */
export type { QuestionFactoryCandidate };

/**
 * The issue-code catalogue itself lives in `config/mission3d-issue-codes.ts`
 * (the single source of truth, mirroring `revision/types.ts`'s
 * `RevisionIssueCode` import from `../config`) — re-exported here so every
 * other originality module can import it from `./types` without reaching
 * into `../config` directly.
 */
export { ORIGINALITY_ISSUE_CODES };
export type { OriginalityIssueCode };

export interface OriginalityIssue {
  readonly code: OriginalityIssueCode;
  readonly path: string;
  readonly message: string;
  readonly severity: "error" | "review_required";
}

export interface OriginalityIssueSummary {
  readonly errorCount: number;
  readonly codes: readonly OriginalityIssueCode[];
}

/**
 * The exact scope of comparison this gate performs and the corpus
 * snapshot the evidence rests on. `comparedIds` is bounded by the
 * production bank's own size; `corpusFingerprint` is `hashJson` over the
 * sorted id list, so any addition/removal to the corpus between two runs
 * changes it deterministically — see `orchestrate-originality-review.ts`'s
 * cached-replay validity check.
 */
export interface OriginalityCorpusScope {
  /** `"staged"` is not added until Mission 3E — see the plan's §5c. */
  readonly source: "production_bank";
  readonly comparedIds: readonly string[];
  readonly corpusFingerprint: string;
}

export interface OriginalityMatch {
  readonly matchedId: string;
  readonly similarityScore: number;
}

/**
 * Four-way classification of the candidate's nearest-match similarity
 * score, derived purely from the two existing `FACTORY_THRESHOLDS` cut
 * points (`STRUCTURALLY_SIMILAR_SIMILARITY`, `NEAR_DUPLICATE_SIMILARITY`)
 * plus the natural `similarity = 1.0` boundary within the upper bucket —
 * no new threshold values. See the Mission 3D plan §4a's outcome table.
 */
export const ORIGINALITY_CLASSIFICATIONS = [
  "distinct",
  "structurally_similar",
  "substantive_duplicate",
  "exact_duplicate",
] as const;
export type OriginalityClassification = (typeof ORIGINALITY_CLASSIFICATIONS)[number];

/**
 * This gate is duplicate/near-duplicate detection within the factory's
 * own corpus only; it is not a copyright-infringement check against
 * NAPLAN/ICAS/commercial material, and the existing human editorial
 * checklist (`docs/CONTENT_RULES.md`) remains required and is not
 * superseded by this gate.
 *
 * `blueprintHash` is resolved via `resolveBoundBlueprint` verbatim, even
 * though the similarity decision itself never reads blueprint content —
 * this keeps originality symmetric with every other gate in this mission
 * for corpus-drift-style cached-replay detection (Mission 3D plan §4a).
 */
export interface OriginalityEvidence {
  readonly candidateId: string;
  readonly candidateRevision: number;
  readonly candidateContentHash: string;
  readonly blueprintHash?: string;
  readonly checkerVersion: string;
  readonly normalisationVersion: string;
  readonly corpusScope: OriginalityCorpusScope;
  readonly nearestMatches: readonly OriginalityMatch[];
  readonly classification: OriginalityClassification;
  readonly outcome: "passed" | "failed" | "quarantined";
  readonly issues: readonly OriginalityIssue[];
  readonly issueSummary: OriginalityIssueSummary;
  readonly validatedAt: string;
  readonly originalityFingerprint: string;
}

/**
 * Everything the pure verifier needs, supplied entirely by the caller —
 * no I/O, no wall-clock read, no randomness inside
 * `verifyCandidateOriginality` itself. `corpus` is the orchestrator's
 * already-extracted comparable-text set (from the live `questionBank`),
 * `blueprintHash` the orchestrator's already-resolved bound-blueprint
 * hash (via `resolveBoundBlueprint`, reused verbatim).
 */
export interface OriginalityVerificationContext {
  readonly validatedAt: string;
  readonly corpus: readonly { readonly id: string; readonly comparableText: string }[];
  readonly blueprintHash?: string;
}

export type OriginalityResult =
  | {
      readonly status: "passed";
      readonly classification: "distinct";
      readonly evidence: OriginalityEvidence;
    }
  | {
      readonly status: "failed";
      readonly classification: "structurally_similar" | "substantive_duplicate" | "exact_duplicate";
      readonly issues: readonly OriginalityIssue[];
      readonly evidence: OriginalityEvidence;
    }
  | {
      readonly status: "quarantined";
      readonly issues: readonly OriginalityIssue[];
      readonly evidence: OriginalityEvidence;
    };
