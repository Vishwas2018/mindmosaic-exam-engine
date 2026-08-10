import type { SelectionUnit } from "./selection-units";

/**
 * Choosing which units make up a source's quota.
 *
 * Without a stimulus rule every unit is one question and this is a slice —
 * `packExact` degenerates to "take the first N", which is precisely what
 * `selectExamQuestions` already does. With one, the units have sizes 4-7 and
 * the paper needs an exact total (39) from a bounded number of them (6-7), so
 * "take the first N" cannot work: it would either overshoot or leave a
 * partial group.
 *
 * `packExact` therefore searches the (already seeded-shuffled) unit order for
 * the first combination that lands exactly on the target within the unit-count
 * bounds. The search is depth-first over take/skip in shuffled order, so the
 * result is a deterministic function of the seed, and it is bounded by a node
 * budget so a pathological bank cannot hang a request.
 */

export interface PackBounds {
  /** Total questions the pack must contain. */
  readonly target: number;
  /** Inclusive bounds on how many units may be used. */
  readonly minUnits: number;
  readonly maxUnits: number;
}

/* Generous for real inputs (tens of units, targets in the tens) and small
   enough that an adversarial bank cannot stall a route handler. Exceeding it
   reports "no pack found", which readiness surfaces as not satisfiable —
   never as a silently short paper. */
const NODE_BUDGET = 200_000;

/**
 * The first exact pack in the given unit order, or undefined when none exists
 * within the bounds and the node budget.
 */
export function packExact(
  units: readonly SelectionUnit[],
  bounds: PackBounds,
): readonly SelectionUnit[] | undefined {
  const { target, minUnits, maxUnits } = bounds;
  if (target <= 0) return [];

  /* Remaining capacity from index i onwards, so a branch that can no longer
     reach the target is abandoned instead of walked to the end. */
  const suffixTotals = new Array<number>(units.length + 1).fill(0);
  for (let index = units.length - 1; index >= 0; index -= 1) {
    suffixTotals[index] = suffixTotals[index + 1]! + units[index]!.questions.length;
  }

  let nodes = 0;
  const chosen: SelectionUnit[] = [];

  function search(index: number, total: number): boolean {
    if (total === target && chosen.length >= minUnits && chosen.length <= maxUnits) {
      return true;
    }
    if (index >= units.length) return false;
    if (total > target) return false;
    if (chosen.length > maxUnits) return false;
    if (total + suffixTotals[index]! < target) return false;
    nodes += 1;
    if (nodes > NODE_BUDGET) return false;

    const unit = units[index]!;
    if (chosen.length < maxUnits && total + unit.questions.length <= target) {
      chosen.push(unit);
      if (search(index + 1, total + unit.questions.length)) return true;
      chosen.pop();
    }
    return search(index + 1, total);
  }

  return search(0, 0) ? [...chosen] : undefined;
}

/**
 * The largest total the units can reach without exceeding the target, in the
 * given order — the fallback used when a full-length pattern is NOT
 * satisfiable and the caller has asked for a clearly labelled practice module
 * of whatever the bank can supply. Greedy in shuffled order, so it is still a
 * deterministic function of the seed, and it never splits a unit.
 */
export function packBestEffort(
  units: readonly SelectionUnit[],
  bounds: PackBounds,
): readonly SelectionUnit[] {
  const chosen: SelectionUnit[] = [];
  let total = 0;
  for (const unit of units) {
    if (chosen.length >= bounds.maxUnits) break;
    if (total + unit.questions.length > bounds.target) continue;
    chosen.push(unit);
    total += unit.questions.length;
    if (total === bounds.target) break;
  }
  return chosen;
}
