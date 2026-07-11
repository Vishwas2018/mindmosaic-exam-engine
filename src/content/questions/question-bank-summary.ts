import type { Question } from "@/schemas/question.schema";
import { QUESTION_TYPES } from "@/schemas/question.schema";
import { VISUAL_TYPES } from "@/schemas/visual.schema";

export interface QuestionBankSummary {
  totalQuestions: number;
  byQuestionType: Readonly<Record<string, number>>;
  byVisualType: Readonly<Record<string, number>>;
  byYearLevel: Readonly<Record<string, number>>;
  byExamStyle: Readonly<Record<string, number>>;
  bySubject: Readonly<Record<string, number>>;
  byStrand: Readonly<Record<string, number>>;
  bySkill: Readonly<Record<string, number>>;
  byDifficulty: Readonly<Record<string, number>>;
  manualReviewCount: number;
  questionsWithVisuals: number;
}

function tally(
  keys: readonly string[],
  values: readonly string[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const key of keys) counts[key] = 0;
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  return counts;
}

/**
 * Pure summary of a question collection, shared by the validation script,
 * full-bank tests and documentation.
 */
export function summariseQuestionBank(
  questions: readonly Question[],
): QuestionBankSummary {
  return {
    totalQuestions: questions.length,
    byQuestionType: tally(
      QUESTION_TYPES,
      questions.map((question) => question.type),
    ),
    byVisualType: tally(
      VISUAL_TYPES,
      questions.flatMap((question) =>
        question.visuals.map((visual) => visual.type),
      ),
    ),
    byYearLevel: tally(
      [],
      questions.map((question) => `year-${question.yearLevel}`),
    ),
    byExamStyle: tally(
      [],
      questions.map((question) => question.examStyle),
    ),
    bySubject: tally(
      [],
      questions.map((question) => question.metadata.subject),
    ),
    byStrand: tally(
      [],
      questions.map((question) => question.metadata.strand),
    ),
    bySkill: tally(
      [],
      questions.map(
        (question) => question.metadata.skill ?? question.metadata.topic,
      ),
    ),
    byDifficulty: tally(
      [],
      questions.map((question) => question.metadata.difficulty),
    ),
    manualReviewCount: questions.filter(
      (question) => question.answerKey.kind === "manual",
    ).length,
    questionsWithVisuals: questions.filter(
      (question) => question.visuals.length > 0,
    ).length,
  };
}
