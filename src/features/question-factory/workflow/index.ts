export { applyTransition } from "./apply-transition";
export type {
  TransitionContext,
  TransitionFailureReason,
  TransitionResult,
} from "./apply-transition";
export {
  GATE_OUTCOME_SEVERITIES,
  canAdvanceToSemanticReviewPassed,
  decideGateFailureOutcome,
} from "./policies";
export type {
  GateFailureOutcome,
  GateFailurePolicyInput,
  GateOutcomeSeverity,
  SemanticReviewGateInput,
} from "./policies";
export {
  CANDIDATE_STATES,
  SEMANTIC_CLASSIFICATIONS,
  TERMINAL_STATES,
  isCandidateState,
} from "./states";
export type { CandidateState, SemanticClassification } from "./states";
export {
  TRANSITION_TABLE,
  getLegalNextStates,
  isLegalTransition,
  isReachableFrom,
} from "./transitions";
