/**
 * Fraction/decimal token parsing and comparison, built entirely on the
 * exact `Fraction` arithmetic in `numeric.ts`. Used for equivalence
 * ("is 2/4 the same as 1/2?"), comparison, and independent ordering of a
 * set of fraction/decimal option or matching-column texts.
 */
import {
  compareFractions,
  type Fraction,
  fractionFromDecimalString,
  makeFraction,
  NumericDerivationError,
} from "./numeric";

const FRACTION_TOKEN_PATTERN = /^-?\d+\s*\/\s*\d+$/;
const DECIMAL_TOKEN_PATTERN = /^-?\d+(?:\.\d+)?$/;

/** Parses "3/4" (a literal `a/b` token) into an exact `Fraction`, or `undefined` if the text isn't shaped that way. */
export function parseFractionToken(text: string): Fraction | undefined {
  const trimmed = text.trim();
  if (!FRACTION_TOKEN_PATTERN.test(trimmed)) return undefined;
  const [numeratorText, denominatorText] = trimmed.split("/").map((part) => part.trim());
  try {
    return makeFraction(BigInt(numeratorText), BigInt(denominatorText));
  } catch (error) {
    if (error instanceof NumericDerivationError) return undefined;
    throw error;
  }
}

/** Parses a plain decimal or integer literal into an exact `Fraction`, or `undefined` if the text isn't shaped that way. */
export function parseDecimalToken(text: string): Fraction | undefined {
  const trimmed = text.trim();
  if (!DECIMAL_TOKEN_PATTERN.test(trimmed)) return undefined;
  return fractionFromDecimalString(trimmed);
}

/** Tries a fraction token first, then a plain decimal — the two shapes a numeric option/matching-column text is expected to use. */
export function parseNumericToken(text: string): Fraction | undefined {
  return parseFractionToken(text) ?? parseDecimalToken(text);
}

export function fractionsEquivalent(a: Fraction, b: Fraction): boolean {
  return compareFractions(a, b) === 0;
}

export interface SortableEntry<Id> {
  readonly id: Id;
  readonly value: Fraction;
}

/**
 * Independently sorts entries by their exact numeric value. Returns
 * `undefined` — never a tie-broken guess — when two entries share the same
 * value, since a well-formed ordering question should never have a
 * genuine tie between its own items.
 */
export function sortByValue<Id>(
  entries: readonly SortableEntry<Id>[],
  direction: "ascending" | "descending",
): readonly Id[] | undefined {
  for (let i = 0; i < entries.length; i += 1) {
    for (let j = i + 1; j < entries.length; j += 1) {
      if (compareFractions(entries[i].value, entries[j].value) === 0) return undefined;
    }
  }
  const sorted = [...entries].sort((a, b) => {
    const comparison = compareFractions(a.value, b.value);
    return direction === "ascending" ? comparison : -comparison;
  });
  return sorted.map((entry) => entry.id);
}
