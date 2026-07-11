import { canAdvanceToSemanticReviewPassed, type SemanticReviewGateInput } from "./policies";
import type { CandidateState } from "./states";
import { isLegalTransition } from "./transitions";

export type TransitionFailureReason =
  | "illegal_transition"
  | "revision_limit_exhausted"
  | "missing_semantic_review_gate_context"
  | "semantic_review_requires_independent_evidence";

export type TransitionResult =
  | { readonly ok: true; readonly from: CandidateState; readonly to: CandidateState }
  | {
      readonly ok: false;
      readonly from: CandidateState;
      readonly to: CandidateState;
      readonly reason: TransitionFailureReason;
      readonly message: string;
    };

export interface TransitionContext {
  /** Revisions already spent on this candidate's lineage. */
  readonly revisionCount: number;
  /** Configured revision limit (Shared Governance: 2). */
  readonly maxRevisions: number;
  /**
   * Required when `to === "semantic_review_passed"`. Omitted for every
   * other transition target.
   */
  readonly semanticReviewGate?: SemanticReviewGateInput;
}

/**
 * The single entry point for moving a candidate between lifecycle states:
 * enforces the transition table, the bounded-revision policy, and the
 * semantic-reviewer-availability gate together, so no caller can bypass
 * any one of them by calling a lower-level check alone.
 */
export function applyTransition(
  from: CandidateState,
  to: CandidateState,
  context: TransitionContext,
): TransitionResult {
  if (!isLegalTransition(from, to)) {
    return {
      ok: false,
      from,
      to,
      reason: "illegal_transition",
      message: `'${from}' cannot transition to '${to}'.`,
    };
  }

  if (to === "needs_revision" && context.revisionCount >= context.maxRevisions) {
    return {
      ok: false,
      from,
      to,
      reason: "revision_limit_exhausted",
      message: `Revision limit (${context.maxRevisions}) already reached for this candidate lineage; route to 'rejected' instead.`,
    };
  }

  if (to === "semantic_review_passed") {
    if (!context.semanticReviewGate) {
      return {
        ok: false,
        from,
        to,
        reason: "missing_semantic_review_gate_context",
        message: "Advancing to 'semantic_review_passed' requires semanticReviewGate context.",
      };
    }
    if (!canAdvanceToSemanticReviewPassed(context.semanticReviewGate)) {
      return {
        ok: false,
        from,
        to,
        reason: "semantic_review_requires_independent_evidence",
        message:
          "Semantic-objective / manual-review-writing candidates require independent reviewer evidence at the production confidence threshold; route to 'quarantined' instead.",
      };
    }
  }

  return { ok: true, from, to };
}
