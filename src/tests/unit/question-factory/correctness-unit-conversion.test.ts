import { describe, expect, it } from "vitest";

import { convertUnit, SUPPORTED_UNITS } from "@/features/question-factory/correctness/unit-conversion";
import { fractionFromDecimalString, fractionToDisplayString } from "@/features/question-factory/correctness/numeric";

/**
 * Exact-arithmetic fixtures for the closed unit-conversion table (design
 * §6 item 9): every conversion factor must be an exact `Fraction` — e.g.
 * `1.2 kg -> 1200 g` must be exactly `1200`, never a float artefact like
 * `1199.9999999998`.
 */
describe("convertUnit — exact conversions", () => {
  it("1.2 kg to g is exactly 1200", () => {
    const result = convertUnit(fractionFromDecimalString("1.2"), "kg", "g");
    expect(result).toBeDefined();
    expect(fractionToDisplayString(result!)).toBe("1200");
  });

  it("750 g to kg is exactly 3/4", () => {
    const result = convertUnit(fractionFromDecimalString("750"), "g", "kg");
    expect(result).toBeDefined();
    expect(fractionToDisplayString(result!)).toBe("3/4");
  });

  it("1 km to m is exactly 1000", () => {
    const result = convertUnit(fractionFromDecimalString("1"), "km", "m");
    expect(fractionToDisplayString(result!)).toBe("1000");
  });

  it("250 cm to m is exactly 5/2", () => {
    const result = convertUnit(fractionFromDecimalString("250"), "cm", "m");
    expect(fractionToDisplayString(result!)).toBe("5/2");
  });

  it("2.5 m to mm is exactly 2500", () => {
    const result = convertUnit(fractionFromDecimalString("2.5"), "m", "mm");
    expect(fractionToDisplayString(result!)).toBe("2500");
  });

  it("1.5 L to mL is exactly 1500", () => {
    const result = convertUnit(fractionFromDecimalString("1.5"), "L", "mL");
    expect(fractionToDisplayString(result!)).toBe("1500");
  });

  it("500 mL to L is exactly 1/2", () => {
    const result = convertUnit(fractionFromDecimalString("500"), "mL", "L");
    expect(fractionToDisplayString(result!)).toBe("1/2");
  });

  it("90 min to h is exactly 3/2", () => {
    const result = convertUnit(fractionFromDecimalString("90"), "min", "h");
    expect(fractionToDisplayString(result!)).toBe("3/2");
  });

  it("2 h to s is exactly 7200", () => {
    const result = convertUnit(fractionFromDecimalString("2"), "h", "s");
    expect(fractionToDisplayString(result!)).toBe("7200");
  });

  it("120 s to min is exactly 2", () => {
    const result = convertUnit(fractionFromDecimalString("120"), "s", "min");
    expect(fractionToDisplayString(result!)).toBe("2");
  });

  it("converting a unit to itself is the identity", () => {
    const result = convertUnit(fractionFromDecimalString("7.25"), "kg", "kg");
    expect(fractionToDisplayString(result!)).toBe("29/4");
  });
});

describe("convertUnit — unsupported pairs fail closed, never an approximation", () => {
  it("returns undefined for two units in different categories (mass to length)", () => {
    expect(convertUnit(fractionFromDecimalString("5"), "kg", "m")).toBeUndefined();
  });

  it("returns undefined for an unrecognised source unit", () => {
    expect(convertUnit(fractionFromDecimalString("5"), "lb", "kg")).toBeUndefined();
  });

  it("returns undefined for an unrecognised target unit", () => {
    expect(convertUnit(fractionFromDecimalString("5"), "kg", "oz")).toBeUndefined();
  });

  it("SUPPORTED_UNITS is exactly the Grade 3/5 closed unit set", () => {
    expect([...SUPPORTED_UNITS].sort()).toEqual(["L", "cm", "g", "h", "kg", "km", "m", "mL", "min", "mm", "s"].sort());
  });
});
