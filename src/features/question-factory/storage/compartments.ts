/**
 * The fixed set of physical storage locations under
 * `content/question-factory/`, matching the workspace scaffolded in the
 * domain-definition commit. A candidate record lives in exactly one of
 * these at a time.
 */
export const FACTORY_COMPARTMENTS = [
  "blueprints",
  "inbox",
  "generated",
  "review-queue",
  "staged",
  "published-manifests",
  "rejected/structural",
  "rejected/correctness",
  "rejected/semantic",
  "rejected/originality",
  "rejected/difficulty",
  "quarantined",
  "archived",
  "reports",
] as const;

export type FactoryCompartment = (typeof FACTORY_COMPARTMENTS)[number];

const COMPARTMENT_SET: ReadonlySet<string> = new Set(FACTORY_COMPARTMENTS);

export function isFactoryCompartment(value: string): value is FactoryCompartment {
  return COMPARTMENT_SET.has(value);
}
