import type { Question } from "@/schemas/question.schema";

import { factoryPublishedQuestions } from "./generated";
import { questionBank } from "./question-bank";

/**
 * The GATED pool: every question a learner can be served that has cleared a
 * review gate, and nothing else — the curated 100 plus the factory-published
 * set.
 */
export const publishedExamBank: readonly Question[] = Object.freeze([
  ...questionBank,
  ...factoryPublishedQuestions,
]);

/**
 * Practice bank alias. Seeds have been deleted; practiceExamBank aliases
 * publishedExamBank so any callers receive only gate-passed content.
 */
export const practiceExamBank: readonly Question[] = Object.freeze([...publishedExamBank]);
