import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import curriculumManifestJson from "../../../../content/curriculum-imports/vic-f10-v2-l3-l5.json";
import {
  CLASSROOM_ONLY_CURRICULUM_CODES,
  getAllLessons,
  getLessonByCode,
  getCurriculumPathwaysForYearLevel,
  getPublishedLessonForYearLevel,
  resolveQuestionsForCurriculumNode,
} from "@/features/curriculum/lessons";
import {
  extractQuestionIdsFromAlignments,
  isAlignmentApprovedAndMapped,
} from "@/server/curriculum/gated-practice-coverage";

function allNodes(yearLevel: number) {
  return getCurriculumPathwaysForYearLevel(yearLevel).learningAreas.flatMap((area) =>
    area.pathways.flatMap((pathway) => pathway.nodes),
  );
}

function strandCounts(yearLevel: number) {
  return Object.fromEntries(
    getCurriculumPathwaysForYearLevel(yearLevel).learningAreas.flatMap((area) =>
      area.pathways.map((pathway) => [pathway.strand, pathway.nodes.length]),
    ),
  );
}

describe("year-aware student curriculum pathways", () => {
  it("projects the authoritative 104-lesson registry as 54 Grade 3 and 50 Grade 5 lessons", () => {
    expect(getAllLessons()).toHaveLength(104);
    expect(allNodes(3)).toHaveLength(54);
    expect(allNodes(5)).toHaveLength(50);
  });

  it("groups Grade 3 into the canonical Mathematics and English strand counts", () => {
    const pathways = getCurriculumPathwaysForYearLevel(3);
    expect(pathways.level).toBe("Level 3");
    expect(pathways.learningAreas.map((area) => area.title)).toEqual([
      "Mathematics",
      "English",
    ]);
    expect(pathways.learningAreas.map((area) => area.lessonCount)).toEqual([24, 30]);
    expect(strandCounts(3)).toEqual({
      number: 9,
      algebra: 3,
      measurement: 5,
      space: 2,
      statistics: 3,
      probability: 2,
      language: 12,
      literature: 5,
      literacy: 13,
    });
  });

  it("groups Grade 5 into exactly 24 Mathematics and 26 English lessons", () => {
    const pathways = getCurriculumPathwaysForYearLevel(5);
    expect(pathways.level).toBe("Level 5");
    expect(pathways.lessonCount).toBe(50);
    expect(pathways.learningAreas.map((area) => area.lessonCount)).toEqual([24, 26]);
    expect(strandCounts(5)).toEqual({
      number: 10,
      algebra: 2,
      measurement: 4,
      space: 3,
      statistics: 3,
      probability: 2,
      language: 9,
      literature: 5,
      literacy: 12,
    });
  });

  it("contains no duplicate codes or cross-year pathway leakage", () => {
    const grade3Codes = allNodes(3).map((node) => node.curriculumCode);
    const grade5Codes = allNodes(5).map((node) => node.curriculumCode);

    expect(new Set(grade3Codes).size).toBe(54);
    expect(new Set(grade5Codes).size).toBe(50);
    expect(grade3Codes.every((code) => /^VC2[ME]3/.test(code))).toBe(true);
    expect(grade5Codes.every((code) => /^VC2[ME]5/.test(code))).toBe(true);
    expect(grade3Codes.filter((code) => grade5Codes.includes(code))).toEqual([]);
  });

  it("returns an honest empty result for missing or unsupported years", () => {
    for (const yearLevel of [null, undefined, 4, 7]) {
      const result = getCurriculumPathwaysForYearLevel(yearLevel);
      expect(result.level).toBeNull();
      expect(result.lessonCount).toBe(0);
      expect(result.learningAreas).toEqual([]);
    }
  });

  it("wires the Learn page to the authenticated student's year without a Grade 3 fallback", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/app/student/learn/page.tsx"),
      "utf8",
    );

    expect(source).toContain("getCurriculumPathwaysForYearLevel(student.yearLevel)");
    expect(source).not.toContain("getLevel3NumberPathway");
  });

  it("makes every pathway lesson link resolve to a published lesson in the same year", () => {
    for (const yearLevel of [3, 5]) {
      for (const node of allNodes(yearLevel)) {
        expect(node.lessonHref).toBe(`/student/learn/lessons/${node.curriculumCode}`);
        expect(getLessonByCode(node.curriculumCode, { publishedOnly: true })?.level).toBe(
          `Level ${yearLevel}`,
        );
        expect(getPublishedLessonForYearLevel(node.curriculumCode, yearLevel)).toBeDefined();
        expect(getPublishedLessonForYearLevel(node.curriculumCode, yearLevel === 3 ? 5 : 3)).toBe(
          undefined,
        );
      }
    }

    expect(getPublishedLessonForYearLevel("NOT-A-LESSON", 5)).toBeUndefined();
    expect(getPublishedLessonForYearLevel("VC2M5N01", null)).toBeUndefined();
  });

  it("keeps every classroom-only lesson browsable but removes all online practice", () => {
    const nodes = [...allNodes(3), ...allNodes(5)];
    const classroomNodes = nodes.filter((node) =>
      CLASSROOM_ONLY_CURRICULUM_CODES.has(node.curriculumCode),
    );

    expect(classroomNodes).toHaveLength(CLASSROOM_ONLY_CURRICULUM_CODES.size);
    for (const node of classroomNodes) {
      expect(node.lessonHref).toBe(`/student/learn/lessons/${node.curriculumCode}`);
      expect(node.practiceStatus).toBe("classroom_only");
      expect(node.questionCount).toBe(0);
      expect(node.practiceHref).toBeUndefined();
    }
  });

  it("exposes practice only when the existing governed resolver returns published questions", () => {
    for (const node of [...allNodes(3), ...allNodes(5)]) {
      const resolvedQuestions = resolveQuestionsForCurriculumNode(node.curriculumCode);

      expect(node.questionCount).toBe(resolvedQuestions.length);
      if (node.practiceStatus === "classroom_only" || resolvedQuestions.length === 0) {
        expect(node.practiceHref).toBeUndefined();
      } else {
        expect(node.practiceHref).toContain(
          `curriculumCode=${encodeURIComponent(node.curriculumCode)}`,
        );
      }
    }
  });

  it("does not turn the manifest's in-review VC2M5A02 mapping into student practice", () => {
    const manifest = curriculumManifestJson as {
      nodes: Array<{ nodeId: string; officialCode?: string }>;
      taxonomyAlignments: Array<{
        curriculumNodeId: string;
        rationale?: string;
        review?: { status?: string };
      }>;
    };
    const node = manifest.nodes.find((candidate) => candidate.officialCode === "VC2M5A02");
    expect(node).toBeDefined();

    const alignments = manifest.taxonomyAlignments.filter(
      (alignment) => alignment.curriculumNodeId === node!.nodeId,
    );
    const inReview = alignments.find((alignment) => alignment.review?.status === "in_review");
    expect(inReview?.rationale).toContain("g5-alg-eq-002");
    expect(isAlignmentApprovedAndMapped(inReview)).toBe(false);
    expect(extractQuestionIdsFromAlignments(alignments)).not.toContain("g5-alg-eq-002");
    expect(resolveQuestionsForCurriculumNode("VC2M5A02").map((question) => question.id)).not.toContain(
      "g5-alg-eq-002",
    );
  });
});
