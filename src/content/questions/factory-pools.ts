import type { Question } from "@/schemas/question.schema";

import { factoryPublishedQuestions } from "./generated";
import { scholarshipPublishedQuestions } from "./generated/scholarship-index";

/**
 * Every factory-published question: the historical assembled snapshot plus the strictly
 * assembled scholarship pool. Anything that decides "is this a factory item with a source
 * manifest" must use this, not one pool alone.
 */
export const allFactoryPublishedQuestions: readonly Question[] = Object.freeze([
  ...factoryPublishedQuestions,
  ...scholarshipPublishedQuestions,
]);
