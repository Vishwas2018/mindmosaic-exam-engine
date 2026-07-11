import { describe, expect, it } from "vitest";

import {
  MAX_COORDINATE_GRID_LINES_PER_AXIS,
  MAX_NUMBER_LINE_TICKS,
  calculateBoundedStepCount,
} from "@/schemas/visual-safety";
import { visualSchema } from "@/schemas/visual.schema";

function numberLine(data: Record<string, unknown>) {
  return visualSchema.safeParse({
    id: "test-number-line",
    type: "number_line",
    altText: "A number line for testing.",
    data,
  });
}

function coordinateGrid(data: Record<string, unknown>) {
  return visualSchema.safeParse({
    id: "test-coordinate-grid",
    type: "coordinate_grid",
    altText: "A coordinate grid for testing.",
    data,
  });
}

describe("calculateBoundedStepCount", () => {
  it("counts inclusive ticks for a normal range", () => {
    expect(calculateBoundedStepCount(0, 10, 1)).toBe(11);
    expect(calculateBoundedStepCount(0, 10, 2)).toBe(6);
  });

  it("returns 0 for a zero step", () => {
    expect(calculateBoundedStepCount(0, 10, 0)).toBe(0);
  });

  it("returns 0 for a negative step", () => {
    expect(calculateBoundedStepCount(0, 10, -1)).toBe(0);
  });

  it("returns 0 for Infinity or NaN in any numeric input", () => {
    expect(calculateBoundedStepCount(0, Infinity, 1)).toBe(0);
    expect(calculateBoundedStepCount(0, 10, Infinity)).toBe(0);
    expect(calculateBoundedStepCount(NaN, 10, 1)).toBe(0);
    expect(calculateBoundedStepCount(0, 10, NaN)).toBe(0);
  });

  it("clamps a tiny step over a huge span instead of returning a huge count", () => {
    const count = calculateBoundedStepCount(0, 1_000_000, 0.0001, MAX_NUMBER_LINE_TICKS);
    expect(count).toBe(MAX_NUMBER_LINE_TICKS);
  });

  it("accepts the maximum boundary exactly", () => {
    const count = calculateBoundedStepCount(0, MAX_NUMBER_LINE_TICKS - 1, 1, MAX_NUMBER_LINE_TICKS);
    expect(count).toBe(MAX_NUMBER_LINE_TICKS);
  });

  it("clamps one step beyond the maximum boundary", () => {
    const count = calculateBoundedStepCount(0, MAX_NUMBER_LINE_TICKS, 1, MAX_NUMBER_LINE_TICKS);
    expect(count).toBe(MAX_NUMBER_LINE_TICKS);
  });

  it("handles a floating-point step without producing extra or missing ticks", () => {
    /* 0.1 cannot be represented exactly in binary floating point; the
       implementation must still produce exactly 11 ticks for [0,1] step
       0.1, not 10 or 12 from accumulated rounding error. */
    expect(calculateBoundedStepCount(0, 1, 0.1)).toBe(11);
  });

  it("returns 0 when max is less than min", () => {
    expect(calculateBoundedStepCount(10, 0, 1)).toBe(0);
  });
});

describe("number_line schema safety limits", () => {
  it("accepts a normal range and step", () => {
    expect(numberLine({ min: 0, max: 10, step: 1 }).success).toBe(true);
  });

  it("rejects a zero step", () => {
    expect(numberLine({ min: 0, max: 10, step: 0 }).success).toBe(false);
  });

  it("rejects a negative step", () => {
    expect(numberLine({ min: 0, max: 10, step: -1 }).success).toBe(false);
  });

  it("rejects Infinity for min, max or step", () => {
    expect(numberLine({ min: 0, max: Infinity, step: 1 }).success).toBe(false);
    expect(numberLine({ min: 0, max: 10, step: Infinity }).success).toBe(false);
  });

  it("rejects NaN for min, max or step", () => {
    expect(numberLine({ min: NaN, max: 10, step: 1 }).success).toBe(false);
  });

  it("rejects a tiny step over a huge span that would exceed the tick cap", () => {
    const result = numberLine({ min: 0, max: 1_000_000, step: 0.01 });
    expect(result.success).toBe(false);
  });

  it("accepts the maximum tick count exactly", () => {
    const result = numberLine({ min: 0, max: MAX_NUMBER_LINE_TICKS - 1, step: 1 });
    expect(result.success).toBe(true);
  });

  it("rejects one tick beyond the maximum", () => {
    const result = numberLine({ min: 0, max: MAX_NUMBER_LINE_TICKS, step: 1 });
    expect(result.success).toBe(false);
  });
});

describe("coordinate_grid schema safety limits", () => {
  it("accepts a normal range and grid step", () => {
    expect(
      coordinateGrid({ xRange: [0, 10], yRange: [0, 10], gridStep: 1 }).success,
    ).toBe(true);
  });

  it("rejects a zero grid step", () => {
    expect(
      coordinateGrid({ xRange: [0, 10], yRange: [0, 10], gridStep: 0 }).success,
    ).toBe(false);
  });

  it("rejects a negative grid step", () => {
    expect(
      coordinateGrid({ xRange: [0, 10], yRange: [0, 10], gridStep: -1 }).success,
    ).toBe(false);
  });

  it("rejects a tiny grid step over a huge x-range", () => {
    const result = coordinateGrid({
      xRange: [0, 1_000_000],
      yRange: [0, 10],
      gridStep: 0.01,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a tiny grid step over a huge y-range", () => {
    const result = coordinateGrid({
      xRange: [0, 10],
      yRange: [0, 1_000_000],
      gridStep: 0.01,
    });
    expect(result.success).toBe(false);
  });

  it("accepts the maximum line count exactly", () => {
    const result = coordinateGrid({
      xRange: [0, MAX_COORDINATE_GRID_LINES_PER_AXIS - 1],
      yRange: [0, 10],
      gridStep: 1,
    });
    expect(result.success).toBe(true);
  });

  it("rejects one line beyond the maximum", () => {
    const result = coordinateGrid({
      xRange: [0, MAX_COORDINATE_GRID_LINES_PER_AXIS],
      yRange: [0, 10],
      gridStep: 1,
    });
    expect(result.success).toBe(false);
  });
});
