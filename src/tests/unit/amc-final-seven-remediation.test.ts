import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { loadAmcReviewTargets } from "../../../scripts/lib/amc-review-sources.mjs";
import { amcPublishedQuestions } from "@/content/questions/generated/amc-index";
import { publishedExamBank } from "@/content/questions/practice-bank";
import { questionBank } from "@/content/questions/question-bank";
import { showcaseQuestions } from "@/content/questions/showcase-fixtures";
import {
  DEMO_MULTILINE_PROMPT,
  showcasePromptLayoutQuestions,
} from "@/content/questions/showcase-prompt-layout-fixtures";
import {
  buildPatternReadiness,
  getExamPattern,
  selectPatternQuestions,
} from "@/features/exam-engine/exam-patterns";
import type { AuthoringQuestion } from "@/features/exam-engine/types";
import type { Question } from "@/schemas/question.schema";

/**
 * Proposed revisions of two AMC questions, preview-only readiness of the seven
 * outstanding questions, and guards on the showcase fixtures. Nothing here
 * approves, publishes or serves anything: the revised wording is a NEW
 * revision that still needs fresh review and an owner decision, and the
 * previews are drafts built in memory.
 *
 * WHAT THE REVISION TESTS ESTABLISH, AND WHAT THEY DO NOT
 *
 * They establish that:
 *  - the keyed answer follows from arithmetic that is HARD-CODED in this file
 *    from the figures in the revision brief (4 x 8 shells less 5 + 7 + 10;
 *    every pair with 3x + 5y = 30), checked by exhaustive enumeration of
 *    those fixed inputs;
 *  - the revised prompt and explanation CONTAIN the phrases and figures the
 *    brief calls for (plain string presence);
 *  - identity, type, marks, label, time, options and key are preserved.
 *
 * They do NOT parse the prose, derive the figures from the wording, or prove
 * that the wording is unambiguous or that a reader would reach these
 * figures. Whether the wording is clear and age-appropriate rests on human
 * review. The repository's own answer solver is keyed by question id and
 * does not read the prompt either.
 */

const targets = await loadAmcReviewTargets();
const preview = (id: string): Question => {
  const target = targets.find((entry) => entry.question.id === id);
  if (!target) throw new Error(`Missing AMC draft ${id}`);
  return target.question;
};

describe("roadmap-amc-y3-014 (equal-sharing wording)", () => {
  const question = preview("roadmap-amc-y3-014");

  it("keeps its identity, type, marks, time, label and options", () => {
    expect(question.type).toBe("multiple_choice");
    expect(question.metadata.marks).toBe(4);
    expect(question.metadata.estimatedTimeSeconds).toBe(150);
    expect(question.metadata.difficulty).toBe("medium");
    expect(question.options.map((option) => option.text)).toEqual(["7", "11", "9", "10", "13"]);
    expect(question.answerKey).toEqual({ kind: "single_option", optionId: "d" });
  });

  it("no longer contains the words 'average' or 'mean' in the prompt or explanation", () => {
    const text = `${question.prompt} ${question.explanation}`.toLowerCase();
    expect(text).not.toMatch(/\baverage\b|\bmean\b/);
    expect(question.prompt).toContain("shared equally");
  });

  it("mentions the figures the brief calls for (string presence only)", () => {
    expect(question.prompt).toContain("four boxes");
    expect(question.prompt).toContain("8 shells");
    expect(question.prompt).toContain("5, 7 and 10");
  });

  it("has exactly one option matching the hard-coded arithmetic", () => {
    const boxes = 4;
    const eachWhenShared = 8;
    const known = [5, 7, 10];
    const total = boxes * eachWhenShared;
    const matching = question.options.filter(
      (option) => known.reduce((sum, value) => sum + value, 0) + Number(option.text) === total,
    );
    expect(matching.map((option) => option.id)).toEqual(["d"]);
    expect(question.explanation).toContain("32");
    expect(question.explanation).toContain("10 shells");
  });
});

describe("roadmap-amc-y5-028 (bags of counters wording)", () => {
  const question = preview("roadmap-amc-y5-028");

  it("keeps its identity, type, marks, time, label and key", () => {
    expect(question.type).toBe("number_entry");
    expect(question.metadata.marks).toBe(8);
    expect(question.metadata.estimatedTimeSeconds).toBe(180);
    expect(question.metadata.difficulty).toBe("challenging");
    expect(question.answerKey).toEqual({ kind: "number", value: 3, tolerance: 0 });
  });

  it("no longer contains the algebra notation", () => {
    expect(question.prompt).not.toMatch(/3a|5b|\bwhole-number solutions\b/);
  });

  it("mentions the rules the brief calls for (string presence only)", () => {
    for (const phrase of [
      "bags of 3",
      "bags of 5",
      "exactly 30 counters",
      "including none of one size",
      "identical",
      "order",
    ]) {
      expect(question.prompt).toContain(phrase);
    }
  });

  it("matches the keyed count when the hard-coded equation 3x + 5y = 30 is enumerated", () => {
    const combos: Array<[number, number]> = [];
    for (let threes = 0; threes <= 30; threes += 1) {
      for (let fives = 0; fives <= 30; fives += 1) {
        if (3 * threes + 5 * fives === 30) combos.push([threes, fives]);
      }
    }
    expect(combos).toEqual([[0, 6], [5, 3], [10, 0]]);
    expect(combos.length).toBe((question.answerKey as { value: number }).value);
    // Excluding "none of one size" would change the count, which is why the rule is in the brief.
    expect(combos.filter(([threes, fives]) => threes > 0 && fives > 0)).toHaveLength(1);
  });

  it("mentions each leftover count the explanation needs (string presence only)", () => {
    for (const leftOver of [25, 20, 10, 5]) {
      expect(leftOver % 3).not.toBe(0);
      expect(question.explanation).toContain(String(leftOver));
    }
  });
});

describe("the seven outstanding AMC questions, as previews only", () => {
  const SEVEN = [
    "roadmap-amc-y3-005",
    "roadmap-amc-y3-014",
    "roadmap-amc-y3-016",
    "roadmap-amc-y3-026",
    "roadmap-amc-y5-006",
    "roadmap-amc-y5-019",
    "roadmap-amc-y5-028",
  ];
  const byId = new Map<string, Question>();
  for (const question of amcPublishedQuestions) byId.set(question.id, question);
  for (const id of SEVEN) byId.set(id, preview(id));
  const bank = [...byId.values()] as readonly AuthoringQuestion[];

  it.each([
    ["amc-y3-middle-primary-full", 3],
    ["amc-y5-upper-primary-full", 5],
  ])("%s fills the 10/10/5/5 tier shape from the published questions plus the previews", (patternId, year) => {
    const pattern = getExamPattern(patternId)!;
    const readiness = buildPatternReadiness(bank, pattern);
    expect(readiness.state).toBe("ready");
    expect(readiness.sources.every((source) => source.satisfiable)).toBe(true);

    const draw = selectPatternQuestions(bank, pattern, "amc-final-seven");
    if (!draw.ok) throw new Error("expected a full draw");
    expect(draw.reduced).toBe(false);
    expect(draw.questions).toHaveLength(30);
    expect(new Set(draw.questions.map((question) => question.id)).size).toBe(30);
    expect(draw.questions.every((question) => question.yearLevel === year)).toBe(true);

    const tiers = new Map<string, number>();
    for (const question of draw.questions) {
      const tier = question.type === "number_entry" ? "T4" : `T${question.metadata.marks - 2}`;
      tiers.set(tier, (tiers.get(tier) ?? 0) + 1);
    }
    expect(Object.fromEntries(tiers)).toEqual({ T1: 10, T2: 10, T3: 5, T4: 5 });
  });

  it("every one of the seven is needed: dropping any one leaves its paper short", () => {
    for (const id of SEVEN) {
      const without = bank.filter((question) => question.id !== id);
      const year = id.includes("-y3-") ? 3 : 5;
      const pattern = getExamPattern(year === 3 ? "amc-y3-middle-primary-full" : "amc-y5-upper-primary-full")!;
      expect(buildPatternReadiness(without, pattern).state, id).toBe("short");
    }
  });
});

describe("showcase fixtures never carry real or unpublished question content", () => {
  /** Every runtime showcase fixture, which the showcase page compiles into a public static chunk. */
  const runtimeFixtures: readonly Question[] = [...showcaseQuestions, ...showcasePromptLayoutQuestions];
  const everyString = (question: Question): string[] => [
    question.prompt,
    question.explanation ?? "",
    ...("options" in question && Array.isArray(question.options)
      ? question.options.map((option: { text: string }) => option.text)
      : []),
  ];

  it("the prompt-layout fixtures are labelled synthetic demonstration content", () => {
    expect(DEMO_MULTILINE_PROMPT.startsWith("Demonstration only")).toBe(true);
    for (const question of showcasePromptLayoutQuestions) {
      expect(question.id.startsWith("showcase-demo-"), question.id).toBe(true);
      expect(question.metadata.tags).toContain("demonstration");
      expect(question.explanation).toContain("Demonstration fixture");
    }
  });

  it("no runtime showcase fixture contains the unpublished roadmap-amc-y5-019 stem or its options", () => {
    const y5019 = preview("roadmap-amc-y5-019");
    const options = (y5019 as { options: Array<{ text: string }> }).options.map((option) => option.text);
    for (const fixture of runtimeFixtures) {
      expect(fixture.id.startsWith("roadmap-"), fixture.id).toBe(false);
      for (const text of everyString(fixture)) {
        expect(text, fixture.id).not.toContain(y5019.prompt);
        expect(text, fixture.id).not.toContain("Chen does not choose grape");
        expect(text, fixture.id).not.toContain("Five friends");
      }
      const texts = (fixture as { options?: Array<{ text: string }> }).options?.map((option) => option.text) ?? [];
      expect(texts.join("|"), fixture.id).not.toBe(options.join("|"));
    }
  });

  it("no runtime showcase fixture reproduces any AMC draft prompt", () => {
    const draftPrompts = targets.map((target) => target.question.prompt);
    for (const fixture of runtimeFixtures) {
      for (const text of everyString(fixture)) {
        for (const draft of draftPrompts) expect(text, fixture.id).not.toContain(draft);
      }
    }
  });

  it("the demonstration fixtures are not in any real examination bank", () => {
    const realIds = new Set([...questionBank, ...publishedExamBank].map((question) => question.id));
    for (const question of showcasePromptLayoutQuestions) expect(realIds.has(question.id), question.id).toBe(false);
  });

  it("only the showcase page imports the demonstration fixtures", () => {
    const root = path.join(process.cwd(), "src");
    const importers: string[] = [];
    const walk = (directory: string): void => {
      for (const name of readdirSync(directory)) {
        const full = path.join(directory, name);
        if (statSync(full).isDirectory()) {
          if (name !== "tests" && name !== "node_modules") walk(full);
        } else if (/\.(ts|tsx)$/.test(name) && readFileSync(full, "utf8").includes("showcase-prompt-layout-fixtures")) {
          importers.push(path.relative(process.cwd(), full).split(path.sep).join("/"));
        }
      }
    };
    walk(root);
    expect(importers).toEqual(["src/app/showcase/page.tsx"]);
  });
});
