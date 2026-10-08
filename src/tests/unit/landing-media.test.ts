import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { cinematicMotion } from "@/features/landing/cinematic/config";
import { hero } from "@/features/landing/content";
import {
  buildChapterSlots,
  HERO_SCENE_IDS,
  landingMedia,
  resolveMediaAsset,
  resolveSlotSrc,
} from "@/features/landing/media";

const { scenes, sceneOrder } = landingMedia.chapter1;
const allSlots = sceneOrder.map((id) => scenes[id]);

describe("landing media registry", () => {
  it("resolves a base path and revision to a versioned file name", () => {
    expect(resolveMediaAsset("/landing/media/chapter-01-intro/ch01-scene-01-learn.webp", "v1")).toBe(
      "/landing/media/chapter-01-intro/ch01-scene-01-learn-v1.webp",
    );
    expect(resolveMediaAsset("/a.b/c/file.name.webp", "v2")).toBe("/a.b/c/file.name-v2.webp");
  });

  it("rejects a path with no extension instead of shipping a broken URL", () => {
    expect(() => resolveMediaAsset("/a.b/no-extension", "v1")).toThrow(/no file extension/);
  });

  it("keeps the registry's chapter keys in story order", () => {
    expect(Object.keys(landingMedia)).toEqual(["chapter1", "chapter2"]);
  });

  describe("Chapter 1 scenes", () => {
    it("has exactly six slots, in the story order the copy uses", () => {
      expect([...sceneOrder]).toEqual([...HERO_SCENE_IDS]);
      expect(Object.keys(scenes)).toHaveLength(6);
      expect(sceneOrder).toEqual(hero.scenes.map((scene) => scene.id));
    });

    it("stores each scene under its documented, versioned name", () => {
      expect(allSlots.map(resolveSlotSrc)).toEqual([
        "/landing/media/chapter-01-intro/ch01-scene-01-learn-v1.webp",
        "/landing/media/chapter-01-intro/ch01-scene-02-practise-v1.webp",
        "/landing/media/chapter-01-intro/ch01-scene-03-prepare-v1.webp",
        "/landing/media/chapter-01-intro/ch01-scene-04-understand-v1.webp",
        "/landing/media/chapter-01-intro/ch01-scene-05-progress-v1.webp",
        "/landing/media/chapter-01-intro/ch01-scene-06-explore-v1.webp",
      ]);
    });

    it("points every slot at a file that exists in the chapter folder", () => {
      for (const slot of allSlots) {
        const src = resolveSlotSrc(slot);
        expect(src.startsWith("/landing/media/chapter-01-intro/")).toBe(true);
        expect(existsSync(join(process.cwd(), "public", src)), src).toBe(true);
      }
    });

    it("is honest that these are interim, below-production placeholders", () => {
      for (const slot of allSlots) {
        expect(slot.assetStatus).toBe("interim");
        expect(slot.notes).toMatch(/1672x941/);
      }
    });

    it("does not call anything production until a production-resolution file exists", () => {
      for (const slot of allSlots) expect(slot.assetStatus).not.toBe("production");
    });

    it("selects every slot (one candidate each) and spends the face budget on Learn only", () => {
      for (const slot of allSlots) expect(slot.selection).toBe("active");
      expect(allSlots.filter((slot) => slot.treatment === "face-visible").map((slot) => slot.label)).toEqual([
        "Scene 01 - Learn",
      ]);
    });

    it("gives every slot the owner-facing metadata", () => {
      for (const slot of allSlots) {
        for (const key of ["label", "revision", "sceneDescription", "focalMobile", "focalTablet", "focalDesktop", "notes"] as const) {
          expect(slot[key].length, key).toBeGreaterThan(0);
        }
        expect(slot.revision).toMatch(/^v\d+$/);
        expect(slot.sceneDescription).not.toMatch(/logo|mindmosaic|screen|answer/i);
      }
    });

    it("keeps the decorative contract: empty alt, separate owner description", () => {
      for (const slot of allSlots) {
        expect(slot.decorative).toBe(true);
        expect(slot.alt).toBe("");
        expect(slot.sceneDescription.length).toBeGreaterThan(10);
      }
    });

    it("only names motion presets that exist, and keeps the camera move within 5%", () => {
      for (const slot of allSlots) {
        expect(Object.keys(cinematicMotion.presets)).toContain(slot.motionPreset);
        const preset = cinematicMotion.presets[slot.motionPreset];
        for (const scale of [preset.fromScale, preset.settledScale, preset.handoffScale]) {
          expect(scale).toBeGreaterThanOrEqual(1);
          expect(scale).toBeLessThanOrEqual(1.05);
        }
        expect(Math.abs(preset.handoffScale - preset.fromScale)).toBeGreaterThanOrEqual(0.02);
      }
    });

    it("alternates push and pull so consecutive scenes never drift the same way", () => {
      const presets = allSlots.map((slot) => slot.motionPreset);
      presets.slice(1).forEach((preset, index) => expect(preset).not.toBe(presets[index]));
    });
  });

  it("builds a slot's selection without touching its asset maturity", () => {
    const candidate = { ...allSlots[0]!, selection: undefined } as never;
    const built = buildChapterSlots<"primary">({ primary: candidate }, "primary").primary;
    expect(built.selection).toBe("active");
    expect(built.assetStatus).toBe("interim");
  });
});
