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
} from "@/features/curriculum/lessons/content";
import { lessonSchema } from "@/features/curriculum/lessons/schema";

describe("Victorian Curriculum Level 3 (Grade 3) Lessons Content Suite", () => {
  const lessons = getAllLessons();

  it("contains exactly 54 authored lessons covering the entire Victorian Level 3 catalogue", () => {
    expect(lessons).toHaveLength(54);
  });

  it("contains all 24 Mathematics lessons across all 6 strands", () => {
    const mathsLessons = lessons.filter((l) =>
      ["number", "algebra", "measurement", "space", "statistics", "probability"].includes(l.strand),
    );
    expect(mathsLessons).toHaveLength(24);

    const numberLessons = lessons.filter((l) => l.strand === "number");
    expect(numberLessons).toHaveLength(9);

    const algebraLessons = lessons.filter((l) => l.strand === "algebra");
    expect(algebraLessons).toHaveLength(3);

    const measurementLessons = lessons.filter((l) => l.strand === "measurement");
    expect(measurementLessons).toHaveLength(5);

    const spaceLessons = lessons.filter((l) => l.strand === "space");
    expect(spaceLessons).toHaveLength(2);

    const statisticsLessons = lessons.filter((l) => l.strand === "statistics");
    expect(statisticsLessons).toHaveLength(3);

    const probabilityLessons = lessons.filter((l) => l.strand === "probability");
    expect(probabilityLessons).toHaveLength(2);
  });

  it("contains all 30 English lessons across all 3 strands", () => {
    const englishLessons = lessons.filter((l) =>
      ["language", "literature", "literacy"].includes(l.strand),
    );
    expect(englishLessons).toHaveLength(30);

    const languageLessons = lessons.filter((l) => l.strand === "language");
    expect(languageLessons).toHaveLength(12);

    const literatureLessons = lessons.filter((l) => l.strand === "literature");
    expect(literatureLessons).toHaveLength(5);

    const literacyLessons = lessons.filter((l) => l.strand === "literacy");
    expect(literacyLessons).toHaveLength(13);
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

  it("all 54 lessons across all 9 strands retain 'published' status for live student serving", () => {
    const published = getPublishedLessons();
    expect(published).toHaveLength(54);
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
    const pubLesson = getLessonByCode("VC2M3N01", { publishedOnly: true });
    expect(pubLesson).toBeDefined();
    expect(pubLesson?.curriculumCode).toBe("VC2M3N01");

    const algebraLesson = getLessonByCode("VC2M3A01", { publishedOnly: true });
    expect(algebraLesson).toBeDefined();
    expect(algebraLesson?.curriculumCode).toBe("VC2M3A01");

    const nonExistent = getLessonByCode("NON_EXISTENT", { publishedOnly: true });
    expect(nonExistent).toBeUndefined();
  });

  it("builds all 9 strand pathways correctly with includeDrafts options", () => {
    const allPathwaysWithDrafts = getAllLevel3Pathways({ includeDrafts: true });
    expect(allPathwaysWithDrafts).toHaveLength(9);

    const totalNodes = allPathwaysWithDrafts.reduce((acc, p) => acc + p.nodes.length, 0);
    expect(totalNodes).toBe(54);

    expect(getLevel3NumberPathway().nodes).toHaveLength(9);
    expect(getLevel3AlgebraPathway({ includeDrafts: true }).nodes).toHaveLength(3);
    expect(getLevel3MeasurementPathway({ includeDrafts: true }).nodes).toHaveLength(5);
    expect(getLevel3SpacePathway({ includeDrafts: true }).nodes).toHaveLength(2);
    expect(getLevel3StatisticsPathway({ includeDrafts: true }).nodes).toHaveLength(3);
    expect(getLevel3ProbabilityPathway({ includeDrafts: true }).nodes).toHaveLength(2);
    expect(getLevel3LanguagePathway({ includeDrafts: true }).nodes).toHaveLength(12);
    expect(getLevel3LiteraturePathway({ includeDrafts: true }).nodes).toHaveLength(5);
    expect(getLevel3LiteracyPathway({ includeDrafts: true }).nodes).toHaveLength(13);
  });

  it("non-digital classroom nodes do not force worked examples while all other lessons include verified worked examples", () => {
    const NON_DIGITAL_NODES = new Set([
      "VC2E3LA01",
      "VC2E3LE02",
      "VC2E3LE05",
      "VC2E3LY01",
      "VC2E3LY02",
      "VC2E3LY13",
    ]);

    for (const lesson of lessons) {
      const workedExamples = lesson.sections.filter((s) => s.kind === "worked_example");
      if (NON_DIGITAL_NODES.has(lesson.curriculumCode)) {
        expect(workedExamples.length).toBe(0);
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
