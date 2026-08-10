import {
  REGISTRY_SUBJECT_BY_FILTER,
  selectExamQuestions,
  type ExamSelectionConfig,
} from "@/features/exam-engine/selection";
import type { AuthoringQuestion } from "@/features/exam-engine/types";

import {
  matchesStrandFilter,
  matchesTypeFilter,
  sourcesInSittingOrder,
  type ExamPattern,
  type PatternSource,
} from "./exam-pattern";
import { MAX_FORMS, unitsInForm } from "./form-partition";
import { packBestEffort, packExact } from "./pack-units";
import { parseProgrammeId } from "./programme-id";
import {
  buildSelectionUnits,
  unitQuestionCount,
  type SelectionUnit,
} from "./selection-units";

/**
 * Sitting a pattern is the EXISTING seeded selection, run once per source and
 * concatenated in sitting order. There is deliberately no second selection
 * algorithm: `selectExamQuestions` still performs the eligibility filter, the
 * seeded shuffle and the take. What this module adds around it is
 *
 *   1. a per-source pool (the source's programme, narrowed by its filters),
 *   2. stimulus GROUPS as the unit of selection, where the pattern says so,
 *   3. stable form partitioning, so three sittings can be provably disjoint,
 *   4. exact packing, so a group-based paper lands on its declared count.
 *
 * Two things it deliberately does NOT do: it does not lock sections (the
 * engine cannot, hence `no_section_lock`), and it never pads a source from
 * outside its own filtered pool.
 */

/** The eligible pool for one source, before grouping or form partitioning. */
export function sourcePool(
  bank: readonly AuthoringQuestion[],
  source: PatternSource,
): readonly AuthoringQuestion[] {
  const scope = parseProgrammeId(source.programmeId);
  if (!scope?.subject) return [];
  const subjectId = REGISTRY_SUBJECT_BY_FILTER[scope.subject];
  /*
   * Year/style/subject eligibility is delegated to the shared filter by
   * building the same config `selectExamQuestions` would, then applying the
   * source's own extra narrowing. Written out rather than calling
   * `filterEligibleQuestions` twice, because the strand/type filters have to
   * apply BEFORE grouping and form partitioning, not after.
   */
  return bank.filter(
    (question) =>
      question.yearLevel === scope.yearLevel &&
      question.examStyle === scope.examStyle &&
      question.metadata.subject === subjectId &&
      matchesStrandFilter(source, question.metadata.strand) &&
      matchesTypeFilter(source, question.type),
  );
}

function sourceConfig(
  source: PatternSource,
  count: number,
): ExamSelectionConfig | undefined {
  const scope = parseProgrammeId(source.programmeId);
  if (!scope?.subject) return undefined;
  return {
    yearLevel: scope.yearLevel,
    examStyle: scope.examStyle,
    subject: scope.subject,
    questionCount: count,
    timing: "timed",
  };
}

/**
 * Seeded shuffle of a source's units, delegated to the existing selection so
 * the shuffle itself has exactly one implementation.
 *
 * `selectExamQuestions` shuffles QUESTIONS, so units are shuffled by
 * shuffling one representative question per unit and reading the units back
 * in that order. A unit's representative is its first question, which
 * `buildSelectionUnits` has already ordered deterministically.
 */
function shuffleUnits(
  units: readonly SelectionUnit[],
  source: PatternSource,
  seed: string,
): readonly SelectionUnit[] {
  if (units.length === 0) return units;
  const representatives = units.map((unit) => unit.questions[0]!);
  const config = sourceConfig(source, representatives.length);
  if (!config) return units;
  const shuffled = selectExamQuestions(representatives, config, seed);
  if (!shuffled.ok) return units;
  const unitByRepresentativeId = new Map(
    units.map((unit) => [unit.questions[0]!.id, unit]),
  );
  return shuffled.questions.flatMap((question) => {
    const unit = unitByRepresentativeId.get(question.id);
    return unit ? [unit] : [];
  });
}

export interface SourceSelection {
  readonly sourceId: string;
  /** What the pattern asks this source for. */
  readonly requested: number;
  /** What the bank actually supplied. */
  readonly served: number;
  readonly questions: readonly AuthoringQuestion[];
  /** True when the source met its full quota. */
  readonly satisfied: boolean;
}

export interface SelectPatternOptions {
  /** Which form to draw within; ignored when `formCount` is 1. */
  readonly form?: number;
  /**
   * How many disjoint forms the bank is being partitioned into. Comes from
   * readiness (`PatternReadiness.distinctPapers`) — a caller must not invent
   * it, or it would partition a bank too thin to fill even one paper.
   */
  readonly formCount?: number;
  /**
   * Draw whatever the bank can supply instead of failing. The result is NOT a
   * full-length paper and must be presented as a practice module with a
   * recalculated count and time (doc §6). Off by default.
   */
  readonly asPracticeModule?: boolean;
}

export type PatternSelectionResult =
  | {
      ok: true;
      questions: readonly AuthoringQuestion[];
      seed: string;
      form: number;
      formCount: number;
      sources: readonly SourceSelection[];
      /** True when this draw is the reduced practice-module fallback. */
      reduced: boolean;
    }
  | {
      ok: false;
      reason: "insufficient_questions";
      sources: readonly SourceSelection[];
      requestedCount: number;
      availableCount: number;
    };

/** Draw one source's questions. Exported for readiness, which asks the same question. */
export function selectSourceQuestions(
  bank: readonly AuthoringQuestion[],
  pattern: ExamPattern,
  source: PatternSource,
  seed: string,
  options: SelectPatternOptions = {},
): SourceSelection {
  const formCount = Math.min(Math.max(options.formCount ?? 1, 1), MAX_FORMS);
  const form = Math.min(Math.max(options.form ?? 0, 0), formCount - 1);

  const pool = sourcePool(bank, source);
  const allUnits = buildSelectionUnits(pool, pattern.stimulusRule);
  const units = shuffleUnits(
    unitsInForm(pattern.id, allUnits, form, formCount),
    source,
    `${seed}#${source.id}`,
  );

  /* Unit-count bounds. A grouped source is bounded by the pattern's
     distinctStimuli; an ungrouped one has one question per unit, so the
     bounds are simply the quota itself. */
  const bounds = pattern.stimulusRule
    ? {
        target: source.count,
        minUnits: pattern.stimulusRule.distinctStimuli[0],
        maxUnits: pattern.stimulusRule.distinctStimuli[1],
      }
    : { target: source.count, minUnits: source.count, maxUnits: source.count };

  const exact = packExact(units, bounds);
  if (exact) {
    return {
      sourceId: source.id,
      requested: source.count,
      served: unitQuestionCount(exact),
      questions: exact.flatMap((unit) => unit.questions),
      satisfied: true,
    };
  }

  if (!options.asPracticeModule) {
    return {
      sourceId: source.id,
      requested: source.count,
      served: 0,
      questions: [],
      satisfied: false,
    };
  }

  /* Fallback: as much as the bank can supply, still in whole units. */
  const best = packBestEffort(units, {
    ...bounds,
    minUnits: 1,
    maxUnits: pattern.stimulusRule ? bounds.maxUnits : source.count,
  });
  return {
    sourceId: source.id,
    requested: source.count,
    served: unitQuestionCount(best),
    questions: best.flatMap((unit) => unit.questions),
    satisfied: false,
  };
}

export function selectPatternQuestions(
  bank: readonly AuthoringQuestion[],
  pattern: ExamPattern,
  seed: string,
  options: SelectPatternOptions = {},
): PatternSelectionResult {
  const formCount = Math.min(Math.max(options.formCount ?? 1, 1), MAX_FORMS);
  const form = Math.min(Math.max(options.form ?? 0, 0), formCount - 1);

  /* Sitting order, not registry order: NAPLAN language sits spelling first.
     For a merged pattern this is only an internal draw order — the child
     sees one undivided paper either way. */
  const sources = sourcesInSittingOrder(pattern).map((source) =>
    selectSourceQuestions(bank, pattern, source, seed, { ...options, form, formCount }),
  );

  const questions = sources.flatMap((source) => source.questions);
  const availableCount = questions.length;

  /* No partial full-length papers (doc §6): unless the caller explicitly
     asked for the reduced practice module, one unsatisfied source fails the
     whole draw. */
  const allSatisfied = sources.every((source) => source.satisfied);
  if (!allSatisfied && !options.asPracticeModule) {
    return {
      ok: false,
      reason: "insufficient_questions",
      sources,
      requestedCount: pattern.questionCount,
      availableCount,
    };
  }
  if (availableCount === 0) {
    return {
      ok: false,
      reason: "insufficient_questions",
      sources,
      requestedCount: pattern.questionCount,
      availableCount: 0,
    };
  }

  return {
    ok: true,
    questions,
    seed,
    form,
    formCount,
    sources,
    reduced: !allSatisfied,
  };
}
