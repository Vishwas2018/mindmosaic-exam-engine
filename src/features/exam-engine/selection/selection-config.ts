import type { SubjectId } from "@/features/taxonomy/subject-registry";
import { YEAR_LEVELS } from "@/features/taxonomy/year-registry";
import type { ExamStyle, YearLevel } from "@/schemas/question.schema";

/**
 * Which authored bank a session draws from. Recorded per session so
 * server-side scoring recomputes the selection from the same pool the
 * session was started with. Strictly nested: curated ⊂ published ⊂ practice.
 *
 * - "curated"   — the governed, exactly-100 curated production bank. The
 *                 default, and the only bank whose distribution is pinned by
 *                 `validate:questions`.
 * - "published" — curated plus every question the question-factory has
 *                 actually published (`factoryPublishedQuestions`). Every item
 *                 in it has cleared a review gate; contains NO auto-generated
 *                 seed content. This is what a scoped catalogue program should
 *                 default to so a child never sees ungated content by default.
 * - "practice"  — published plus the ~1,100 auto-generated `practiceQuestions`
 *                 seeds, which have never been through the publication gates.
 *                 Reachable only when a learner deliberately opts in via the
 *                 configurator's "include the extended practice bank" toggle.
 */
export type ExamBankId = "curated" | "published" | "practice";

/** Filters a student can choose on the exam setup screen. */
export type YearLevelFilter = YearLevel | "mixed";
export type ExamStyleFilter = ExamStyle | "mixed";
export type SubjectFilter =
  | "numeracy"
  | "reading"
  | "language"
  | "science"
  | "digital_technologies"
  | "spelling"
  | "mixed";
export type QuestionCountOption = 10 | 20 | 30 | "full";
/**
 * What the ENGINE accepts, as opposed to what the configurator's picker
 * offers. Exam simulations sit papers of the official sizes — 36, 39, 42,
 * 45, 50, 52 — none of which is one of the three fixed options a child can
 * choose, so the config type has to be wider than the picker's.
 * `QuestionCountOption` stays exactly as it was and is still what the
 * configurator's select is typed against.
 */
export type ExamQuestionCount = number | "full";
export type TimingMode = "timed" | "untimed";

export interface ExamSelectionConfig {
  yearLevel: YearLevelFilter;
  examStyle: ExamStyleFilter;
  subject: SubjectFilter;
  questionCount: ExamQuestionCount;
  timing: TimingMode;
  /**
   * Set only for an exam simulation: the `ExamPattern` whose shape this
   * sitting is following (see features/exam-engine/exam-patterns). Its
   * presence is what makes the sitting's duration the paper's published
   * time limit rather than a count-derived one, and what lets /exam and
   * /results name the paper instead of describing filters.
   */
  patternId?: string;
  /**
   * True when the bank could not fill the pattern and the candidate
   * explicitly accepted a shortened paper. Never inferred — a paper that is
   * short must say so everywhere it is named.
   */
  shortened?: boolean;
}

/**
 * Year filters the selection engine understands (expansion-plan T0a).
 *
 * Widened from `[3, 5, "mixed"]` to the full Years 1-12 span. This is the
 * ENGINE's range, and it is also what `buildBankEligibilitySummary` walks,
 * so a Year 7 question becomes selectable the moment one exists.
 *
 * It is NOT what a year picker should render: offering a learner a year
 * with an empty pool is a dead end. The configurator narrows this list to
 * the years its own bank eligibility reports content for, and the sign-up
 * and parent forms read yearLevelsWithGatedCoverage()
 * (src/features/taxonomy/coverage.ts). Nothing user-facing takes this
 * array as its option list.
 */
export const YEAR_LEVEL_OPTIONS: readonly YearLevelFilter[] = [
  ...YEAR_LEVELS,
  "mixed",
];
export const EXAM_STYLE_OPTIONS: readonly ExamStyleFilter[] = [
  "naplan_style",
  "icas_style",
  "mixed",
];
/**
 * Subjects the selection engine can isolate on their own.
 *
 * Science, Digital Technologies and Spelling are ICAS-only papers (NAPLAN
 * assesses none of them), so choosing one alongside
 * `examStyle: "naplan_style"` yields an empty pool. That is handled where
 * it belongs — the configurator narrows
 * its pickers to what `buildBankEligibilitySummary` reports content for,
 * and the catalogue never generates a NAPLAN cell for them (see
 * `features/catalogue/catalogue.ts`, which reads the styles off the subject
 * registry). This array is the ENGINE's vocabulary, not a picker's option
 * list.
 */
export const SUBJECT_OPTIONS: readonly SubjectFilter[] = [
  "numeracy",
  "reading",
  "language",
  "science",
  "digital_technologies",
  "spelling",
  "mixed",
];
/**
 * The registry subject each isolable filter selects.
 *
 * One filter value does not equal one registry id — the filter is called
 * "language" but the subject is `language_conventions` — so the two
 * vocabularies need a stated mapping rather than a cast. `satisfies` binds
 * it to `SubjectId`, so a typo or a subject removed from the registry is a
 * compile error here.
 *
 * "mixed" is absent by construction: it spans several subjects, and its
 * span is `SUBJECTS_BY_FILTER` in ./select-questions.ts.
 *
 * The type-only import keeps this free of a runtime cycle
 * (question.schema imports the registry's values).
 */
export const REGISTRY_SUBJECT_BY_FILTER = {
  numeracy: "numeracy",
  reading: "reading",
  language: "language_conventions",
  science: "science",
  digital_technologies: "digital_technologies",
  spelling: "spelling",
} as const satisfies Record<Exclude<SubjectFilter, "mixed">, SubjectId>;

/** Every subject a program can pin, in catalogue display order. */
export const ISOLABLE_SUBJECT_FILTERS = Object.keys(
  REGISTRY_SUBJECT_BY_FILTER,
) as readonly Exclude<SubjectFilter, "mixed">[];

export const QUESTION_COUNT_OPTIONS: readonly QuestionCountOption[] = [
  10,
  20,
  30,
  "full",
];

/**
 * Production exam durations in seconds for the fixed question counts.
 * Timer-expiry E2E coverage uses Playwright's clock API rather than
 * shortened durations, so these values are never weakened for tests.
 * `full` is deliberately absent: its duration depends on how many
 * questions actually match the chosen filters — see durationSecondsFor.
 */
export const FIXED_EXAM_DURATION_SECONDS: Record<"10" | "20" | "30", number> = {
  "10": 15 * 60,
  "20": 30 * 60,
  "30": 45 * 60,
};

/** Backward-compatible alias retained for the fixed-count durations. */
export const EXAM_DURATION_SECONDS = FIXED_EXAM_DURATION_SECONDS;

/**
 * A "full" exam's duration is derived from the questions it will actually
 * contain, not a flat value — a one-question full set must not receive
 * the same 90 minutes as a 100-question one. The rule: sum each selected
 * question's authored `estimatedTimeSeconds`, apply a buffer for reading
 * instructions and reviewing answers, round up to the next whole minute,
 * then clamp to sensible bounds so a tiny set isn't effectively untimed
 * and a huge one doesn't exceed a sitting most learners can sustain.
 */
export const FULL_EXAM_TIME_BUFFER_FACTOR = 1.5;
export const MINIMUM_FULL_EXAM_DURATION_SECONDS = 10 * 60;
export const MAXIMUM_FULL_EXAM_DURATION_SECONDS = 180 * 60;

/** The only fact duration calculation needs about a question. */
export interface EstimatedTimeSource {
  metadata: { estimatedTimeSeconds: number };
}

function fullExamDurationSeconds(questions: readonly EstimatedTimeSource[]): number {
  const totalEstimatedSeconds = questions.reduce(
    (sum, question) => sum + question.metadata.estimatedTimeSeconds,
    0,
  );
  const buffered = totalEstimatedSeconds * FULL_EXAM_TIME_BUFFER_FACTOR;
  const roundedUpToMinute = Math.ceil(buffered / 60) * 60;
  return Math.min(
    MAXIMUM_FULL_EXAM_DURATION_SECONDS,
    Math.max(MINIMUM_FULL_EXAM_DURATION_SECONDS, roundedUpToMinute),
  );
}

/**
 * Duration for a timed exam. For a fixed question count this is a table
 * lookup; for `full` it is derived from the actual questions that will be
 * (or were) selected — pass the eligible set for a setup-screen preview,
 * or the final selected set once a session has started (they are the
 * same questions, since `full` selects every eligible question).
 */
export function durationSecondsFor(
  count: ExamQuestionCount,
  questions: readonly EstimatedTimeSource[] = [],
): number {
  if (count === "full") {
    return fullExamDurationSeconds(questions);
  }
  /* A count the table does not cover falls back to the same estimate-driven
     rule "full" uses, rather than returning undefined as a number. The three
     table entries are unchanged, so every existing sitting length keeps its
     exact production duration. A pattern sitting never reaches this — its
     duration is the paper's published limit (see
     exam-patterns/pattern-session.ts). */
  return (
    FIXED_EXAM_DURATION_SECONDS[String(count) as "10" | "20" | "30"] ??
    fullExamDurationSeconds(questions)
  );
}

/** Timer display thresholds shared by the UI and tests. */
export const TIMER_WARNING_SECONDS = 120;
export const TIMER_CRITICAL_SECONDS = 30;
