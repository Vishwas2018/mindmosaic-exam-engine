export interface AdaptiveEligibilityFacts {
  readonly machineScorableAtRoutingPoint: boolean;
  readonly rendererSupported: boolean;
  readonly accessibleRepresentationSufficient: boolean;
  readonly requiredMediaAvailable: boolean;
  readonly blueprintMetadataComplete: boolean;
  readonly unresolvedQaFlags: readonly string[];
  readonly enemySetAssessmentComplete: boolean;
  readonly peerPoolCapacityPasses: boolean;
  readonly hasUnresolvedManualParts: boolean;
}

export type AdaptiveIneligibilityReason =
  | "not_machine_scorable"
  | "renderer_unsupported"
  | "accessible_representation_insufficient"
  | "required_media_unavailable"
  | "blueprint_metadata_incomplete"
  | "unresolved_qa_flags"
  | "enemy_set_assessment_incomplete"
  | "peer_pool_capacity_insufficient"
  | "manual_marks_unresolved";

/** Fail-closed eligibility for an item or immutable group version. */
export function evaluateAdaptiveEligibility(facts: AdaptiveEligibilityFacts): {
  readonly eligible: boolean;
  readonly reasons: readonly AdaptiveIneligibilityReason[];
} {
  const reasons: AdaptiveIneligibilityReason[] = [];
  if (!facts.machineScorableAtRoutingPoint) reasons.push("not_machine_scorable");
  if (!facts.rendererSupported) reasons.push("renderer_unsupported");
  if (!facts.accessibleRepresentationSufficient) reasons.push("accessible_representation_insufficient");
  if (!facts.requiredMediaAvailable) reasons.push("required_media_unavailable");
  if (!facts.blueprintMetadataComplete) reasons.push("blueprint_metadata_incomplete");
  if (facts.unresolvedQaFlags.length > 0) reasons.push("unresolved_qa_flags");
  if (!facts.enemySetAssessmentComplete) reasons.push("enemy_set_assessment_incomplete");
  if (!facts.peerPoolCapacityPasses) reasons.push("peer_pool_capacity_insufficient");
  if (facts.hasUnresolvedManualParts) reasons.push("manual_marks_unresolved");
  return { eligible: reasons.length === 0, reasons };
}
