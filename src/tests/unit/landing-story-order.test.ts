import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { cinematicMotion, pinnedTravelFactor } from "@/features/landing/cinematic/config";
import { sections } from "@/features/landing/content";

describe("landing story order", () => {
  it("runs Chapters 1 to 4, then the quality and closing sections", () => {
    expect(sections.filter((section) => section.enabled).map((section) => section.key)).toEqual([
      "hero",
      "chapterTwo",
      "chapterThree",
      "chapterFour",
      "qualityBand",
      "trustAndCare",
      "faqAndStart",
      "footer",
    ]);
  });
});

describe("cinematic config", () => {
  it("pins at Tailwind's lg breakpoint, which the chapter layout classes use", () => {
    const theme = readFileSync(join(process.cwd(), "node_modules/tailwindcss/theme.css"), "utf8");
    const lg = /--breakpoint-lg:\s*([\d.]+)rem/.exec(theme);
    expect(lg).not.toBeNull();
    expect(Number(lg![1]) * 16).toBe(cinematicMotion.pinnedMinWidth);
  });

  it("keeps Chapter 1's scene boundaries ordered, cross-fades from overlapping, and the mosaic inside 0..1", () => {
    const { sceneStarts, crossfade, mosaicReveal } = cinematicMotion.chapter1;
    const starts = Object.values(sceneStarts);
    expect(starts).toHaveLength(6);
    expect(starts[0]).toBe(0);
    starts.slice(1).forEach((start, index) => {
      // Strictly increasing, and neighbouring cross-fade windows never touch.
      expect(start).toBeGreaterThan(starts[index]!);
      expect(start - starts[index]!).toBeGreaterThan(crossfade);
    });
    // The last scene finishes settling before the mosaic hand-off begins.
    expect(starts.at(-1)! + crossfade / 2).toBeLessThan(mosaicReveal.start);
    expect(mosaicReveal.start).toBeLessThan(mosaicReveal.end);
    const lastEnd = mosaicReveal.end + (mosaicReveal.steps - 1) * mosaicReveal.endStagger;
    expect(lastEnd).toBeLessThanOrEqual(1);
  });

  it("keeps Chapter 1 compact: 460-520svh in total, well under Chapter 2", () => {
    const { desktopScrollHeightSvh } = cinematicMotion.chapter1;
    expect(desktopScrollHeightSvh).toBeGreaterThanOrEqual(460);
    expect(desktopScrollHeightSvh).toBeLessThanOrEqual(520);
    expect(desktopScrollHeightSvh).toBeLessThan(cinematicMotion.chapter2.desktopScrollHeightSvh);
  });

  it("converts a 200svh section into a pinned travel of half its scroll", () => {
    expect(pinnedTravelFactor(200)).toBe(2);
  });
});
