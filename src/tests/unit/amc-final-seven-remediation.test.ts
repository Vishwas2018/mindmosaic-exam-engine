import { describe, expect, it } from "vitest";

import { loadAmcReviewTargets } from "../../../scripts/lib/amc-review-sources.mjs";
import { amcPublishedQuestions } from "@/content/questions/generated/amc-index";
import { MULTILINE_PROMPT } from "@/content/questions/showcase-prompt-layout-fixtures";
import {
  buildPatternReadiness,
  getExamPattern,
  selectPatternQuestions,
} from "@/features/exam-engine/exam-patterns";
import type { AuthoringQuestion } from "@/features/exam-engine/types";
import type { Question } from "@/schemas/question.schema";

/**
 * Proposed revisions of two AMC questions, and the preview-only readiness of
 * the seven outstanding questions. Nothing here approves, publishes or serves
 * anything: the revised wording is a NEW revision that still needs fresh review
 * and an owner decision, and the previews are drafts built in memory.
 *
 * The solver in `amc-first-party-solvers.ts` is keyed by question id and never
 * reads the prompt, so it cannot show that revised wording still asks the
 * original question. These tests do that: they take the numbers stated in the
 * text and enumerate every possibility.
 */

const targets = await loadAmcReviewTargets();
const preview = (id: string): Question => {
  const target = targets.find((entry) => entry.question.id === id);
  if (!target) throw new Error(`Missing AMC draft ${id}`);
  return target.question;
};

describe("roadmap-amc-y3-014 (equal-sharing wording)", () => {
  const question = preview("roadmap-amc-y3-014");

  it("keeps its identity, type, marks, time, label and tier", () => {
    expect(question.type).toBe("multiple_choice");
    expect(question.metadata.marks).toBe(4);
    expect(question.metadata.estimatedTimeSeconds).toBe(150);
    expect(question.metadata.difficulty).toBe("medium");
    expect(question.options.map((option) => option.text)).toEqual(["7", "11", "9", "10", "13"]);
    expect(question.answerKey).toEqual({ kind: "single_option", optionId: "d" });
  });

  it("no longer uses the undefined term 'average' anywhere a learner reads", () => {
    const text = `${question.prompt} ${question.explanation}`.toLowerCase();
    expect(text).not.toMatch(/\baverage\b|\bmean\b/);
    expect(question.prompt).toContain("shared equally");
  });

  it("states the numbers it is meant to preserve", () => {
    expect(question.prompt).toContain("four boxes");
    expect(question.prompt).toContain("8 shells");
    expect(question.prompt).toContain("5, 7 and 10");
  });

  it("has exactly one correct option when the stated numbers are applied", () => {
    const boxes = 4;
    const eachWhenShared = 8;
    const known = [5, 7, 10];
    const total = boxes * eachWhenShared;
    const correct = question.options.filter(
      (option) => known.reduce((sum, value) => sum + value, 0) + Number(option.text) === total,
    );
    expect(correct.map((option) => option.id)).toEqual(["d"]);
    expect(question.explanation).toContain("32");
    expect(question.explanation).toContain("10 shells");
  });
});

describe("roadmap-amc-y5-028 (bags of counters wording)", () => {
  const question = preview("roadmap-amc-y5-028");

  it("keeps its identity, type, marks, time, label and tier", () => {
    expect(question.type).toBe("number_entry");
    expect(question.metadata.marks).toBe(8);
    expect(question.metadata.estimatedTimeSeconds).toBe(180);
    expect(question.metadata.difficulty).toBe("challenging");
    expect(question.answerKey).toEqual({ kind: "number", value: 3, tolerance: 0 });
  });

  it("drops the two-variable algebra notation", () => {
    expect(question.prompt).not.toMatch(/3a|5b|\bwhole-number solutions\b/);
  });

  it("states the rules that make the count unambiguous", () => {
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

  it("gives the keyed count by exhaustive enumeration, and shows the rules matter", () => {
    const combos: Array<[number, number]> = [];
    for (let threes = 0; threes <= 30; threes += 1) {
      for (let fives = 0; fives <= 30; fives += 1) {
        if (3 * threes + 5 * fives === 30) combos.push([threes, fives]);
      }
    }
    expect(combos).toEqual([[0, 6], [5, 3], [10, 0]]);
    expect(combos.length).toBe((question.answerKey as { value: number }).value);
    // If "none of one size" were not allowed the answer would differ, so the wording must say it.
    expect(combos.filter(([threes, fives]) => threes > 0 && fives > 0)).toHaveLength(1);
  });

  it("explains every excluded count of 5-bags", () => {
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
      const tier =
        question.type === "number_entry" ? "T4" : `T${question.metadata.marks - 2}`;
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

describe("showcase prompt-layout fixture", () => {
  it("is word-for-word the stem of roadmap-amc-y5-019, so the browser test covers the real defect", () => {
    expect(MULTILINE_PROMPT).toBe(preview("roadmap-amc-y5-019").prompt);
  });
});
