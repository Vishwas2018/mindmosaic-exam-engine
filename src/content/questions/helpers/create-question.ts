import type { QuestionSeed } from "../types";

/**
 * Typing helper for content files. It performs no transformation — schema
 * validation happens once at the bank level in `question-bank.ts` — but gives
 * authors inline type checking while keeping each question a plain, fully
 * explicit object that is easy to review.
 */
export function defineQuestions(
  questions: readonly QuestionSeed[],
): readonly QuestionSeed[] {
  return questions;
}
