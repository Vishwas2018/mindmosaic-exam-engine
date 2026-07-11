/**
 * Deterministic initial display order for an ordering question's items.
 *
 * Pure function of the authored item order: the same question always
 * yields the same starting sequence, and rotating by one position always
 * differs from the authored order itself (item ids are unique per the
 * question schema, so a length-2-or-more rotation always changes at least
 * the first position). This is what stops a learner who never touches an
 * ordering question from being shown a default that happens to already be
 * correct.
 *
 * The renderer has no access to the answer key (candidate-facing state
 * never carries one — see the security boundary in scoring/), so this
 * cannot check itself against the *correct* order at render time. That
 * guarantee is instead enforced once, at content-validation time, against
 * every production and showcase question — see
 * `src/tests/unit/ordering-initial-order.test.ts`.
 */
export function deriveInitialOrder(itemIds: readonly string[]): string[] {
  if (itemIds.length < 2) return [...itemIds];
  return [...itemIds.slice(1), itemIds[0]];
}
