import type { SemanticClassification } from "./states";

export const GATE_OUTCOME_SEVERITIES = ["hard_fail", "soft_fail", "uncertain"] as const;
export type GateOutcomeSeverity = (typeof GATE_OUTCOME_SEVERITIES)[number];

export type GateFailureOutcome = "rejected" | "needs_revision" | "quarantined";

export interface GateFailurePolicyInput {
  /** How confidently the gate can say the candidate is unfit. */
  readonly severity: GateOutcomeSeverity;
  /** Revisions already spent on this candidate's lineage. */
  readonly revisionCount: number;
  /** Configured revision limit (Shared Governance: 2). */
  readonly maxRevisions: number;
}

/**
 * Data-driven rejection/quarantine policy: a hard failure is unambiguous
 * enough to reject outright; an uncertain result (the gate cannot decide)
 * is quarantined rather than guessed at; a soft failure is revisable while
 * the bounded revision budget remains, and rejected once it's spent.
 */
export function decideGateFailureOutcome(input: GateFailurePolicyInput): GateFailureOutcome {
  if (input.severity === "uncertain") return "quarantined";
  if (input.severity === "hard_fail") return "rejected";
  return input.revisionCount < input.maxRevisions ? "needs_revision" : "rejected";
}

export interface SemanticReviewGateInput {
  readonly semanticClassification: SemanticClassification;
  /**
   * True only if an independent-reviewer record exists that meets the
   * production confidence threshold, has sufficient evidence references,
   * and has no unresolved ambiguity finding. Rule-based/self-review
   * evidence must never be passed here as true for semantic content.
   */
  readonly hasIndependentReviewerRecordAtThreshold: boolean;
}

/**
 * The reviewer-availability gate: `deterministically_computable`
 * candidates need only the deterministic safety checks that already ran
 * to reach `correctness_check_passed`. `semantic_objective` and
 * `manual_review_writing` candidates can never advance to
 * `semantic_review_passed` without independent-reviewer evidence at the
 * production threshold - with no such evidence they must be quarantined,
 * never rejected or silently passed (Shared Governance: "Rule-based
 * review is a safety net, never sufficient proof for semantic content").
 */
export function canAdvanceToSemanticReviewPassed(input: SemanticReviewGateInput): boolean {
  if (input.semanticClassification === "deterministically_computable") {
    return true;
  }
  return input.hasIndependentReviewerRecordAtThreshold;
}
