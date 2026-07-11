import { describe, expect, it } from "vitest";

import { questionBank } from "@/content/questions/question-bank";
import {
  MAXIMUM_FULL_EXAM_DURATION_SECONDS,
  MINIMUM_FULL_EXAM_DURATION_SECONDS,
  createSeededRandom,
  durationSecondsFor,
  filterEligibleQuestions,
  hashSeed,
  seededShuffle,
  selectExamQuestions,
  type ExamSelectionConfig,
} from "@/features/exam-engine/selection";

const baseConfig: ExamSelectionConfig = {
  yearLevel: 3,
  examStyle: "naplan_style",
  subject: "numeracy",
  questionCount: 10,
  timing: "timed",
};

describe("seeded random", () => {
  it("hashes the same seed to the same value", () => {
    expect(hashSeed("mindmosaic")).toBe(hashSeed("mindmosaic"));
    expect(hashSeed("mindmosaic")).not.toBe(hashSeed("mindmosaic2"));
  });

  it("produces an identical sequence for an identical seed", () => {
    const first = createSeededRandom("seed-a");
    const second = createSeededRandom("seed-a");
    const sequenceA = Array.from({ length: 10 }, () => first());
    const sequenceB = Array.from({ length: 10 }, () => second());
    expect(sequenceA).toEqual(sequenceB);
  });

  it("shuffles deterministically without mutating the input", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const original = [...items];
    const shuffledA = seededShuffle(items, "stable-seed");
    const shuffledB = seededShuffle(items, "stable-seed");
    const shuffledC = seededShuffle(items, "another-seed");

    expect(items).toEqual(original);
    expect(shuffledA).toEqual(shuffledB);
    expect(shuffledA).not.toEqual(shuffledC);
    expect([...shuffledA].sort((a, b) => a - b)).toEqual(original);
  });
});

describe("filterEligibleQuestions", () => {
  it("filters by year level, exam style and subject", () => {
    const eligible = filterEligibleQuestions(questionBank, {
      yearLevel: 3,
      examStyle: "naplan_style",
      subject: "numeracy",
    });
    expect(eligible.length).toBeGreaterThan(0);
    for (const question of eligible) {
      expect(question.yearLevel).toBe(3);
      expect(question.examStyle).toBe("naplan_style");
      expect(question.metadata.subject).toBe("numeracy");
    }
  });

  it("maps the language filter to language conventions", () => {
    const eligible = filterEligibleQuestions(questionBank, {
      yearLevel: "mixed",
      examStyle: "mixed",
      subject: "language",
    });
    expect(eligible.length).toBeGreaterThan(0);
    for (const question of eligible) {
      expect(question.metadata.subject).toBe("language_conventions");
    }
  });

  it("includes every subject, including writing, under mixed", () => {
    const eligible = filterEligibleQuestions(questionBank, {
      yearLevel: "mixed",
      examStyle: "mixed",
      subject: "mixed",
    });
    expect(eligible.length).toBe(questionBank.length);
  });

  it("covers every filter combination without errors", () => {
    const yearLevels = [3, 5, "mixed"] as const;
    const styles = ["naplan_style", "icas_style", "mixed"] as const;
    const subjects = ["numeracy", "reading", "language", "mixed"] as const;
    for (const yearLevel of yearLevels) {
      for (const examStyle of styles) {
        for (const subject of subjects) {
          const eligible = filterEligibleQuestions(questionBank, {
            yearLevel,
            examStyle,
            subject,
          });
          expect(eligible.length).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe("selectExamQuestions", () => {
  it("returns the same questions in the same order for the same seed", () => {
    const first = selectExamQuestions(questionBank, baseConfig, "seed-1");
    const second = selectExamQuestions(questionBank, baseConfig, "seed-1");
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(first.questions.map((question) => question.id)).toEqual(
        second.questions.map((question) => question.id),
      );
      expect(first.questions).toHaveLength(10);
    }
  });

  it("changes the order for a different seed", () => {
    const first = selectExamQuestions(questionBank, baseConfig, "seed-1");
    const second = selectExamQuestions(questionBank, baseConfig, "seed-2");
    if (first.ok && second.ok) {
      expect(first.questions.map((question) => question.id)).not.toEqual(
        second.questions.map((question) => question.id),
      );
    }
  });

  it("never selects duplicate questions", () => {
    const result = selectExamQuestions(
      questionBank,
      { ...baseConfig, yearLevel: "mixed", examStyle: "mixed", subject: "mixed", questionCount: 30 },
      "dupe-check",
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      const ids = result.questions.map((question) => question.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("uses the whole eligible pool for the full set", () => {
    const result = selectExamQuestions(
      questionBank,
      { ...baseConfig, questionCount: "full" },
      "full-set",
    );
    const eligible = filterEligibleQuestions(questionBank, baseConfig);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.questions).toHaveLength(eligible.length);
    }
  });

  it("reports insufficient questions instead of guessing", () => {
    const result = selectExamQuestions(
      questionBank,
      { ...baseConfig, yearLevel: 3, examStyle: "icas_style", questionCount: 30 },
      "too-many",
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("insufficient_questions");
      expect(result.requestedCount).toBe(30);
      expect(result.eligibleCount).toBeLessThan(30);
    }
  });
});

describe("durationSecondsFor", () => {
  it("uses the fixed table for 10, 20 and 30 questions regardless of the questions passed", () => {
    expect(durationSecondsFor(10, [])).toBe(15 * 60);
    expect(durationSecondsFor(20, [])).toBe(30 * 60);
    expect(durationSecondsFor(30, [])).toBe(45 * 60);
  });

  it("derives a full-exam duration from the selected questions' estimated time", () => {
    const questions = Array.from({ length: 20 }, () => ({
      metadata: { estimatedTimeSeconds: 60 },
    }));
    /* 20 * 60s = 1200s raw, * 1.5 buffer = 1800s = 30min exactly, above the
       minimum clamp so this exercises the real formula, not the floor. */
    expect(durationSecondsFor("full", questions)).toBe(30 * 60);
  });

  it("does not give a single-question full exam the same duration as a large one", () => {
    const one = durationSecondsFor("full", [{ metadata: { estimatedTimeSeconds: 60 } }]);
    const hundred = durationSecondsFor(
      "full",
      Array.from({ length: 100 }, () => ({ metadata: { estimatedTimeSeconds: 90 } })),
    );
    expect(one).toBeLessThan(hundred);
    expect(one).toBeLessThan(90 * 60);
  });

  it("clamps a tiny full exam to the minimum duration", () => {
    expect(durationSecondsFor("full", [{ metadata: { estimatedTimeSeconds: 10 } }])).toBe(
      MINIMUM_FULL_EXAM_DURATION_SECONDS,
    );
    expect(durationSecondsFor("full", [])).toBe(MINIMUM_FULL_EXAM_DURATION_SECONDS);
  });

  it("clamps a huge full exam to the maximum duration", () => {
    const manySlowQuestions = Array.from({ length: 200 }, () => ({
      metadata: { estimatedTimeSeconds: 300 },
    }));
    expect(durationSecondsFor("full", manySlowQuestions)).toBe(
      MAXIMUM_FULL_EXAM_DURATION_SECONDS,
    );
  });

  it("derives duration from the real bank for a filtered full set, matching the documented formula", () => {
    const eligible = filterEligibleQuestions(questionBank, {
      yearLevel: 3,
      examStyle: "naplan_style",
      subject: "numeracy",
    });
    const totalEstimatedSeconds = eligible.reduce(
      (sum, question) => sum + question.metadata.estimatedTimeSeconds,
      0,
    );
    const expected = Math.min(
      MAXIMUM_FULL_EXAM_DURATION_SECONDS,
      Math.max(
        MINIMUM_FULL_EXAM_DURATION_SECONDS,
        Math.ceil((totalEstimatedSeconds * 1.5) / 60) * 60,
      ),
    );
    expect(durationSecondsFor("full", eligible)).toBe(expected);
  });
});
