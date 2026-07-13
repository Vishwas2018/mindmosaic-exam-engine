/**
 * Exact-arithmetic primitives for the correctness-verification gate.
 * Never uses floating-point equality for a correctness decision: every
 * value that flows into a comparison is either an exact bigint-backed
 * `Fraction` or an integer cent count. `number` is only ever a decoded
 * *input* (from a schema field already typed `number`) or a display-only
 * *output* — never the thing two values are compared by.
 *
 * Uses `BigInt(n)` rather than `0n`/`1n` literal syntax throughout: this
 * project's `tsconfig.json` targets ES2017, which predates BigInt literal
 * syntax (ES2020) even though the `bigint` type and `BigInt()` itself are
 * available (Node has supported both since well before this codebase's
 * minimum runtime).
 */

import { CORRECTNESS_LIMITS } from "../config";

export type NumericDerivationErrorCode =
  | "numeric_overflow"
  | "division_by_zero"
  | "invalid_fraction_representation"
  | "invalid_money_representation"
  | "invalid_rounding_rule"
  | "fraction_resource_limit_exceeded"
  | "arithmetic_resource_limit_exceeded"
  | "money_value_invalid"
  | "money_limit_exceeded";

export class NumericDerivationError extends Error {
  constructor(
    readonly code: NumericDerivationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "NumericDerivationError";
  }
}

const ZERO = BigInt(0);
const ONE = BigInt(1);
const NEGATIVE_ONE = BigInt(-1);
const HUNDRED = BigInt(100);

/** Bounds every bigint numerator/denominator this module produces, so a pathological input fails closed rather than exhausting memory. */
const MAX_MAGNITUDE = BigInt(10) ** BigInt(15);

export function isSafeFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && !Number.isNaN(value);
}

function assertBounded(value: bigint, context: string): void {
  const magnitude = value < ZERO ? -value : value;
  if (magnitude > MAX_MAGNITUDE) {
    throw new NumericDerivationError(
      "numeric_overflow",
      `${context} exceeds the supported magnitude bound.`,
    );
  }
}

function gcdBig(a: bigint, b: bigint): bigint {
  let x = a < ZERO ? -a : a;
  let y = b < ZERO ? -b : b;
  while (y !== ZERO) {
    [x, y] = [y, x % y];
  }
  return x === ZERO ? ONE : x;
}

/** Always reduced to lowest terms with a strictly positive denominator. */
export interface Fraction {
  readonly num: bigint;
  readonly den: bigint;
}

export function makeFraction(numerator: bigint, denominator: bigint): Fraction {
  if (denominator === ZERO) {
    throw new NumericDerivationError("division_by_zero", "Fraction denominator is zero.");
  }
  assertBounded(numerator, "Fraction numerator");
  assertBounded(denominator, "Fraction denominator");
  const sign = denominator < ZERO ? NEGATIVE_ONE : ONE;
  const num = numerator * sign;
  const den = denominator * sign;
  const divisor = gcdBig(num, den);
  return { num: num / divisor, den: den / divisor };
}

export function fractionFromBigInt(value: bigint): Fraction {
  return makeFraction(value, ONE);
}

export function fractionFromInt(value: number): Fraction {
  if (!Number.isInteger(value)) {
    throw new NumericDerivationError(
      "invalid_fraction_representation",
      `${value} is not an integer.`,
    );
  }
  return fractionFromBigInt(BigInt(value));
}

const DECIMAL_PATTERN = /^-?\d+(?:\.\d+)?$/;

/**
 * Rejects a digit run longer than the configured bound *before* it is ever
 * passed to `BigInt(...)`. `BigInt` construction cost grows with digit
 * count, so this check must run first — bounding the resulting magnitude
 * only after construction (as `assertBounded` does) is too late to
 * prevent a pathological input (e.g. a thousand-digit literal) from doing
 * expensive work.
 */
function assertDigitLengthBounded(digits: string, context: string): void {
  if (digits.length > CORRECTNESS_LIMITS.FRACTION_MAX_DIGIT_LENGTH) {
    throw new NumericDerivationError(
      "fraction_resource_limit_exceeded",
      `${context} has ${digits.length} digits, exceeding the supported limit of ${CORRECTNESS_LIMITS.FRACTION_MAX_DIGIT_LENGTH}.`,
    );
  }
}

/** Exact decimal-string parse — never `Number(text) * 10 ** n`, which can introduce binary-float error for the scale factor itself. */
export function fractionFromDecimalString(text: string): Fraction {
  const trimmed = text.trim();
  if (!DECIMAL_PATTERN.test(trimmed)) {
    throw new NumericDerivationError(
      "invalid_fraction_representation",
      `'${text}' is not an exact decimal or integer literal.`,
    );
  }
  const negative = trimmed.startsWith("-");
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const [wholePart, fractionPart = ""] = unsigned.split(".");
  const digits = `${wholePart}${fractionPart}`;
  assertDigitLengthBounded(digits, "Decimal literal");
  assertDigitLengthBounded(fractionPart, "Decimal literal's fractional part (scale exponent)");
  const scale = BigInt(10) ** BigInt(fractionPart.length);
  const magnitude = BigInt(digits === "" ? "0" : digits);
  return makeFraction(negative ? -magnitude : magnitude, scale);
}

/**
 * Converts a schema-typed `number` (already validated `.finite()` by Zod)
 * into an exact `Fraction` via its own default string form — safe because
 * every numeric field this module reads back out of a `Question` is a
 * clean, human-authored literal (e.g. `71`, `12.5`), never a computed
 * float with binary-representation noise.
 */
export function fractionFromFiniteNumber(value: number): Fraction {
  if (!isSafeFiniteNumber(value)) {
    throw new NumericDerivationError(
      "invalid_fraction_representation",
      `${value} is not a safe finite number.`,
    );
  }
  return fractionFromDecimalString(value.toString());
}

export function addFractions(a: Fraction, b: Fraction): Fraction {
  return makeFraction(a.num * b.den + b.num * a.den, a.den * b.den);
}

export function subtractFractions(a: Fraction, b: Fraction): Fraction {
  return makeFraction(a.num * b.den - b.num * a.den, a.den * b.den);
}

export function multiplyFractions(a: Fraction, b: Fraction): Fraction {
  return makeFraction(a.num * b.num, a.den * b.den);
}

export function divideFractions(a: Fraction, b: Fraction): Fraction {
  if (b.num === ZERO) {
    throw new NumericDerivationError("division_by_zero", "Division by zero fraction.");
  }
  return makeFraction(a.num * b.den, a.den * b.num);
}

export function negateFraction(a: Fraction): Fraction {
  return makeFraction(-a.num, a.den);
}

export function absFraction(a: Fraction): Fraction {
  return a.num < ZERO ? negateFraction(a) : a;
}

/** -1, 0, or 1 — cross-multiplication is exact because both denominators are strictly positive. */
export function compareFractions(a: Fraction, b: Fraction): -1 | 0 | 1 {
  const left = a.num * b.den;
  const right = b.num * a.den;
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

export function fractionsEqual(a: Fraction, b: Fraction): boolean {
  return compareFractions(a, b) === 0;
}

export function fractionWithinTolerance(a: Fraction, b: Fraction, tolerance: Fraction): boolean {
  return compareFractions(absFraction(subtractFractions(a, b)), tolerance) <= 0;
}

export function fractionToDisplayString(value: Fraction): string {
  return value.den === ONE ? value.num.toString() : `${value.num}/${value.den}`;
}

/** Display/representation only — never used as the basis of a correctness comparison. */
export function fractionToApproximateNumber(value: Fraction): number {
  return Number(value.num) / Number(value.den);
}

/**
 * Parses a dollar amount ("$12.50", "12.5", "3") into an exact integer cent
 * count. Never multiplies a floating-point dollar value by 100 — the cents
 * value is derived from the decimal string's own digit positions.
 */
export function dollarsToCents(text: string): number {
  const trimmed = text.trim().replace(/^\$/, "");
  if (!DECIMAL_PATTERN.test(trimmed)) {
    throw new NumericDerivationError(
      "invalid_money_representation",
      `'${text}' is not a valid dollar amount.`,
    );
  }
  const negative = trimmed.startsWith("-");
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const [wholePart, fractionPart = ""] = unsigned.split(".");
  if (fractionPart.length > 2) {
    throw new NumericDerivationError(
      "invalid_money_representation",
      `'${text}' specifies more than two decimal places for a currency amount.`,
    );
  }
  assertDigitLengthBounded(wholePart, "Currency amount");
  const paddedCents = fractionPart.padEnd(2, "0");
  const cents = BigInt(wholePart) * HUNDRED + BigInt(paddedCents === "" ? "0" : paddedCents);
  const signedCents = negative ? -cents : cents;
  assertBounded(signedCents, "Money amount in cents");
  return Number(signedCents);
}

/** Converts a schema `number` already known to represent a dollar amount into exact cents via its own decimal string form. */
export function numberToCents(value: number): number {
  if (!isSafeFiniteNumber(value)) {
    throw new NumericDerivationError(
      "invalid_money_representation",
      `${value} is not a safe finite number.`,
    );
  }
  return dollarsToCents(value.toString());
}

/** Converts an exact integer cent count into an exact `Fraction` of dollars (cents/100) — never a float division, never `toFixed()`. */
export function fractionFromCents(cents: number): Fraction {
  if (!Number.isInteger(cents)) {
    throw new NumericDerivationError("money_value_invalid", `${cents} is not an integer cent count.`);
  }
  return makeFraction(BigInt(cents), HUNDRED);
}

export function centsToDisplayString(cents: number): string {
  const negative = cents < 0;
  const magnitude = Math.abs(cents);
  const dollars = Math.trunc(magnitude / 100);
  const remainder = magnitude % 100;
  return `${negative ? "-" : ""}$${dollars}.${remainder.toString().padStart(2, "0")}`;
}
