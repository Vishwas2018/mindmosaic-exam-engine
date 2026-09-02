import "server-only";

import curriculumManifestJson from "../../../../content/curriculum-imports/vic-f10-v2-l3-l5.json";
import {
  extractQuestionIdsFromAlignments,
  gatedPracticeCoverageResolver,
} from "@/server/curriculum/gated-practice-coverage";
import { isClassroomOnlyCurriculumNode } from "./classroom-only";
import { getLessonByCode, getPublishedLessons } from "./content";
import { resolveQuestionsForCurriculumNode } from "./resolver";
import type {
  CurriculumLearningAreaId,
  CurriculumLearningAreaPathways,
  CurriculumYearPathways,
  LessonPathway,
  LessonPathwayNode,
} from "./types";

interface ManifestNode {
  nodeId: string;
  officialCode?: string;
}

interface CurriculumManifestProjection {
  nodes: readonly ManifestNode[];
  taxonomyAlignments: readonly {
    curriculumNodeId: string;
    rationale?: string;
    review?: { status?: string };
  }[];
}

interface StrandMetadata {
  id: string;
  title: string;
}

interface LearningAreaMetadata {
  id: CurriculumLearningAreaId;
  title: string;
  curriculumCodePrefix: "VC2M" | "VC2E";
  strands: readonly StrandMetadata[];
}

/** Canonical Victorian Curriculum learning-area and strand order, shared by every year. */
const CURRICULUM_STRUCTURE: readonly LearningAreaMetadata[] = Object.freeze([
  {
    id: "mathematics",
    title: "Mathematics",
    curriculumCodePrefix: "VC2M",
    strands: Object.freeze([
      { id: "number", title: "Number" },
      { id: "algebra", title: "Algebra" },
      { id: "measurement", title: "Measurement" },
      { id: "space", title: "Space" },
      { id: "statistics", title: "Statistics" },
      { id: "probability", title: "Probability" },
    ]),
  },
  {
    id: "english",
    title: "English",
    curriculumCodePrefix: "VC2E",
    strands: Object.freeze([
      { id: "language", title: "Language" },
      { id: "literature", title: "Literature" },
      { id: "literacy", title: "Literacy" },
    ]),
  },
]);

const curriculumManifest = curriculumManifestJson as CurriculumManifestProjection;
const manifestNodeByCode = new Map(
  curriculumManifest.nodes
    .filter((node): node is ManifestNode & { officialCode: string } => Boolean(node.officialCode))
    .map((node) => [node.officialCode, node]),
);
const manifestAlignmentsByNodeId = new Map<string, CurriculumManifestProjection["taxonomyAlignments"]>();

for (const alignment of curriculumManifest.taxonomyAlignments) {
  const current = manifestAlignmentsByNodeId.get(alignment.curriculumNodeId) ?? [];
  manifestAlignmentsByNodeId.set(alignment.curriculumNodeId, [...current, alignment]);
}

function buildPracticeProjection(curriculumCode: string): Pick<
  LessonPathwayNode,
  "questionCount" | "practiceStatus" | "practiceHref"
> {
  if (isClassroomOnlyCurriculumNode(curriculumCode)) {
    return {
      questionCount: 0,
      practiceStatus: "classroom_only",
    };
  }

  const manifestNode = manifestNodeByCode.get(curriculumCode);
  if (!manifestNode) {
    return { questionCount: 0, practiceStatus: "none" };
  }

  const alignments = manifestAlignmentsByNodeId.get(manifestNode.nodeId) ?? [];
  const coverage = gatedPracticeCoverageResolver(manifestNode.nodeId, alignments);
  const approvedIds = new Set(
    extractQuestionIdsFromAlignments(alignments, { onlyApproved: true }),
  );
  const governedQuestions = resolveQuestionsForCurriculumNode(curriculumCode).filter((question) =>
    approvedIds.has(question.id),
  );

  // The manifest gate and student resolver must agree. Any drift fails closed.
  const questionCount =
    coverage.supportingContentCount === governedQuestions.length
      ? governedQuestions.length
      : 0;
  const practiceStatus =
    questionCount >= 5 ? "covered" : questionCount > 0 ? "partial" : "none";

  return {
    questionCount,
    practiceStatus,
    practiceHref:
      questionCount > 0
        ? `/practice/session?curriculumCode=${encodeURIComponent(curriculumCode)}&count=${Math.min(5, questionCount)}`
        : undefined,
  };
}

function buildPathway(
  level: string,
  strand: StrandMetadata,
  lessons: ReturnType<typeof getPublishedLessons>,
): LessonPathway {
  const nodes: LessonPathwayNode[] = lessons.map((lesson, index) => ({
    curriculumCode: lesson.curriculumCode,
    lessonHref: `/student/learn/lessons/${lesson.curriculumCode}`,
    title: lesson.title,
    strand: lesson.strand,
    level: lesson.level,
    sortOrder: index + 1,
    estimatedMinutes: lesson.estimatedMinutes,
    learningIntention: lesson.learningIntention,
    prerequisites: lesson.prerequisites,
    status: lesson.status,
    ...buildPracticeProjection(lesson.curriculumCode),
  }));

  return {
    strand: strand.id,
    level,
    title: strand.title,
    description: `${nodes.length} sequenced ${level} ${strand.title} lessons from the Victorian Curriculum F-10 Version 2.0.`,
    nodes,
  };
}

/**
 * Projects the authoritative published lesson registry into learning area -> strand -> lesson
 * navigation for a student's real year level. Unsupported or missing years return an honest
 * empty result; there is deliberately no Grade 3 fallback.
 */
export function getCurriculumPathwaysForYearLevel(
  yearLevel: number | null | undefined,
): CurriculumYearPathways {
  const requestedYearLevel = typeof yearLevel === "number" ? yearLevel : null;
  const level = requestedYearLevel === null ? null : `Level ${requestedYearLevel}`;
  const lessons = level
    ? getPublishedLessons().filter((lesson) => lesson.level === level)
    : [];

  if (lessons.length === 0 || level === null) {
    return {
      yearLevel: requestedYearLevel,
      level: null,
      lessonCount: 0,
      learningAreas: [],
    };
  }

  const learningAreas: CurriculumLearningAreaPathways[] = CURRICULUM_STRUCTURE.map((area) => {
    const areaLessons = lessons.filter((lesson) =>
      lesson.curriculumCode.startsWith(area.curriculumCodePrefix),
    );
    const pathways = area.strands
      .map((strand) =>
        buildPathway(
          level,
          strand,
          areaLessons.filter((lesson) => lesson.strand === strand.id),
        ),
      )
      .filter((pathway) => pathway.nodes.length > 0);

    return {
      id: area.id,
      title: area.title,
      lessonCount: pathways.reduce((total, pathway) => total + pathway.nodes.length, 0),
      pathways,
    };
  }).filter((area) => area.lessonCount > 0);

  return {
    yearLevel: requestedYearLevel,
    level,
    lessonCount: learningAreas.reduce((total, area) => total + area.lessonCount, 0),
    learningAreas,
  };
}

/** Returns a published lesson only when it belongs to the student's supported year level. */
export function getPublishedLessonForYearLevel(
  curriculumCode: string,
  yearLevel: number | null | undefined,
) {
  if (typeof yearLevel !== "number") return undefined;

  const lesson = getLessonByCode(curriculumCode.toUpperCase(), { publishedOnly: true });
  return lesson?.level === `Level ${yearLevel}` ? lesson : undefined;
}
