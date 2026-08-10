import { describe, expect, it } from "vitest";

import {
  buildAllPatternReadiness,
  buildPatternReadiness,
  getExamPattern,
  reducedModuleMinutes,
  selectPatternQuestions,
} from "@/features/exam-engine/exam-patterns";
import { bankQuestions, stimulusGroup } from "@/tests/fixtures/exam-pattern-bank";
import type { Question } from "@/schemas/question.schema";

/**
 * Readiness is the promise the picker makes. Its one job is that "Ready to
 * sit" is true — that a card offering a full-length paper cannot lead to a
 * start that fails — and that a bank which cannot fill the shape says so
 * rather than quietly serving a short paper under the full-length name.
 */

const NUMERACY = getExamPattern("naplan-y3-numeracy-full")!;
const LANGUAGE = getExamPattern("naplan-y3-language-full")!;
const READING = getExamPattern("naplan-y3-reading-full")!;
const WRITING = getExamPattern("naplan-y3-writing-deferred")!;

function numeracyBank(count: number): Question[] {
  return bankQuestions("numeracy", count, {
    yearLevel: 3,
    examStyle: "naplan_style",
    subject: "numeracy",
  });
}

function languageBank(spelling: number, grammar: number): Question[] {
  return [
    ...bankQuestions("spell", spelling, {
      yearLevel: 3,
      examStyle: "naplan_style",
      subject: "language_conventions",
      strand: "Spelling",
    }),
    ...bankQuestions("gram", grammar, {
      yearLevel: 3,
      examStyle: "naplan_style",
      subject: "language_conventions",
      strand: "Grammar",
    }),
  ];
}

describe("pattern readiness", () => {
  it("reports ready, and how many disjoint papers the bank supports", () => {
    const readiness = buildPatternReadiness(numeracyBank(36 * 4), NUMERACY);
    expect(readiness.state).toBe("ready");
    expect(readiness.availableCount).toBe(36);
    expect(readiness.distinctPapers).toBe(3);
  });

  it("drops to fewer papers as the bank thins, before dropping to none", () => {
    expect(buildPatternReadiness(numeracyBank(80), NUMERACY).distinctPapers).toBe(2);
    expect(buildPatternReadiness(numeracyBank(40), NUMERACY).distinctPapers).toBe(1);
  });

  it("never reports ready for a paper that would then fail to start", () => {
    /* The property that matters: readiness runs the real selection, so
       "ready" and "startable" cannot disagree. */
    for (const size of [0, 10, 35, 36, 37, 74, 108, 150]) {
      const bank = numeracyBank(size);
      const readiness = buildPatternReadiness(bank, NUMERACY);
      const started = selectPatternQuestions(bank, NUMERACY, "start", {
        form: 0,
        formCount: Math.max(1, readiness.distinctPapers),
      });
      if (readiness.state === "ready") {
        expect(started.ok, `bank of ${size} said ready but did not start`).toBe(true);
        if (started.ok) expect(started.questions).toHaveLength(36);
      }
    }
  });

  it("binds on the sub-quota, not the total", () => {
    /* 60 questions for a 52-question paper — comfortably enough in total,
       but only 10 of them are spelling and the paper needs 25. */
    const readiness = buildPatternReadiness(languageBank(10, 50), LANGUAGE);
    expect(readiness.state).toBe("short");
    const spelling = readiness.sources.find((source) => source.sourceId === "spelling")!;
    expect(spelling.poolSize).toBe(10);
    expect(spelling.satisfiable).toBe(false);
    const grammar = readiness.sources.find(
      (source) => source.sourceId === "grammar-and-punctuation",
    )!;
    expect(grammar.satisfiable).toBe(true);
    /* What could be sat is 10 spelling + 27 grammar, not 52. */
    expect(readiness.availableCount).toBe(37);
    expect(readiness.availableCount).toBeLessThan(readiness.requestedCount);
  });

  it("binds on stimulus-group availability, not on the reading question total", () => {
    /* 60 reading questions, which is more than the 39 a paper needs — but
       every one of them is a standalone item with no passage, so not a single
       whole group exists. */
    const bank = bankQuestions("reading", 60, {
      yearLevel: 3,
      examStyle: "naplan_style",
      subject: "reading",
    });
    const readiness = buildPatternReadiness(bank, READING);
    expect(readiness.state).toBe("unavailable");
    const source = readiness.sources[0]!;
    expect(source.poolSize).toBe(60);
    expect(source.groupedPoolSize).toBe(0);
    expect(source.stimulusGroups).toBe(0);
  });

  it("counts whole passages, and ignores ones that are the wrong size", () => {
    const bank = [
      ...stimulusGroup("t1", 7, { subject: "reading", type: "reading_comprehension" }),
      ...stimulusGroup("t2", 6, { subject: "reading", type: "reading_comprehension" }),
      ...stimulusGroup("t3", 6, { subject: "reading", type: "reading_comprehension" }),
      ...stimulusGroup("t4", 6, { subject: "reading", type: "reading_comprehension" }),
      ...stimulusGroup("t5", 7, { subject: "reading", type: "reading_comprehension" }),
      ...stimulusGroup("t6", 7, { subject: "reading", type: "reading_comprehension" }),
      /* Out of the [4, 7] range: neither counts towards a paper. */
      ...stimulusGroup("t7", 2, { subject: "reading", type: "reading_comprehension" }),
      ...stimulusGroup("t8", 20, { subject: "reading", type: "reading_comprehension" }),
    ];
    const readiness = buildPatternReadiness(bank, READING);
    const source = readiness.sources[0]!;
    expect(source.stimulusGroups).toBe(6);
    expect(source.groupedPoolSize).toBe(39);
    expect(source.poolSize).toBe(61);
    expect(readiness.state).toBe("ready");
    expect(readiness.distinctPapers).toBe(1);
  });

  it("reports nothing at all as unavailable rather than short", () => {
    const readiness = buildPatternReadiness([], NUMERACY);
    expect(readiness.state).toBe("unavailable");
    expect(readiness.availableCount).toBe(0);
    expect(readiness.distinctPapers).toBe(0);
  });

  it("never reports a deferred pattern as startable, however deep the bank", () => {
    const readiness = buildPatternReadiness(numeracyBank(500), WRITING);
    expect(readiness.state).toBe("unavailable");
    expect(readiness.availableCount).toBe(0);
  });

  it("covers every registered pattern", () => {
    const all = buildAllPatternReadiness(numeracyBank(200));
    expect(Object.keys(all).length).toBeGreaterThan(0);
    expect(all[NUMERACY.id]?.state).toBe("ready");
    expect(all[READING.id]?.state).toBe("unavailable");
  });
});

describe("reduced practice modules", () => {
  it("recalculates the time in proportion to the questions actually served", () => {
    /* 26 of 52 questions is half the paper, so half the 45 minutes. */
    expect(reducedModuleMinutes(LANGUAGE, 26)).toBe(23);
    expect(reducedModuleMinutes(LANGUAGE, 52)).toBe(45);
    /* Never longer than the full-length paper, and never so short that a
       handful of questions is effectively untimed. */
    expect(reducedModuleMinutes(LANGUAGE, 1)).toBe(5);
    expect(reducedModuleMinutes(LANGUAGE, 100)).toBe(45);
  });

  it("serves exactly the count readiness advertised", () => {
    const bank = languageBank(10, 50);
    const readiness = buildPatternReadiness(bank, LANGUAGE);
    expect(readiness.state).toBe("short");
    const selection = selectPatternQuestions(bank, LANGUAGE, "readiness", {
      asPracticeModule: true,
    });
    expect(selection.ok).toBe(true);
    if (!selection.ok) return;
    expect(selection.questions).toHaveLength(readiness.availableCount);
    expect(selection.reduced).toBe(true);
  });
});
