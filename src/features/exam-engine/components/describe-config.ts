import type {
  ExamSelectionConfig,
  ExamStyleFilter,
  SubjectFilter,
} from "@/features/exam-engine/selection";

/*
 * Pure, side-effect-free formatting — deliberately its own module rather
 * than living inside ExamConfigurator.tsx. /exam and /results only need
 * this one function to describe the active session's config; before this
 * split, importing it from the configurator file pulled that whole
 * client component — including its production question-bank import —
 * into both routes' bundles for a single string-formatting call.
 */

export const YEAR_LABELS: Record<string, string> = {
  "3": "Grade 3",
  "5": "Grade 5",
  mixed: "Mixed grades",
};

export const STYLE_LABELS: Record<ExamStyleFilter, string> = {
  naplan_style: "NAPLAN-style practice",
  icas_style: "ICAS-style practice",
  mixed: "Mixed styles",
};

export const SUBJECT_LABELS: Record<SubjectFilter, string> = {
  numeracy: "Numeracy",
  reading: "Reading",
  language: "Language",
  mixed: "Mixed subjects",
};

export function describeConfig(config: ExamSelectionConfig): string {
  const count =
    config.questionCount === "full" ? "Full set" : `${config.questionCount} questions`;
  const timing = config.timing === "timed" ? "Timed" : "Untimed";
  return `${YEAR_LABELS[String(config.yearLevel)]} · ${STYLE_LABELS[config.examStyle]} · ${SUBJECT_LABELS[config.subject]} · ${count} · ${timing}`;
}
