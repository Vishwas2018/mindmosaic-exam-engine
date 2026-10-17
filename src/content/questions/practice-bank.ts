import type { Question } from "@/schemas/question.schema";

import { allFactoryPublishedQuestions } from "./factory-pools";
import { questionBank } from "./question-bank";

/**
 * The GATED pool: every question a learner can be served that has cleared a
 * review gate, and nothing else — the curated 100 plus the factory-published
 * set plus the strictly assembled AMC pool (every AMC item carries a unique,
 * revision-bound human approval or `questions:assemble-bank --subject
 * amc_mathematics` refuses to build it).
 */
export const publishedExamBank: readonly Question[] = Object.freeze([
  ...questionBank,
  ...allFactoryPublishedQuestions,
]);

/**
 * Practice bank alias. Seeds have been deleted; practiceExamBank aliases
 * publishedExamBank so any callers receive only gate-passed content.
 */
export const practiceExamBank: readonly Question[] = Object.freeze([...publishedExamBank]);
