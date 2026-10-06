import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { DRILL_QUESTION_COUNT } from "@/features/exam-engine/recommendation/build-drill";
import {
  chapter3Scenes,
  chapterThree,
  correctSampleOption,
  journeySamples,
  selectedSampleOption,
} from "@/features/landing/chapter3-journey";
import { cinematicMotion, pinnedTravelFactor } from "@/features/landing/cinematic/config";
import {
  chapter2LayerStarts,
  chapter3LayerStarts,
  layerForegroundOpacity,
  orderedLayerStarts,
  spanForegroundOpacity,
} from "@/features/landing/cinematic/sceneProgress";
import {
  EVERY_TEST_PROMISE,
  PARENT_LAUNCHES_DRILL,
  PROHIBITED_PRODUCT_CLAIMS,
  TEN_QUESTION_DRILL,
} from "@/features/landing/copy-guards";
import { learningDemo, respondsToStudent, sections } from "@/features/landing/content";
import { landingMedia } from "@/features/landing/media";

const timing = cinematicMotion.chapter3;
const starts = chapter3LayerStarts;
const read = (file: string) => readFileSync(join(process.cwd(), "src", file), "utf8");

describe("home page composition", () => {
  it("puts Chapter 3 after Chapter 2 and ForParents after Chapter 3", () => {
    const keys = sections.filter((section) => section.enabled).map((section) => section.key);
    expect(keys.indexOf("chapterThree")).toBe(keys.indexOf("chapterTwo") + 1);
    expect(keys.indexOf("forParents")).toBe(keys.indexOf("chapterThree") + 1);
  });

  it("no longer composes LearningDemo, ProductTour or RespondsToStudent on the home page", () => {
    const keys = sections.map((section) => section.key) as string[];
    for (const gone of ["learningDemo", "productTour", "respondsToStudent"]) expect(keys).not.toContain(gone);
    const page = read("app/page.tsx");
    for (const name of ["LearningDemo", "ProductTour", "RespondsToStudent"]) expect(page).not.toContain(name);
    expect(page).toContain("ChapterThreeHowItWorks");
  });
});

describe("Chapter 3 story", () => {
  it("runs Learn, Practise, Understand, Next in order", () => {
    expect(chapter3Scenes.map((scene) => scene.id)).toEqual(["learn", "practise", "understand", "next"]);
    expect(chapter3Scenes.map((scene) => scene.number)).toEqual([1, 2, 3, 4]);
    expect(chapter3Scenes.map((scene) => scene.navLabel)).toEqual(["Learn", "Practise", "Understand", "Next"]);
  });

  it("uses the agreed chapter heading, distinct from the Chapter 2 hand-off", () => {
    expect(chapterThree.eyebrow).toBe("How it works");
    expect(chapterThree.heading).toBe("One concept. Four connected steps.");
    expect(chapterThree.heading).not.toBe("See how MindMosaic works.");
  });

  it("uses the agreed scene headings and propositions", () => {
    expect(chapter3Scenes.map((scene) => [scene.heading, scene.proposition])).toEqual([
      ["Learn the concept.", "Start with understanding."],
      ["Practise it.", "Try the idea for yourself."],
      ["Understand the mistake.", "A wrong answer should explain something."],
      ["Know what to work on next.", "Results can turn missed skills into a focused next step."],
    ]);
  });
});

describe("demo continuity: one source, one question", () => {
  it("draws every sample from the approved landing content, not a copy of it", () => {
    expect(journeySamples.lesson).toBe(learningDemo.learnDemo);
    expect(journeySamples.practice).toBe(learningDemo.practiseDemo);
    expect(journeySamples.results).toBe(respondsToStudent.sample);
  });

  it("has Practise and Understand share the same question, with the wrong answer picked", () => {
    const practise = chapter3Scenes[1]!;
    const understand = chapter3Scenes[2]!;
    expect(practise.state).toBe("question-select");
    expect(understand.state).toBe("question-review");
    expect(journeySamples.practice.question).toBe("What fraction of the bar is shaded?");
    expect(selectedSampleOption()).toMatchObject({ key: "A", label: "3/5", correct: false });
    expect(correctSampleOption()).toMatchObject({ key: "B", label: "3/8", correct: true });
  });

  it("takes the worked explanation from the approved practice sample", () => {
    expect(journeySamples.practice.explanationSteps).toHaveLength(3);
    expect(journeySamples.practice.explanationSteps[2]).toContain("⅜");
  });
});

describe("Next-step product truth", () => {
  const publicCopy = [
    chapterThree.heading,
    chapterThree.intro,
    chapterThree.handoff.heading,
    chapterThree.handoff.body,
    ...chapter3Scenes.flatMap((scene) => [scene.heading, scene.proposition, scene.body, scene.note ?? "", ...scene.facts]),
  ].join("\n");
  const next = chapter3Scenes[3]!;

  it("describes recommendations as conditional, five-question and fixed-rule", () => {
    expect(next.body).toMatch(/After an eligible test/);
    expect(next.body).toMatch(/\bcan\b/);
    expect(next.body).toMatch(/five-question practice set/);
    expect(next.body).toMatch(/when enough suitable published questions are available/);
    expect(next.note).toBe("Suggestions follow fixed rules applied to the student's answers.");
    expect(next.facts.join(" ")).toMatch(/Up to three suggestions/);
    expect(next.facts.join(" ")).toMatch(/Objective questions only/);
  });

  it("agrees with the recommendation engine's drill size", () => {
    expect(DRILL_QUESTION_COUNT).toBe(5);
    expect(journeySamples.results.nextSet).toMatch(new RegExp(`^${DRILL_QUESTION_COUNT} questions`));
    expect(journeySamples.results.badge).toBe("Sample");
  });

  it("makes no AI, adaptive, tutor, every-test or ten-question claim", () => {
    expect(publicCopy).not.toMatch(PROHIBITED_PRODUCT_CLAIMS);
    expect(publicCopy).not.toMatch(EVERY_TEST_PROMISE);
    expect(publicCopy).not.toMatch(TEN_QUESTION_DRILL);
    expect(publicCopy).not.toMatch(/\btutor(?:s|ing)?\b|personalis|mastery|automatic(?:ally)?|every (?:wrong answer|result|practice)/i);
  });

  it("does not let the parent hand-off launch the student's drill or claim a recommendation for everyone", () => {
    const handoff = `${chapterThree.handoff.heading} ${chapterThree.handoff.body}`;
    expect(handoff).not.toMatch(PARENT_LAUNCHES_DRILL);
    expect(handoff).not.toMatch(/drill|practice set|recommend|launch/i);
    expect(next.body).not.toMatch(/\balways\b|\bevery\b/i);
  });
});

describe("Chapter 3 is DOM/SVG only", () => {
  const files = [
    "chapter3-journey.ts",
    "components/ChapterThreeHowItWorks.tsx",
    "components/JourneyScene.tsx",
    "components/chapter-three-visuals.tsx",
    "components/ChapterSceneProgress.tsx",
    "cinematic/useChapterScroll.ts",
  ];

  it("has no media-registry slot and no image, canvas or video in its components", () => {
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

  it("renders nothing interactive inside the sample product", () => {
    const source = read("features/landing/components/chapter-three-visuals.tsx");
    expect(source).not.toMatch(/<button|<a\b|onClick|tabIndex|<input|<select/);
  });
});

describe("Chapter 3 cinematic config", () => {
  it("starts from the agreed timeline and a 500svh stage", () => {
    expect(timing.desktopScrollHeightSvh).toBe(500);
    expect(timing.layerStarts).toEqual({ intro: 0, learn: 0.08, practise: 0.29, understand: 0.5, next: 0.71, handoff: 0.94 });
    expect(pinnedTravelFactor(timing.desktopScrollHeightSvh)).toBe(1.25);
  });

  it("keeps layer starts increasing and cross-fades from overlapping", () => {
    expect(starts).toHaveLength(6);
    for (let i = 1; i < starts.length; i += 1) expect(starts[i]!).toBeGreaterThan(starts[i - 1]!);
    for (let i = 1; i < starts.length - 1; i += 1) expect(starts[i + 1]! - starts[i]!).toBeGreaterThan(timing.crossfade);
  });

  it("keeps product windows ordered inside 0..1 and the shell scale gentle", () => {
    for (const range of [timing.lessonBuild, timing.questionAppear, timing.review, timing.resultsBuild, timing.shellScale.window]) {
      expect(range.start).toBeGreaterThanOrEqual(0);
      expect(range.end).toBeLessThanOrEqual(1);
      expect(range.start).toBeLessThan(range.end);
    }
    expect(timing.shellScale.from).toBeGreaterThanOrEqual(0.95);
    expect(timing.shellScale.from).toBeLessThan(1);
  });

  it("generalises layer starts without changing Chapter 2's", () => {
    expect(orderedLayerStarts(cinematicMotion.chapter2.layerStarts)).toEqual(chapter2LayerStarts);
    expect(chapter2LayerStarts).toHaveLength(8);
  });
});

describe("Chapter 3 transitions", () => {
  const cf = timing.crossfade;
  const sweep = (fn: (q: number) => void) => {
    for (let q = 0; q <= 1; q += 0.002) fn(q);
  };

  it("never lets two scenes' copy be readable at once", () => {
    sweep((q) => {
      for (let layer = 0; layer < starts.length - 1; layer += 1) {
        const a = layerForegroundOpacity(q, starts, layer, cf);
        const b = layerForegroundOpacity(q, starts, layer + 1, cf);
        expect(Math.min(a, b), `copy ${layer}/${layer + 1} at ${q.toFixed(3)}`).toBe(0);
      }
    });
  });

  it("never shows two product states at once", () => {
    sweep((q) => {
      const lesson = spanForegroundOpacity(q, starts, 1, 1, cf);
      const question = spanForegroundOpacity(q, starts, 2, 3, cf);
      const results = spanForegroundOpacity(q, starts, 4, 4, cf);
      expect(Math.min(lesson, question), `lesson/question ${q.toFixed(3)}`).toBe(0);
      expect(Math.min(question, results), `question/results ${q.toFixed(3)}`).toBe(0);
      expect(Math.min(lesson, results)).toBe(0);
    });
  });

  it("keeps the same question on screen, fully visible, across Practise to Understand", () => {
    const boundary = starts[3]!;
    for (let q = boundary - cf; q <= boundary + cf; q += 0.001) {
      expect(spanForegroundOpacity(q, starts, 2, 3, cf), `q=${q.toFixed(3)}`).toBe(1);
    }
  });

  it("keeps the outer product frame fully present from Learn to Next, so scene changes never blank the stage", () => {
    for (let q = starts[1]! + cf; q <= starts[5]! - cf; q += 0.002) {
      expect(spanForegroundOpacity(q, starts, 1, 4, cf), `q=${q.toFixed(3)}`).toBe(1);
    }
  });
});
