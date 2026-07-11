import { describe, expect, it } from "vitest";

import {
  CANDIDATE_STATES,
  TERMINAL_STATES,
  type CandidateState,
  getLegalNextStates,
  isLegalTransition,
} from "@/features/question-factory/workflow";

// Independently authored expected transition table, restated here (not
// imported from the implementation) so this test genuinely locks the
// contract rather than checking the implementation against itself.
const EXPECTED_TRANSITIONS: Record<CandidateState, readonly CandidateState[]> = {
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

describe("candidate lifecycle transition table (exhaustive)", () => {
  it.each(CANDIDATE_STATES)("state '%s' has the expected legal next states", (from) => {
    expect(new Set(getLegalNextStates(from))).toEqual(new Set(EXPECTED_TRANSITIONS[from]));
  });

  it("agrees with the expected table for every one of the 13x13 (from, to) pairs", () => {
    let checked = 0;
    for (const from of CANDIDATE_STATES) {
      for (const to of CANDIDATE_STATES) {
        const expected = EXPECTED_TRANSITIONS[from].includes(to);
        expect(isLegalTransition(from, to)).toBe(expected);
        checked++;
      }
    }
    expect(checked).toBe(CANDIDATE_STATES.length * CANDIDATE_STATES.length);
  });

  it("marks exactly needs_revision and archived as terminal (no legal outgoing transition)", () => {
    for (const state of CANDIDATE_STATES) {
      const isTerminalByTable = getLegalNextStates(state).length === 0;
      expect(isTerminalByTable).toBe(TERMINAL_STATES.has(state));
    }
    expect(TERMINAL_STATES).toEqual(new Set(["needs_revision", "archived"]));
  });

  it("every gate stage from 'generated' through 'difficulty_review_passed' can reach rejected, needs_revision and quarantined", () => {
    const gateStates: CandidateState[] = [
      "generated",
      "structural_validation_passed",
      "correctness_check_passed",
      "semantic_review_passed",
      "originality_review_passed",
      "difficulty_review_passed",
    ];
    for (const state of gateStates) {
      const next = getLegalNextStates(state);
      expect(next).toContain("rejected");
      expect(next).toContain("needs_revision");
      expect(next).toContain("quarantined");
    }
  });

  it("'staged' can fail (rejected/quarantined) but cannot request a revision", () => {
    const next = getLegalNextStates("staged");
    expect(next).toContain("rejected");
    expect(next).toContain("quarantined");
    expect(next).not.toContain("needs_revision");
  });

  it("only published, rejected and quarantined lead to archived", () => {
    for (const state of CANDIDATE_STATES) {
      const leadsToArchived = getLegalNextStates(state).includes("archived");
      expect(leadsToArchived).toBe(["published", "rejected", "quarantined"].includes(state));
    }
  });

  it("has no transition from any state back to blueprint_created (no cycles to the start)", () => {
    for (const state of CANDIDATE_STATES) {
      expect(getLegalNextStates(state)).not.toContain("blueprint_created");
    }
  });
});
