import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  performanceBand,
  PERFORMANCE_BAND_LABELS,
} from "@/features/parent-dashboard/performance-band";
import {
  chapter4Sample,
  chapter4Scenes,
  chapterFour,
  toPercent,
} from "@/features/landing/chapter4-progress";
import {
  bandBadgeStyle,
  bandBarBgClass,
  bandToneClass,
} from "@/features/landing/components/chapter-four-visuals";
import { cinematicMotion, pinnedTravelFactor } from "@/features/landing/cinematic/config";
import {
  chapter4LayerStarts,
  layerForegroundOpacity,
} from "@/features/landing/cinematic/sceneProgress";
import {
  EVERY_TEST_PROMISE,
  PARENT_LAUNCHES_DRILL,
  PROHIBITED_PRODUCT_CLAIMS,
  TEN_QUESTION_DRILL,
} from "@/features/landing/copy-guards";
import { forParents, sections } from "@/features/landing/content";
import { landingMedia } from "@/features/landing/media";

const timing = cinematicMotion.chapter4;
const starts = chapter4LayerStarts;
const read = (file: string) => readFileSync(join(process.cwd(), "src", file), "utf8");

describe("home page composition: Chapter 4", () => {
  it("puts Chapter 4 after Chapter 3 and qualityBand after Chapter 4", () => {
    const keys = sections.filter((section) => section.enabled).map((section) => section.key);
    expect(keys.indexOf("chapterFour")).toBe(keys.indexOf("chapterThree") + 1);
    expect(keys.indexOf("qualityBand")).toBe(keys.indexOf("chapterFour") + 1);
    expect(keys.indexOf("trustAndCare")).toBe(keys.indexOf("qualityBand") + 1);
  });

  it("no longer composes ForParents on the home page", () => {
    const enabledKeys = sections.filter((section) => section.enabled).map((section) => section.key);
    expect(enabledKeys).not.toContain("forParents");
    const page = read("app/page.tsx");
    expect(page).toContain("ChapterFourProgressParents");
  });
});

describe("Chapter 4 story structure", () => {
  it("runs Latest, Subjects, Parent view in exact order", () => {
    expect(chapter4Scenes.map((scene) => scene.id)).toEqual(["latest", "subjects", "parent"]);
    expect(chapter4Scenes.map((scene) => scene.number)).toEqual([1, 2, 3]);
    expect(chapter4Scenes.map((scene) => scene.navLabel)).toEqual(["Latest", "Subjects", "Parent view"]);
  });

  it("uses the agreed chapter heading and eyebrow", () => {
    expect(chapterFour.eyebrow).toBe("Progress & parents");
    expect(chapterFour.heading).toBe("Progress that stays understandable.");
  });

  it("uses the agreed scene headings and propositions", () => {
    expect(chapter4Scenes.map((scene) => [scene.heading, scene.proposition])).toEqual([
      ["See what happened.", "A result is more useful when it has context."],
      ["See the pattern.", "One result matters less than the pattern across subjects."],
      ["See the bigger picture.", "Recent work comes together in one read-only parent view."],
    ]);
  });
});

describe("sample integrity and derivation from forParents.summary", () => {
  it("derives all sample metrics directly from forParents.summary without hardcoding", () => {
    expect(chapter4Sample.studentName).toBe(forParents.summary.name);
    expect(chapter4Sample.badge).toBe(forParents.summary.badge);
    expect(chapter4Sample.dateRange).toBe(forParents.summary.dateRange);
    expect(chapter4Sample.week).toEqual(forParents.summary.week);
  });

  it("derives latest session as ICAS-style Reading 8/10 (80%)", () => {
    const latest = chapter4Sample.latestSession;
    expect(latest.label).toContain("Reading");
    expect(latest.count).toBe(8);
    expect(latest.total).toBe(10);
    expect(latest.percentage).toBe(80);
    expect(latest.percentage).toBe(toPercent(8, 10));
    expect(latest.when).toBe("Thu");
  });

  it("derives subject percentages accurately: Reading 80, Numeracy 70, Language conventions 60", () => {
    const subjectsMap = Object.fromEntries(
      chapter4Sample.subjects.map((s) => [s.subject, s.percentage]),
    );
    expect(subjectsMap["reading"]).toBe(80);
    expect(subjectsMap["numeracy"]).toBe(70);
    expect(subjectsMap["language_conventions"]).toBe(60);

    expect(toPercent(8, 10)).toBe(80);
    expect(toPercent(14, 20)).toBe(70);
    expect(toPercent(9, 15)).toBe(60);
  });

  it("matches canonical performance bands across all four tiers", () => {
    expect(performanceBand(80)).toBe("strong");
    expect(PERFORMANCE_BAND_LABELS["strong"]).toBe("Strong");

    expect(performanceBand(70)).toBe("good");
    expect(PERFORMANCE_BAND_LABELS["good"]).toBe("Good");

    expect(performanceBand(60)).toBe("building");
    expect(PERFORMANCE_BAND_LABELS["building"]).toBe("Building");

    expect(performanceBand(49)).toBe("focus");
    expect(performanceBand(35)).toBe("focus");
    expect(PERFORMANCE_BAND_LABELS["focus"]).toBe("Needs practice");
  });

  it("maps each performance band to its semantic design tokens", () => {
    // Tone classes (for score rings and text)
    expect(bandToneClass("strong")).toBe("text-success");
    expect(bandToneClass("good")).toBe("text-primary");
    expect(bandToneClass("building")).toBe("text-warning");
    expect(bandToneClass("focus")).toBe("text-error");

    // Bar background classes (for progress bars)
    expect(bandBarBgClass("strong")).toBe("bg-success");
    expect(bandBarBgClass("good")).toBe("bg-primary");
    expect(bandBarBgClass("building")).toBe("bg-warning");
    expect(bandBarBgClass("focus")).toBe("bg-error");

    // Badge styling (for band badges)
    expect(bandBadgeStyle("strong")).toContain("text-success");
    expect(bandBadgeStyle("good")).toContain("text-primary");
    expect(bandBadgeStyle("building")).toContain("text-warning");
    expect(bandBadgeStyle("focus")).toContain("text-error");
    expect(bandBadgeStyle("focus")).toContain("bg-error/10");
  });

  it("derives band labels directly from the canonical registry", () => {
    for (const sub of chapter4Sample.subjects) {
      expect(sub.bandLabel).toBe(PERFORMANCE_BAND_LABELS[sub.band]);
    }
  });
});

describe("product truth safeguards", () => {
  const publicCopy = [
    chapterFour.heading,
    chapterFour.intro,
    chapterFour.handoff.heading,
    chapterFour.handoff.body,
    ...chapter4Scenes.flatMap((s) => [s.heading, s.proposition, s.body, ...s.facts]),
  ].join("\n");

  it("states parent view is read-only", () => {
    expect(chapterFour.readOnlyBadge).toContain("Read only");
    expect(chapter4Scenes[2]!.facts).toContain("Read-only view preserving student records");
  });

  it("never promises parent launches drill", () => {
    expect(publicCopy).not.toMatch(PARENT_LAUNCHES_DRILL);
    expect(publicCopy).not.toMatch(/launch drill|start drill|parent drill/i);
  });

  it("makes no prohibited product claims (AI, adaptive, live Family plan, etc.)", () => {
    expect(publicCopy).not.toMatch(PROHIBITED_PRODUCT_CLAIMS);
    expect(publicCopy).not.toMatch(EVERY_TEST_PROMISE);
    expect(publicCopy).not.toMatch(TEN_QUESTION_DRILL);
  });

  it("never includes placeholder May testing cycle or fake checkpoints", () => {
    expect(publicCopy).not.toMatch(/May testing cycle|testing cycle|checkpoint/i);
  });

  it("never presents premium LearningInsights or readiness score as live", () => {
    expect(publicCopy).not.toMatch(/readiness score|recommended next actions/i);
  });
});

describe("Chapter 4 is DOM/SVG only", () => {
  const files = [
    "chapter4-progress.ts",
    "components/ChapterFourProgressParents.tsx",
    "components/ProgressScene.tsx",
    "components/chapter-four-visuals.tsx",
  ];

  it("has no media-registry slots and no image, canvas or video in its components", () => {
    expect(Object.keys(landingMedia)).toEqual(["chapter1", "chapter2"]);
    for (const file of files) {
      const source = read(`features/landing/${file}`);
      expect(source, file).not.toMatch(/next\/image|<img|<canvas|<video|\.(webp|png|jpe?g|svg)\b|\/landing\/media/i);
    }
  });

  it("holds no hard-coded colour values, only design tokens", () => {
    for (const file of files) {
      const source = read(`features/landing/${file}`);
      expect(source, file).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/);
    }
  });

  it("renders non-interactive sample UI (no buttons or form inputs)", () => {
    const source = read("features/landing/components/chapter-four-visuals.tsx");
    expect(source).not.toMatch(/<button|<input|<select|onClick|tabIndex/);
  });

  it("never duplicates numeric threshold percentages (80, 65, 50) in visual components", () => {
    const source = read("features/landing/components/chapter-four-visuals.tsx");
    // Verify that thresholds like percentage >= 80 or >= 65 are not in the visuals component
    expect(source).not.toMatch(/>=\s*(?:80|65|50)/);
    // Verify no shortcut ternary labels like band === 'strong' ? 'Strong'
    expect(source).not.toMatch(/band\s*===\s*["']strong["']\s*\?\s*["']Strong["']/);
  });
});

describe("Chapter 4 cinematic config and timing", () => {
  it("uses 400svh desktop scroll height with valid layer starts", () => {
    expect(timing.desktopScrollHeightSvh).toBe(400);
    expect(timing.layerStarts).toEqual({
      intro: 0,
      latest: 0.1,
      subjects: 0.37,
      parent: 0.64,
      handoff: 0.93,
    });
    expect(pinnedTravelFactor(timing.desktopScrollHeightSvh)).toBe(400 / 300);
  });

  it("keeps layer starts increasing and non-overlapping", () => {
    expect(starts).toHaveLength(5);
    for (let i = 1; i < starts.length; i += 1) {
      expect(starts[i]!).toBeGreaterThan(starts[i - 1]!);
    }
    for (let i = 1; i < starts.length - 1; i += 1) {
      expect(starts[i + 1]! - starts[i]!).toBeGreaterThan(timing.crossfade);
    }
  });

  it("never lets adjacent foreground copies overlap readably", () => {
    for (let p = 0; p <= 1; p += 0.005) {
      for (let layer = 0; layer < starts.length - 1; layer += 1) {
        const opCurrent = layerForegroundOpacity(p, starts, layer, timing.crossfade);
        const opNext = layerForegroundOpacity(p, starts, layer + 1, timing.crossfade);
        expect(opCurrent * opNext).toBeLessThan(0.01);
      }
    }
  });
});
