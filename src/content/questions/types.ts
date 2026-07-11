/**
 * Content-level types for the production question bank.
 *
 * Content lifecycle:
 *   draft → schema validated → correctness checked → editorially reviewed → published
 *
 * Only questions with `status: "published"` and `origin: "original_seed"` are
 * included in the production bank. The lifecycle is recorded on each question;
 * there is no backend workflow in this phase.
 */

import type { QuestionInput } from "@/schemas/question.schema";

/**
 * A question as authored in a content file, before bank-level validation.
 * Bank-level validation (schema, uniqueness, distribution) happens once in
 * `question-bank.ts`, so content files stay plain, reviewable data.
 */
export type QuestionSeed = QuestionInput;
