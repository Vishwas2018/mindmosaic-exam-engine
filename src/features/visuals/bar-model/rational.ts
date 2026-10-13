/**
 * Exact rational arithmetic and a Gauss-Jordan solver for the bar-model
 * validator. BigInt numerator/denominator throughout: there is no floating
 * point anywhere in the maths, so "uniquely determined" and "contradiction"
 * are exact decisions, not tolerances.
 */

export interface Rational {
  readonly n: bigint;
  readonly d: bigint;
}

/** The serialisable form used outside this module: never a float or BigInt. */
export interface RationalString {
  readonly numerator: string;
  readonly denominator: string;
}

const ZERO: Rational = { n: BigInt(0), d: BigInt(1) };
const ONE: Rational = { n: BigInt(1), d: BigInt(1) };

function gcd(a: bigint, b: bigint): bigint {
  let x = a < BigInt(0) ? -a : a;
  let y = b < BigInt(0) ? -b : b;
  while (y !== BigInt(0)) {
    [x, y] = [y, x % y];
  }
  return x;
}

export function rational(n: bigint, d: bigint = BigInt(1)): Rational {
  if (d === BigInt(0)) throw new RangeError("Zero denominator.");
  const sign = d < BigInt(0) ? -BigInt(1) : BigInt(1);
  const divisor = gcd(n, d) || BigInt(1);
  return { n: (sign * n) / divisor, d: (sign * d) / divisor };
}

/** Parse a decimal string/number such as "12", "2.5" or "0.125" exactly. */
export function rationalFromDecimal(value: number | string): Rational {
  const text = String(value);
  const match = /^(\d+)(?:\.(\d+))?$/.exec(text);
  if (!match) throw new RangeError(`Not a plain non-negative decimal: ${text}`);
  const fraction = match[2] ?? "";
  return rational(BigInt(match[1] + fraction), BigInt(10) ** BigInt(fraction.length));
}

export const rationalZero = ZERO;
export const rationalOne = ONE;

export const add = (a: Rational, b: Rational): Rational => rational(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Rational, b: Rational): Rational => rational(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a: Rational, b: Rational): Rational => rational(a.n * b.n, a.d * b.d);
export const div = (a: Rational, b: Rational): Rational => rational(a.n * b.d, a.d * b.n);
export const neg = (a: Rational): Rational => ({ n: -a.n, d: a.d });
export const isZero = (a: Rational): boolean => a.n === BigInt(0);
export const isNegative = (a: Rational): boolean => a.n < BigInt(0);
export const isWhole = (a: Rational): boolean => a.d === BigInt(1);
export const equals = (a: Rational, b: Rational): boolean => a.n === b.n && a.d === b.d;

export function toRationalString(value: Rational): RationalString {
  return { numerator: value.n.toString(), denominator: value.d.toString() };
}

/** "27", "-3" or "5/2" - for messages and tests, never for maths. */
export function formatRational(value: Rational): string {
  return value.d === BigInt(1) ? value.n.toString() : `${value.n}/${value.d}`;
}

/**
 * The decimal expansion when it terminates (denominator of the form
 * 2^a * 5^b), otherwise null. Used only to spot a leaked answer such as
 * "2.5" in descriptive text.
 */
export function terminatingDecimal(value: Rational): string | null {
  let d = value.d;
  let places = 0;
  while (d % BigInt(10) === BigInt(0)) {
    d /= BigInt(10);
    places += 1;
  }
  let twos = 0;
  while (d % BigInt(2) === BigInt(0)) {
    d /= BigInt(2);
    twos += 1;
  }
  let fives = 0;
  while (d % BigInt(5) === BigInt(0)) {
    d /= BigInt(5);
    fives += 1;
  }
  if (d !== BigInt(1)) return null;
  const extra = Math.max(twos, fives);
  const scale = BigInt(10) ** BigInt(places + extra);
  const scaled = (value.n * scale) / value.d;
  const digits = (scaled < BigInt(0) ? -scaled : scaled).toString().padStart(places + extra + 1, "0");
  const cut = digits.length - (places + extra);
  const whole = digits.slice(0, cut);
  const fraction = digits.slice(cut).replace(/0+$/, "");
  return `${scaled < BigInt(0) ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

/** A linear expression: sum(coefficients[name] * name) + constant. */
export interface LinearExpression {
  readonly terms: ReadonlyMap<string, Rational>;
  readonly constant: Rational;
}

export const constant = (value: Rational): LinearExpression => ({ terms: new Map(), constant: value });
export const variable = (name: string, coefficient: Rational = ONE): LinearExpression => ({
  terms: new Map([[name, coefficient]]),
  constant: ZERO,
});

export function combine(
  left: LinearExpression,
  right: LinearExpression,
  rightFactor: Rational = ONE,
): LinearExpression {
  const terms = new Map(left.terms);
  for (const [name, coefficient] of right.terms) {
    const next = add(terms.get(name) ?? ZERO, mul(coefficient, rightFactor));
    if (isZero(next)) terms.delete(name);
    else terms.set(name, next);
  }
  return { terms, constant: add(left.constant, mul(right.constant, rightFactor)) };
}

export const sumExpressions = (expressions: readonly LinearExpression[]): LinearExpression =>
  expressions.reduce((total, expression) => combine(total, expression), constant(ZERO));

/** left - right = 0 */
export const equation = (left: LinearExpression, right: LinearExpression): LinearExpression =>
  combine(left, right, rational(-BigInt(1)));

export type SolveOutcome =
  | { readonly consistent: false }
  | {
      readonly consistent: true;
      /** Exact value of each variable that the equations pin down. */
      readonly determined: ReadonlyMap<string, Rational>;
      /** Variables the equations leave free or only partly constrained. */
      readonly undetermined: ReadonlySet<string>;
    };

/**
 * Solve a system of `expression = 0` equations by exact Gauss-Jordan
 * elimination. `variables` fixes the column order, so the result never
 * depends on iteration order.
 */
export function solveLinearSystem(
  variables: readonly string[],
  equations: readonly LinearExpression[],
): SolveOutcome {
  const columns = variables.length;
  // Row layout: coefficients..., then the right-hand side (-constant).
  const rows: Rational[][] = equations.map((expression) => {
    const row: Rational[] = Array.from({ length: columns + 1 }, () => ZERO);
    for (const [name, coefficient] of expression.terms) {
      const column = variables.indexOf(name);
      if (column >= 0) row[column] = coefficient;
    }
    row[columns] = neg(expression.constant);
    return row;
  });

  const pivotColumns: number[] = [];
  let pivotRow = 0;
  for (let column = 0; column < columns && pivotRow < rows.length; column += 1) {
    const found = rows.findIndex((row, index) => index >= pivotRow && !isZero(row[column]));
    if (found < 0) continue;
    [rows[pivotRow], rows[found]] = [rows[found], rows[pivotRow]];
    const pivot = rows[pivotRow][column];
    rows[pivotRow] = rows[pivotRow].map((cell) => div(cell, pivot));
    for (let other = 0; other < rows.length; other += 1) {
      if (other === pivotRow || isZero(rows[other][column])) continue;
      const factor = rows[other][column];
      rows[other] = rows[other].map((cell, index) => sub(cell, mul(factor, rows[pivotRow][index])));
    }
    pivotColumns.push(column);
    pivotRow += 1;
  }

  for (const row of rows) {
    const allZero = row.slice(0, columns).every(isZero);
    if (allZero && !isZero(row[columns])) return { consistent: false };
  }

  const determined = new Map<string, Rational>();
  const undetermined = new Set<string>(variables);
  pivotColumns.forEach((column, index) => {
    const row = rows[index];
    const dependsOnFree = row.slice(0, columns).some((cell, other) => other !== column && !isZero(cell));
    if (!dependsOnFree) {
      determined.set(variables[column], row[columns]);
      undetermined.delete(variables[column]);
    }
  });
  return { consistent: true, determined, undetermined };
}
