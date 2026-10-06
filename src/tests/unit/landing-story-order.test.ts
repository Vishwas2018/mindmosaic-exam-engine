import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { cinematicMotion, pinnedTravelFactor } from "@/features/landing/cinematic/config";
import { sections } from "@/features/landing/content";

describe("landing story order", () => {
  it("runs Chapters 1 to 3, then the existing parent sections, with no separate Programs or How it works sections", () => {
    expect(sections.filter((section) => section.enabled).map((section) => section.key)).toEqual([
      "hero",
      "chapterTwo",
      "chapterThree",
      "forParents",
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

  it("keeps every timeline window ordered and inside 0..1", () => {
    const { imageSettle, imageHandoff, copyExit, mosaicReveal } = cinematicMotion.chapter1;
    for (const range of [imageSettle, imageHandoff, copyExit]) {
      expect(range.start).toBeGreaterThanOrEqual(0);
      expect(range.end).toBeLessThanOrEqual(1);
      expect(range.start).toBeLessThan(range.end);
    }
    expect(imageSettle.end).toBeLessThanOrEqual(imageHandoff.start);
    const lastEnd = mosaicReveal.end + (mosaicReveal.steps - 1) * mosaicReveal.endStagger;
    expect(lastEnd).toBeLessThanOrEqual(1);
  });

  it("converts a 200svh section into a pinned travel of half its scroll", () => {
    expect(pinnedTravelFactor(200)).toBe(2);
  });
});
