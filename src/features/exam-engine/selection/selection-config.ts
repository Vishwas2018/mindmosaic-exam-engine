import type { ExamStyle, YearLevel } from "@/schemas/question.schema";

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
 * Production exam durations in seconds, keyed by question count.
 * Timer-expiry E2E coverage uses Playwright's clock API rather than
 * shortened durations, so these values are never weakened for tests.
 */
export const EXAM_DURATION_SECONDS: Record<"10" | "20" | "30" | "full", number> = {
  "10": 15 * 60,
  "20": 30 * 60,
  "30": 45 * 60,
  full: 90 * 60,
};

export function durationSecondsFor(count: QuestionCountOption): number {
  return EXAM_DURATION_SECONDS[String(count) as keyof typeof EXAM_DURATION_SECONDS];
}

/** Timer display thresholds shared by the UI and tests. */
export const TIMER_WARNING_SECONDS = 120;
export const TIMER_CRITICAL_SECONDS = 30;
