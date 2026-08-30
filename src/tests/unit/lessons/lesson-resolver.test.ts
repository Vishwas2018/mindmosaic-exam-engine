import { describe, expect, it } from "vitest";
import {
  LEVEL_3_ALIGNMENTS,
  LEVEL_5_ALIGNMENTS,
  LEVEL_3_NUMBER_ALIGNMENTS,
  LEVEL_5_NUMBER_ALIGNMENTS,
  getMappedQuestionIdsForNode,
} from "@/features/curriculum/lessons/alignments";
import { resolveQuestionsForCurriculumNode, resolveQuestionsForNode } from "@/features/curriculum/lessons/resolver";

describe("Curriculum Node Question Resolver", () => {
  it("defines mappings for all 54 Level 3 nodes and all 50 Level 5 nodes in alignments", () => {
    const l3Keys = Object.keys(LEVEL_3_ALIGNMENTS);
    expect(l3Keys).toHaveLength(54);
    expect(LEVEL_3_NUMBER_ALIGNMENTS).toBe(LEVEL_3_ALIGNMENTS);

    const l5Keys = Object.keys(LEVEL_5_ALIGNMENTS);
    expect(l5Keys).toHaveLength(50);
    expect(LEVEL_5_NUMBER_ALIGNMENTS).toBe(LEVEL_5_ALIGNMENTS);
  });

  it("returns mapped question IDs via helper function for Level 3 Number nodes", () => {
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

  it("returns mapped question IDs via helper function for Level 5 Number nodes", () => {
    const ids = getMappedQuestionIdsForNode("VC2M5N01");
    expect(ids.length).toBeGreaterThanOrEqual(5);
    expect(ids).toContain("g5-nap-num-number-001");
  });

  it("returns mapped question IDs for Level 5 English nodes with coverage", () => {
    const ids = getMappedQuestionIdsForNode("VC2E5LA01");
    expect(ids.length).toBeGreaterThanOrEqual(5);
    expect(ids).toContain("g5-eng-reg-001");
  });

  it("returns empty array for unknown node codes", () => {
    expect(getMappedQuestionIdsForNode("UNKNOWN_CODE")).toEqual([]);
  });

  it("resolves full question objects from published bank for Level 3 and Level 5 nodes", () => {
    const l3Questions = resolveQuestionsForNode("VC2M3N01", 3);
    expect(l3Questions.length).toBeGreaterThan(0);
    expect(l3Questions.length).toBeLessThanOrEqual(3);
    expect(l3Questions[0]).toHaveProperty("id");
    expect(l3Questions[0]).toHaveProperty("prompt");

    const l5Questions = resolveQuestionsForCurriculumNode("VC2M5N01", 3);
    expect(l5Questions.length).toBeGreaterThan(0);
    expect(l5Questions.length).toBeLessThanOrEqual(3);
    expect(l5Questions[0]).toHaveProperty("id");
    expect(l5Questions[0]).toHaveProperty("prompt");
  });
});
