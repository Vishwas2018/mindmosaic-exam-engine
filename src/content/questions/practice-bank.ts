import type { Question } from "@/schemas/question.schema";

import { factoryPublishedQuestions } from "./generated";
import legacyQuarantinedIds from "./legacy-quarantined-ids.json";
import { questionBank } from "./question-bank";

/**
 * The GATED pool: every question a learner can be served that has cleared a
 * review gate, and nothing else — the curated 100 plus the factory-published
 * set.
 */
const quarantined = new Set<string>(legacyQuarantinedIds);

/**
 * Items in content/quarantine/legacy-unapproved/ledger.json are excluded from learner delivery
 * even if one were to reappear in the curated or assembled pools.
 */
export const publishedExamBank: readonly Question[] = Object.freeze(
  [...questionBank, ...factoryPublishedQuestions].filter((question) => !quarantined.has(question.id)),
);

/**
 * Practice bank alias. Seeds have been deleted; practiceExamBank aliases
 * publishedExamBank so any callers receive only gate-passed content.
 */
export const practiceExamBank: readonly Question[] = Object.freeze([...publishedExamBank]);
