import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { cinematicMotion } from "@/features/landing/cinematic/config";
import { CHAPTER_1_ACTIVE_OPTION, landingMedia, resolveMediaAsset, resolveSlotSrc } from "@/features/landing/media";

const { primary, alternates } = landingMedia.chapter1.intro;
const allSlots = [primary, ...Object.values(alternates)];

describe("landing media registry", () => {
  it("resolves a base path and revision to a versioned file name", () => {
    expect(resolveMediaAsset("/landing/media/chapter-01-intro/ch01-hero-primary.webp", "v1")).toBe(
      "/landing/media/chapter-01-intro/ch01-hero-primary-v1.webp",
    );
    expect(resolveMediaAsset("/a.b/c/file.name.webp", "v2")).toBe("/a.b/c/file.name-v2.webp");
  });

  it("rejects a path with no extension instead of shipping a broken URL", () => {
    expect(() => resolveMediaAsset("/a.b/no-extension", "v1")).toThrow(/no file extension/);
  });

  it("makes the collaborative two-student scene (Option B) the active primary", () => {
    expect(CHAPTER_1_ACTIVE_OPTION).toBe("optionB");
    expect(primary.status).toBe("active");
    expect(resolveSlotSrc(primary)).toBe("/landing/media/chapter-01-intro/ch01-hero-primary-v1.webp");
    expect(resolveSlotSrc(primary)).toBe(resolveSlotSrc(alternates.optionB));
    expect(alternates.optionB.status).toBe("active");
    expect(alternates.optionA.status).not.toBe("active");
    expect(alternates.optionC.status).not.toBe("active");
  });

  it("stores the two alternates under the documented names", () => {
    expect(resolveSlotSrc(alternates.optionA)).toBe("/landing/media/chapter-01-intro/ch01-hero-alt-a-v1.webp");
    expect(resolveSlotSrc(alternates.optionC)).toBe("/landing/media/chapter-01-intro/ch01-hero-alt-b-v1.webp");
  });

  it("points every slot at a file that exists in the chapter folder", () => {
    for (const slot of allSlots) {
      const src = resolveSlotSrc(slot);
      expect(src.startsWith("/landing/media/chapter-01-intro/")).toBe(true);
      expect(existsSync(join(process.cwd(), "public", src)), src).toBe(true);
    }
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

  it("only names motion presets that exist in the cinematic config", () => {
    for (const slot of allSlots) {
      expect(Object.keys(cinematicMotion.presets)).toContain(slot.motionPreset);
    }
  });
});
