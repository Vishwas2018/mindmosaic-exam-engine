import {
  getExamPattern,
  patternSittingLabel,
} from "@/features/exam-engine/exam-patterns";
import type {
  ExamSelectionConfig,
  ExamStyleFilter,
  SubjectFilter,
} from "@/features/exam-engine/selection";
import { YEAR_LEVELS } from "@/features/taxonomy/year-registry";

/*
 * Pure, side-effect-free formatting — deliberately its own module rather
 * than living inside ExamConfigurator.tsx. /exam and /results only need
 * this one function to describe the active session's config; before this
 * split, importing it from the configurator file pulled that whole
 * client component — including its production question-bank import —
 * into both routes' bundles for a single string-formatting call.
 */

/*
 * Years 1-12 (expansion-plan T0a), built from the registry so a new year
 * cannot render as `undefined` in a config description. The "Grade N"
 * wording is unchanged — it is what every existing surface, test and
 * screenshot uses for Years 3 and 5.
 */
export const YEAR_LABELS: Record<string, string> = {
  ...Object.fromEntries(YEAR_LEVELS.map((year) => [String(year), `Grade ${year}`])),
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
  science: "Science",
  digital_technologies: "Digital Technologies",
  spelling: "Spelling",
  mixed: "Mixed subjects",
};

export function describeConfig(config: ExamSelectionConfig): string {
  const count =
    config.questionCount === "full" ? "Full set" : `${config.questionCount} questions`;
  const timing = config.timing === "timed" ? "Timed" : "Untimed";
  return `${YEAR_LABELS[String(config.yearLevel)]} · ${STYLE_LABELS[config.examStyle]} · ${SUBJECT_LABELS[config.subject]} · ${count} · ${timing}`;
}

/**
 * What a sitting is called on screen.
 *
 * A configurator session is described by its filters, exactly as before. A
 * full-length practice paper is named by its pattern, because that is what
 * the child chose — and a reduced sitting is named as a practice module with
 * its real size, never after the full-length pattern it fell short of. The
 * one formatter every candidate-facing surface goes through, so no screen can
 * quietly call a short paper a full-length one.
 */
export function describeSitting(config: ExamSelectionConfig): string {
  const pattern = config.patternId ? getExamPattern(config.patternId) : undefined;
  if (!pattern) return describeConfig(config);
  const served =
    typeof config.questionCount === "number"
      ? config.questionCount
      : pattern.questionCount;
  return patternSittingLabel(pattern, served, config.shortened === true);
}
