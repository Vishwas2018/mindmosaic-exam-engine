import { describe, expect, it } from "vitest";

import { questionBank } from "@/content/questions/question-bank";
import {
  createSeededRandom,
  hashSeed,
  seededShuffle,
  selectExamQuestions,
  type ExamSelectionConfig,
} from "@/features/exam-engine/selection";

/**
 * Fixed-vector regression tests. Every expected value here was captured
 * once from a real run of the implementation and then hard-coded — this
 * is the correct way to build a golden-vector test, but it means these
 * assertions must never be "fixed" by recomputing and pasting in whatever
 * the code currently produces. If one of these fails, the seeded-random
 * algorithm, the shuffle, or the selection pipeline changed behaviour;
 * that is either a real regression or an intentional change that needs
 * this file updated deliberately, with a note explaining why.
 */

const GOLDEN_SEED = "golden-vector-seed";

describe("hashSeed golden vector", () => {
  it("hashes a known seed to a known 32-bit value", () => {
    expect(hashSeed(GOLDEN_SEED)).toBe(3674899714);
  });

  it("hashes an empty string to the FNV-1a offset basis", () => {
    expect(hashSeed("")).toBe(0x811c9dc5);
  });
});

describe("createSeededRandom golden vector", () => {
  it("produces a known sequence for a known seed", () => {
    const random = createSeededRandom(GOLDEN_SEED);
    const sequence = Array.from({ length: 5 }, () => random());
    expect(sequence).toEqual([
      0.25446389033459127,
      0.13928136136382818,
      0.08327331789769232,
      0.18748752120882273,
      0.17063250136561692,
    ]);
  });
});

describe("seededShuffle golden vector", () => {
  it("produces a known permutation for a known seed", () => {
    const shuffled = seededShuffle(
      ["a", "b", "c", "d", "e", "f", "g", "h"],
      GOLDEN_SEED,
    );
    expect(shuffled).toEqual(["d", "b", "h", "e", "f", "g", "a", "c"]);
  });
});

/**
 * The production bank is versioned by this hash of its question ids in
 * bank order. If a content change reorders, adds, or removes questions,
 * this guard fails first with a clear message — the selection golden
 * vector below is only meaningful against this exact bank shape, and a
 * silent mismatch there would be far more confusing to debug.
 */
describe("production bank version guard", () => {
  it("matches the bank shape the selection golden vector was captured against", () => {
    expect(questionBank.length).toBe(100);
    expect(hashSeed(questionBank.map((question) => question.id).join("|"))).toBe(
      896530402,
    );
  });
});

describe("selectExamQuestions golden vector", () => {
  const config: ExamSelectionConfig = {
    yearLevel: 3,
    examStyle: "naplan_style",
    subject: "numeracy",
    questionCount: 10,
    timing: "timed",
  };

  it("selects a known, fixed set of question ids for a known seed and filter", () => {
    const result = selectExamQuestions(questionBank, config, GOLDEN_SEED);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.questions.map((question) => question.id)).toEqual([
      "g3-nap-num-space-001",
      "g3-nap-num-data-004",
      "g3-nap-num-number-002",
      "g3-nap-num-geo-003",
      "g3-nap-num-frac-001",
      "g3-nap-num-frac-002",
      "g3-nap-num-frac-003",
      "g3-nap-num-number-001",
      "g3-nap-num-geo-001",
      "g3-nap-num-geo-002",
    ]);
  });
});
