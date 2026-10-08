import { describe, expect, it } from "vitest";

import { cinematicMotion } from "@/features/landing/cinematic/config";
import {
  chapter2LayerStarts,
  chapter3LayerStarts,
  chapter4LayerStarts,
  layerBackdropOpacity,
  layerForegroundOpacity,
  layerOpacity,
  layerPresence,
  spanForegroundOpacity,
} from "@/features/landing/cinematic/sceneProgress";

/**
 * Regression cover for the continuous-scroll hand-over (owner visual acceptance,
 * October 2026): foreground never goes blank between layers, two copies are never
 * legible together, stacked backdrops never dip to show the page behind them, and
 * layers are only skipped by paint once they are fully out of play.
 */

const chapters = [
  { name: "Chapter 2", starts: chapter2LayerStarts, crossfade: cinematicMotion.chapter2.crossfade },
  { name: "Chapter 3", starts: chapter3LayerStarts, crossfade: cinematicMotion.chapter3.crossfade },
  { name: "Chapter 4", starts: chapter4LayerStarts, crossfade: cinematicMotion.chapter4.crossfade },
] as const;

/** Positions around every boundary: well before, the edges of the window, its midpoint, and well after. */
function aroundBoundary(boundary: number, crossfade: number): number[] {
  const offsets = [-1.5, -1, -0.5, -0.25, -0.1, -0.02, 0, 0.02, 0.1, 0.25, 0.5, 1, 1.5];
  return offsets.map((o) => boundary + (o * crossfade) / 2);
}

describe("foreground hand-over", () => {
  for (const { name, starts, crossfade } of chapters) {
    it(`${name}: something is always readable, and never two things at once`, () => {
      for (let layer = 0; layer < starts.length - 1; layer += 1) {
        for (const q of aroundBoundary(starts[layer + 1]!, crossfade)) {
          const leaving = layerForegroundOpacity(q, starts, layer, crossfade);
          const entering = layerForegroundOpacity(q, starts, layer + 1, crossfade);
          const where = `layers ${layer}/${layer + 1} at q=${q.toFixed(4)}`;
          expect(Math.max(leaving, entering), `blank beat, ${where}`).toBeGreaterThanOrEqual(0.15);
          expect(Math.min(leaving, entering), `legible overlap, ${where}`).toBeLessThanOrEqual(0.25);
        }
      }
    });

    it(`${name}: the hand-over is a smooth ramp, not a swap`, () => {
      for (let layer = 0; layer < starts.length - 1; layer += 1) {
        const boundary = starts[layer + 1]!;
        let previous = layerForegroundOpacity(boundary - crossfade, starts, layer, crossfade);
        for (let step = 1; step <= 200; step += 1) {
          const q = boundary - crossfade + (2 * crossfade * step) / 200;
          const current = layerForegroundOpacity(q, starts, layer, crossfade);
          // Leaving copy only ever gets fainter, and never by a visible jump between neighbouring scroll positions.
          expect(current).toBeLessThanOrEqual(previous + 1e-9);
          expect(previous - current).toBeLessThan(0.06);
          previous = current;
        }
      }
    });
  }

  it("keeps a span of consecutive layers (Chapter 3's question state) lit through its inner boundary", () => {
    const starts = chapter3LayerStarts;
    const cf = cinematicMotion.chapter3.crossfade;
    for (const q of aroundBoundary(starts[3]!, cf)) expect(spanForegroundOpacity(q, starts, 2, 3, cf)).toBe(1);
  });
});

describe("backdrop hand-over", () => {
  const starts = chapter2LayerStarts;
  const cf = cinematicMotion.chapter2.crossfade;
  const lastScene = starts.length - 2;

  it("never lets two stacked scene backdrops dip below full coverage", () => {
    // Scenes are layers 1..6; the combined coverage of an outgoing and an incoming opaque panel stays 1.
    for (let layer = 1; layer < lastScene; layer += 1) {
      for (const q of aroundBoundary(starts[layer + 1]!, cf)) {
        const outgoing = layerBackdropOpacity(q, starts, layer, cf, true);
        const incoming = layerBackdropOpacity(q, starts, layer + 1, cf, layer + 1 < lastScene);
        const coverage = 1 - (1 - outgoing) * (1 - incoming);
        expect(coverage, `scenes ${layer}/${layer + 1} at q=${q.toFixed(4)}`).toBeGreaterThanOrEqual(0.999);
      }
    }
  });

  it("fades the last scene's backdrop out normally into the hand-off", () => {
    const boundary = starts[lastScene + 1]!;
    expect(layerBackdropOpacity(boundary - cf, starts, lastScene, cf, false)).toBe(1);
    expect(layerBackdropOpacity(boundary, starts, lastScene, cf, false)).toBeCloseTo(0.5, 5);
    expect(layerBackdropOpacity(boundary + cf, starts, lastScene, cf, false)).toBe(0);
  });
});

describe("layer presence (paint skipping)", () => {
  for (const { name, starts, crossfade } of chapters) {
    it(`${name}: a layer is present whenever any of it can be visible`, () => {
      for (let layer = 0; layer < starts.length; layer += 1) {
        for (let q = 0; q <= 1; q += 0.002) {
          const visible =
            layerOpacity(q, starts, layer, crossfade) > 0 || layerForegroundOpacity(q, starts, layer, crossfade) > 0;
          if (visible) expect(layerPresence(q, starts, layer, crossfade), `layer ${layer} at q=${q.toFixed(3)}`).toBe(1);
        }
      }
    });
  }

  it("includes the stacked backdrop that outlives its layer's own fade", () => {
    const starts = chapter2LayerStarts;
    const cf = cinematicMotion.chapter2.crossfade;
    const lastScene = starts.length - 2;
    for (let layer = 1; layer < lastScene; layer += 1) {
      for (let q = 0; q <= 1; q += 0.002) {
        if (layerBackdropOpacity(q, starts, layer, cf, true) > 0) expect(layerPresence(q, starts, layer, cf)).toBe(1);
      }
    }
  });
});

describe("blend config", () => {
  it("overlaps the foreground fade windows and keeps every fraction inside the cross-fade", () => {
    const { foregroundWindow, fadeOutEnd, fadeInStart, backdropInEnd } = cinematicMotion.layerBlend;
    expect(fadeInStart).toBeLessThan(fadeOutEnd);
    for (const value of [foregroundWindow, fadeOutEnd, fadeInStart, backdropInEnd]) {
      expect(value).toBeGreaterThan(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });
});
