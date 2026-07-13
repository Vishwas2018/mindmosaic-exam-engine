import { describe, expect, it } from "vitest";

import { CORRECTNESS_LIMITS } from "@/features/question-factory/config";
import {
  addFractions,
  centsToDisplayString,
  compareFractions,
  divideFractions,
  dollarsToCents,
  fractionFromCents,
  fractionFromDecimalString,
  fractionFromFiniteNumber,
  fractionFromInt,
  fractionsEqual,
  fractionToDisplayString,
  fractionWithinTolerance,
  makeFraction,
  NumericDerivationError,
  numberToCents,
} from "@/features/question-factory/correctness/numeric";
import { parseFractionToken, parseNumericToken, sortByValue } from "@/features/question-factory/correctness/fraction-decimal";
import { boundMessage } from "@/features/question-factory/correctness/evidence";
import { totalCents } from "@/features/question-factory/correctness/money";

describe("exact fraction arithmetic", () => {
  it("reduces fractions to lowest terms with a positive denominator", () => {
    const value = makeFraction(BigInt(-4), BigInt(-8));
    expect(value.num).toBe(BigInt(1));
    expect(value.den).toBe(BigInt(2));
  });

  it("rejects a zero denominator as division_by_zero", () => {
    expect(() => makeFraction(BigInt(1), BigInt(0))).toThrow(NumericDerivationError);
    try {
      makeFraction(BigInt(1), BigInt(0));
    } catch (error) {
      expect((error as NumericDerivationError).code).toBe("division_by_zero");
    }
  });

  it("parses exact decimal strings without binary-float error", () => {
    const value = fractionFromDecimalString("12.50");
    expect(fractionToDisplayString(value)).toBe("25/2");
  });

  it("adds decimals exactly, where naive floating point would drift", () => {
    const sum = addFractions(fractionFromDecimalString("0.1"), fractionFromDecimalString("0.2"));
    expect(fractionsEqual(sum, fractionFromDecimalString("0.3"))).toBe(true);
  });

  it("rejects division by a zero fraction", () => {
    expect(() => divideFractions(fractionFromInt(1), fractionFromInt(0))).toThrow(NumericDerivationError);
  });

  it("compares fractions exactly via cross-multiplication", () => {
    expect(compareFractions(fractionFromInt(1), fractionFromInt(2))).toBe(-1);
    expect(compareFractions(fractionFromInt(2), fractionFromInt(1))).toBe(1);
    expect(compareFractions(fractionFromInt(2), fractionFromInt(2))).toBe(0);
  });

  it("treats equal fractions as equal regardless of representation", () => {
    expect(fractionsEqual(fractionFromDecimalString("0.5"), makeFraction(BigInt(2), BigInt(4)))).toBe(true);
  });

  it("honours an explicit tolerance band", () => {
    const declared = fractionFromInt(10);
    const tolerance = fractionFromDecimalString("0.5");
    expect(fractionWithinTolerance(fractionFromDecimalString("10.4"), declared, tolerance)).toBe(true);
    expect(fractionWithinTolerance(fractionFromDecimalString("10.6"), declared, tolerance)).toBe(false);
  });

  it("rejects a non-integer for fractionFromInt", () => {
    expect(() => fractionFromInt(1.5)).toThrow(NumericDerivationError);
  });

  it("rejects malformed decimal text", () => {
    expect(() => fractionFromDecimalString("twelve")).toThrow(NumericDerivationError);
    expect(() => fractionFromDecimalString("1.2.3")).toThrow(NumericDerivationError);
  });

  it("rejects NaN and Infinity as unsafe finite numbers", () => {
    expect(() => fractionFromFiniteNumber(Number.NaN)).toThrow(NumericDerivationError);
    expect(() => fractionFromFiniteNumber(Number.POSITIVE_INFINITY)).toThrow(NumericDerivationError);
  });

  it("fails closed on a magnitude past the supported bound", () => {
    expect(() => makeFraction(BigInt(10) ** BigInt(20), BigInt(1))).toThrow(NumericDerivationError);
  });
});

describe("exact money (integer cents)", () => {
  it("parses a dollar amount into exact cents without floating-point multiplication", () => {
    expect(dollarsToCents("$12.50")).toBe(1250);
    expect(dollarsToCents("2")).toBe(200);
  });

  it("rejects a currency amount with more than two decimal places", () => {
    expect(() => dollarsToCents("$1.234")).toThrow(NumericDerivationError);
  });

  it("rejects an unsafe decimal-assumption money representation", () => {
    expect(() => dollarsToCents("twelve dollars")).toThrow(NumericDerivationError);
  });

  it("round-trips a schema number amount through numberToCents", () => {
    expect(numberToCents(5.5)).toBe(550);
  });

  it("formats cents back to a display string", () => {
    expect(centsToDisplayString(550)).toBe("$5.50");
    expect(centsToDisplayString(5)).toBe("$0.05");
  });

  it("converts an exact cent count to a fraction of dollars without float division or toFixed()", () => {
    expect(fractionToDisplayString(fractionFromCents(30))).toBe("3/10");
    expect(fractionToDisplayString(fractionFromCents(735))).toBe("147/20");
  });

  it("rejects a non-integer cent count", () => {
    expect(() => fractionFromCents(5.5)).toThrow(NumericDerivationError);
  });
});

describe("money totals — exact integer-cent arithmetic (totalCents)", () => {
  it("computes 0.10 x 3 = 0.30 exactly", () => {
    const total = totalCents([{ unitCents: dollarsToCents("$0.10"), quantity: 3 }]);
    expect(total).toBe(30);
    expect(fractionToDisplayString(fractionFromCents(total))).toBe("3/10");
  });

  it("computes 1.05 x 7 = 7.35 exactly, where naive float multiplication drifts", () => {
    const total = totalCents([{ unitCents: dollarsToCents("$1.05"), quantity: 7 }]);
    expect(total).toBe(735);
    expect(centsToDisplayString(total)).toBe("$7.35");
  });

  it("sums multiple line items exactly", () => {
    const total = totalCents([
      { unitCents: 200, quantity: 2 },
      { unitCents: 150, quantity: 1 },
    ]);
    expect(total).toBe(550);
  });

  it("returns zero for a zero-quantity line item", () => {
    expect(totalCents([{ unitCents: 500, quantity: 0 }])).toBe(0);
  });

  it("rejects a negative quantity", () => {
    expect(() => totalCents([{ unitCents: 500, quantity: -1 }])).toThrow(NumericDerivationError);
    try {
      totalCents([{ unitCents: 500, quantity: -1 }]);
    } catch (error) {
      expect((error as NumericDerivationError).code).toBe("money_value_invalid");
    }
  });

  it("rejects a non-integral quantity", () => {
    expect(() => totalCents([{ unitCents: 500, quantity: 1.5 }])).toThrow(NumericDerivationError);
  });

  it("rejects a quantity exceeding the configured limit", () => {
    expect(() =>
      totalCents([{ unitCents: 100, quantity: CORRECTNESS_LIMITS.MONEY_MAX_QUANTITY + 1 }]),
    ).toThrow(NumericDerivationError);
    try {
      totalCents([{ unitCents: 100, quantity: CORRECTNESS_LIMITS.MONEY_MAX_QUANTITY + 1 }]);
    } catch (error) {
      expect((error as NumericDerivationError).code).toBe("money_limit_exceeded");
    }
  });

  it("accepts a large but bounded total", () => {
    const total = totalCents([{ unitCents: 100, quantity: 1000 }]);
    expect(total).toBe(100000);
  });

  it("rejects a total exceeding the configured limit", () => {
    expect(() =>
      totalCents([{ unitCents: CORRECTNESS_LIMITS.MONEY_MAX_TOTAL_CENTS, quantity: 2 }]),
    ).toThrow(NumericDerivationError);
  });

  it("rejects more line items than the configured limit", () => {
    const lineItems = Array.from({ length: CORRECTNESS_LIMITS.MONEY_MAX_LINE_ITEMS + 1 }, () => ({
      unitCents: 100,
      quantity: 1,
    }));
    expect(() => totalCents(lineItems)).toThrow(NumericDerivationError);
  });

  it("rejects a currency string with three decimal places before any arithmetic runs", () => {
    expect(() => dollarsToCents("$1.234")).toThrow(NumericDerivationError);
  });
});

describe("fraction/decimal token parsing — resource bounds before BigInt construction", () => {
  it("parses a numerator/denominator at the configured digit-length limit", () => {
    const digits = "9".repeat(CORRECTNESS_LIMITS.FRACTION_MAX_DIGIT_LENGTH);
    const parsed = parseFractionToken(`${digits}/1`);
    expect(parsed).toBeDefined();
  });

  it("refuses a numerator one digit beyond the configured limit", () => {
    const digits = "9".repeat(CORRECTNESS_LIMITS.FRACTION_MAX_DIGIT_LENGTH + 1);
    const parsed = parseFractionToken(`${digits}/1`);
    expect(parsed).toBeUndefined();
  });

  it("refuses an enormous digit string without ever constructing the BigInt", () => {
    const digits = "9".repeat(5000);
    const parsed = parseFractionToken(`${digits}/1`);
    expect(parsed).toBeUndefined();
  });

  it("rejects a zero denominator", () => {
    expect(parseFractionToken("1/0")).toBeUndefined();
  });

  it("parses negative fractions", () => {
    const parsed = parseFractionToken("-3/4");
    expect(parsed).toBeDefined();
    if (parsed) expect(fractionToDisplayString(parsed)).toBe("-3/4");
  });

  it("reduces equivalent large-but-valid fractions to the same canonical value", () => {
    const a = parseNumericToken("50000000000/100000000000");
    const b = parseNumericToken("1/2");
    expect(a).toBeDefined();
    expect(b).toBeDefined();
    if (a && b) expect(fractionsEqual(a, b)).toBe(true);
  });

  it("bounds the number of items sortByValue processes without pathological blow-up", () => {
    const entries = Array.from({ length: CORRECTNESS_LIMITS.MAX_ORDERING_ITEMS }, (_unused, index) => ({
      id: `item-${index}`,
      value: fractionFromInt(index),
    }));
    const sorted = sortByValue(entries, "ascending");
    expect(sorted).toBeDefined();
    expect(sorted?.length).toBe(CORRECTNESS_LIMITS.MAX_ORDERING_ITEMS);
  });
});

describe("boundMessage — persisted issue-evidence bounding", () => {
  it("leaves a short message untouched", () => {
    const result = boundMessage("short message");
    expect(result).toEqual({ message: "short message", truncated: false });
  });

  it("truncates an oversized message to the configured bound deterministically", () => {
    const oversized = "x".repeat(CORRECTNESS_LIMITS.MAX_ISSUE_MESSAGE_LENGTH * 3);
    const first = boundMessage(oversized);
    const second = boundMessage(oversized);
    expect(first.truncated).toBe(true);
    expect(first.message.length).toBeLessThanOrEqual(CORRECTNESS_LIMITS.MAX_ISSUE_MESSAGE_LENGTH);
    expect(first).toEqual(second);
  });

  it("produces identical output for identical input regardless of call count (deterministic truncation)", () => {
    const oversized = "abcdefghij".repeat(100);
    const results = Array.from({ length: 5 }, () => boundMessage(oversized));
    for (const result of results) expect(result).toEqual(results[0]);
  });
});
