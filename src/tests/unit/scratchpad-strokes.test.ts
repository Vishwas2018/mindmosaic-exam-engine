import { describe, expect, it } from "vitest";

import {
  appendPoint,
  distanceToSegment,
  strokesHitAt,
  toNormalisedPoint,
  toSvgPath,
} from "@/features/exam-engine/scratchpad";
import type { Stroke } from "@/features/exam-engine/scratchpad";

const BOX = { left: 100, top: 50, width: 200, height: 100 };

describe("toNormalisedPoint", () => {
  it("maps a pointer position to 0..1 within the box", () => {
    expect(toNormalisedPoint(200, 100, BOX)).toEqual({ x: 0.5, y: 0.5 });
    expect(toNormalisedPoint(100, 50, BOX)).toEqual({ x: 0, y: 0 });
    expect(toNormalisedPoint(300, 150, BOX)).toEqual({ x: 1, y: 1 });
  });

  it("clamps points outside the box", () => {
    /* Pointer capture keeps delivering moves after the finger leaves the
       panel; unclamped those would stretch the drawing's coordinate space. */
    expect(toNormalisedPoint(0, 0, BOX)).toEqual({ x: 0, y: 0 });
    expect(toNormalisedPoint(9999, 9999, BOX)).toEqual({ x: 1, y: 1 });
  });

  it("returns the origin for a zero-sized box rather than dividing by zero", () => {
    expect(toNormalisedPoint(10, 10, { left: 0, top: 0, width: 0, height: 0 })).toEqual({
      x: 0,
      y: 0,
    });
  });
});

describe("appendPoint", () => {
  it("keeps the first point", () => {
    expect(appendPoint([], { x: 0.1, y: 0.1 })).toEqual([{ x: 0.1, y: 0.1 }]);
  });

  it("drops points closer than the minimum distance", () => {
    const points = [{ x: 0.5, y: 0.5 }];
    const same = appendPoint(points, { x: 0.5005, y: 0.5 });
    /* Returned by identity so callers can skip a state update entirely. */
    expect(same).toBe(points);
  });

  it("keeps points beyond the minimum distance", () => {
    const points = [{ x: 0.5, y: 0.5 }];
    expect(appendPoint(points, { x: 0.6, y: 0.5 })).toHaveLength(2);
  });
});

describe("toSvgPath", () => {
  it("returns an empty string for no points", () => {
    expect(toSvgPath([], 100, 100)).toBe("");
  });

  it("renders a single point as a zero-length line so a tap makes a dot", () => {
    /* With stroke-linecap round this paints a dot; a bare `M` paints nothing,
       which would make tapping a decimal point do visibly nothing. */
    expect(toSvgPath([{ x: 0.5, y: 0.5 }], 100, 200)).toBe("M 50 100 L 50 100");
  });

  it("scales normalised points into the given pixel box", () => {
    const path = toSvgPath(
      [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
      200,
      100,
    );
    expect(path).toBe("M 0 0 L 200 100");
  });

  it("rescales the same stroke when the box grows, which is the resize case", () => {
    const points = [
      { x: 0.25, y: 0.5 },
      { x: 0.75, y: 0.5 },
    ];
    expect(toSvgPath(points, 100, 100)).toBe("M 25 50 L 75 50");
    expect(toSvgPath(points, 400, 200)).toBe("M 100 100 L 300 100");
  });
});

describe("distanceToSegment", () => {
  it("measures to the nearest point on the segment, not to its ends", () => {
    const a = { x: 0, y: 0 };
    const b = { x: 1, y: 0 };
    expect(distanceToSegment({ x: 0.5, y: 0.1 }, a, b)).toBeCloseTo(0.1);
  });

  it("falls back to point distance for a degenerate segment", () => {
    const a = { x: 0.5, y: 0.5 };
    expect(distanceToSegment({ x: 0.5, y: 0.6 }, a, a)).toBeCloseTo(0.1);
  });
});

describe("strokesHitAt", () => {
  const bar: Stroke = {
    id: "bar",
    colour: "slate",
    points: [
      { x: 0.1, y: 0.5 },
      { x: 0.9, y: 0.5 },
    ],
  };
  const dot: Stroke = { id: "dot", colour: "orange", points: [{ x: 0.1, y: 0.1 }] };

  it("hits a long straight stroke along its middle, not only at its stored points", () => {
    /* A division bar is two points far apart. A point-only hit test would
       make its whole length un-erasable, which is exactly the stroke a
       child most wants to rub out. */
    expect(strokesHitAt([bar], { x: 0.5, y: 0.5 })).toEqual(["bar"]);
  });

  it("misses strokes outside the radius", () => {
    expect(strokesHitAt([bar], { x: 0.5, y: 0.9 })).toEqual([]);
  });

  it("hits a single-point stroke", () => {
    expect(strokesHitAt([dot], { x: 0.11, y: 0.11 })).toEqual(["dot"]);
  });

  it("returns every stroke under the pointer", () => {
    const crossing: Stroke = {
      id: "crossing",
      colour: "royal",
      points: [
        { x: 0.5, y: 0.2 },
        { x: 0.5, y: 0.8 },
      ],
    };
    expect([...strokesHitAt([bar, crossing], { x: 0.5, y: 0.5 })].sort()).toEqual([
      "bar",
      "crossing",
    ]);
  });
});
