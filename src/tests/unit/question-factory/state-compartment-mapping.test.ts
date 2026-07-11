import { describe, expect, it } from "vitest";

import { CANDIDATE_STATES, type CandidateState } from "@/features/question-factory/workflow";
import {
  FACTORY_COMPARTMENTS,
  REJECTION_GATES,
  compartmentForState,
} from "@/features/question-factory/storage";

describe("compartmentForState", () => {
  it("maps every non-rejected, non-published state to a compartment that exists in FACTORY_COMPARTMENTS", () => {
    const compartmentSet = new Set(FACTORY_COMPARTMENTS);
    const statesWithoutSpecialHandling = CANDIDATE_STATES.filter(
      (state) => state !== "rejected" && state !== "published",
    );
    for (const state of statesWithoutSpecialHandling) {
      const compartment = compartmentForState(state);
      expect(compartment).toBeDefined();
      expect(compartmentSet.has(compartment as never)).toBe(true);
    }
  });

  it("requires a rejection gate to resolve a compartment for 'rejected'", () => {
    expect(compartmentForState("rejected")).toBeUndefined();
  });

  it("maps 'rejected' plus each gate to its own dedicated compartment", () => {
    for (const gate of REJECTION_GATES) {
      expect(compartmentForState("rejected", gate)).toBe(`rejected/${gate}`);
    }
  });

  it("has no workspace compartment for 'published' (it moves into the real question bank)", () => {
    expect(compartmentForState("published")).toBeUndefined();
  });

  it("routes every gate-review state into the shared review-queue compartment", () => {
    const gateStates: CandidateState[] = [
      "structural_validation_passed",
      "correctness_check_passed",
      "semantic_review_passed",
      "originality_review_passed",
      "difficulty_review_passed",
      "needs_revision",
    ];
    for (const state of gateStates) {
      expect(compartmentForState(state)).toBe("review-queue");
    }
  });

  it("maps blueprint_created, generated, staged, quarantined and archived to their own compartments", () => {
    expect(compartmentForState("blueprint_created")).toBe("blueprints");
    expect(compartmentForState("generated")).toBe("generated");
    expect(compartmentForState("staged")).toBe("staged");
    expect(compartmentForState("quarantined")).toBe("quarantined");
    expect(compartmentForState("archived")).toBe("archived");
  });
});
