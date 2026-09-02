import { describe, expect, it } from "vitest";
import {
  getAllLessons,
  getPublishedLessons,
  getLessonByCode,
  getLevel3NumberPathway,
  getLevel3AlgebraPathway,
  getLevel3MeasurementPathway,
  getLevel3SpacePathway,
  getLevel3StatisticsPathway,
  getLevel3ProbabilityPathway,
  getLevel3LanguagePathway,
  getLevel3LiteraturePathway,
  getLevel3LiteracyPathway,
  getAllLevel3Pathways,
  getLevel5NumberPathway,
  getLevel5AlgebraPathway,
  getLevel5MeasurementPathway,
  getLevel5SpacePathway,
  getLevel5StatisticsPathway,
  getLevel5ProbabilityPathway,
  getLevel5LanguagePathway,
  getLevel5LiteraturePathway,
  getLevel5LiteracyPathway,
  getAllLevel5Pathways,
  getCurriculumPathwaysForYearLevel,
  hasCurriculumPathwaysForYearLevel,
} from "@/features/curriculum/lessons/content";
import { lessonSchema } from "@/features/curriculum/lessons/schema";
import { CLASSROOM_ONLY_CURRICULUM_CODES } from "@/features/curriculum/lessons/classroom-only";

describe("Victorian Curriculum Level 3 and Level 5 Lessons Content Suite", () => {
  const lessons = getAllLessons();

  /* ──────────────────────────────────────────────────
     Registry invariant: total = 54 (L3) + 50 (L5)
  ────────────────────────────────────────────────── */

  it("contains exactly 104 authored lessons covering the entire Victorian Level 3 (54) and Level 5 (50) catalogue", () => {
    expect(lessons).toHaveLength(104);
  });

  it("contains all 54 Grade 3 lessons across all 9 strands", () => {
    const l3Lessons = lessons.filter((l) => l.level === "Level 3");
    expect(l3Lessons).toHaveLength(54);

    const mathsL3 = l3Lessons.filter((l) =>
      ["number", "algebra", "measurement", "space", "statistics", "probability"].includes(l.strand),
    );
    expect(mathsL3).toHaveLength(24);

    const englishL3 = l3Lessons.filter((l) =>
      ["language", "literature", "literacy"].includes(l.strand),
    );
    expect(englishL3).toHaveLength(30);
  });

  it("contains all 50 Grade 5 lessons across all 9 strands", () => {
    const l5Lessons = lessons.filter((l) => l.level === "Level 5");
    expect(l5Lessons).toHaveLength(50);

    const mathsL5 = l5Lessons.filter((l) =>
      ["number", "algebra", "measurement", "space", "statistics", "probability"].includes(l.strand),
    );
    expect(mathsL5).toHaveLength(24);

    const numberL5 = l5Lessons.filter((l) => l.strand === "number");
    expect(numberL5).toHaveLength(10);

    const algebraL5 = l5Lessons.filter((l) => l.strand === "algebra");
    expect(algebraL5).toHaveLength(2);

    const measurementL5 = l5Lessons.filter((l) => l.strand === "measurement");
    expect(measurementL5).toHaveLength(4);

    const spaceL5 = l5Lessons.filter((l) => l.strand === "space");
    expect(spaceL5).toHaveLength(3);

    const statisticsL5 = l5Lessons.filter((l) => l.strand === "statistics");
    expect(statisticsL5).toHaveLength(3);

    const probabilityL5 = l5Lessons.filter((l) => l.strand === "probability");
    expect(probabilityL5).toHaveLength(2);

    const englishL5 = l5Lessons.filter((l) =>
      ["language", "literature", "literacy"].includes(l.strand),
    );
    expect(englishL5).toHaveLength(26);

    const languageL5 = l5Lessons.filter((l) => l.strand === "language");
    expect(languageL5).toHaveLength(9);

    const literatureL5 = l5Lessons.filter((l) => l.strand === "literature");
    expect(literatureL5).toHaveLength(5);

    const literacyL5 = l5Lessons.filter((l) => l.strand === "literacy");
    expect(literacyL5).toHaveLength(12);
  });

  it("every lesson strictly satisfies the Zod lessonSchema", () => {
    for (const lesson of lessons) {
      const parsed = lessonSchema.parse(lesson);
      expect(parsed.curriculumCode).toBe(lesson.curriculumCode);
      expect(parsed.learningIntention.length).toBeGreaterThanOrEqual(10);
      expect(parsed.successCriteria.length).toBeGreaterThanOrEqual(1);
      expect(parsed.sections.length).toBeGreaterThanOrEqual(2);
      expect(parsed.provenance.originalityStatement.length).toBeGreaterThanOrEqual(10);
    }
  });

  it("all 104 lessons across all 18 pathways retain 'published' status for live student serving", () => {
    const published = getPublishedLessons();
    expect(published).toHaveLength(104);
    for (const pub of published) {
      expect(pub.status).toBe("published");
    }

    const drafts = lessons.filter((l) => l.status === "draft");
    expect(drafts).toHaveLength(0);
  });

  it("prerequisite dependencies form a strictly valid acyclic graph (DAG) with no self-references or missing nodes", () => {
    const lessonCodes = new Set(lessons.map((l) => l.curriculumCode));

    for (const lesson of lessons) {
      for (const prereq of lesson.prerequisites) {
        expect(lessonCodes.has(prereq)).toBe(true);
        expect(prereq).not.toBe(lesson.curriculumCode);
      }
    }
  });

  it("retrieves lessons by curriculum code with published filtering options", () => {
    const l3Lesson = getLessonByCode("VC2M3N01", { publishedOnly: true });
    expect(l3Lesson).toBeDefined();
    expect(l3Lesson?.curriculumCode).toBe("VC2M3N01");

    const l5Lesson = getLessonByCode("VC2M5N01", { publishedOnly: true });
    expect(l5Lesson).toBeDefined();
    expect(l5Lesson?.curriculumCode).toBe("VC2M5N01");

    const nonExistent = getLessonByCode("NON_EXISTENT", { publishedOnly: true });
    expect(nonExistent).toBeUndefined();
  });

  /* ──────────────────────────────────────────────────
     Level 3 pathway builder tests
  ────────────────────────────────────────────────── */

  it("builds all 9 Level 3 strand pathways correctly with includeDrafts options", () => {
    const l3Pathways = getAllLevel3Pathways({ includeDrafts: true });
    expect(l3Pathways).toHaveLength(9);

    const totalL3Nodes = l3Pathways.reduce((acc, p) => acc + p.nodes.length, 0);
    expect(totalL3Nodes).toBe(54);

    expect(getLevel3NumberPathway().nodes).toHaveLength(9);
    expect(getLevel3AlgebraPathway().nodes).toHaveLength(3);
    expect(getLevel3MeasurementPathway().nodes).toHaveLength(5);
    expect(getLevel3SpacePathway().nodes).toHaveLength(2);
    expect(getLevel3StatisticsPathway().nodes).toHaveLength(3);
    expect(getLevel3ProbabilityPathway().nodes).toHaveLength(2);
    expect(getLevel3LanguagePathway().nodes).toHaveLength(12);
    expect(getLevel3LiteraturePathway().nodes).toHaveLength(5);
    expect(getLevel3LiteracyPathway().nodes).toHaveLength(13);
  });

  it("Level 3 pathways carry 'Level 3' in the level field", () => {
    for (const pathway of getAllLevel3Pathways()) {
      expect(pathway.level).toBe("Level 3");
    }
  });

  /* ──────────────────────────────────────────────────
     Level 5 pathway builder tests
  ────────────────────────────────────────────────── */

  it("builds all 9 Level 5 strand pathways correctly with includeDrafts options", () => {
    const l5Pathways = getAllLevel5Pathways({ includeDrafts: true });
    expect(l5Pathways).toHaveLength(9);

    const totalL5Nodes = l5Pathways.reduce((acc, p) => acc + p.nodes.length, 0);
    expect(totalL5Nodes).toBe(50);

    expect(getLevel5NumberPathway().nodes).toHaveLength(10);
    expect(getLevel5AlgebraPathway().nodes).toHaveLength(2);
    expect(getLevel5MeasurementPathway().nodes).toHaveLength(4);
    expect(getLevel5SpacePathway().nodes).toHaveLength(3);
    expect(getLevel5StatisticsPathway().nodes).toHaveLength(3);
    expect(getLevel5ProbabilityPathway().nodes).toHaveLength(2);
    expect(getLevel5LanguagePathway().nodes).toHaveLength(9);
    expect(getLevel5LiteraturePathway().nodes).toHaveLength(5);
    expect(getLevel5LiteracyPathway().nodes).toHaveLength(12);
  });

  it("Level 5 pathways carry 'Level 5' in the level field", () => {
    for (const pathway of getAllLevel5Pathways()) {
      expect(pathway.level).toBe("Level 5");
    }
  });

  /* ──────────────────────────────────────────────────
     Year-aware pathway API tests
  ────────────────────────────────────────────────── */

  it("getCurriculumPathwaysForYearLevel(3) returns 9 Level 3 pathways with 54 total nodes", () => {
    const pathways = getCurriculumPathwaysForYearLevel(3);
    expect(pathways).toHaveLength(9);
    const total = pathways.reduce((acc, p) => acc + p.nodes.length, 0);
    expect(total).toBe(54);
    for (const p of pathways) {
      expect(p.level).toBe("Level 3");
    }
  });

  it("getCurriculumPathwaysForYearLevel(5) returns 9 Level 5 pathways with 50 total nodes", () => {
    const pathways = getCurriculumPathwaysForYearLevel(5);
    expect(pathways).toHaveLength(9);
    const total = pathways.reduce((acc, p) => acc + p.nodes.length, 0);
    expect(total).toBe(50);
    for (const p of pathways) {
      expect(p.level).toBe("Level 5");
    }
  });

  it("getCurriculumPathwaysForYearLevel(null) returns an empty array — no silent fallback", () => {
    const pathways = getCurriculumPathwaysForYearLevel(null);
    expect(pathways).toHaveLength(0);
  });

  it("getCurriculumPathwaysForYearLevel for an unsupported year returns an empty array", () => {
    for (const year of [1, 2, 4, 6, 7, 8, 9, 10, 99]) {
      const pathways = getCurriculumPathwaysForYearLevel(year);
      expect(pathways).toHaveLength(0);
    }
  });

  it("hasCurriculumPathwaysForYearLevel correctly identifies supported year levels", () => {
    expect(hasCurriculumPathwaysForYearLevel(3)).toBe(true);
    expect(hasCurriculumPathwaysForYearLevel(5)).toBe(true);
    expect(hasCurriculumPathwaysForYearLevel(null)).toBe(false);
    expect(hasCurriculumPathwaysForYearLevel(4)).toBe(false);
    expect(hasCurriculumPathwaysForYearLevel(1)).toBe(false);
  });

  /* ──────────────────────────────────────────────────
     Curriculum code isolation (no cross-year leakage)
  ────────────────────────────────────────────────── */

  it("no Grade 3 curriculum code appears in the Grade 5 pathway", () => {
    const l3Codes = new Set(
      getCurriculumPathwaysForYearLevel(3)
        .flatMap((p) => p.nodes)
        .map((n) => n.curriculumCode),
    );
    const l5Nodes = getCurriculumPathwaysForYearLevel(5).flatMap((p) => p.nodes);
    for (const node of l5Nodes) {
      expect(l3Codes.has(node.curriculumCode)).toBe(false);
    }
  });

  it("no Grade 5 curriculum code appears in the Grade 3 pathway", () => {
    const l5Codes = new Set(
      getCurriculumPathwaysForYearLevel(5)
        .flatMap((p) => p.nodes)
        .map((n) => n.curriculumCode),
    );
    const l3Nodes = getCurriculumPathwaysForYearLevel(3).flatMap((p) => p.nodes);
    for (const node of l3Nodes) {
      expect(l5Codes.has(node.curriculumCode)).toBe(false);
    }
  });

  it("no duplicate curriculum codes exist across all 104 lessons", () => {
    const codes = lessons.map((l) => l.curriculumCode);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });

  /* ──────────────────────────────────────────────────
     Classroom-only state correctness
  ────────────────────────────────────────────────── */

  it("classroom-only nodes are concept-only lessons without worked examples or online checks", () => {
    for (const lesson of lessons) {
      const workedExamples = lesson.sections.filter((s) => s.kind === "worked_example");
      if (CLASSROOM_ONLY_CURRICULUM_CODES.has(lesson.curriculumCode)) {
        expect(lesson.sections.some((s) => s.kind === "concept")).toBe(true);
        expect(workedExamples.length).toBe(0);
        expect(lesson.sections.some((s) => s.kind === "check")).toBe(false);
      } else {
        expect(workedExamples.length).toBeGreaterThanOrEqual(1);
        for (const we of workedExamples) {
          if (we.kind === "worked_example") {
            expect(we.steps.length).toBeGreaterThanOrEqual(1);
            for (const step of we.steps) {
              expect(step.why).toBeDefined();
              expect(step.why.length).toBeGreaterThanOrEqual(5);
            }
          }
        }
      }
    }
  });
});
