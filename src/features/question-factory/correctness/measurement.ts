/**
 * Independent perimeter/area derivation from a `geometry_shape` visual's
 * own `data.measurements` array — never a number restated only in the
 * explanation. Only `square` and `rectangle` are implemented (an exact,
 * closed-form, unambiguous formula); `triangle`, `circle`, and `polygon`
 * (vertex-distance perimeter) are a documented, honest gap — see the
 * Mission 2C report's "Deterministic coverage" section — and fall through
 * to `structurally_scoreable_only` rather than an invented computation.
 */
import type { VisualAsset } from "@/schemas/visual.schema";
import { addFractions, type Fraction, fractionFromFiniteNumber, multiplyFractions } from "./numeric";

type GeometryShapeVisual = Extract<VisualAsset, { type: "geometry_shape" }>;

export function measurementsMapOf(shape: GeometryShapeVisual): ReadonlyMap<string, number> {
  return new Map(shape.data.measurements.map((m) => [m.label.trim().toLocaleLowerCase("en-AU"), m.value]));
}

export interface DerivedRectangleMeasures {
  readonly perimeter: Fraction;
  readonly area: Fraction;
}

/**
 * `square`/`rectangle` only — the two shapes whose perimeter/area follow
 * directly and unambiguously from labelled side lengths without needing
 * vertex coordinates.
 */
export function deriveRectangleMeasures(shape: GeometryShapeVisual): DerivedRectangleMeasures | undefined {
  const measures = measurementsMapOf(shape);

  if (shape.data.shape === "square") {
    const side = measures.get("side");
    if (side === undefined) return undefined;
    const sideFraction = fractionFromFiniteNumber(side);
    return {
      perimeter: multiplyFractions(fractionFromFiniteNumber(4), sideFraction),
      area: multiplyFractions(sideFraction, sideFraction),
    };
  }

  if (shape.data.shape === "rectangle") {
    const length = measures.get("length");
    const width = measures.get("width");
    if (length === undefined || width === undefined) return undefined;
    const lengthFraction = fractionFromFiniteNumber(length);
    const widthFraction = fractionFromFiniteNumber(width);
    return {
      perimeter: multiplyFractions(fractionFromFiniteNumber(2), addFractions(lengthFraction, widthFraction)),
      area: multiplyFractions(lengthFraction, widthFraction),
    };
  }

  return undefined;
}
