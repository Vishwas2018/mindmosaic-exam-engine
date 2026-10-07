import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { chapter2Scenes } from "@/features/landing/chapter2-scenes";
import { cinematicMotion, pinnedTravelFactor } from "@/features/landing/cinematic/config";
import {
  activeLayer,
  chapter2LayerStarts,
  layerAnchor,
  layerEnter,
  layerExit,
  layerForegroundOpacity,
  layerLocal,
  layerOpacity,
} from "@/features/landing/cinematic/sceneProgress";
import { programmes } from "@/features/landing/content";
import { landingMedia, resolveSlotSrc } from "@/features/landing/media";

const timing = cinematicMotion.chapter2;
const MEDIA_ROOT = join(process.cwd(), "public/landing/media/chapter-02-programs");

describe("Chapter 2 scene data", () => {
  it("tells the six programmes in exactly the agreed order", () => {
    expect(chapter2Scenes.map((scene) => scene.id)).toEqual([
      "naplan",
      "icas",
      "curriculum",
      "amc",
      "singapore",
      "selective",
    ]);
    expect(chapter2Scenes.map((scene) => scene.number)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("shows NAPLAN and ICAS as Available, Curriculum as Limited, and the rest as In development", () => {
    const status = Object.fromEntries(chapter2Scenes.map((scene) => [scene.id, scene.status]));
    expect(status).toEqual({
      naplan: "Available",
      icas: "Available",
      curriculum: "Limited",
      amc: "In development",
      singapore: "In development",
      selective: "In development",
    });
    expect(chapter2Scenes[0]!.statusLine).toBe("Available now · Years 3 & 5");
    expect(chapter2Scenes[1]!.statusLine).toBe("Available now · Years 3 & 5");
    expect(chapter2Scenes[2]!.statusLine).toBe("Limited · Years 3 & 5");
    for (const scene of chapter2Scenes.slice(3)) expect(scene.statusLine).toBe("In development");
  });

  it("describes Curriculum as live lessons with incomplete coverage, never as a complete programme", () => {
    const curriculum = chapter2Scenes[2]!;
    expect(curriculum.statusTone).toBe("limited");
    expect(curriculum.note).toBe(
      "Published Maths and English lessons are available to signed-in students in Years 3 and 5. Broader curriculum coverage and exact mapping are still being developed.",
    );
    expect(curriculum.cta.href).toBe("/learn");
    expect(curriculum.cta.label).toBe("Explore learning");
    expect(curriculum.statusLine).not.toMatch(/available/i);
  });

  it("derives every status from the canonical programme data, never its own copy", () => {
    for (const scene of chapter2Scenes) {
      const canonical = programmes.items.find((item) => item.id === scene.programmeId);
      expect(canonical, scene.programmeId).toBeDefined();
      const expected = {
        available: ["Available", "available"],
        limited: ["Limited", "limited"],
        in_development: ["In development", "in-development"],
      }[canonical!.status];
      expect([scene.status, scene.statusTone]).toEqual(expected);
    }
  });

  it("never claims availability for an in-development scene", () => {
    for (const scene of chapter2Scenes.filter((candidate) => candidate.status !== "Available")) {
      const text = [scene.heading, scene.proposition, scene.statusLine, scene.note ?? "", ...scene.facts].join(" ");
      expect(text, scene.id).not.toMatch(/available now|open now|start practising|sign up now/i);
    }
  });

  it("keeps scholarships a planned direction and notes that eligibility varies", () => {
    const selective = chapter2Scenes[5]!;
    expect(selective.heading).toBe("Selective & scholarship preparation");
    expect(selective.note).toMatch(/vary by state and programme/i);
    expect(selective.note).toMatch(/scholarship.*planned.*not open/i);
  });

  it("gives every scene 2 to 4 facts and a destination", () => {
    for (const scene of chapter2Scenes) {
      expect(scene.facts.length).toBeGreaterThanOrEqual(2);
      expect(scene.facts.length).toBeLessThanOrEqual(4);
      expect(scene.cta.href.startsWith("/")).toBe(true);
    }
  });

  it("uses photography for all six programme scenes", () => {
    expect(chapter2Scenes.filter((scene) => scene.mediaSlot).map((scene) => scene.id)).toEqual([
      "naplan",
      "icas",
      "curriculum",
      "amc",
      "singapore",
      "selective",
    ]);
  });
});

describe("Chapter 2 media registry", () => {
  const slots = Object.entries(landingMedia.chapter2);

  it("has one registry slot per photographic scene, each active", () => {
    expect(slots.map(([key]) => key).sort()).toEqual([
      "amc",
      "curriculum",
      "icas",
      "naplan",
      "selective",
      "singapore",
    ]);
    for (const [, { primary }] of slots) expect(primary.selection).toBe("active");
  });

  it("points every slot at an existing file in its programme folder, with the documented name", () => {
    const expected = {
      naplan: "/landing/media/chapter-02-programs/naplan/ch02-naplan-primary-v1.webp",
      icas: "/landing/media/chapter-02-programs/icas/ch02-icas-primary-v1.webp",
      curriculum: "/landing/media/chapter-02-programs/curriculum/ch02-curriculum-primary-v1.webp",
      amc: "/landing/media/chapter-02-programs/amc/ch02-amc-primary-v1.webp",
      singapore: "/landing/media/chapter-02-programs/singapore-maths/ch02-singapore-primary-v1.webp",
      selective: "/landing/media/chapter-02-programs/selective-scholarships/ch02-selective-primary-v1.webp",
    } as const;
    for (const [key, { primary }] of slots) {
      const src = resolveSlotSrc(primary);
      expect(src).toBe(expected[key as keyof typeof expected]);
      expect(existsSync(join(process.cwd(), "public", src)), src).toBe(true);
    }
  });

  it("has a folder for every programme scene", () => {
    expect(readdirSync(MEDIA_ROOT).sort()).toEqual([
      "amc",
      "curriculum",
      "icas",
      "naplan",
      "selective-scholarships",
      "singapore-maths",
    ]);
  });

  it("marks all six assets as interim until production renders exist", () => {
    for (const [key, { primary }] of slots) expect(primary.assetStatus, key).toBe("interim");
  });

  it("is decorative with an empty alt, face-free, and uses a real motion preset", () => {
    for (const [key, { primary }] of slots) {
      expect(primary.decorative, key).toBe(true);
      expect(primary.alt, key).toBe("");
      expect(primary.treatment, key).not.toBe("face-visible");
      expect(Object.keys(cinematicMotion.presets)).toContain(primary.motionPreset);
      const preset = cinematicMotion.presets[primary.motionPreset];
      expect(Math.max(preset.fromScale, preset.settledScale, preset.handoffScale)).toBeLessThanOrEqual(1.04);
    }
  });

  it("keeps physical image paths out of the Chapter 2 components", () => {
    for (const file of [
      "components/ChapterTwoPrograms.tsx",
      "components/ProgramScene.tsx",
      "components/ProgramSceneProgress.tsx",
      "components/chapter-two-visuals.tsx",
      "chapter2-scenes.ts",
    ]) {
      const source = readFileSync(join(process.cwd(), "src/features/landing", file), "utf8");
      expect(source, file).not.toMatch(/\.(webp|png|jpe?g)\b|\/landing\/media|\/photos\//);
    }
  });

  it("never lets a file name leak an answer or a logo", () => {
    for (const [, { primary }] of slots) {
      expect(resolveSlotSrc(primary)).not.toMatch(/answer|logo/i);
    }
  });
});

describe("Chapter 2 cinematic config", () => {
  const starts = chapter2LayerStarts;

  it("keeps layer starts strictly increasing from 0 and inside 0..1 (intro, 6 scenes, hand-off)", () => {
    expect(starts).toHaveLength(8);
    expect(starts[0]).toBe(0);
    for (let i = 1; i < starts.length; i += 1) expect(starts[i]!).toBeGreaterThan(starts[i - 1]!);
    expect(starts[starts.length - 1]!).toBeLessThan(1);
  });

  it("keeps cross-fades from overlapping each other", () => {
    for (let i = 1; i < starts.length - 1; i += 1) {
      expect(starts[i + 1]! - starts[i]!).toBeGreaterThan(timing.crossfade);
    }
  });

  it("scrolls 650 to 700svh and converts that into a pinned travel factor", () => {
    expect(timing.desktopScrollHeightSvh).toBeGreaterThanOrEqual(650);
    expect(timing.desktopScrollHeightSvh).toBeLessThanOrEqual(700);
    expect(pinnedTravelFactor(timing.desktopScrollHeightSvh)).toBeGreaterThan(1);
  });

  it("keeps windows ordered and the product scale below 1", () => {
    for (const range of [timing.photoSettle, timing.photoHandoff, timing.build, timing.productScale.window]) {
      expect(range.start).toBeGreaterThanOrEqual(0);
      expect(range.end).toBeLessThanOrEqual(1);
      expect(range.start).toBeLessThan(range.end);
    }
    expect(timing.photoSettle.end).toBeLessThanOrEqual(timing.photoHandoff.start);
    expect(timing.productScale.from).toBeGreaterThanOrEqual(0.95);
    expect(timing.productScale.from).toBeLessThan(1);
  });
});

describe("scene progress maths", () => {
  const starts = chapter2LayerStarts;
  const fade = timing.crossfade;

  it("starts on the intro and ends on the hand-off", () => {
    expect(activeLayer(0, starts)).toBe(0);
    expect(activeLayer(0.3, starts)).toBe(2);
    expect(activeLayer(1, starts)).toBe(7);
    expect(layerOpacity(0, starts, 0, fade)).toBe(1);
    expect(layerOpacity(1, starts, 7, fade)).toBe(1);
  });

  it("never shows a blank frame: neighbours cross-fade so combined opacity stays near 1", () => {
    for (let q = 0; q <= 1; q += 0.005) {
      const total = starts.reduce((sum, _start, index) => sum + layerOpacity(q, starts, index, fade), 0);
      expect(total, `q=${q.toFixed(3)}`).toBeGreaterThan(0.45);
      expect(total, `q=${q.toFixed(3)}`).toBeLessThan(1.55);
    }
  });

  it("makes text and product UI take turns across a cross-fade, never overlapping or garbling", () => {
    for (let index = 0; index < starts.length - 1; index += 1) {
      for (let q = 0; q <= 1; q += 0.002) {
        const leaving = layerForegroundOpacity(q, starts, index, fade);
        const entering = layerForegroundOpacity(q, starts, index + 1, fade);
        expect(Math.min(leaving, entering), `layers ${index}/${index + 1} at q=${q.toFixed(3)}`).toBe(0);
      }
    }
    expect(layerForegroundOpacity(layerAnchor(starts, 3), starts, 3, fade)).toBe(1);
    expect(layerForegroundOpacity(0, starts, 0, fade)).toBe(1);
    expect(layerForegroundOpacity(1, starts, 7, fade)).toBe(1);
  });

  it("holds each scene fully visible away from the boundaries", () => {
    for (let index = 1; index <= 6; index += 1) {
      expect(layerOpacity(layerAnchor(starts, index), starts, index, fade)).toBe(1);
    }
  });

  it("enters and exits cleanly and reports local progress 0..1", () => {
    expect(layerEnter(starts[2]! - fade, starts, 2, fade)).toBe(0);
    expect(layerExit(starts[3]! + fade, starts, 2, fade)).toBe(1);
    expect(layerLocal(starts[2]!, starts, 2)).toBe(0);
    expect(layerLocal(starts[3]!, starts, 2)).toBe(1);
  });
});
