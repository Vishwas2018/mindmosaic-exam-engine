import type { Question } from "@/schemas/question.schema";

import { validateQuestionBank } from "@/features/exam-engine/validation";

import { practiceQuestionSeeds } from "./generated/generated-questions";
import { questionBank } from "./question-bank";

/**
 * The interactive PRACTICE pool. `questionBank` stays the governed, exactly-100
 * curated production bank (validated by scripts/validate-question-bank.mts and
 * the determinism tests). This module adds the auto-generated practice
 * questions — schema-validated here so any malformed item fails the build
 * loudly — and exposes the combined pool the exam UI draws from, so children
 * get a large bank to practise with without changing the governed set.
 */
export const practiceQuestions: readonly Question[] = validateQuestionBank([
  ...practiceQuestionSeeds,
]);

export const practiceExamBank: readonly Question[] = Object.freeze([
  ...questionBank,
  ...practiceQuestions,
]);
