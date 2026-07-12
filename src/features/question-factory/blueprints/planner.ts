import type { ExamStyle } from "@/features/exam-engine/types";

import { skillTaxonomyRegistry } from "../taxonomy";
import type { TaxonomyDifficulty, TaxonomySubject } from "../taxonomy";
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
 * and the entry itself support, each targeting the same `targetCount`.
 *
 * Two deliberate anti-bias measures, both pure functions of the request and
 * the (already-deterministic) taxonomy registry, so re-running the same
 * request always produces byte-identical output:
 *
 *  - Question type and visual type are chosen by deterministic round-robin
 *    over each entry's own `recommendedQuestionTypes` /
 *    `recommendedVisualTypes` — in the entry's *authored* order, never
 *    re-sorted alphabetically — keyed by that blueprint's position within
 *    the entry's own row list. An entry offering `["multiple_choice",
 *    "short_answer"]` alternates between the two across its blueprints
 *    instead of emitting `multiple_choice` (or whichever option happens to
 *    sort first) every time.
 *  - Entries are interleaved round-robin in the final output (one row from
 *    each eligible entry per round, entries visited in a stable
 *    id-ordered rotation) rather than emitted one entry's full row block
 *    at a time. A stable base ordering is still required for determinism
 *    — taxonomy entries have no other canonical order — but nothing
 *    downstream that takes the first N rows of a batch ends up with an
 *    alphabetical prefix of taxonomy ids; it gets a fair cross-section.
 *
 * Difficulty is not selected from a set at all: every (year level x exam
 * style x difficulty) combination allowed by both the request and the
 * entry gets its own blueprint, so there is nothing to rotate there.
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
    // A stable base ordering is required for determinism (taxonomy entries
    // have no other canonical order); the round-robin interleave below is
    // what keeps this from becoming an alphabetical-preference bias.
    .sort((a, b) => a.id.localeCompare(b.id));

  const rowsByEntry: BlueprintInputRow[][] = [];

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

    const entryRows: BlueprintInputRow[] = [];
    for (const yearLevel of yearLevels) {
      for (const examStyle of examStyles) {
        for (const difficulty of difficulties) {
          const rotation = entryRows.length;
          const questionType = selectFromRotation(entry.recommendedQuestionTypes, rotation)!;
          // `hotspot_svg` cannot rotate independently of questionType: a
          // hotspot question always requires it, and no other question
          // type may use it (validateBlueprint enforces both directions).
          // Keep the rotation fair over the *compatible* visual-type pool
          // for whichever questionType this row landed on.
          const visualType =
            questionType === "hotspot"
              ? entry.recommendedVisualTypes.includes("hotspot_svg")
                ? "hotspot_svg"
                : undefined
              : selectFromRotation(
                  entry.recommendedVisualTypes.filter((visual) => visual !== "hotspot_svg"),
                  rotation,
                );
          entryRows.push({
            entryId: entry.id,
            yearLevel,
            examStyle,
            difficulty,
            questionType,
            visualType,
          });
        }
      }
    }
    if (entryRows.length > 0) rowsByEntry.push(entryRows);
  }

  const plans = interleaveRoundRobin(rowsByEntry);

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

/** Deterministic round-robin pick from `options` at position `rotation`; `undefined` when empty. */
function selectFromRotation<T>(options: readonly T[], rotation: number): T | undefined {
  return options.length > 0 ? options[rotation % options.length] : undefined;
}

/**
 * Interleaves each entry's own row list round-robin: round 0 takes row 0
 * from every entry that has one (in `groups`' order), round 1 takes row 1
 * from every entry that still has one, and so on, until every row from
 * every group has been emitted exactly once. Pure function of `groups`'
 * order and contents, so it is exactly as deterministic as its input.
 */
function interleaveRoundRobin<T>(groups: readonly (readonly T[])[]): T[] {
  const result: T[] = [];
  const maxRows = Math.max(0, ...groups.map((group) => group.length));
  for (let round = 0; round < maxRows; round++) {
    for (const group of groups) {
      const row = group[round];
      if (row !== undefined) result.push(row);
    }
  }
  return result;
}

interface BlueprintInputRow {
  readonly entryId: string;
  readonly yearLevel: BlueprintYearLevel;
  readonly examStyle: ExamStyle;
  readonly difficulty: TaxonomyDifficulty;
  readonly questionType: string;
  readonly visualType: string | undefined;
}
