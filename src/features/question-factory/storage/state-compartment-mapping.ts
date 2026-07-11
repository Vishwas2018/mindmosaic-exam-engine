import type { CandidateState } from "../workflow";
import type { FactoryCompartment } from "./compartments";

export const REJECTION_GATES = [
  "structural",
  "correctness",
  "semantic",
  "originality",
  "difficulty",
] as const;
export type RejectionGate = (typeof REJECTION_GATES)[number];

/**
 * Maps a candidate's lifecycle state to the physical compartment it
 * belongs in. `rejected` additionally needs the gate that rejected it,
 * since the workspace has one rejection compartment per gate rather than
 * a single generic bucket - omit it and the mapping is undefined (the
 * caller must supply it). `published` has no workspace compartment: a
 * published candidate's content is written into
 * `src/content/questions/generated/` by the publishing subsystem
 * (Mission 3), and only its manifest stays in the factory workspace.
 */
export function compartmentForState(
  state: CandidateState,
  rejectionGate?: RejectionGate,
): FactoryCompartment | undefined {
  switch (state) {
    case "blueprint_created":
      return "blueprints";
    case "generated":
      return "generated";
    case "structural_validation_passed":
    case "correctness_check_passed":
    case "semantic_review_passed":
    case "originality_review_passed":
    case "difficulty_review_passed":
    case "needs_revision":
      return "review-queue";
    case "staged":
      return "staged";
    case "quarantined":
      return "quarantined";
    case "archived":
      return "archived";
    case "rejected":
      return rejectionGate ? (`rejected/${rejectionGate}` as FactoryCompartment) : undefined;
    case "published":
      return undefined;
    default:
      return undefined;
  }
}
