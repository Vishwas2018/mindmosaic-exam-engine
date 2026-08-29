import { describe, expect, it } from "vitest";
import {
  LEVEL_3_NUMBER_ALIGNMENTS,
  getMappedQuestionIdsForNode,
} from "@/features/curriculum/lessons/alignments";
import { resolveQuestionsForCurriculumNode, resolveQuestionsForNode } from "@/features/curriculum/lessons/resolver";

describe("Curriculum Node Question Resolver", () => {
  it("defines mappings for all 9 Level 3 Number nodes", () => {
    const codes = [
      "VC2M3N01",
      "VC2M3N02",
      "VC2M3N03",
      "VC2M3N04",
      "VC2M3N05",
      "VC2M3N06",
      "VC2M3N07",
      "VC2M3N08",
      "VC2M3N09",
    ];

    for (const code of codes) {
      expect(LEVEL_3_NUMBER_ALIGNMENTS[code]).toBeDefined();
      expect(LEVEL_3_NUMBER_ALIGNMENTS[code].length).toBeGreaterThan(0);
    }
  });

  it("returns mapped question IDs via helper function", () => {
    const ids = getMappedQuestionIdsForNode("VC2M3N01");
    expect(ids).toEqual([
      "g3-nap-num-number-001",
      "man-1073b6dfccd922bb3dff1d7e",
      "man-30f6b506e9f643379eb704df",
      "man-3ceeafa77022f47d2e1c24ac",
      "man-be1f53f36fe30de66abd3034",
      "man-ce9b5b7301d4c6c950eee793",
    ]);
  });

  it("returns empty array for unknown node codes", () => {
    const ids = getMappedQuestionIdsForNode("UNKNOWN_CODE");
    expect(ids).toEqual([]);
  });

  it("resolves full question objects from published bank", () => {
    const questions = resolveQuestionsForNode("VC2M3N01", 3);
    expect(questions.length).toBeGreaterThan(0);
    expect(questions.length).toBeLessThanOrEqual(3);
    expect(questions[0]).toHaveProperty("id");
    expect(questions[0]).toHaveProperty("prompt");

    const viaCurriculumFn = resolveQuestionsForCurriculumNode("VC2M3N01", 2);
    expect(viaCurriculumFn.length).toBe(2);
  });
});
