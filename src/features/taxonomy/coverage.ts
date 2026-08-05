import "server-only";

import type { ExamStyle, YearLevel } from "@/schemas/question.schema";
import {
  filterEligibleQuestions,
  type SubjectFilter,
} from "@/features/exam-engine/selection";
import { getExamBank } from "@/server/exam-bank";

import { isValidStyleYear, YEAR_LEVELS } from "./year-registry";

/**
 * Which (year, style, subject) cells we actually have gated content for.
 *
 * Kept apart from ./subject-registry.ts and ./year-registry.ts on purpose,
 * and the distinction is load-bearing:
 *
 *   - the year registry says which sittings EXIST (NAPLAN is sat in Years
 *     3, 5, 7 and 9). That is a fact about the assessment and never changes
 *     because of what we have written.
 *   - a subject's `yearLevels` says which years the SUBJECT spans.
 *   - this module says which cells we can serve a learner TODAY. It moves
 *     every time content is published.
 *
 * Collapsing them would mean publishing content could silently make
 * "NAPLAN-style Year 4" look valid, or an empty bank could make a real
 * sitting look nonexistent.
 *
 * `import "server-only"`: this reaches the authoring banks through
 * src/server/exam-bank.ts, which carries answer keys. Client surfaces that
 * need coverage take it as props from a server component — the sign-up
 * wizard and the catalogue both do.
 */

/**
 * The gate a catalogue cell must clear before it stops being "coming soon".
 *
 * 30 is the largest fixed sitting length the configurator offers
 * (QUESTION_COUNT_OPTIONS), so a program below it cannot fill every length
 * it advertises. This is the same bar the published-bank reachability
 * suite asserts against; keeping one number means the catalogue and that
 * suite cannot disagree about what "ready" means.
 */
export const GATED_COVERAGE_THRESHOLD = 30;

export interface CoverageCell {
  readonly yearLevel: YearLevel;
  readonly examStyle: ExamStyle;
  readonly subject: SubjectFilter;
  /** Eligible questions in the gated ("published") bank. */
  readonly gatedCount: number;
  /** True once the cell clears GATED_COVERAGE_THRESHOLD. */
  readonly ready: boolean;
}

function coverageKey(
  yearLevel: YearLevel,
  examStyle: ExamStyle,
  subject: SubjectFilter,
): string {
  return `${yearLevel}:${examStyle}:${subject}`;
}

/*
 * Built once per process. The gated bank is a frozen module-level array, so
 * this cannot go stale within a process; a publication run ships new code.
 *
 * Only style/year combinations that are real sittings are walked — there is
 * no point counting questions for NAPLAN Year 4, and materialising cells
 * for impossible sittings is how an impossible sitting ends up rendered
 * somewhere as "0 questions" rather than as absent.
 */
const COVERAGE_SUBJECTS: readonly SubjectFilter[] = [
  "numeracy",
  "reading",
  "language",
];

let cache: Map<string, CoverageCell> | null = null;

function buildCoverage(): Map<string, CoverageCell> {
  const bank = getExamBank("published");
  const cells = new Map<string, CoverageCell>();

  for (const yearLevel of YEAR_LEVELS) {
    for (const examStyle of ["naplan_style", "icas_style"] as const) {
      if (!isValidStyleYear(examStyle, yearLevel)) continue;
      for (const subject of COVERAGE_SUBJECTS) {
        const gatedCount = filterEligibleQuestions(bank, {
          yearLevel,
          examStyle,
          subject,
        }).length;
        cells.set(coverageKey(yearLevel, examStyle, subject), {
          yearLevel,
          examStyle,
          subject,
          gatedCount,
          ready: gatedCount >= GATED_COVERAGE_THRESHOLD,
        });
      }
    }
  }

  return cells;
}

function coverage(): Map<string, CoverageCell> {
  cache ??= buildCoverage();
  return cache;
}

/** Every real sitting cell, whether or not it has content yet. */
export function getCoverageCells(): readonly CoverageCell[] {
  return [...coverage().values()];
}

export function getCoverageCell(
  yearLevel: YearLevel,
  examStyle: ExamStyle,
  subject: SubjectFilter,
): CoverageCell | undefined {
  return coverage().get(coverageKey(yearLevel, examStyle, subject));
}

/**
 * Year levels a learner can be offered today: at least one cell at that
 * year clears the threshold.
 *
 * This is what the sign-up year grid and the exam configurator's year list
 * read, so a year becomes selectable the moment content is published for
 * it and not one commit earlier. Nothing hard-codes [3, 5] any more.
 */
export function yearLevelsWithGatedCoverage(): readonly YearLevel[] {
  const years = new Set<YearLevel>();
  for (const cell of coverage().values()) {
    if (cell.ready) years.add(cell.yearLevel);
  }
  return [...years].sort((a, b) => a - b);
}

/** Whether any subject/style at this year is ready to serve. */
export function hasGatedCoverage(yearLevel: YearLevel): boolean {
  return yearLevelsWithGatedCoverage().includes(yearLevel);
}

/**
 * Promotes a scoped `coming_soon` program to `live` once its cell clears
 * the gated threshold.
 *
 * The catalogue declares every expansion cell as coming_soon because it is
 * imported by client components and must not reach a question bank. This is
 * the server-side half: the catalogue page and the program route both run
 * their program lists through here, so a cell goes live the moment content
 * is published for it and not one commit earlier.
 *
 * Only ever promotes. A hand-written live program is returned untouched —
 * `naplan-g3-reading` has 17 eligible questions and stays live, because
 * demoting a program a learner is already using is a different decision
 * from deciding when a new one appears, and this function is not the place
 * to make it.
 */
export function resolveProgramStatuses<
  P extends {
    readonly status: "live" | "coming_soon";
    readonly scope?: {
      readonly yearLevel: YearLevel;
      readonly examStyle: ExamStyle;
      readonly subject: Exclude<SubjectFilter, "mixed">;
    };
  },
>(programs: readonly P[]): P[] {
  return programs.map((program) => {
    if (program.status === "live" || !program.scope) return program;
    const cell = getCoverageCell(
      program.scope.yearLevel,
      program.scope.examStyle,
      program.scope.subject,
    );
    return cell?.ready ? { ...program, status: "live" as const } : program;
  });
}

/** Test seam: drops the memoised coverage so a fixture bank can be re-read. */
export function resetCoverageCacheForTests(): void {
  cache = null;
}
