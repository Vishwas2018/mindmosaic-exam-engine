import type { Question } from "@/schemas/question.schema";

import { sampleQuestions } from "./sample-questions";

export const questionBank: readonly Question[] = Object.freeze([
  ...sampleQuestions,
]);

export function getQuestionById(questionId: string): Question | undefined {
  return questionBank.find((question) => question.id === questionId);
}

export function getQuestionsFor(
  yearLevel: Question["yearLevel"],
  examMode: Question["examMode"],
): readonly Question[] {
  return questionBank.filter(
    (question) =>
      question.yearLevel === yearLevel && question.examMode === examMode,
  );
}
