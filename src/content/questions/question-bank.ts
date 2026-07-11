import type { Question } from "@/schemas/question.schema";

import { validateQuestionBank } from "@/features/exam-engine/validation";

import { grade3IcasEnglish } from "./grade-3/icas-english";
import { grade3IcasMathematics } from "./grade-3/icas-mathematics";
import { grade3NaplanLanguage } from "./grade-3/naplan-language";
import { grade3NaplanNumeracy } from "./grade-3/naplan-numeracy";
import { grade3NaplanReading } from "./grade-3/naplan-reading";

/**
 * The validated production question bank. Every question is original
 * MindMosaic content with status "published" and origin "original_seed".
 * Showcase fixtures and test fixtures live separately and are never included.
 */
export const questionBank: readonly Question[] = Object.freeze(
  validateQuestionBank([
    ...grade3NaplanNumeracy,
    ...grade3NaplanReading,
    ...grade3NaplanLanguage,
    ...grade3IcasMathematics,
    ...grade3IcasEnglish,
  ]),
);

export function getQuestionById(questionId: string): Question | undefined {
  return questionBank.find((question) => question.id === questionId);
}

export function getQuestionsFor(
  yearLevel: Question["yearLevel"],
  examStyle: Question["examStyle"],
): readonly Question[] {
  return questionBank.filter(
    (question) =>
      question.yearLevel === yearLevel && question.examStyle === examStyle,
  );
}
