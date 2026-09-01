import { describe, expect, it } from "vitest";
import {
  getAllLevel3Pathways,
  getAllLevel5Pathways,
  getCurriculumPathwaysForYearLevel,
  groupPathwaysByLearningArea,
  getLessonByCode,
} from "@/features/curriculum/lessons/content";
import { getMappedQuestionIdsForNode } from "@/features/curriculum/lessons/alignments";
import { resolveQuestionsForCurriculumNode } from "@/features/curriculum/lessons/resolver";
import { CLASSROOM_ONLY_CURRICULUM_CODES } from "@/features/curriculum/lessons/classroom-only";
import type { LessonPathway } from "@/features/curriculum/lessons/types";

function nodeCodes(pathways: readonly LessonPathway[]): string[] {
  return pathways.flatMap((pathway) => pathway.nodes.map((node) => node.curriculumCode));
}

const MATHS_STRANDS = ["number", "algebra", "measurement", "space", "statistics", "probability"];
const ENGLISH_STRANDS = ["language", "literature", "literacy"];

describe("getCurriculumPathwaysForYearLevel — year-aware pathway API", () => {
  it("Year 3 resolves to exactly the Grade 3 pathways (all 54 lessons, no regression)", () => {
    const yearThree = getCurriculumPathwaysForYearLevel(3);
    const canonical = getAllLevel3Pathways();

    expect(yearThree.length).toBe(canonical.length);
    expect(nodeCodes(yearThree).sort()).toEqual(nodeCodes(canonical).sort());
    expect(nodeCodes(yearThree)).toHaveLength(54);
    expect(yearThree.every((p) => p.level === "Level 3")).toBe(true);
  });

  it("Year 5 resolves to exactly the Grade 5 pathways (all 50 lessons)", () => {
    const yearFive = getCurriculumPathwaysForYearLevel(5);
    const canonical = getAllLevel5Pathways();

    expect(yearFive.length).toBe(canonical.length);
    expect(nodeCodes(yearFive).sort()).toEqual(nodeCodes(canonical).sort());
    expect(nodeCodes(yearFive)).toHaveLength(50);
    expect(yearFive.every((p) => p.level === "Level 5")).toBe(true);
  });

  it("Grade 5 exposes exactly 50 lessons: 24 Mathematics + 26 English", () => {
    const codes = nodeCodes(getCurriculumPathwaysForYearLevel(5));
    expect(codes).toHaveLength(50);

    const pathways = getCurriculumPathwaysForYearLevel(5);
    const mathsCount = pathways
      .filter((p) => MATHS_STRANDS.includes(p.strand))
      .reduce((sum, p) => sum + p.nodes.length, 0);
    const englishCount = pathways
      .filter((p) => ENGLISH_STRANDS.includes(p.strand))
      .reduce((sum, p) => sum + p.nodes.length, 0);

    expect(mathsCount).toBe(24);
    expect(englishCount).toBe(26);
    expect(mathsCount + englishCount).toBe(50);
  });

  it("has no duplicate curriculum codes within the Grade 5 pathway set", () => {
    const codes = nodeCodes(getCurriculumPathwaysForYearLevel(5));
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("has no duplicate curriculum codes within the Grade 3 pathway set", () => {
    const codes = nodeCodes(getCurriculumPathwaysForYearLevel(3));
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("never leaks a Grade 3 node into the Grade 5 pathway set", () => {
    const g5Codes = nodeCodes(getCurriculumPathwaysForYearLevel(5));
    for (const code of g5Codes) {
      expect(code.startsWith("VC2M5") || code.startsWith("VC2E5")).toBe(true);
    }
  });

  it("never leaks a Grade 5 node into the Grade 3 pathway set", () => {
    const g3Codes = nodeCodes(getCurriculumPathwaysForYearLevel(3));
    for (const code of g3Codes) {
      expect(code.startsWith("VC2M3") || code.startsWith("VC2E3")).toBe(true);
    }
  });

  it("fails honestly for a missing or unrecognised yearLevel — never silently defaults to Grade 3", () => {
    for (const yearLevel of [null, undefined, 4, 6, 99, -1]) {
      const pathways = getCurriculumPathwaysForYearLevel(yearLevel as number | null | undefined);
      expect(pathways).toHaveLength(0);
    }
  });

  it("the combined Year 3 + Year 5 registry accounts for all 104 authored lessons", () => {
    const total =
      nodeCodes(getCurriculumPathwaysForYearLevel(3)).length +
      nodeCodes(getCurriculumPathwaysForYearLevel(5)).length;
    expect(total).toBe(104);
  });

  it("every pathway lesson link resolves to a real published lesson", () => {
    for (const yearLevel of [3, 5]) {
      for (const pathway of getCurriculumPathwaysForYearLevel(yearLevel)) {
        for (const node of pathway.nodes) {
          const lesson = getLessonByCode(node.curriculumCode, { publishedOnly: true });
          expect(lesson, `expected a published lesson for ${node.curriculumCode}`).toBeDefined();
          expect(lesson?.curriculumCode).toBe(node.curriculumCode);
        }
      }
    }
  });

  it("classroom-only nodes are flagged and expose zero digital practice questions", () => {
    for (const yearLevel of [3, 5]) {
      for (const pathway of getCurriculumPathwaysForYearLevel(yearLevel)) {
        for (const node of pathway.nodes) {
          const shouldBeClassroomOnly = CLASSROOM_ONLY_CURRICULUM_CODES.has(node.curriculumCode);
          expect(node.isClassroomOnly).toBe(shouldBeClassroomOnly);
          if (shouldBeClassroomOnly) {
            expect(node.questionCount).toBe(0);
          }
        }
      }
    }
  });

  it("governed-practice (non classroom-only) nodes still resolve real questions through the existing resolver", () => {
    const pathways = getCurriculumPathwaysForYearLevel(5);
    let checked = 0;
    for (const pathway of pathways) {
      for (const node of pathway.nodes) {
        if (node.isClassroomOnly || node.questionCount === 0) continue;
        const resolved = resolveQuestionsForCurriculumNode(node.curriculumCode);
        expect(resolved.length).toBeGreaterThan(0);
        expect(resolved.length).toBeLessThanOrEqual(getMappedQuestionIdsForNode(node.curriculumCode).length);
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("a pathway's questionCount never exceeds the raw governed alignment mapping (no manufactured practice)", () => {
    for (const yearLevel of [3, 5]) {
      for (const pathway of getCurriculumPathwaysForYearLevel(yearLevel)) {
        for (const node of pathway.nodes) {
          expect(node.questionCount).toBe(getMappedQuestionIdsForNode(node.curriculumCode).length);
        }
      }
    }
  });
});

describe("groupPathwaysByLearningArea", () => {
  it("groups Year 5 pathways into Mathematics and English, preserving strand pathways", () => {
    const groups = groupPathwaysByLearningArea(getCurriculumPathwaysForYearLevel(5));
    const learningAreas = groups.map((g) => g.learningArea);

    expect(learningAreas).toEqual(["Mathematics", "English"]);

    const maths = groups.find((g) => g.learningArea === "Mathematics")!;
    const english = groups.find((g) => g.learningArea === "English")!;
    expect(maths.pathways).toHaveLength(6);
    expect(english.pathways).toHaveLength(3);
    expect(maths.pathways.reduce((sum, p) => sum + p.nodes.length, 0)).toBe(24);
    expect(english.pathways.reduce((sum, p) => sum + p.nodes.length, 0)).toBe(26);
  });

  it("returns no groups for an empty pathway list (missing/unknown year)", () => {
    expect(groupPathwaysByLearningArea(getCurriculumPathwaysForYearLevel(null))).toEqual([]);
    expect(groupPathwaysByLearningArea(getCurriculumPathwaysForYearLevel(4))).toEqual([]);
  });
});
