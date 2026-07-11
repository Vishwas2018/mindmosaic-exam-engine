export const CANDIDATE_STATES = [
  "blueprint_created",
  "generated",
  "structural_validation_passed",
  "correctness_check_passed",
  "semantic_review_passed",
  "originality_review_passed",
  "difficulty_review_passed",
  "staged",
  "published",
  "needs_revision",
  "rejected",
  "quarantined",
  "archived",
] as const;

export type CandidateState = (typeof CANDIDATE_STATES)[number];

/** States with no legal outgoing transition: the candidate record is done. */
export const TERMINAL_STATES: ReadonlySet<CandidateState> = new Set([
  "needs_revision",
  "archived",
]);

export const SEMANTIC_CLASSIFICATIONS = [
  "deterministically_computable",
  "semantic_objective",
  "manual_review_writing",
] as const;

export type SemanticClassification = (typeof SEMANTIC_CLASSIFICATIONS)[number];
