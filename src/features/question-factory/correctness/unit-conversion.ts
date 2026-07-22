/**
 * Closed unit-conversion table for the multi-step declared-solution
 * verification method (`derive-multistep-answer.ts`'s `convert_unit`
 * operation). Deliberately not a general units library: only the Grade 3/5
 * numeracy curriculum's own unit set (length: mm/cm/m/km; mass: g/kg;
 * volume: mL/L; time: s/min/h), per the design's §3.4. Every multiplier is
 * an exact `Fraction` — never a floating conversion factor — and an
 * unrecognised unit, or a recognised pair from two different categories
 * (e.g. `g` to `m`), is a terminal "unsupported" result, never an
 * approximate guess.
 */
import { divideFractions, type Fraction, fractionFromInt, makeFraction, multiplyFractions } from "./numeric";

type UnitCategory = "length" | "mass" | "volume" | "time";

interface UnitDefinition {
  readonly category: UnitCategory;
  /** Multiplying an amount expressed in this unit by this factor yields the equivalent amount in the category's base unit (m / kg / L / h). */
  readonly toBaseMultiplier: Fraction;
}

const ONE = fractionFromInt(1);

const UNIT_TABLE: Readonly<Record<string, UnitDefinition>> = Object.freeze({
  // Length — base unit: m.
  mm: { category: "length", toBaseMultiplier: makeFraction(BigInt(1), BigInt(1000)) },
  cm: { category: "length", toBaseMultiplier: makeFraction(BigInt(1), BigInt(100)) },
  m: { category: "length", toBaseMultiplier: ONE },
  km: { category: "length", toBaseMultiplier: fractionFromInt(1000) },

  // Mass — base unit: kg.
  g: { category: "mass", toBaseMultiplier: makeFraction(BigInt(1), BigInt(1000)) },
  kg: { category: "mass", toBaseMultiplier: ONE },

  // Volume — base unit: L.
  mL: { category: "volume", toBaseMultiplier: makeFraction(BigInt(1), BigInt(1000)) },
  L: { category: "volume", toBaseMultiplier: ONE },

  // Time — base unit: h.
  s: { category: "time", toBaseMultiplier: makeFraction(BigInt(1), BigInt(3600)) },
  min: { category: "time", toBaseMultiplier: makeFraction(BigInt(1), BigInt(60)) },
  h: { category: "time", toBaseMultiplier: ONE },
});

/** The closed set of unit strings this table recognises, for callers that need to report or validate against it directly. */
export const SUPPORTED_UNITS: readonly string[] = Object.keys(UNIT_TABLE);

/**
 * Converts an exact `Fraction` amount from `fromUnit` to `toUnit`.
 * `undefined` — never an approximation — when either unit is outside the
 * closed table above, or when the two units belong to different
 * categories (e.g. converting a mass to a length is never meaningful).
 */
export function convertUnit(value: Fraction, fromUnit: string, toUnit: string): Fraction | undefined {
  const from = UNIT_TABLE[fromUnit];
  const to = UNIT_TABLE[toUnit];
  if (from === undefined || to === undefined || from.category !== to.category) return undefined;
  const baseValue = multiplyFractions(value, from.toBaseMultiplier);
  return divideFractions(baseValue, to.toBaseMultiplier);
}
