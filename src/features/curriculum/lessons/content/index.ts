import type { Lesson, LessonPathway, LessonPathwayNode } from "../types";
import { getMappedQuestionIdsForNode } from "../resolver";
import { LEVEL_3_NUMBER_LESSONS } from "./level-3-number";

export * from "./level-3-number";

const ALL_LESSONS: readonly Lesson[] = Object.freeze([...LEVEL_3_NUMBER_LESSONS]);

const LESSON_MAP = new Map<string, Lesson>();
for (const lesson of ALL_LESSONS) {
  LESSON_MAP.set(lesson.curriculumCode, lesson);
}

export function getAllLessons(): readonly Lesson[] {
  return ALL_LESSONS;
}

export function getPublishedLessons(): readonly Lesson[] {
  return ALL_LESSONS.filter((l) => l.status === "published");
}

export function getLessonByCode(
  curriculumCode: string,
  options?: { publishedOnly?: boolean },
): Lesson | undefined {
  const lesson = LESSON_MAP.get(curriculumCode);
  if (!lesson) return undefined;
  if (options?.publishedOnly && lesson.status !== "published") return undefined;
  return lesson;
}

export function getLevel3NumberPathway(options?: { includeDrafts?: boolean }): LessonPathway {
  const includeDrafts = options?.includeDrafts ?? false;
  const lessons = LEVEL_3_NUMBER_LESSONS.filter(
    (lesson) => includeDrafts || lesson.status === "published",
  );
  const nodes: LessonPathwayNode[] = lessons.map((lesson, index) => ({
    curriculumCode: lesson.curriculumCode,
    title: lesson.title,
    strand: lesson.strand,
    level: lesson.level,
    sortOrder: index + 1,
    estimatedMinutes: lesson.estimatedMinutes,
    learningIntention: lesson.learningIntention,
    prerequisites: lesson.prerequisites,
    status: lesson.status,
    questionCount: getMappedQuestionIdsForNode(lesson.curriculumCode).length,
  }));

  return {
    strand: "number",
    level: "Level 3",
    title: "Victorian Curriculum Level 3: Number Pathway",
    description:
      "A structured 9-lesson pathway covering odd/even numbers, place value up to 10,000, fractions, partitioning arithmetic, arrays, estimation, money, modelling, and algorithms.",
    nodes,
  };
}
