import type { ExamStyle } from "@/features/exam-engine/types";

import { skillTaxonomyRegistry } from "../taxonomy";
import type { TaxonomyDifficulty, TaxonomySubject } from "../taxonomy";
import { BLUEPRINT_LIMITS } from "./limits";
import type { Blueprint } from "./schema";
import { blueprintSchema } from "./schema";
import type { BlueprintYearLevel } from "./types";
import { fromNumericYearLevel } from "./types";

export interface CoverageRequest {
  readonly batchId: string;
  readonly yearLevels: readonly BlueprintYearLevel[];
  readonly examStyles: readonly ExamStyle[];
  /** Restrict to these subjects; omit to plan across every subject. */
  readonly subjects?: readonly TaxonomySubject[];
  /** Restrict to these taxonomy ids; omit to plan across every matching entry. */
  readonly skillIds?: readonly string[];
  /** Restrict to these difficulty bands; omit to use each entry's full supported set. */
  readonly difficulties?: readonly TaxonomyDifficulty[];
  readonly targetCountPerBlueprint: number;
  readonly marks?: number;
  readonly estimatedTimeSecondsPerBlueprint?: number;
  readonly reasoningStepsPerBlueprint?: number;
}

const DEFAULT_MARKS = 1;
const DEFAULT_ESTIMATED_TIME_SECONDS = 60;
const DEFAULT_REASONING_STEPS = 1;

function slugSegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

/**
 * Deterministically plans a balanced batch of blueprints from a coverage
 * request: every matching taxonomy entry gets one blueprint per
 * (year level x exam style x difficulty) combination that both the request
 * and the entry itself support, each targeting the same `targetCount`. The
 * question type is the entry's first recommended type (entries list
 * `recommendedQuestionTypes` in a fixed order); the visual type, if any, is
 * the first recommended visual type. Iteration order is a straight sort by
 * taxonomy id, so re-running the same request produces byte-identical
 * output.
 */
export function planBlueprintBatch(request: CoverageRequest): Blueprint[] {
  const candidateEntries = skillTaxonomyRegistry
    .list()
    .filter((entry) => {
      if (request.skillIds && !request.skillIds.includes(entry.id)) return false;
      if (request.subjects && !request.subjects.includes(entry.subject)) return false;
      return true;
    })
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id));

  const plans: BlueprintInputRow[] = [];

  for (const entry of candidateEntries) {
    if (entry.recommendedQuestionTypes.length === 0) continue;

    const yearLevels = entry.yearLevels
      .map(fromNumericYearLevel)
      .filter((yearLevel) => request.yearLevels.includes(yearLevel))
      .slice()
      .sort();

    const examStyles = entry.examStyles
      .filter((examStyle) => request.examStyles.includes(examStyle))
      .slice()
      .sort();

    const difficulties = entry.supportedDifficulties
      .filter((difficulty) => !request.difficulties || request.difficulties.includes(difficulty))
      .slice()
      .sort();

    const questionType = entry.recommendedQuestionTypes.slice().sort()[0]!;
    const visualType =
      entry.recommendedVisualTypes.length > 0
        ? entry.recommendedVisualTypes.slice().sort()[0]
        : undefined;

    for (const yearLevel of yearLevels) {
      for (const examStyle of examStyles) {
        for (const difficulty of difficulties) {
          plans.push({ entryId: entry.id, yearLevel, examStyle, difficulty, questionType, visualType });
        }
      }
    }
  }

  plans.sort(
    (a, b) =>
      a.entryId.localeCompare(b.entryId) ||
      a.yearLevel.localeCompare(b.yearLevel) ||
      a.examStyle.localeCompare(b.examStyle) ||
      a.difficulty.localeCompare(b.difficulty),
  );

  return plans.map((plan, index) => {
    const entry = skillTaxonomyRegistry.get(plan.entryId)!;
    const idSuffix = slugSegment(
      `${String(index + 1).padStart(3, "0")}-${plan.entryId}-${plan.difficulty}`,
    ).slice(0, 80);

    const blueprintInput = {
      id: `${request.batchId}-bp-${idSuffix}`,
      batchId: request.batchId,
      yearLevel: plan.yearLevel,
      examStyle: plan.examStyle,
      subject: entry.subject,
      strand: entry.strand,
      skill: entry.id,
      difficulty: plan.difficulty,
      questionType: plan.questionType,
      visualType: plan.visualType,
      targetCount: request.targetCountPerBlueprint,
      marks: request.marks ?? DEFAULT_MARKS,
      estimatedTimeSeconds:
        request.estimatedTimeSecondsPerBlueprint ?? DEFAULT_ESTIMATED_TIME_SECONDS,
      learningObjective: `Practise ${entry.displayName.toLowerCase()} at ${plan.difficulty} difficulty.`,
      misconceptionTargets: [],
      reasoningSteps: request.reasoningStepsPerBlueprint ?? DEFAULT_REASONING_STEPS,
      accessibilityConstraints: [],
      originalityConstraints: [],
      generationConstraints: [],
    };

    return blueprintSchema.parse(blueprintInput);
  });
}

interface BlueprintInputRow {
  readonly entryId: string;
  readonly yearLevel: BlueprintYearLevel;
  readonly examStyle: ExamStyle;
  readonly difficulty: TaxonomyDifficulty;
  readonly questionType: string;
  readonly visualType: string | undefined;
}

export { BLUEPRINT_LIMITS };
