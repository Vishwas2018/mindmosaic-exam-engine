import { normaliseIdentity, normaliseIdentityOrThrow } from "../config";
import type { AmbiguityStatus, ReviewResult } from "../provenance";
import { computeReviewResultHash } from "./review-result-hash";
import type { ReviewContext, ReviewOutcome, Reviewer } from "./types";

export const FIXTURE_REVIEWER_VERSION = "v1" as const;

/**
 * Caller-configured, deterministic outcome a `FixtureReviewer` always
 * produces regardless of candidate content — deliberately never inspects
 * `context.question` itself (unlike `DeterministicRuleReviewer`), so
 * tests can construct any scenario (passing, failing, low-confidence,
 * ambiguous, self-review) without needing a real candidate shape to
 * trigger it.
 */
export interface FixtureReviewOutcomeConfig {
  readonly result: ReviewResult;
  readonly confidence: number;
  readonly findings: readonly string[];
  readonly evidenceReferences: readonly string[];
  readonly ambiguityStatus: AmbiguityStatus;
  readonly recommendedCorrections?: readonly string[];
}

/**
 * Deterministic, test/CI-only reviewer (contract §7: "never counts as
 * independent evidence for real candidates"). This is an operational and
 * policy statement, not a special code-level flag — a `FixtureReviewer`
 * satisfies exactly the same `Reviewer` contract, produces exactly the
 * same `ReviewRecord` shape, and is subject to exactly the same
 * independence/confidence/ambiguity/evidence-sufficiency checks as any
 * other reviewer (`isProductionGradeIndependentReview`). Its declared
 * identity (default: `"human"`, i.e. a stand-in for a hand-reviewed
 * fixture) must still be genuinely independent of whatever generator
 * identity produced the candidate under test, exactly like a real
 * external reviewer.
 */
export class FixtureReviewer implements Reviewer {
  readonly reviewerClass = "fixture" as const;
  readonly reviewerIdentity;
  readonly reviewerVersion = FIXTURE_REVIEWER_VERSION;

  constructor(
    private readonly outcome: FixtureReviewOutcomeConfig,
    declaredIdentity = "human",
  ) {
    this.reviewerIdentity = normaliseIdentityOrThrow(declaredIdentity);
  }

  async review(context: ReviewContext): Promise<ReviewOutcome> {
    return {
      kind: "record",
      draft: {
        candidateId: context.candidateId,
        stage: "correctness_check_passed",
        reviewerIdentity: this.reviewerIdentity,
        reviewerVersion: this.reviewerVersion,
        result: this.outcome.result,
        confidence: this.outcome.confidence,
        findings: [...this.outcome.findings],
        evidenceReferences: [...this.outcome.evidenceReferences],
        ...(this.outcome.recommendedCorrections !== undefined
          ? { recommendedCorrections: [...this.outcome.recommendedCorrections] }
          : {}),
        ambiguityStatus: this.outcome.ambiguityStatus,
        reviewedAt: context.reviewedAt,
        reviewPromptVersion: "fixture-v1",
        reviewPromptHash: "fixture-v1",
        evidenceBinding: {
          candidateContentHash: context.candidateContentHash,
          blueprintHash: context.blueprintHash,
          candidateRevision: context.candidateRevision,
          reviewResultHash: computeReviewResultHash({
            result: this.outcome.result,
            confidence: this.outcome.confidence,
            findings: this.outcome.findings,
            evidenceReferences: this.outcome.evidenceReferences,
            ambiguityStatus: this.outcome.ambiguityStatus,
            recommendedCorrections: this.outcome.recommendedCorrections,
          }),
          semanticClassification: context.semanticClassification,
        },
      },
    };
  }
}

/** Re-exported so callers never need a second import path for the identity check the class constructor already performs. */
export function isSupportedFixtureIdentity(declaredName: string): boolean {
  return normaliseIdentity(declaredName) !== undefined;
}
