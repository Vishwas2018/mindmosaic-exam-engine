import type { Question } from "@/schemas/question.schema";

import { seededShuffle } from "./seeded-random";
import type { ExamSelectionConfig, SubjectFilter } from "./selection-config";

const SUBJECTS_BY_FILTER: Record<SubjectFilter, readonly string[]> = {
  numeracy: ["numeracy"],
  reading: ["reading"],
  language: ["language_conventions"],
  mixed: ["numeracy", "reading", "language_conventions", "writing"],
};

/** Filter the bank down to questions eligible for the chosen configuration. */
export function filterEligibleQuestions(
  bank: readonly Question[],
  config: Pick<ExamSelectionConfig, "yearLevel" | "examStyle" | "subject">,
): readonly Question[] {
  const subjects = SUBJECTS_BY_FILTER[config.subject];
  return bank.filter(
    (question) =>
      (config.yearLevel === "mixed" || question.yearLevel === config.yearLevel) &&
      (config.examStyle === "mixed" || question.examStyle === config.examStyle) &&
      subjects.includes(question.metadata.subject),
  );
}

export type SelectionResult =
  | {
      ok: true;
      questions: readonly Question[];
      seed: string;
      eligibleCount: number;
    }
  | {
      ok: false;
      reason: "insufficient_questions";
      eligibleCount: number;
      requestedCount: number;
    };

/**
 * Deterministically select and order exam questions.
 *
 * The same bank, configuration and seed always produce the same questions in
 * the same order. Selection happens once when a session starts; the result is
 * stored in session state so navigation and rerenders can never reshuffle it.
 */
export function selectExamQuestions(
  bank: readonly Question[],
  config: ExamSelectionConfig,
  seed: string,
): SelectionResult {
  const eligible = filterEligibleQuestions(bank, config);
  const requestedCount =
    config.questionCount === "full" ? eligible.length : config.questionCount;

  if (eligible.length === 0 || eligible.length < requestedCount) {
    return {
      ok: false,
      reason: "insufficient_questions",
      eligibleCount: eligible.length,
      requestedCount,
    };
  }

  const shuffled = seededShuffle(eligible, seed);
  return {
    ok: true,
    questions: shuffled.slice(0, requestedCount),
    seed,
    eligibleCount: eligible.length,
  };
}
