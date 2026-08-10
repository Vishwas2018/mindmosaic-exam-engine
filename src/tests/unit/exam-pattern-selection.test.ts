import { describe, expect, it } from "vitest";

import {
  buildSelectionUnits,
  getExamPattern,
  selectPatternQuestions,
  stimulusGroupKey,
} from "@/features/exam-engine/exam-patterns";
import { bankQuestions, stimulusGroup } from "@/tests/fixtures/exam-pattern-bank";
import type { Question } from "@/schemas/question.schema";

/**
 * The three runtime-critical selection properties from
 * `docs/content-status/exam-patterns.md`:
 *
 *  a) reading questions sharing a stimulus are drawn as a whole group,
 *  b) three sittings of one pattern share zero questions,
 *  c) NAPLAN language draws its spelling and grammar sub-quotas separately,
 *     spelling first.
 *
 * Each has a failure mode that looks fine on screen — a passage with two of
 * its six questions, a "second paper" that repeats the first, a language
 * paper that is all grammar — so each gets a test that fails loudly if it
 * regresses.
 */

const NAPLAN_Y3_READING = getExamPattern("naplan-y3-reading-full")!;
const NAPLAN_Y3_LANGUAGE = getExamPattern("naplan-y3-language-full")!;
const NAPLAN_Y3_NUMERACY = getExamPattern("naplan-y3-numeracy-full")!;
const ICAS_Y3_ENGLISH = getExamPattern("icas-y3-english-full")!;

/** A reading bank with one passage per entry, carrying that many questions. */
function readingBankOfSizes(sizes: readonly number[]): Question[] {
  return sizes.flatMap((size, index) =>
    stimulusGroup(`text-${index + 1}`, size, {
      yearLevel: 3,
      examStyle: "naplan_style",
      subject: "reading",
      strand: "Inference",
      type: "reading_comprehension",
    }),
  );
}

/** A reading bank of `groups` passages, each carrying `size` questions. */
function readingBank(groups: number, size: number): Question[] {
  return readingBankOfSizes(Array.from({ length: groups }, () => size));
}

describe("stimulus groups are the unit of selection", () => {
  it("groups questions by their passage, not by id", () => {
    const bank = [...readingBank(3, 5), ...bankQuestions("loose", 4, { subject: "reading" })];
    const units = buildSelectionUnits(bank, NAPLAN_Y3_READING.stimulusRule);
    /* Three passages; the four standalone reading questions have no passage
       to belong to and are excluded from a stimulus-ruled paper entirely. */
    expect(units).toHaveLength(3);
    expect(units.every((unit) => unit.questions.length === 5)).toBe(true);
  });

  it("excludes a passage whose group size falls outside the pattern's range", () => {
    /* questionsPerStimulus is [4, 7]: a 2-question passage cannot be a whole
       group, and a 12-question one cannot be taken whole. */
    const bank = [
      ...stimulusGroup("short-text", 2, { subject: "reading", type: "reading_comprehension" }),
      ...stimulusGroup("huge-text", 12, { subject: "reading", type: "reading_comprehension" }),
      ...stimulusGroup("good-text", 6, { subject: "reading", type: "reading_comprehension" }),
    ];
    const units = buildSelectionUnits(bank, NAPLAN_Y3_READING.stimulusRule);
    expect(units).toHaveLength(1);
    expect(units[0]!.questions).toHaveLength(6);
  });

  it("never orphans a question or repeats a passage in a drawn paper", () => {
    /* Mixed passage sizes, as a real bank has: 39 is reachable here (e.g.
       7+7+7+6+6+6 across six texts) but only by whole groups. */
    const bank = readingBankOfSizes([7, 7, 7, 6, 6, 6, 5, 5, 4, 4]);
    const selection = selectPatternQuestions(bank, NAPLAN_Y3_READING, "seed-a");
    expect(selection.ok).toBe(true);
    if (!selection.ok) return;

    expect(selection.questions).toHaveLength(39);

    /* Every passage present is present in full, and none appears twice. */
    const drawnByStimulus = new Map<string, number>();
    for (const question of selection.questions) {
      const key = stimulusGroupKey(question)!;
      drawnByStimulus.set(key, (drawnByStimulus.get(key) ?? 0) + 1);
    }
    const bankByStimulus = new Map<string, number>();
    for (const question of bank) {
      const key = stimulusGroupKey(question)!;
      bankByStimulus.set(key, (bankByStimulus.get(key) ?? 0) + 1);
    }
    for (const [key, drawn] of drawnByStimulus) {
      expect(drawn, `passage ${key} was drawn partially`).toBe(bankByStimulus.get(key));
    }
    /* And the paper is composed of the declared number of texts. */
    const [minStimuli, maxStimuli] = NAPLAN_Y3_READING.stimulusRule!.distinctStimuli;
    expect(drawnByStimulus.size).toBeGreaterThanOrEqual(minStimuli);
    expect(drawnByStimulus.size).toBeLessThanOrEqual(maxStimuli);

    /* No question id appears twice. */
    const ids = selection.questions.map((question) => question.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("refuses to draw a reading paper it can only fill by splitting a passage", () => {
    /* 40 questions across 8 passages of 5 — plenty in total, but no
       combination of whole 5s reaches 39. Splitting one passage would; the
       engine must decline instead. */
    const selection = selectPatternQuestions(readingBank(8, 5), NAPLAN_Y3_READING, "seed-b");
    expect(selection.ok).toBe(false);
  });
});

describe("three sittings of one pattern share no questions", () => {
  it("partitions a numeracy bank into three disjoint papers", () => {
    /* 3x the paper size, which is what the doc's §5 depth table asks for. */
    const bank = bankQuestions("numeracy", 36 * 4, {
      yearLevel: 3,
      examStyle: "naplan_style",
      subject: "numeracy",
    });

    const papers = [0, 1, 2].map((form) =>
      selectPatternQuestions(bank, NAPLAN_Y3_NUMERACY, `sitting-${form}`, {
        form,
        formCount: 3,
      }),
    );
    expect(papers.every((paper) => paper.ok)).toBe(true);

    const idSets = papers.map(
      (paper) => new Set(paper.ok ? paper.questions.map((question) => question.id) : []),
    );
    for (const ids of idSets) expect(ids.size).toBe(36);
    for (const [a, b] of [
      [0, 1],
      [0, 2],
      [1, 2],
    ] as const) {
      const shared = [...idSets[a]!].filter((id) => idSets[b]!.has(id));
      expect(shared, `papers ${a + 1} and ${b + 1} overlap`).toHaveLength(0);
    }
  });

  it("keeps a passage whole within one form rather than splitting it across forms", () => {
    /* Thirty passages of mixed size — deep enough that all three forms can
       fill a 39-question paper. */
    const bank = readingBankOfSizes(
      Array.from({ length: 30 }, (_, index) => [7, 6, 6, 5, 4][index % 5]!),
    );
    const units = buildSelectionUnits(bank, NAPLAN_Y3_READING.stimulusRule);
    expect(units).toHaveLength(30);

    /* Every question of a passage lands in the same form, because the form is
       assigned to the UNIT — so two forms can never share half a passage. */
    const first = selectPatternQuestions(bank, NAPLAN_Y3_READING, "seed-c", {
      form: 1,
      formCount: 3,
    });
    const second = selectPatternQuestions(bank, NAPLAN_Y3_READING, "seed-d", {
      form: 2,
      formCount: 3,
    });
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    const firstIds = new Set(first.questions.map((question) => question.id));
    expect(second.questions.filter((question) => firstIds.has(question.id))).toHaveLength(0);
  });

  it("assigns forms independently of the seed", () => {
    const bank = bankQuestions("numeracy", 36 * 4, {
      yearLevel: 3,
      examStyle: "naplan_style",
      subject: "numeracy",
    });
    /* Different seeds, same form: the pool is the same partition, so the
       papers may reorder but can never leak into another form. */
    const a = selectPatternQuestions(bank, NAPLAN_Y3_NUMERACY, "one", {
      form: 0,
      formCount: 3,
    });
    const b = selectPatternQuestions(bank, NAPLAN_Y3_NUMERACY, "two", {
      form: 1,
      formCount: 3,
    });
    if (!a.ok || !b.ok) throw new Error("expected both draws to succeed");
    const aIds = new Set(a.questions.map((question) => question.id));
    expect(b.questions.filter((question) => aIds.has(question.id))).toHaveLength(0);
  });
});

describe("sub-quotas", () => {
  const languageBank = [
    ...bankQuestions("spell", 40, {
      yearLevel: 3,
      examStyle: "naplan_style",
      subject: "language_conventions",
      strand: "Spelling",
    }),
    ...bankQuestions("gram", 30, {
      yearLevel: 3,
      examStyle: "naplan_style",
      subject: "language_conventions",
      strand: "Grammar",
    }),
    ...bankQuestions("punc", 12, {
      yearLevel: 3,
      examStyle: "naplan_style",
      subject: "language_conventions",
      strand: "Punctuation",
    }),
    /* Vocabulary is registered under language_conventions but is not part of
       a NAPLAN conventions paper — it must never be drawn. */
    ...bankQuestions("vocab", 20, {
      yearLevel: 3,
      examStyle: "naplan_style",
      subject: "language_conventions",
      strand: "Vocabulary",
    }),
  ];

  it("draws 25 spelling then 27 grammar and punctuation, in that order", () => {
    const selection = selectPatternQuestions(languageBank, NAPLAN_Y3_LANGUAGE, "lang");
    expect(selection.ok).toBe(true);
    if (!selection.ok) return;

    expect(selection.questions).toHaveLength(52);
    const strands = selection.questions.map((question) => question.metadata.strand);
    expect(strands.slice(0, 25).every((strand) => strand === "Spelling")).toBe(true);
    expect(strands.slice(25).every((strand) => strand !== "Spelling")).toBe(true);
    expect(strands).not.toContain("Vocabulary");
  });

  it("fails rather than backfilling one sub-quota from the other", () => {
    /* Plenty of grammar, not enough spelling: 52 questions exist in total,
       but the spelling quota cannot be met, so there is no paper. */
    const thinSpelling = [
      ...bankQuestions("spell", 10, {
        subject: "language_conventions",
        strand: "Spelling",
      }),
      ...bankQuestions("gram", 60, {
        subject: "language_conventions",
        strand: "Grammar",
      }),
    ];
    const selection = selectPatternQuestions(thinSpelling, NAPLAN_Y3_LANGUAGE, "lang");
    expect(selection.ok).toBe(false);
    if (selection.ok) return;
    expect(selection.sources.find((source) => source.sourceId === "spelling")?.served).toBe(0);
  });

  it("composes the ICAS English paper from both banks without a visible split", () => {
    const bank = [
      ...bankQuestions("read", 40, {
        yearLevel: 3,
        examStyle: "icas_style",
        subject: "reading",
        strand: "Inference",
      }),
      ...bankQuestions("lang", 30, {
        yearLevel: 3,
        examStyle: "icas_style",
        subject: "language_conventions",
        strand: "Grammar",
      }),
    ];
    const selection = selectPatternQuestions(bank, ICAS_Y3_ENGLISH, "english");
    expect(selection.ok).toBe(true);
    if (!selection.ok) return;
    expect(selection.questions).toHaveLength(45);
    expect(
      selection.questions.filter((question) => question.metadata.subject === "reading"),
    ).toHaveLength(27);
    expect(
      selection.questions.filter(
        (question) => question.metadata.subject === "language_conventions",
      ),
    ).toHaveLength(18);
  });
});

describe("underfilled banks", () => {
  it("does not start a full-length paper it cannot fill", () => {
    const bank = bankQuestions("numeracy", 20, {
      yearLevel: 3,
      examStyle: "naplan_style",
      subject: "numeracy",
    });
    const selection = selectPatternQuestions(bank, NAPLAN_Y3_NUMERACY, "thin");
    expect(selection.ok).toBe(false);
    if (selection.ok) return;
    expect(selection.requestedCount).toBe(36);
  });

  it("offers what it has as a reduced draw only when explicitly asked", () => {
    const bank = bankQuestions("numeracy", 20, {
      yearLevel: 3,
      examStyle: "naplan_style",
      subject: "numeracy",
    });
    const selection = selectPatternQuestions(bank, NAPLAN_Y3_NUMERACY, "thin", {
      asPracticeModule: true,
    });
    expect(selection.ok).toBe(true);
    if (!selection.ok) return;
    expect(selection.questions).toHaveLength(20);
    /* Flagged as reduced, which is what stops it being labelled full-length. */
    expect(selection.reduced).toBe(true);
  });

  it("is reproducible: the same bank, pattern, seed and form give the same paper", () => {
    const bank = bankQuestions("numeracy", 100, {
      yearLevel: 3,
      examStyle: "naplan_style",
      subject: "numeracy",
    });
    const first = selectPatternQuestions(bank, NAPLAN_Y3_NUMERACY, "repeat");
    const second = selectPatternQuestions(bank, NAPLAN_Y3_NUMERACY, "repeat");
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(second.questions.map((question) => question.id)).toEqual(
      first.questions.map((question) => question.id),
    );
  });
});
