import { describe, expect, it } from "vitest";
import {
  LEVEL_3_ALIGNMENTS,
  LEVEL_3_NUMBER_ALIGNMENTS,
  getMappedQuestionIdsForNode,
} from "@/features/curriculum/lessons/alignments";
import { resolveQuestionsForCurriculumNode, resolveQuestionsForNode } from "@/features/curriculum/lessons/resolver";

describe("Curriculum Node Question Resolver", () => {
  it("defines mappings for all 54 Victorian Level 3 nodes in LEVEL_3_ALIGNMENTS", () => {
    const keys = Object.keys(LEVEL_3_ALIGNMENTS);
    expect(keys).toHaveLength(54);
    expect(LEVEL_3_NUMBER_ALIGNMENTS).toBe(LEVEL_3_ALIGNMENTS);
  });

  it("returns mapped question IDs via helper function for Number nodes", () => {
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

  it("returns mapped question IDs for English nodes with coverage", () => {
    const ids = getMappedQuestionIdsForNode("VC2E3LA06");
    expect(ids.length).toBe(25);
    expect(ids).toContain("g3-nap-lang-agreement-001");
  });

  it("returns empty array for zero-coverage / coming-soon / unknown node codes", () => {
    expect(getMappedQuestionIdsForNode("VC2M3A01")).toEqual([]);
    expect(getMappedQuestionIdsForNode("UNKNOWN_CODE")).toEqual([]);
  });

  it("resolves full question objects from published bank for coverage-bound nodes", () => {
    const questions = resolveQuestionsForNode("VC2M3N01", 3);
    expect(questions.length).toBeGreaterThan(0);
    expect(questions.length).toBeLessThanOrEqual(3);
    expect(questions[0]).toHaveProperty("id");
    expect(questions[0]).toHaveProperty("prompt");

    const viaCurriculumFn = resolveQuestionsForCurriculumNode("VC2M3N01", 2);
    expect(viaCurriculumFn.length).toBe(2);
  });

  it("safely returns empty array when resolving questions for zero-coverage nodes", () => {
    const questions = resolveQuestionsForNode("VC2M3A01");
    expect(questions).toEqual([]);
  });
});
