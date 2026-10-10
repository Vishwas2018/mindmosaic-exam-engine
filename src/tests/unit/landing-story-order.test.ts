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

  it("keeps Chapter 1's story clock windows ordered and inside 0..6", () => {
    const { crossfade, copyWipe, mosaic, desktopScrollHeightSvh } = cinematicMotion.chapter1;
    // The photograph cross-fade of segment k ends exactly when scene k+1 is fully in; the copy wipe finishes first.
    expect(crossfade.start + crossfade.span).toBeCloseTo(1, 10);
    expect(copyWipe.start + copyWipe.span).toBeLessThanOrEqual(crossfade.start + crossfade.span + 0.3);
    for (const window of [mosaic.sweep, mosaic.navFade, mosaic.release]) {
      expect(window.start).toBeGreaterThanOrEqual(5);
      expect(window.start + window.span).toBeLessThanOrEqual(6);
    }
    // The ivory release is the last thing to finish, so the stage unpins onto the page colour.
    expect(mosaic.release.start + mosaic.release.span).toBe(6);
    expect(mosaic.sweep.start).toBeLessThan(mosaic.navFade.start);
    expect(desktopScrollHeightSvh).toBeLessThan(cinematicMotion.chapter2.desktopScrollHeightSvh);
  });

  it("converts a 200svh section into a pinned travel of half its scroll", () => {
    expect(pinnedTravelFactor(200)).toBe(2);
  });
});
