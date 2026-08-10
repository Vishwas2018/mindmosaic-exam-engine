import { hashSeed } from "@/features/exam-engine/selection";

import type { SelectionUnit } from "./selection-units";

/**
 * Stable form partitioning — the doc's §5 requirement, and the reason this
 * module exists at all:
 *
 * > **Distinct seeds do not guarantee distinct papers.** Independent seeded
 * > draws from one bank overlap.
 *
 * Two sittings of the same pattern with different seeds will, with high
 * probability, share questions — that is what independent sampling from one
 * pool means. So a sitting does not pick a seed and hope; it picks a FORM.
 * Each eligible unit is assigned to form A, B or C exactly once, by a hash of
 * its own identity, and a sitting draws only within its form. Forms are
 * disjoint by construction, so three sittings on three forms share zero
 * questions — provably, not probabilistically.
 *
 * The assignment is a pure function of (pattern id, unit key): it does not
 * move when the bank grows, when the seed changes, or between the client and
 * the server. Adding questions to the bank redistributes only the new ones.
 *
 * The partition is over UNITS, not questions, so a stimulus group is never
 * split across two forms — half a passage in form A and half in form B would
 * reintroduce exactly the orphaning the group rule exists to prevent.
 */
export const MAX_FORMS = 3;

/** Which form a unit belongs to. Deterministic and seed-independent. */
export function formOfUnit(
  patternId: string,
  unit: SelectionUnit,
  formCount: number,
): number {
  if (formCount <= 1) return 0;
  return hashSeed(`${patternId}|${unit.key}`) % formCount;
}

/** The units of one form. */
export function unitsInForm(
  patternId: string,
  units: readonly SelectionUnit[],
  form: number,
  formCount: number,
): readonly SelectionUnit[] {
  if (formCount <= 1) return units;
  return units.filter((unit) => formOfUnit(patternId, unit, formCount) === form);
}

/** Every form index for a given count: [0], [0,1] or [0,1,2]. */
export function formIndexes(formCount: number): readonly number[] {
  return Array.from({ length: Math.max(1, formCount) }, (_, index) => index);
}
