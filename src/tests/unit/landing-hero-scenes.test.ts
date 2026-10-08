import { describe, expect, it } from "vitest";

import { cinematicMotion, pinnedTravelFactor } from "@/features/landing/cinematic/config";
import {
  HERO_SCENE_COUNT,
  heroActiveScene,
  heroCaptionOpacity,
  heroLayerOpacity,
  heroSceneAnchor,
  heroSceneCover,
  heroSceneEnd,
  heroSceneLocal,
  heroSceneScale,
  heroSceneStarts,
} from "@/features/landing/cinematic/heroScenes";

/*
 * Chapter 1's six-scene stage is a pure function of scroll progress. These tests pin the
 * properties the owner asked for: gradual and reversible, never blank, never two captions
 * legible at once, stacked photographs that never dip, a restrained camera, and no timers.
 */

const timing = cinematicMotion.chapter1;
const sweep = (fn: (q: number) => void, step = 0.001) => {
  for (let q = 0; q <= 1 + 1e-9; q += step) fn(Math.min(1, q));
};
const around = (boundary: number) =>
  [-1.5, -1, -0.5, -0.25, -0.1, -0.02, 0, 0.02, 0.1, 0.25, 0.5, 1, 1.5].map(
    (o) => boundary + (o * timing.crossfade) / 2,
  );

describe("Chapter 1 scene timeline", () => {
  it("has six scenes in the configured order and a compact total length", () => {
    expect(HERO_SCENE_COUNT).toBe(6);
    expect(heroSceneStarts).toEqual(Object.values(timing.sceneStarts));
    expect(timing.desktopScrollHeightSvh).toBeGreaterThanOrEqual(460);
    expect(timing.desktopScrollHeightSvh).toBeLessThanOrEqual(520);
    // About two thirds of a screen of scrolling per scene: brisk, not exhausting.
    const perSceneSvh = ((1 / HERO_SCENE_COUNT) * (timing.desktopScrollHeightSvh - 100));
    expect(perSceneSvh).toBeGreaterThan(55);
    expect(perSceneSvh).toBeLessThan(90);
  });

  it("reports the active scene from progress, deterministically", () => {
    expect(heroActiveScene(0)).toBe(0);
    heroSceneStarts.forEach((start, index) => expect(heroActiveScene(start + 1e-6)).toBe(index));
    expect(heroActiveScene(1)).toBe(5);
    expect(heroActiveScene(0.5)).toBe(heroActiveScene(0.5));
  });

  it("walks each scene's own window from 0 to 1 and the last one to the release", () => {
    for (let index = 0; index < HERO_SCENE_COUNT; index += 1) {
      expect(heroSceneLocal(heroSceneStarts[index]!, index)).toBe(0);
      expect(heroSceneLocal(heroSceneEnd(index), index)).toBe(1);
    }
    expect(heroSceneEnd(HERO_SCENE_COUNT - 1)).toBe(1);
  });
});

describe("scene photographs: stacked, gradual, reversible", () => {
  it("covers the previous scene gradually and monotonically as the page scrolls forward", () => {
    for (let index = 1; index < HERO_SCENE_COUNT; index += 1) {
      let previous = heroSceneCover(0, index);
      sweep((q) => {
        const cover = heroSceneCover(q, index);
        expect(cover).toBeGreaterThanOrEqual(previous - 1e-12);
        // Small steps of scroll never produce a visible jump.
        expect(cover - previous).toBeLessThan(0.02);
        previous = cover;
      });
      expect(heroSceneCover(1, index)).toBe(1);
      expect(heroSceneCover(0, index)).toBe(0);
    }
    expect(heroSceneCover(0, 0)).toBe(1);
  });

  it("is a pure function of progress: scrolling back retraces the same frames", () => {
    const frame = (q: number) =>
      [3, 4].flatMap((index) => [
        heroSceneCover(q, index),
        heroCaptionOpacity(q, index),
        heroSceneScale(q, index, cinematicMotion.presets.cameraPull),
        heroSceneLocal(q, index),
      ]);
    const positions = Array.from({ length: 201 }, (_, i) => i / 200);
    const forward = positions.map(frame);
    const backward = [...positions].reverse().map(frame).reverse();
    expect(backward).toEqual(forward);
  });

  it("never lets two stacked photographs dip below full coverage", () => {
    // The outgoing photograph stays fully opaque beneath, so coverage = 1 - (1 - 1)(1 - cover) = 1 throughout.
    for (let index = 1; index < HERO_SCENE_COUNT; index += 1) {
      for (const q of around(heroSceneStarts[index]!)) {
        const beneath = heroLayerOpacity(q, index - 1, 1, 0); // the next layer not yet fully covering
        const incoming = heroLayerOpacity(q, index, 1, 0);
        const coverage = 1 - (1 - beneath) * (1 - incoming);
        expect(coverage, `scene ${index} at q=${q.toFixed(4)}`).toBeGreaterThanOrEqual(0.999);
      }
    }
  });

  it("drops a layer from painting only once a READY neighbour fully covers it", () => {
    expect(heroLayerOpacity(0.5, 1, 1, 1)).toBe(0);
    expect(heroLayerOpacity(0.5, 1, 1, 0.99)).toBe(1);
    // A neighbour that failed or is still loading has readiness 0, so its cover is 0 and the layer stays.
    expect(heroLayerOpacity(0.5, 1, 1, 0 * heroSceneCover(0.5, 2))).toBe(1);
  });

  it("shows nothing for a scene that is not ready, however far the scroll has passed", () => {
    for (let index = 1; index < HERO_SCENE_COUNT; index += 1) {
      expect(heroLayerOpacity(1, index, 0, 0)).toBe(0);
    }
  });
});

describe("scene captions", () => {
  it("always has one readable and never two legible at once, at every boundary", () => {
    for (let index = 0; index < HERO_SCENE_COUNT - 1; index += 1) {
      for (const q of around(heroSceneStarts[index + 1]!)) {
        const leaving = heroCaptionOpacity(q, index);
        const entering = heroCaptionOpacity(q, index + 1);
        const where = `captions ${index}/${index + 1} at q=${q.toFixed(4)}`;
        expect(Math.max(leaving, entering), `blank, ${where}`).toBeGreaterThanOrEqual(0.15);
        expect(Math.min(leaving, entering), `doubled, ${where}`).toBeLessThanOrEqual(0.25);
      }
    }
  });

  it("holds exactly one caption at full strength away from the boundaries", () => {
    for (let index = 0; index < HERO_SCENE_COUNT; index += 1) {
      const q = heroSceneAnchor(index);
      const strengths = Array.from({ length: HERO_SCENE_COUNT }, (_, i) => heroCaptionOpacity(q, i));
      expect(strengths[index]).toBe(1);
      expect(strengths.filter((value) => value > 0.01)).toHaveLength(1);
    }
  });

  it("starts on the first caption and ends on the last", () => {
    expect(heroCaptionOpacity(0, 0)).toBe(1);
    expect(heroCaptionOpacity(1, HERO_SCENE_COUNT - 1)).toBe(1);
  });
});

describe("camera movement", () => {
  it("is restrained: every preset stays within 5% and moves across the whole scene", () => {
    for (const name of ["cameraPush", "cameraPull"] as const) {
      const preset = cinematicMotion.presets[name];
      let low = Infinity;
      let high = -Infinity;
      for (let index = 0; index < HERO_SCENE_COUNT; index += 1) {
        sweep((q) => {
          const scale = heroSceneScale(q, index, preset);
          low = Math.min(low, scale);
          high = Math.max(high, scale);
        }, 0.01);
      }
      expect(low).toBeGreaterThanOrEqual(1);
      expect(high).toBeLessThanOrEqual(1.05);
      expect(high - low).toBeGreaterThanOrEqual(0.02);
    }
  });

  it("changes gradually: a small scroll step never jumps the scale", () => {
    const preset = cinematicMotion.presets.cameraPush;
    let previous = heroSceneScale(0, 0, preset);
    sweep((q) => {
      const scale = heroSceneScale(q, 0, preset);
      expect(Math.abs(scale - previous)).toBeLessThan(0.005);
      previous = scale;
    });
  });
});

describe("navigator anchors", () => {
  it("lands inside each scene's steady state, away from any cross-fade", () => {
    for (let index = 0; index < HERO_SCENE_COUNT; index += 1) {
      const anchor = heroSceneAnchor(index);
      expect(heroActiveScene(anchor)).toBe(index);
      // Not inside the cross-fade with the previous or next scene.
      if (index > 0) expect(anchor).toBeGreaterThanOrEqual(heroSceneStarts[index]! + timing.crossfade / 2 - 1e-9);
      if (index < HERO_SCENE_COUNT - 1) expect(anchor).toBeLessThanOrEqual(heroSceneStarts[index + 1]! - timing.crossfade / 2 + 1e-9);
      // The last scene settles before the mosaic hand-off starts.
      if (index === HERO_SCENE_COUNT - 1) expect(anchor).toBeLessThanOrEqual(timing.mosaicReveal.start);
    }
  });

  it("maps to ordinary page scroll through the pinned travel factor", () => {
    const factor = pinnedTravelFactor(timing.desktopScrollHeightSvh);
    expect(factor).toBeCloseTo(timing.desktopScrollHeightSvh / (timing.desktopScrollHeightSvh - 100), 10);
    for (let index = 0; index < HERO_SCENE_COUNT; index += 1) {
      const scrollFraction = heroSceneAnchor(index) / factor;
      expect(scrollFraction).toBeGreaterThanOrEqual(0);
      expect(scrollFraction).toBeLessThan(1);
    }
  });
});
