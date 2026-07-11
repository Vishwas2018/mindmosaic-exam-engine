export {
  EXAM_DURATION_SECONDS,
  EXAM_STYLE_OPTIONS,
  QUESTION_COUNT_OPTIONS,
  SUBJECT_OPTIONS,
  TIMER_CRITICAL_SECONDS,
  TIMER_WARNING_SECONDS,
  YEAR_LEVEL_OPTIONS,
  durationSecondsFor,
} from "./selection-config";
export type {
  ExamSelectionConfig,
  ExamStyleFilter,
  QuestionCountOption,
  SubjectFilter,
  TimingMode,
  YearLevelFilter,
} from "./selection-config";
export { createSeededRandom, hashSeed, seededShuffle } from "./seeded-random";
export { filterEligibleQuestions, selectExamQuestions } from "./select-questions";
export type { SelectionResult } from "./select-questions";
