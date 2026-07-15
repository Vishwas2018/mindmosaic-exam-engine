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

/**
 * Every physical compartment `state` could authoritatively occupy, derived
 * entirely from `compartmentForState` (never a second, hand-maintained
 * mapping). For every state except `rejected` this is at most the single
 * compartment `compartmentForState` returns (empty for a state with no
 * workspace compartment at all, e.g. `published`). `rejected`'s compartment
 * depends on which gate rejected the candidate, which a caller checking an
 * already-persisted record may not know in advance — this returns every
 * per-gate rejection compartment, so a caller can ask "is this physical
 * compartment consistent with *some* valid rejection", not "consistent with
 * one specific gate's rejection".
 *
 * Used to distinguish a lifecycle state that is physically inconsistent
 * with the compartment it was found in (e.g. `rejected` or `quarantined`
 * found sitting in `review-queue`) from a state that is simply unrelated or
 * earlier in the pipeline (e.g. `blueprint_created`) — the former is a
 * genuine compartment/state conflict, the latter is not.
 */
export function authoritativeCompartmentsForState(
  state: CandidateState,
): readonly FactoryCompartment[] {
  if (state === "rejected") {
    return REJECTION_GATES.map((gate) => compartmentForState("rejected", gate) as FactoryCompartment);
  }
  const compartment = compartmentForState(state);
  return compartment ? [compartment] : [];
}
