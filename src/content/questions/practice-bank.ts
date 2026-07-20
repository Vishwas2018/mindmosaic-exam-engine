import type { Question } from "@/schemas/question.schema";

import { validateQuestionBank } from "@/features/exam-engine/validation";

import { factoryPublishedQuestions } from "./generated";
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

/**
 * Factory-approved content that has cleared the full question-factory
 * governance chain (structural -> correctness -> semantic -> originality
 * -> difficulty -> staged -> published, see
 * `src/features/question-factory/publication/`) and been assembled by
 * `npm run questions:assemble-bank` into `./generated/index.ts`. Additive
 * only, exactly like `practiceQuestions` above — the curated 100-question
 * `questionBank` is never modified by this pool, so its own governing
 * tests (`src/tests/unit/question-bank.test.ts`) stay green regardless of
 * how much factory content is published. Empty until the first real
 * publication run.
 */
export const practiceExamBank: readonly Question[] = Object.freeze([
  ...questionBank,
  ...practiceQuestions,
  ...factoryPublishedQuestions,
]);
