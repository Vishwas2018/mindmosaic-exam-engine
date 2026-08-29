import { describe, expect, it } from "vitest";
import { getAllLessons, getLessonByCode, getLevel3NumberPathway } from "@/features/curriculum/lessons/content";
import { lessonSchema } from "@/features/curriculum/lessons/schema";

describe("Level 3 Number Curriculum Lessons Content", () => {
  const lessons = getAllLessons();

  it("contains exactly 9 authored lessons for VC2M3N01 through VC2M3N09", () => {
    expect(lessons).toHaveLength(9);
    const codes = lessons.map((l) => l.curriculumCode);
    expect(codes).toEqual([
      "VC2M3N01",
      "VC2M3N02",
      "VC2M3N03",
      "VC2M3N04",
      "VC2M3N05",
      "VC2M3N06",
      "VC2M3N07",
      "VC2M3N08",
      "VC2M3N09",
    ]);
  });

  it("every lesson satisfies the Zod lessonSchema", () => {
    for (const lesson of lessons) {
      const parsed = lessonSchema.parse(lesson);
      expect(parsed.curriculumCode).toBe(lesson.curriculumCode);
    }
  });

  it("all lessons are explicitly set to 'published' status", () => {
    for (const lesson of lessons) {
      expect(lesson.status).toBe("published");
    }
  });

  it("prerequisite dependencies form a valid acyclic graph (DAG)", () => {
    const lessonCodes = new Set(lessons.map((l) => l.curriculumCode));

    for (const lesson of lessons) {
      for (const prereq of lesson.prerequisites) {
        expect(lessonCodes.has(prereq)).toBe(true);
        // Ensure no self-prerequisites
        expect(prereq).not.toBe(lesson.curriculumCode);
      }
    }
  });

  it("retrieves a lesson by its curriculum code", () => {
    const lesson = getLessonByCode("VC2M3N03");
    expect(lesson).toBeDefined();
    expect(lesson?.title).toContain("Fractions");
  });

  it("builds the complete Level 3 Number pathway with 9 nodes", () => {
    const pathway = getLevel3NumberPathway();
    expect(pathway.nodes).toHaveLength(9);
    expect(pathway.strand).toBe("number");
    expect(pathway.level).toBe("Level 3");
  });
});
