import { hashJson } from "../provenance";
import type { AmbiguityStatus, ReviewResult } from "../provenance";

/**
 * The content a `ReviewRecord.evidenceBinding.reviewResultHash` binds to:
 * exactly what the reviewer concluded, independent of chain position
 * (`previousReviewHash`/`reviewHash`, which `appendReviewRecord` computes
 * separately over the whole record including this field). Distinct from
 * the chain hash so a caller can compare "did this review conclude the
 * same thing" without needing the full chain context `computeReviewHash`
 * requires.
 */
export interface ReviewResultHashInput {
  readonly result: ReviewResult;
  readonly confidence: number;
  readonly findings: readonly string[];
  readonly evidenceReferences: readonly string[];
  readonly ambiguityStatus: AmbiguityStatus;
  readonly recommendedCorrections?: readonly string[];
}

export function computeReviewResultHash(input: ReviewResultHashInput): string {
  return hashJson({
    result: input.result,
    confidence: input.confidence,
    findings: input.findings,
    evidenceReferences: input.evidenceReferences,
    ambiguityStatus: input.ambiguityStatus,
    ...(input.recommendedCorrections !== undefined
      ? { recommendedCorrections: input.recommendedCorrections }
      : {}),
  });
}
