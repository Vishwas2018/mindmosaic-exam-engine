/**
 * The "more than twice X [but fewer than Y]" interval predicate used by
 * checkOptionQuestion in check-question-correctness.mts (g5-icas-math-b01-008:
 * "Which team scored more than twice Blue's score but fewer than 20 points?").
 *
 * Extracted to a plain .ts module (not .mts) so it can be imported from both
 * the CLI script and a unit test — matching the scripts/lib/*.ts convention
 * already used for batch-log.ts, gate.ts and programme-quotas.ts.
 */
export interface TwicePredicate {
  readonly matches: (value: number) => boolean;
  readonly description: string;
}

/** `prompt` must already be lower-cased, as checkOptionQuestion does before calling this. */
export function moreThanTwicePredicate(
  prompt: string,
  referenceValue: number,
  referenceLabel: string,
): TwicePredicate {
  const fewerMatch = prompt.match(/\b(fewer|less) than (\d+)\b/);
  const upperBound = fewerMatch ? Number(fewerMatch[2]) : Infinity;
  return {
    matches: (value: number) => value > referenceValue * 2 && value < upperBound,
    description: `more than twice the '${referenceLabel}' value${upperBound < Infinity ? ` but fewer than ${upperBound}` : ""}`,
  };
}
