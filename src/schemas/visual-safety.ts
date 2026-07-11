/**
 * Shared bounds for anything that walks a numeric range in fixed steps —
 * number-line ticks, coordinate-grid gridlines. A schema-valid but
 * adversarial combination (a tiny step over a huge span) can otherwise
 * generate an effectively unbounded array and freeze the tab; these
 * constants are enforced twice, deliberately:
 *
 * 1. At content-validation time (visual.schema.ts superRefine), which is
 *    the primary defence — unsafe configurations are rejected before
 *    they ever reach a renderer.
 * 2. At render time (calculateBoundedStepCount, used for index-based
 *    generation instead of an open-ended `for (v = min; v <= max; v +=
 *    step)` float loop), as a defence-in-depth backstop against any
 *    configuration that reaches the renderer without going through
 *    schema validation.
 */
export const MAX_NUMBER_LINE_TICKS = 200;
export const MAX_COORDINATE_GRID_LINES_PER_AXIS = 200;

/**
 * How many `min, min + step, min + 2*step, ...` points fit at or before
 * `max`, capped at `maxCount`. Returns 0 for any input that can't
 * describe a safe forward range (non-finite values, a non-positive step,
 * or max <= min) rather than throwing — callers treat 0 as "render
 * nothing" instead of needing their own guard.
 */
export function calculateBoundedStepCount(
  min: number,
  max: number,
  step: number,
  maxCount: number = MAX_NUMBER_LINE_TICKS,
): number {
  if (
    !Number.isFinite(min) ||
    !Number.isFinite(max) ||
    !Number.isFinite(step) ||
    step <= 0 ||
    max < min
  ) {
    return 0;
  }
  const rawCount = Math.floor((max - min) / step) + 1;
  return Math.min(Math.max(rawCount, 0), maxCount);
}
