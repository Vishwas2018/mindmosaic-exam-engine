import type { Lesson, LessonPathway, LessonPathwayNode } from "../types";
import { getMappedQuestionIdsForNode } from "../resolver";
import { LEVEL_3_NUMBER_LESSONS } from "./level-3-number";
import { LEVEL_3_ALGEBRA_LESSONS } from "./level-3-algebra";
import { LEVEL_3_MEASUREMENT_LESSONS } from "./level-3-measurement";
import { LEVEL_3_SPACE_LESSONS } from "./level-3-space";
import { LEVEL_3_STATISTICS_LESSONS } from "./level-3-statistics";
import { LEVEL_3_PROBABILITY_LESSONS } from "./level-3-probability";
import { LEVEL_3_ENGLISH_LANGUAGE_LESSONS } from "./level-3-english-language";
import { LEVEL_3_ENGLISH_LITERATURE_LESSONS } from "./level-3-english-literature";
import { LEVEL_3_ENGLISH_LITERACY_LESSONS } from "./level-3-english-literacy";

export * from "./level-3-number";
export * from "./level-3-algebra";
export * from "./level-3-measurement";
export * from "./level-3-space";
export * from "./level-3-statistics";
export * from "./level-3-probability";
export * from "./level-3-english-language";
export * from "./level-3-english-literature";
export * from "./level-3-english-literacy";

const ALL_LESSONS: readonly Lesson[] = Object.freeze([
  ...LEVEL_3_NUMBER_LESSONS,
  ...LEVEL_3_ALGEBRA_LESSONS,
  ...LEVEL_3_MEASUREMENT_LESSONS,
  ...LEVEL_3_SPACE_LESSONS,
  ...LEVEL_3_STATISTICS_LESSONS,
  ...LEVEL_3_PROBABILITY_LESSONS,
  ...LEVEL_3_ENGLISH_LANGUAGE_LESSONS,
  ...LEVEL_3_ENGLISH_LITERATURE_LESSONS,
  ...LEVEL_3_ENGLISH_LITERACY_LESSONS,
]);

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

function buildPathwayFromLessons(
  lessons: readonly Lesson[],
  strand: string,
  title: string,
  description: string,
  options?: { includeDrafts?: boolean },
): LessonPathway {
  const includeDrafts = options?.includeDrafts ?? false;
  const filtered = lessons.filter(
    (lesson) => includeDrafts || lesson.status === "published",
  );
  const nodes: LessonPathwayNode[] = filtered.map((lesson, index) => ({
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
    strand,
    level: "Level 3",
    title,
    description,
    nodes,
  };
}

export function getLevel3NumberPathway(options?: { includeDrafts?: boolean }): LessonPathway {
  return buildPathwayFromLessons(
    LEVEL_3_NUMBER_LESSONS,
    "number",
    "Victorian Curriculum Level 3: Number Pathway",
    "A structured 9-lesson pathway covering odd/even numbers, place value up to 10,000, fractions, partitioning arithmetic, arrays, estimation, money, modelling, and algorithms.",
    options,
  );
}

export function getLevel3AlgebraPathway(options?: { includeDrafts?: boolean }): LessonPathway {
  return buildPathwayFromLessons(
    LEVEL_3_ALGEBRA_LESSONS,
    "algebra",
    "Victorian Curriculum Level 3: Algebra Pathway",
    "A structured 3-lesson pathway covering inverse relationships, flexible mental strategies, and multiplication/division fact families.",
    options,
  );
}

export function getLevel3MeasurementPathway(options?: { includeDrafts?: boolean }): LessonPathway {
  return buildPathwayFromLessons(
    LEVEL_3_MEASUREMENT_LESSONS,
    "measurement",
    "Victorian Curriculum Level 3: Measurement Pathway",
    "A structured 5-lesson pathway covering metric units, scaled instruments, time conversions, clock reading to the minute, and angles as measures of turn.",
    options,
  );
}

export function getLevel3SpacePathway(options?: { includeDrafts?: boolean }): LessonPathway {
  return buildPathwayFromLessons(
    LEVEL_3_SPACE_LESSONS,
    "space",
    "Victorian Curriculum Level 3: Space Pathway",
    "A structured 2-lesson pathway exploring 3D object features (prisms, pyramids) and alpha-numeric grid mapping.",
    options,
  );
}

export function getLevel3StatisticsPathway(options?: { includeDrafts?: boolean }): LessonPathway {
  return buildPathwayFromLessons(
    LEVEL_3_STATISTICS_LESSONS,
    "statistics",
    "Victorian Curriculum Level 3: Statistics Pathway",
    "A structured 3-lesson pathway covering categorical tallying, column/picture graphs, and statistical investigations.",
    options,
  );
}

export function getLevel3ProbabilityPathway(options?: { includeDrafts?: boolean }): LessonPathway {
  return buildPathwayFromLessons(
    LEVEL_3_PROBABILITY_LESSONS,
    "probability",
    "Victorian Curriculum Level 3: Probability Pathway",
    "A structured 2-lesson pathway exploring qualitative chance language along a continuum and repeated trial experiments.",
    options,
  );
}

export function getLevel3LanguagePathway(options?: { includeDrafts?: boolean }): LessonPathway {
  return buildPathwayFromLessons(
    LEVEL_3_ENGLISH_LANGUAGE_LESSONS,
    "language",
    "Victorian Curriculum Level 3: English Language Pathway",
    "A comprehensive 12-lesson pathway covering sentence structure, clauses, verb tenses, modality, text layout, vocabulary, and apostrophe mechanics.",
    options,
  );
}

export function getLevel3LiteraturePathway(options?: { includeDrafts?: boolean }): LessonPathway {
  return buildPathwayFromLessons(
    LEVEL_3_ENGLISH_LITERATURE_LESSONS,
    "literature",
    "Victorian Curriculum Level 3: English Literature Pathway",
    "A rich 5-lesson pathway exploring character motivations, narrative arcs, setting/cultural contexts, poetic devices, and imaginative adaptation.",
    options,
  );
}

export function getLevel3LiteracyPathway(options?: { includeDrafts?: boolean }): LessonPathway {
  return buildPathwayFromLessons(
    LEVEL_3_ENGLISH_LITERACY_LESSONS,
    "literacy",
    "Victorian Curriculum Level 3: English Literacy Pathway",
    "A rigorous 13-lesson pathway covering phonics syllable division, morphology affixes, silent letter patterns, homophones, comprehension, paragraph writing, editing, and cursive handwriting.",
    options,
  );
}

export function getAllLevel3Pathways(options?: { includeDrafts?: boolean }): readonly LessonPathway[] {
  return Object.freeze([
    getLevel3NumberPathway(options),
    getLevel3AlgebraPathway(options),
    getLevel3MeasurementPathway(options),
    getLevel3SpacePathway(options),
    getLevel3StatisticsPathway(options),
    getLevel3ProbabilityPathway(options),
    getLevel3LanguagePathway(options),
    getLevel3LiteraturePathway(options),
    getLevel3LiteracyPathway(options),
  ]);
}
