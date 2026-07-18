import type { ExamStyle, YearLevel } from "@/schemas/question.schema";

/**
 * Which authored bank a session draws from: the curated production bank
 * ("curated", the default) or curated plus the auto-generated extended set
 * ("practice"). Recorded per session so server-side scoring recomputes the
 * selection from the same pool the session was started with.
 */
export type ExamBankId = "curated" | "practice";

/** Filters a student can choose on the exam setup screen. */
export type YearLevelFilter = YearLevel | "mixed";
export type ExamStyleFilter = ExamStyle | "mixed";
export type SubjectFilter = "numeracy" | "reading" | "language" | "mixed";
export type QuestionCountOption = 10 | 20 | 30 | "full";
export type TimingMode = "timed" | "untimed";

export interface ExamSelectionConfig {
  yearLevel: YearLevelFilter;
  examStyle: ExamStyleFilter;
  subject: SubjectFilter;
  questionCount: QuestionCountOption;
  timing: TimingMode;
}

export const YEAR_LEVEL_OPTIONS: readonly YearLevelFilter[] = [3, 5, "mixed"];
export const EXAM_STYLE_OPTIONS: readonly ExamStyleFilter[] = [
  "naplan_style",
  "icas_style",
  "mixed",
];
export const SUBJECT_OPTIONS: readonly SubjectFilter[] = [
  "numeracy",
  "reading",
  "language",
  "mixed",
];
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
  count: QuestionCountOption,
  questions: readonly EstimatedTimeSource[] = [],
): number {
  if (count === "full") {
    return fullExamDurationSeconds(questions);
  }
  return FIXED_EXAM_DURATION_SECONDS[String(count) as "10" | "20" | "30"];
}

/** Timer display thresholds shared by the UI and tests. */
export const TIMER_WARNING_SECONDS = 120;
export const TIMER_CRITICAL_SECONDS = 30;
