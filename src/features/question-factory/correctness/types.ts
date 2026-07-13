import type { StructuralValidationEvidence } from "../validation";
import type { QuestionFactoryCandidate } from "../validation";

/** Re-exported so orchestration callers never need to reach into `../validation` themselves. */
export type { QuestionFactoryCandidate };

export const CORRECTNESS_CAPABILITIES = [
  "deterministically_verifiable",
  "structurally_scoreable_only",
  "requires_independent_semantic_review",
  "unsupported",
] as const;
export type CorrectnessCapability = (typeof CORRECTNESS_CAPABILITIES)[number];

/**
 * Closed issue-code catalogue for the correctness gate. Grouped to mirror
 * `docs/reports/mission2-production/03-correctness-verification.md`'s
 * "Issue-code catalogue" section.
 */
export const CORRECTNESS_VERIFICATION_ISSUE_CODES = [
  // Structural-evidence binding (entry-condition checks).
  "missing_structural_evidence",
  "stale_structural_evidence",
  "structural_evidence_mismatch",

  // Capability / routing.
  "unsupported_correctness_category",
  "semantic_review_required",

  // Independent derivation.
  "unable_to_derive_answer",
  "ambiguous_prompt",
  "ambiguous_visual_data",

  // Comparison and scoring.
  "declared_answer_mismatch",
  "canonical_response_not_full_marks",
  "derived_response_not_full_marks",
  "explanation_contradiction",
  "scoring_engine_error",

  // Exact-arithmetic guard rails.
  "numeric_overflow",
  "division_by_zero",
  "invalid_rounding_rule",
  "invalid_money_representation",
  "invalid_fraction_representation",
  "arithmetic_resource_limit_exceeded",
  "fraction_resource_limit_exceeded",
  "money_value_invalid",
  "money_limit_exceeded",

  // Visual-data specific.
  "visual_answer_mismatch",
  "table_reference_missing",
  "chart_category_missing",
  "number_line_inconsistent",
  "ambiguous_visual_label",
  "ambiguous_table_header",
  "ambiguous_table_row",

  // Cached-replay evidence binding (see `validate-cached-replay.ts`).
  "cached_replay_integrity_failure",
] as const;
export type CorrectnessVerificationIssueCode = (typeof CORRECTNESS_VERIFICATION_ISSUE_CODES)[number];

export interface CorrectnessVerificationIssue {
  readonly code: CorrectnessVerificationIssueCode;
  readonly path: string;
  readonly message: string;
  readonly severity: "error" | "review_required";
}

/**
 * Fixed, data-independent catalogue of check groups every run performs —
 * never a runtime execution trace. Mirrors
 * `STRUCTURAL_VALIDATION_CHECK_GROUPS`'s "configured catalogue, not a
 * trace" contract.
 */
export const CORRECTNESS_CHECK_CATALOGUE = [
  "structural_evidence_binding",
  "capability_classification",
  "declared_response_scoring",
  "independent_derivation",
  "derived_response_scoring",
  "declared_vs_derived_comparison",
  "explanation_consistency",
] as const;
export type CorrectnessCheckGroup = (typeof CORRECTNESS_CHECK_CATALOGUE)[number];

/**
 * Everything the pure verifier needs about the upstream structural gate
 * and this run's identity, supplied entirely by the caller — no I/O, no
 * wall-clock read, no randomness inside `verifyCandidateCorrectness`
 * itself. `structuralEvidence` is the stored report the orchestration
 * layer already read from the `reports` compartment; `blueprintHash` is
 * recomputed by the orchestration layer the same way
 * `orchestrate-structural-validation.ts` does, so the pure verifier can
 * detect blueprint drift by comparison alone.
 */
export interface CorrectnessVerificationContext {
  readonly verifiedAt: string;
  readonly structuralEvidence?: StructuralValidationEvidence;
  readonly blueprintHash?: string;
}

export type ScoringStatusSummary = "correct" | "incorrect" | "manual_review" | "unanswered" | "not_applicable";

export interface ScoringOutcomeSummary {
  readonly status: ScoringStatusSummary;
  readonly awardedMarks: number | null;
  readonly availableMarks: number | null;
  readonly fullMarks: boolean;
}

/** A stable, bounded-length representation of a derived or declared answer — never raw donor content, never unbounded text. */
export interface AnswerRepresentation {
  readonly method: string;
  readonly representation: string;
}

export interface CorrectnessVerificationIssueSummary {
  readonly errorCount: number;
  readonly reviewRequiredCount: number;
  readonly codes: readonly CorrectnessVerificationIssueCode[];
}

/**
 * Never includes secrets, raw local paths, unbounded donor content, or a
 * claim of semantic correctness. `declaredAnswer`/`derivedAnswer` carry
 * only short, closed-form representations (e.g. `"71"`, `"3/4"`,
 * `"$12.50"`, an option id) — never the prompt or explanation text
 * itself. `verifiedAt` is observational (caller-supplied wall-clock) and
 * deliberately excluded from `verificationFingerprint` for the same
 * replay-safety reason `validatedAt` is excluded from
 * `StructuralValidationEvidence.validationFingerprint` — see `evidence.ts`.
 */
export interface CorrectnessVerificationEvidence {
  readonly candidateId: string;
  readonly candidateRevision: number;
  readonly candidateContentHash: string;
  readonly blueprintHash?: string;
  readonly structuralEvidenceFingerprint?: string;
  readonly verifierVersion: string;
  /**
   * Version tag for the real scoring-engine *integration* this gate relies
   * on (`safeScoreQuestion`'s contract with `@/features/exam-engine`) —
   * bumped independently of `verifierVersion` whenever that integration's
   * behaviour changes in a way that could invalidate a stored verification,
   * even if the verifier's own check catalogue did not change. See
   * `CORRECTNESS_SCORER_VERSION` in `evidence.ts`.
   */
  readonly scorerVersion: string;
  readonly schemaVersion: string;
  readonly taxonomyVersion: string;
  readonly capability: CorrectnessCapability;
  readonly deterministicCategory?: string;
  readonly declaredAnswer?: AnswerRepresentation;
  readonly derivedAnswer?: AnswerRepresentation;
  readonly declaredScoring?: ScoringOutcomeSummary;
  readonly derivedScoring?: ScoringOutcomeSummary;
  readonly checksPerformed: readonly CorrectnessCheckGroup[];
  readonly issueSummary: CorrectnessVerificationIssueSummary;
  readonly outcome: "passed" | "failed" | "review_required";
  readonly verifiedAt: string;
  readonly verificationFingerprint: string;
}

export type CorrectnessVerificationResult =
  | {
      readonly status: "passed";
      readonly capability: "deterministically_verifiable";
      readonly evidence: CorrectnessVerificationEvidence;
    }
  | {
      readonly status: "failed";
      readonly capability: CorrectnessCapability;
      readonly issues: readonly CorrectnessVerificationIssue[];
      readonly evidence: CorrectnessVerificationEvidence;
    }
  | {
      readonly status: "review_required";
      readonly capability: "structurally_scoreable_only" | "requires_independent_semantic_review";
      readonly issues: readonly CorrectnessVerificationIssue[];
      readonly evidence: CorrectnessVerificationEvidence;
    };
