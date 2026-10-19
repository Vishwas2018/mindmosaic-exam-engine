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

  it("keeps Chapter 1's story clock windows ordered, and its section tall enough for story plus seam", () => {
    const { crossfade, copyWipe, mosaic, desktopScrollHeightSvh, storyScrollHeightSvh, seamSvh } = cinematicMotion.chapter1;
    // The photograph cross-fade of segment k ends exactly when scene k+1 is fully in; the copy wipe finishes first.
    expect(crossfade.start + crossfade.span).toBeCloseTo(1, 10);
    expect(copyWipe.start + copyWipe.span).toBeLessThanOrEqual(crossfade.start + crossfade.span);
    // Accent tiles all appear before the end of the story.
    for (const accent of mosaic.accents) expect(accent.at + mosaic.accentFade).toBeLessThanOrEqual(6);
    // The section is the story plus the seam, and stays shorter than Chapter 2.
    expect(desktopScrollHeightSvh).toBe(storyScrollHeightSvh + seamSvh);
    expect(storyScrollHeightSvh).toBeLessThan(cinematicMotion.chapter2.desktopScrollHeightSvh);
  });

  it("sweeps the seam to completion: the last tile is fully grown by seam progress 1", () => {
    const { span, stagger, grow, delayMix } = cinematicMotion.chapterSeam;
    // The slowest tile has delay <= the sum of the weights; it must be done at u = 1.
    const maxDelay = delayMix.distance + delayMix.jitter + delayMix.row;
    expect((1 * span - maxDelay * stagger) / grow).toBeGreaterThanOrEqual(1);
  });

  it("converts a 200svh section into a pinned travel of half its scroll", () => {
    expect(pinnedTravelFactor(200)).toBe(2);
  });
});
