import type { AuthoringQuestion } from "@/features/exam-engine/types";

import type { ExamPattern } from "./exam-pattern";
import { EXAM_PATTERNS } from "./exam-pattern-registry";
import { MAX_FORMS, formIndexes } from "./form-partition";
import { buildSelectionUnits, unitQuestionCount } from "./selection-units";
import { selectPatternQuestions, sourcePool } from "./select-pattern-questions";

/**
 * How much of each paper the gated bank can actually fill.
 *
 * Counted from the same eligible-question filtering `eligibility-summary.ts`
 * performs, but per SOURCE rather than per (year, style, subject) cell:
 * `BankEligibilitySummary` has no strand dimension and no notion of a
 * stimulus group, so it cannot answer "are there 25 spelling items inside the
 * language programme" or "are there six whole passages of 4-7 questions".
 * Both of those bind before the totals do (doc §5), and reporting a total
 * that the sub-quotas cannot actually realise is how a picker ends up
 * offering a paper that fails at start.
 *
 * Readiness therefore answers by running the real selection: same grouping,
 * same packing, same form partitioning. If readiness says startable, starting
 * it works.
 *
 * Callers pass the gated bank; nothing here chooses one, and nothing here
 * ever considers the ungated seed pool.
 */

export type PatternReadinessState =
  /** Every count and composition constraint is satisfiable. */
  | "ready"
  /**
   * Some gated content exists but the full-length shape is not satisfiable.
   * The pattern must NOT be started as a full-length paper; a clearly
   * labelled practice module of what IS available may be offered instead.
   */
  | "short"
  /** Nothing to draw at all, or a deferred pattern. "Coming soon". */
  | "unavailable";

export interface SourceReadiness {
  readonly sourceId: string;
  /** What the pattern asks this source for. */
  readonly requested: number;
  /** Gated questions matching the source's programme and filters. */
  readonly poolSize: number;
  /**
   * Questions inside whole, in-range stimulus groups. Equal to `poolSize`
   * for a pattern with no stimulus rule; lower when questions carry no
   * passage, or sit in a group whose size is out of range.
   */
  readonly groupedPoolSize: number;
  /** Whole passages available, for a pattern with a stimulus rule. */
  readonly stimulusGroups: number;
  /** Whether this source's quota can be met in a single-form draw. */
  readonly satisfiable: boolean;
}

export interface PatternReadiness {
  readonly patternId: string;
  readonly state: PatternReadinessState;
  /** The full-length paper's size. */
  readonly requestedCount: number;
  /**
   * Questions a sitting could serve today. Equals `requestedCount` when
   * ready; otherwise the size of the reduced practice module.
   */
  readonly availableCount: number;
  /**
   * How many provably non-overlapping papers the bank supports, via stable
   * form partitioning (doc §5). 0 when not startable, up to 3.
   */
  readonly distinctPapers: number;
  readonly sources: readonly SourceReadiness[];
}

/* One fixed probe seed. Readiness must be a property of the BANK, not of
   whichever seed a sitting happens to draw; the packing search is
   order-sensitive, so a varying seed would make the same bank read as ready
   on one page load and short on the next. */
const READINESS_SEED = "readiness";

function sourceReadiness(
  bank: readonly AuthoringQuestion[],
  pattern: ExamPattern,
  formCount: number,
): readonly SourceReadiness[] {
  /* One real draw per form, then read each source's outcome off it —
     rather than a draw per (source, form), which repeats the same work. */
  const drawsByForm = formIndexes(formCount).map((form) =>
    selectPatternQuestions(bank, pattern, READINESS_SEED, { form, formCount }),
  );
  return pattern.sources.map((source) => {
    const pool = sourcePool(bank, source);
    const units = buildSelectionUnits(pool, pattern.stimulusRule);
    /* Satisfiable means satisfiable in EVERY form, since a sitting may be on
       any of them. */
    const satisfiable = drawsByForm.every(
      (draw) =>
        draw.sources.find((entry) => entry.sourceId === source.id)?.satisfied ?? false,
    );
    return {
      sourceId: source.id,
      requested: source.count,
      poolSize: pool.length,
      groupedPoolSize: unitQuestionCount(units),
      stimulusGroups: pattern.stimulusRule ? units.length : 0,
      satisfiable,
    };
  });
}

/**
 * The largest number of provably disjoint papers the bank supports: try three
 * forms, then two, then one, and take the first partition in which every
 * source's quota is satisfiable in every form. 0 means not even one paper.
 */
function maxDistinctPapers(
  bank: readonly AuthoringQuestion[],
  pattern: ExamPattern,
): { distinctPapers: number; sources: readonly SourceReadiness[] } {
  for (let formCount = MAX_FORMS; formCount >= 1; formCount -= 1) {
    const sources = sourceReadiness(bank, pattern, formCount);
    if (sources.every((source) => source.satisfiable)) {
      return { distinctPapers: formCount, sources };
    }
  }
  return { distinctPapers: 0, sources: sourceReadiness(bank, pattern, 1) };
}

export function buildPatternReadiness(
  bank: readonly AuthoringQuestion[],
  pattern: ExamPattern,
): PatternReadiness {
  if (pattern.status === "deferred") {
    /* Deferred patterns are listed so the picker can say what is planned;
       they are never startable, whatever the bank holds. */
    return {
      patternId: pattern.id,
      state: "unavailable",
      requestedCount: pattern.questionCount,
      availableCount: 0,
      distinctPapers: 0,
      sources: pattern.sources.map((source) => ({
        sourceId: source.id,
        requested: source.count,
        poolSize: 0,
        groupedPoolSize: 0,
        stimulusGroups: 0,
        satisfiable: false,
      })),
    };
  }

  const { distinctPapers, sources } = maxDistinctPapers(bank, pattern);
  if (distinctPapers > 0) {
    return {
      patternId: pattern.id,
      state: "ready",
      requestedCount: pattern.questionCount,
      availableCount: pattern.questionCount,
      distinctPapers,
      sources,
    };
  }

  /* Not satisfiable. What COULD be served is the reduced practice module —
     computed by the same draw the fallback would perform, so the number the
     picker shows is the number the child would sit. */
  const fallback = selectPatternQuestions(bank, pattern, READINESS_SEED, {
    asPracticeModule: true,
  });
  const availableCount = fallback.ok ? fallback.questions.length : 0;

  return {
    patternId: pattern.id,
    state: availableCount > 0 ? "short" : "unavailable",
    requestedCount: pattern.questionCount,
    availableCount,
    distinctPapers: 0,
    sources,
  };
}

export type PatternReadinessMap = Readonly<Record<string, PatternReadiness>>;

export function buildAllPatternReadiness(
  bank: readonly AuthoringQuestion[],
  patterns: readonly ExamPattern[] = EXAM_PATTERNS,
): PatternReadinessMap {
  return Object.fromEntries(
    patterns.map((pattern) => [pattern.id, buildPatternReadiness(bank, pattern)]),
  );
}
