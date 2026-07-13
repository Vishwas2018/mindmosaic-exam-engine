import { describe, expect, it } from "vitest";

import {
  addFractions,
  centsToDisplayString,
  compareFractions,
  divideFractions,
  dollarsToCents,
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
});
