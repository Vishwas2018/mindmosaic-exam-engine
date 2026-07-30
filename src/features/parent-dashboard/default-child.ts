import type { ChildProfile, ChildSummary } from "./summary";

/**
 * Ordering and default selection for the parent dashboard's child switcher.
 *
 * Both rules here exist because of one real incident. A parent had two
 * children with the same display name — one an accidental duplicate with no
 * exam data at all — and the dashboard showed the empty one, reporting "No
 * exams from Child A yet" while two completed attempts sat on the sibling.
 *
 * There were two separate defects behind that:
 *
 * 1. The order was not deterministic. Children were sorted by display name
 *    alone; `localeCompare` returns 0 for two identical names, and
 *    `Array.prototype.sort` is stable, so the tie was resolved by whatever
 *    order the rows arrived in — and they arrived from a query with no
 *    ORDER BY. The dashboard was not showing a stable wrong answer, it was
 *    showing an arbitrary one that a vacuum or a row rewrite could flip.
 *    `compareChildren` is a total order, so no tie is ever left to chance.
 *
 * 2. The default was always index 0. Even with a deterministic order, "the
 *    first child" is the wrong default when that child has nothing to show
 *    and a sibling does.
 */

/**
 * Total order over children: display name first (so the switcher still reads
 * alphabetically), then creation time, then id. The last two can only ever
 * matter for children whose names are identical, and `id` guarantees the
 * comparator is total even in the pathological case of two profiles created
 * in the same microsecond.
 */
export function compareChildren(
  a: Pick<ChildProfile, "id" | "displayName" | "createdAt">,
  b: Pick<ChildProfile, "id" | "displayName" | "createdAt">,
): number {
  const byName = (a.displayName ?? "").localeCompare(b.displayName ?? "");
  if (byName !== 0) return byName;

  const aTime = Date.parse(a.createdAt);
  const bTime = Date.parse(b.createdAt);
  // An unparseable timestamp sorts last rather than poisoning the comparison
  // with NaN, which would make the comparator non-transitive.
  const aSafe = Number.isNaN(aTime) ? Infinity : aTime;
  const bSafe = Number.isNaN(bTime) ? Infinity : bTime;
  if (aSafe !== bSafe) return aSafe - bSafe;

  return a.id.localeCompare(b.id);
}

/**
 * Whether this child has anything at all to show. Unreadable attempts count:
 * they still mean the child has sat exams, and the dashboard surfaces them
 * explicitly ("N attempts could not be read"), which is far more useful than
 * silently defaulting past them to a sibling.
 */
export function hasResults(summary: Pick<ChildSummary, "attemptCount" | "unreadableAttemptCount">): boolean {
  return summary.attemptCount > 0 || summary.unreadableAttemptCount > 0;
}

/**
 * Which child the dashboard should open on: the first, in `compareChildren`
 * order, that has any exam data — otherwise the first child.
 *
 * This is deliberately broader than "only break same-name ties". A parent
 * landing on an empty dashboard while another child's results sit one click
 * away is the same failure whatever the two children are called, and the
 * switcher is right there for anyone who wanted the other child. It is only
 * ever a preference, never a filter: no child is hidden by it.
 *
 * Returns 0 for an empty list so callers can index without a guard; they
 * already clamp against `summaries.length - 1`.
 */
export function pickDefaultChildIndex(
  summaries: readonly Pick<ChildSummary, "attemptCount" | "unreadableAttemptCount">[],
): number {
  const withResults = summaries.findIndex(hasResults);
  return withResults === -1 ? 0 : withResults;
}
