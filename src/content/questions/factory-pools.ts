import type { Question } from "@/schemas/question.schema";

import { factoryPublishedQuestions } from "./generated";
import { amcPublishedQuestions } from "./generated/amc-index";

/**
 * Every factory-published question: the historical assembled snapshot plus the strictly
 * assembled AMC pool. Anything that decides "is this a factory item with a source manifest"
 * must use this, not one pool alone.
 */
export const allFactoryPublishedQuestions: readonly Question[] = Object.freeze([
  ...factoryPublishedQuestions,
  ...amcPublishedQuestions,
]);
