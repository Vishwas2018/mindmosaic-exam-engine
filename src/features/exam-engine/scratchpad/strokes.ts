/**
 * Rough-work scratchpad: pure stroke geometry.
 *
 * Kept free of React and of the DOM so it is unit-testable without a
 * canvas, a pointer, or fake timers — the same stance deadline.ts and
 * autosave.ts take in exam-engine/state. Everything here is a function of
 * its arguments.
 */

import type { ScratchPoint, Stroke } from "./types";

/**
 * Convert a pointer position inside a box to normalised 0..1 coordinates,
 * clamped to the box. Clamping matters: a pointer capture keeps sending
 * moves after the finger leaves the panel, and without a clamp those
 * become points outside the surface that stretch the drawing's bounding
 * box and shrink everything else on the next resize.
 */
export function toNormalisedPoint(
  clientX: number,
  clientY: number,
  box: { left: number; top: number; width: number; height: number },
): ScratchPoint {
  if (box.width <= 0 || box.height <= 0) return { x: 0, y: 0 };
  return {
    x: clamp01((clientX - box.left) / box.width),
    y: clamp01((clientY - box.top) / box.height),
  };
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/**
 * Drop points that are closer than `minDistance` (in normalised units) to
 * the previous kept point. A pointermove fires far more often than a
 * child's hand actually moves, and every duplicate point is stored,
 * serialised to sessionStorage, and re-rendered on each frame. Thinning at
 * capture time keeps a page of long division to a few hundred points
 * rather than a few thousand, with no visible change to the line.
 */
export function appendPoint(
  points: readonly ScratchPoint[],
  next: ScratchPoint,
  minDistance = 0.004,
): readonly ScratchPoint[] {
  const last = points[points.length - 1];
  if (!last) return [next];
  if (distance(last, next) < minDistance) return points;
  return [...points, next];
}

export function distance(a: ScratchPoint, b: ScratchPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * SVG path data for a stroke, in the caller's pixel box.
 *
 * A single-point stroke (a dot — a child tapping to make a decimal point)
 * would produce `M x y` with nothing to draw, which SVG renders as
 * nothing. Emitting a zero-length line instead makes it a real dot under
 * `stroke-linecap: round`, so tapping puts a mark on the page like a pen
 * would.
 */
export function toSvgPath(
  points: readonly ScratchPoint[],
  width: number,
  height: number,
): string {
  if (points.length === 0) return "";
  const px = (p: ScratchPoint) => `${round(p.x * width)} ${round(p.y * height)}`;
  if (points.length === 1) {
    const only = px(points[0]);
    return `M ${only} L ${only}`;
  }
  return `M ${px(points[0])} ${points.slice(1).map((p) => `L ${px(p)}`).join(" ")}`;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Ids of strokes the eraser touched at `point`.
 *
 * Erasing is stroke-level, not pixel-level: touching any part of a stroke
 * removes that stroke whole. For a child rubbing out a wrong digit this is
 * both more forgiving and more predictable than a pixel eraser, which
 * tends to leave fragments of the digit behind and cannot be undone
 * cleanly.
 *
 * The hit test measures to the stroke's *segments*, not only its stored
 * points, so a long straight line drawn in two points (a division bar) is
 * erasable along its whole length rather than only at its two ends.
 */
export function strokesHitAt(
  strokes: readonly Stroke[],
  point: ScratchPoint,
  radius = 0.03,
): readonly string[] {
  return strokes
    .filter((stroke) => strokeIsWithin(stroke, point, radius))
    .map((stroke) => stroke.id);
}

function strokeIsWithin(stroke: Stroke, point: ScratchPoint, radius: number): boolean {
  const { points } = stroke;
  if (points.length === 0) return false;
  if (points.length === 1) return distance(points[0], point) <= radius;
  for (let i = 1; i < points.length; i += 1) {
    if (distanceToSegment(point, points[i - 1], points[i]) <= radius) return true;
  }
  return false;
}

/** Shortest distance from `p` to the segment `a`–`b`. */
export function distanceToSegment(
  p: ScratchPoint,
  a: ScratchPoint,
  b: ScratchPoint,
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return distance(p, a);
  /* Projection of p onto the infinite line, clamped to the segment. */
  const t = clamp01(((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSquared);
  return distance(p, { x: a.x + t * dx, y: a.y + t * dy });
}
