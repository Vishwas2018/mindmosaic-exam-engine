import type { Question } from "@/schemas/question.schema";

import { filterEligibleQuestions } from "./select-questions";
import {
  EXAM_STYLE_OPTIONS,
  SUBJECT_OPTIONS,
  YEAR_LEVEL_OPTIONS,
  durationSecondsFor,
  type ExamSelectionConfig,
} from "./selection-config";

/**
 * Precomputed eligibility facts for every (yearLevel, examStyle, subject)
 * filter combination of a bank: how many questions match, and how long a
 * "full" exam over them would run. This is what the exam setup screen
 * actually displays — computing it server-side means the page payload
 * carries these few dozen numbers instead of the authoring bank itself
 * (docs/ASSESSMENT_SECURITY_MODEL.md, Phase 0 addendum).
 */
export interface EligibleSummary {
  count: number;
  fullDurationSeconds: number;
}

export type BankEligibilitySummary = Record<string, EligibleSummary>;

export function eligibilityKey(
  config: Pick<ExamSelectionConfig, "yearLevel" | "examStyle" | "subject">,
): string {
  return `${config.yearLevel}:${config.examStyle}:${config.subject}`;
}

/** Pure: same bank in, same summary out. Covers all 36 filter combinations. */
export function buildBankEligibilitySummary(
  bank: readonly Question[],
): BankEligibilitySummary {
  const summary: BankEligibilitySummary = {};
  for (const yearLevel of YEAR_LEVEL_OPTIONS) {
    for (const examStyle of EXAM_STYLE_OPTIONS) {
      for (const subject of SUBJECT_OPTIONS) {
        const filters = { yearLevel, examStyle, subject };
        const eligible = filterEligibleQuestions(bank, filters);
        summary[eligibilityKey(filters)] = {
          count: eligible.length,
          fullDurationSeconds: durationSecondsFor("full", eligible),
        };
      }
    }
  }
  return summary;
}
