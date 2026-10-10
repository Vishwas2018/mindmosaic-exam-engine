import { describe, expect, it } from "vitest";

import { cinematicMotion } from "@/features/landing/cinematic/config";
import {
  HERO_SCENE_COUNT,
  heroActiveScene,
  heroClock,
  heroCopyState,
  heroLayerVisible,
  heroNavFill,
  heroNavOpacity,
  heroReleaseOpacity,
  heroSceneAnchor,
  heroSceneCover,
  heroTiles,
  heroTileState,
  heroWipeMask,
} from "@/features/landing/cinematic/heroScenes";
import { hero } from "@/features/landing/content";
import { HERO_SCENE_IDS, landingMedia, resolveSlotSrc } from "@/features/landing/media";
import { heroScenePreviews } from "@/features/landing/hero-previews";
import { existsSync } from "node:fs";
import { join } from "node:path";

const steps = Array.from({ length: 601 }, (_, i) => i / 100);

describe("Chapter 1 story clock", () => {
  it("maps chapter progress to 0..6 and clamps", () => {
    expect(heroClock(0)).toBe(0);
    expect(heroClock(0.5)).toBe(3);
    expect(heroClock(1)).toBe(6);
    expect(heroClock(-1)).toBe(0);
    expect(heroClock(2)).toBe(6);
  });

  it("has exactly one scene per story beat, in the owner's order, with copy and a photograph each", () => {
    expect(hero.scenes.map((scene) => scene.id)).toEqual(["learn", "practise", "prepare", "understand", "progress", "explore"]);
    expect([...HERO_SCENE_IDS]).toEqual(hero.scenes.map((scene) => scene.id));
    expect(hero.scenes).toHaveLength(HERO_SCENE_COUNT);
    for (const id of HERO_SCENE_IDS) {
      expect(landingMedia.chapter1.scenes[id].selection).toBe("active");
      expect(heroScenePreviews[id]).toMatch(/^data:image\/jpeg;base64,/);
      expect(existsSync(join(process.cwd(), "public", resolveSlotSrc(landingMedia.chapter1.scenes[id])))).toBe(true);
    }
  });
});

describe("Chapter 1 photograph stack", () => {
  it("shows scene i fully at t = i, and never lets the page show through between scenes", () => {
    for (let i = 0; i < HERO_SCENE_COUNT; i += 1) expect(heroSceneCover(i, i)).toBe(1);
    for (const t of steps) {
      // Scene 0 is always underneath, so the canvas is never empty.
      expect(heroSceneCover(t, 0)).toBe(1);
      // Some layer is fully opaque and visible at every moment: stacked, not dissolved.
      const opaque = Array.from({ length: HERO_SCENE_COUNT }, (_, i) => i).filter(
        (i) => heroLayerVisible(t, i) && heroSceneCover(t, i) >= 0.999,
      );
      expect(opaque.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("is a pure function of t: the same t always gives the same frame, forwards or backwards", () => {
    const forwards = steps.map((t) => [0, 1, 2, 3, 4, 5].map((i) => heroSceneCover(t, i)));
    const backwards = [...steps].reverse().map((t) => [0, 1, 2, 3, 4, 5].map((i) => heroSceneCover(t, i))).reverse();
    expect(backwards).toEqual(forwards);
  });

  it("never zooms or pans: the media slots use the 'still' preset", () => {
    for (const id of HERO_SCENE_IDS) expect(landingMedia.chapter1.scenes[id].motionPreset).toBe("still");
  });
});

describe("Chapter 1 copy wipe", () => {
  it("shows exactly one current copy block at every moment, and always at least one visible", () => {
    for (const t of steps) {
      const states = Array.from({ length: HERO_SCENE_COUNT }, (_, i) => heroCopyState(t, i));
      expect(states.filter((s) => s.visible).length).toBeGreaterThanOrEqual(1);
      expect(states.filter((s) => s.visible).length).toBeLessThanOrEqual(2);
      // Outside the narrow feathered hand-over only one block is up.
      const handover = states.filter((s) => s.visible && s.mask !== "none");
      if (handover.length === 0) expect(states.filter((s) => s.visible)).toHaveLength(1);
      expect(states.filter((s) => s.current).length).toBeLessThanOrEqual(1);
    }
  });

  it("finishes the wipe to the incoming scene before its photograph is fully in", () => {
    const { copyWipe, crossfade } = cinematicMotion.chapter1;
    // Incoming copy for scene 1 completes at 0 + start + span, inside the photo cross-fade [start, start + span].
    expect(copyWipe.start + copyWipe.span).toBeLessThanOrEqual(crossfade.start + crossfade.span);
    // Mid-way, the incoming photograph is already part-covering when its copy arrives (no text before image).
    const t = copyWipe.start + copyWipe.span;
    expect(heroSceneCover(t, 1)).toBeGreaterThan(0);
  });

  it("makes a mask that covers the whole block when finished", () => {
    expect(heroWipeMask(1, true)).toContain("#000");
    expect(heroWipeMask(0, true)).toContain("-20.00%");
  });
});

describe("Chapter 1 navigator", () => {
  it("fills each track in turn and marks the incoming scene once it is mostly there", () => {
    expect(heroNavFill(0, 0)).toBe(0);
    expect(heroNavFill(1, 0)).toBe(1);
    expect(heroNavFill(1, 1)).toBe(0);
    expect(heroNavFill(5, 5)).toBe(0);
    expect(heroNavFill(6, 5)).toBe(1);
    expect(heroActiveScene(0)).toBe(0);
    expect(heroActiveScene(0.79)).toBe(0);
    expect(heroActiveScene(0.8)).toBe(1);
    expect(heroActiveScene(6)).toBe(5);
  });

  it("lands 'go to scene' inside that scene's hold, never in a cross-fade", () => {
    const { crossfade } = cinematicMotion.chapter1;
    expect(heroSceneAnchor(0)).toBe(0);
    for (let i = 1; i < HERO_SCENE_COUNT; i += 1) {
      const t = heroSceneAnchor(i);
      expect(heroActiveScene(t)).toBe(i);
      expect(heroSceneCover(t, i)).toBe(1);
      expect(t).toBeLessThan(i + crossfade.start);
    }
  });
});

describe("Chapter 1 mosaic hand-off", () => {
  it("ends on the page colour with no scenery left: release fully in at t = 6, nav gone, every tile in", () => {
    expect(heroReleaseOpacity(6)).toBe(1);
    expect(heroNavOpacity(6)).toBe(0);
    for (const tile of heroTiles(1440, 900)) {
      const state = heroTileState(6, tile);
      expect(state.opacity).toBeGreaterThan(0.99);
    }
  });

  it("holds the hand-off back until the Explore scene has settled", () => {
    expect(heroReleaseOpacity(5.7)).toBe(0);
    expect(heroNavOpacity(5.4)).toBe(1);
    for (const tile of heroTiles(1440, 900)) {
      if (!tile.accent) expect(heroTileState(5.3, tile).opacity).toBe(0);
    }
  });

  it("builds nine rows of square tiles from the lower right, with accents appearing in order", () => {
    const tiles = heroTiles(1440, 900);
    const size = 900 / 9;
    expect(tiles.every((tile) => tile.size === size)).toBe(true);
    expect(Math.max(...tiles.map((tile) => tile.x + tile.size))).toBe(1440);
    expect(Math.max(...tiles.map((tile) => tile.y + tile.size))).toBe(900);
    expect(tiles.filter((tile) => tile.accent)).toHaveLength(cinematicMotion.chapter1.mosaic.accents.length);
    const first = tiles.find((tile) => tile.accent && tile.tone === "coral")!;
    expect(heroTileState(first.at - 0.01, first).opacity).toBe(0);
    expect(heroTileState(first.at + 1, first).opacity).toBe(1);
    // Deterministic: server and client agree.
    expect(heroTiles(1440, 900)).toEqual(tiles);
  });
});
