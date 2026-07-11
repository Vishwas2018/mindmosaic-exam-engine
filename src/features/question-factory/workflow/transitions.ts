import type { CandidateState } from "./states";

/**
 * The complete legal-transition table. Every gate stage
 * (`generated` .. `difficulty_review_passed`) can advance to the next
 * passed-state or fall to `needs_revision` / `rejected` / `quarantined`
 * per Shared Governance ("any stage may yield rejected / needs_revision
 * / quarantined"). `staged` can only advance to `published` or fail
 * outright — a staged candidate has already cleared every gate, so a
 * late failure is a hard stop, not a revision request. `needs_revision`
 * has no outgoing transition: per the Mission 3 revision workflow, a
 * revision is ingested as a *new* candidate (parentCandidateId), not a
 * reuse of this record.
 */
export const TRANSITION_TABLE: Readonly<Record<CandidateState, readonly CandidateState[]>> = {
  blueprint_created: ["generated"],
  generated: ["structural_validation_passed", "needs_revision", "rejected", "quarantined"],
  structural_validation_passed: [
    "correctness_check_passed",
    "needs_revision",
    "rejected",
    "quarantined",
  ],
  correctness_check_passed: [
    "semantic_review_passed",
    "needs_revision",
    "rejected",
    "quarantined",
  ],
  semantic_review_passed: [
    "originality_review_passed",
    "needs_revision",
    "rejected",
    "quarantined",
  ],
  originality_review_passed: [
    "difficulty_review_passed",
    "needs_revision",
    "rejected",
    "quarantined",
  ],
  difficulty_review_passed: ["staged", "needs_revision", "rejected", "quarantined"],
  staged: ["published", "rejected", "quarantined"],
  published: ["archived"],
  needs_revision: [],
  rejected: ["archived"],
  quarantined: ["archived"],
  archived: [],
};

export function getLegalNextStates(from: CandidateState): readonly CandidateState[] {
  return TRANSITION_TABLE[from];
}

export function isLegalTransition(from: CandidateState, to: CandidateState): boolean {
  return TRANSITION_TABLE[from].includes(to);
}
