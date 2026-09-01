import type {
  Lesson,
  LessonPathway,
  LessonPathwayNode,
  CurriculumLearningArea,
  LearningAreaPathwayGroup,
} from "../types";
import { getMappedQuestionIdsForNode } from "../resolver";
import { isClassroomOnlyCurriculumNode } from "../classroom-only";
import { LEVEL_3_NUMBER_LESSONS } from "./level-3-number";
import { LEVEL_3_ALGEBRA_LESSONS } from "./level-3-algebra";
import { LEVEL_3_MEASUREMENT_LESSONS } from "./level-3-measurement";
import { LEVEL_3_SPACE_LESSONS } from "./level-3-space";
import { LEVEL_3_STATISTICS_LESSONS } from "./level-3-statistics";
import { LEVEL_3_PROBABILITY_LESSONS } from "./level-3-probability";
import { LEVEL_3_ENGLISH_LANGUAGE_LESSONS } from "./level-3-english-language";
import { LEVEL_3_ENGLISH_LITERATURE_LESSONS } from "./level-3-english-literature";
import { LEVEL_3_ENGLISH_LITERACY_LESSONS } from "./level-3-english-literacy";

import { LEVEL_5_NUMBER_LESSONS } from "./level-5-number";
import { LEVEL_5_ALGEBRA_LESSONS } from "./level-5-algebra";
import { LEVEL_5_MEASUREMENT_LESSONS } from "./level-5-measurement";
import { LEVEL_5_SPACE_LESSONS } from "./level-5-space";
import { LEVEL_5_STATISTICS_LESSONS } from "./level-5-statistics";
import { LEVEL_5_PROBABILITY_LESSONS } from "./level-5-probability";
import { LEVEL_5_ENGLISH_LANGUAGE_LESSONS } from "./level-5-english-language";
import { LEVEL_5_ENGLISH_LITERATURE_LESSONS } from "./level-5-english-literature";
import { LEVEL_5_ENGLISH_LITERACY_LESSONS } from "./level-5-english-literacy";

export * from "./level-3-number";
export * from "./level-3-algebra";
export * from "./level-3-measurement";
export * from "./level-3-space";
export * from "./level-3-statistics";
export * from "./level-3-probability";
export * from "./level-3-english-language";
export * from "./level-3-english-literature";
export * from "./level-3-english-literacy";

export * from "./level-5-number";
export * from "./level-5-algebra";
export * from "./level-5-measurement";
export * from "./level-5-space";
export * from "./level-5-statistics";
export * from "./level-5-probability";
export * from "./level-5-english-language";
export * from "./level-5-english-literature";
export * from "./level-5-english-literacy";

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
  ...LEVEL_5_NUMBER_LESSONS,
  ...LEVEL_5_ALGEBRA_LESSONS,
  ...LEVEL_5_MEASUREMENT_LESSONS,
  ...LEVEL_5_SPACE_LESSONS,
  ...LEVEL_5_STATISTICS_LESSONS,
  ...LEVEL_5_PROBABILITY_LESSONS,
  ...LEVEL_5_ENGLISH_LANGUAGE_LESSONS,
  ...LEVEL_5_ENGLISH_LITERATURE_LESSONS,
  ...LEVEL_5_ENGLISH_LITERACY_LESSONS,
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
  level: "Level 3" | "Level 5" = "Level 3",
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
    isClassroomOnly: isClassroomOnlyCurriculumNode(lesson.curriculumCode),
  }));

  return {
    strand,
    level,
    title,
    description,
    nodes,
  };
}

/* ========================================================================== */
/* Level 3 Pathways                                                           */
/* ========================================================================== */

export function getLevel3NumberPathway(options?: { includeDrafts?: boolean }): LessonPathway {
  return buildPathwayFromLessons(
    LEVEL_3_NUMBER_LESSONS,
    "number",
    "Victorian Curriculum Level 3: Number Pathway",
    "A structured 9-lesson pathway covering odd/even numbers, place value up to 10,000, fractions, partitioning arithmetic, arrays, estimation, money, modelling, and algorithms.",
    "Level 3",
    options,
  );
}

export function getLevel3AlgebraPathway(options?: { includeDrafts?: boolean }): LessonPathway {
  return buildPathwayFromLessons(
    LEVEL_3_ALGEBRA_LESSONS,
    "algebra",
    "Victorian Curriculum Level 3: Algebra Pathway",
    "A structured 3-lesson pathway covering inverse relationships, flexible mental strategies, and multiplication/division fact families.",
    "Level 3",
    options,
  );
}

export function getLevel3MeasurementPathway(options?: { includeDrafts?: boolean }): LessonPathway {
  return buildPathwayFromLessons(
    LEVEL_3_MEASUREMENT_LESSONS,
    "measurement",
    "Victorian Curriculum Level 3: Measurement Pathway",
    "A structured 5-lesson pathway covering metric units, scaled instruments, time conversions, clock reading to the minute, and angles as measures of turn.",
    "Level 3",
    options,
  );
}

export function getLevel3SpacePathway(options?: { includeDrafts?: boolean }): LessonPathway {
  return buildPathwayFromLessons(
    LEVEL_3_SPACE_LESSONS,
    "space",
    "Victorian Curriculum Level 3: Space Pathway",
    "A structured 2-lesson pathway exploring 3D object features (prisms, pyramids) and alpha-numeric grid mapping.",
    "Level 3",
    options,
  );
}

export function getLevel3StatisticsPathway(options?: { includeDrafts?: boolean }): LessonPathway {
  return buildPathwayFromLessons(
    LEVEL_3_STATISTICS_LESSONS,
    "statistics",
    "Victorian Curriculum Level 3: Statistics Pathway",
    "A structured 3-lesson pathway covering categorical tallying, column/picture graphs, and statistical investigations.",
    "Level 3",
    options,
  );
}

export function getLevel3ProbabilityPathway(options?: { includeDrafts?: boolean }): LessonPathway {
  return buildPathwayFromLessons(
    LEVEL_3_PROBABILITY_LESSONS,
    "probability",
    "Victorian Curriculum Level 3: Probability Pathway",
    "A structured 2-lesson pathway exploring qualitative chance language along a continuum and repeated trial experiments.",
    "Level 3",
    options,
  );
}

export function getLevel3LanguagePathway(options?: { includeDrafts?: boolean }): LessonPathway {
  return buildPathwayFromLessons(
    LEVEL_3_ENGLISH_LANGUAGE_LESSONS,
    "language",
    "Victorian Curriculum Level 3: English Language Pathway",
    "A comprehensive 12-lesson pathway covering sentence structure, clauses, verb tenses, modality, text layout, vocabulary, and apostrophe mechanics.",
    "Level 3",
    options,
  );
}

export function getLevel3LiteraturePathway(options?: { includeDrafts?: boolean }): LessonPathway {
  return buildPathwayFromLessons(
    LEVEL_3_ENGLISH_LITERATURE_LESSONS,
    "literature",
    "Victorian Curriculum Level 3: English Literature Pathway",
    "A rich 5-lesson pathway exploring character motivations, narrative arcs, setting/cultural contexts, poetic devices, and imaginative adaptation.",
    "Level 3",
    options,
  );
}

export function getLevel3LiteracyPathway(options?: { includeDrafts?: boolean }): LessonPathway {
  return buildPathwayFromLessons(
    LEVEL_3_ENGLISH_LITERACY_LESSONS,
    "literacy",
    "Victorian Curriculum Level 3: English Literacy Pathway",
    "A rigorous 13-lesson pathway covering phonics syllable division, morphology affixes, silent letter patterns, homophones, comprehension, paragraph writing, editing, and cursive handwriting.",
    "Level 3",
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

/* ========================================================================== */
/* Level 5 Pathways                                                           */
/* ========================================================================== */

export function getLevel5NumberPathway(options?: { includeDrafts?: boolean }): LessonPathway {
  return buildPathwayFromLessons(
    LEVEL_5_NUMBER_LESSONS,
    "number",
    "Victorian Curriculum Level 5: Number Pathway",
    "A comprehensive 10-lesson pathway covering factor trees, square/prime numbers, decimal arithmetic, percentages, fraction arithmetic, multi-digit multiplication, division remainders, rounding, multi-step modelling, and algorithms.",
    "Level 5",
    options,
  );
}

export function getLevel5AlgebraPathway(options?: { includeDrafts?: boolean }): LessonPathway {
  return buildPathwayFromLessons(
    LEVEL_5_ALGEBRA_LESSONS,
    "algebra",
    "Victorian Curriculum Level 5: Algebra Pathway",
    "A structured 2-lesson pathway exploring multiplication/division fact families, inverse cancellation, and solving unknown variables in linear equations.",
    "Level 5",
    options,
  );
}

export function getLevel5MeasurementPathway(options?: { includeDrafts?: boolean }): LessonPathway {
  return buildPathwayFromLessons(
    LEVEL_5_MEASUREMENT_LESSONS,
    "measurement",
    "Victorian Curriculum Level 5: Measurement Pathway",
    "A rigorous 4-lesson pathway covering metric unit conversions, perimeter/area formulas, grid-based composite volume, and 12/24-hour time across time zones.",
    "Level 5",
    options,
  );
}

export function getLevel5SpacePathway(options?: { includeDrafts?: boolean }): LessonPathway {
  return buildPathwayFromLessons(
    LEVEL_5_SPACE_LESSONS,
    "space",
    "Victorian Curriculum Level 5: Space Pathway",
    "A structured 3-lesson pathway exploring 3D polyhedra nets, Cartesian coordinate quadrants, and transformational geometry (translations, reflections, rotations).",
    "Level 5",
    options,
  );
}

export function getLevel5StatisticsPathway(options?: { includeDrafts?: boolean }): LessonPathway {
  return buildPathwayFromLessons(
    LEVEL_5_STATISTICS_LESSONS,
    "statistics",
    "Victorian Curriculum Level 5: Statistics Pathway",
    "A structured 3-lesson pathway exploring modes/medians, continuous line graphs, and statistical investigations with unbiased random sampling.",
    "Level 5",
    options,
  );
}

export function getLevel5ProbabilityPathway(options?: { includeDrafts?: boolean }): LessonPathway {
  return buildPathwayFromLessons(
    LEVEL_5_PROBABILITY_LESSONS,
    "probability",
    "Victorian Curriculum Level 5: Probability Pathway",
    "A structured 2-lesson pathway covering numerical 0-1 probability, complementary events, and repeated chance trials (Law of Large Numbers).",
    "Level 5",
    options,
  );
}

export function getLevel5LanguagePathway(options?: { includeDrafts?: boolean }): LessonPathway {
  return buildPathwayFromLessons(
    LEVEL_5_ENGLISH_LANGUAGE_LESSONS,
    "language",
    "Victorian Curriculum Level 5: English Language Pathway",
    "A comprehensive 9-lesson pathway covering social register, reasoned arguments, genre staging, theme progression, modal verbs, expanded noun groups, multimodal design, complex sentences, and punctuation hierarchy.",
    "Level 5",
    options,
  );
}

export function getLevel5LiteraturePathway(options?: { includeDrafts?: boolean }): LessonPathway {
  return buildPathwayFromLessons(
    LEVEL_5_ENGLISH_LITERATURE_LESSONS,
    "literature",
    "Victorian Curriculum Level 5: English Literature Pathway",
    "A rich 5-lesson pathway exploring historical/cultural literary contexts, symbolism and metalanguage, narrative point of view, figurative imagery, and creative character voice.",
    "Level 5",
    options,
  );
}

export function getLevel5LiteracyPathway(options?: { includeDrafts?: boolean }): LessonPathway {
  return buildPathwayFromLessons(
    LEVEL_5_ENGLISH_LITERACY_LESSONS,
    "literacy",
    "Victorian Curriculum Level 5: English Literacy Pathway",
    "A rigorous 12-lesson pathway covering active listening, oral presentations, morphophonemic phonology, Latin/Greek roots, irregular plurals, comprehension monitoring, societal reflections, navigational literacy, evaluative comprehension, multi-paragraph essays, text editing (ARMS & CUPS), and cursive handwriting.",
    "Level 5",
    options,
  );
}

export function getAllLevel5Pathways(options?: { includeDrafts?: boolean }): readonly LessonPathway[] {
  return Object.freeze([
    getLevel5NumberPathway(options),
    getLevel5AlgebraPathway(options),
    getLevel5MeasurementPathway(options),
    getLevel5SpacePathway(options),
    getLevel5StatisticsPathway(options),
    getLevel5ProbabilityPathway(options),
    getLevel5LanguagePathway(options),
    getLevel5LiteraturePathway(options),
    getLevel5LiteracyPathway(options),
  ]);
}

/* ========================================================================== */
/* Year-level-aware pathway API                                              */
/* ========================================================================== */

/**
 * Authoritative registry of the pathway sets this catalogue has actually
 * authored, keyed by the student's real yearLevel. Extending curriculum
 * coverage to another year means authoring its lesson content and adding one
 * entry here — never branching student-facing logic on the year number.
 */
const PATHWAY_BUILDERS_BY_YEAR_LEVEL: Readonly<
  Record<number, (options?: { includeDrafts?: boolean }) => readonly LessonPathway[]>
> = Object.freeze({
  3: getAllLevel3Pathways,
  5: getAllLevel5Pathways,
});

/**
 * Resolves the full set of strand pathways for a student's real yearLevel.
 *
 * Fails honestly: a null/undefined/unrecognised yearLevel returns an empty
 * array rather than silently defaulting to any particular grade's content.
 */
export function getCurriculumPathwaysForYearLevel(
  yearLevel: number | null | undefined,
  options?: { includeDrafts?: boolean },
): readonly LessonPathway[] {
  if (yearLevel === null || yearLevel === undefined) return Object.freeze([]);
  const buildPathways = PATHWAY_BUILDERS_BY_YEAR_LEVEL[yearLevel];
  return buildPathways ? buildPathways(options) : Object.freeze([]);
}

/** Victorian Curriculum Mathematics and English strands authored in this catalogue. */
const STRAND_TO_LEARNING_AREA: Readonly<Record<string, CurriculumLearningArea>> = Object.freeze({
  number: "Mathematics",
  algebra: "Mathematics",
  measurement: "Mathematics",
  space: "Mathematics",
  statistics: "Mathematics",
  probability: "Mathematics",
  language: "English",
  literature: "English",
  literacy: "English",
});

const LEARNING_AREA_DISPLAY_ORDER: readonly CurriculumLearningArea[] = Object.freeze([
  "Mathematics",
  "English",
]);

/**
 * Groups a flat list of strand pathways into learning areas (Mathematics,
 * English), preserving the strand order each pathway list already arrives
 * in. A learning area with no pathways is omitted rather than shown empty.
 */
export function groupPathwaysByLearningArea(
  pathways: readonly LessonPathway[],
): readonly LearningAreaPathwayGroup[] {
  return Object.freeze(
    LEARNING_AREA_DISPLAY_ORDER.map((learningArea) => ({
      learningArea,
      pathways: pathways.filter((pathway) => STRAND_TO_LEARNING_AREA[pathway.strand] === learningArea),
    })).filter((group) => group.pathways.length > 0),
  );
}
