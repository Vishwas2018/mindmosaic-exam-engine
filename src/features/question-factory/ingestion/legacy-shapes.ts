import { z } from "zod";

import { INGESTION_LIMITS } from "./limits";

/**
 * Loose structural schemas for the donor shapes. These validate "does this
 * look like a legacy question record" only — enum-shaped business values
 * (`difficulty`, `examType`, `questionType`, visual `type`, answer-key
 * `type`, stimulus `kind`) are kept as free strings here and validated
 * against the actual alias tables in `normalise.ts`, which can produce a
 * far more specific rejection reason than "does not match the donor shape
 * at all". This is the shape-dispatch layer referenced in
 * `03-legacy-ingestion-requirements.md` §1: "an adapter must dispatch on
 * shape... before attempting field-level parsing".
 */

const legacyVisualAssetShape = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  altText: z.string().optional(),
  title: z.string().optional(),
  caption: z.string().optional(),
  spec: z.unknown().optional(),
  svgContent: z.string().optional(),
});

const legacyOptionShape = z.object({ id: z.string().min(1), text: z.string().min(1) });

const legacyBlankShape = z.object({
  id: z.string().min(1),
  label: z.string().optional(),
  choices: z.array(z.string()).optional(),
});

const legacyMatchColumnsShape = z.object({
  left: z.array(z.object({ id: z.string().min(1), text: z.string().min(1) })),
  right: z.array(z.object({ id: z.string().min(1), text: z.string().min(1) })),
});

const legacyAnswerKeyShape = z
  .object({ type: z.string().min(1) })
  .catchall(z.unknown());

const legacyStimulusShape = z
  .object({
    kind: z.string().min(1),
    title: z.string().optional(),
    body: z.string().min(1),
  })
  .nullable()
  .optional();

export const legacyQuestionJsonShape = z.object({
  id: z.string().optional(),
  examType: z.string().min(1),
  yearLevel: z.union([z.literal(3), z.literal(5)]),
  subject: z.string().min(1),
  strand: z.string().min(1),
  skillId: z.string().optional(),
  skill: z.string().optional(),
  difficulty: z.string().min(1),
  questionType: z.string().min(1),
  prompt: z.string().min(1),
  stimulus: legacyStimulusShape,
  assets: z.array(legacyVisualAssetShape).optional(),
  options: z.array(legacyOptionShape).optional(),
  blanks: z.array(legacyBlankShape).optional(),
  matchColumns: legacyMatchColumnsShape.optional(),
  answerKey: legacyAnswerKeyShape,
  explanation: z.string().min(1),
  estimatedTimeSeconds: z.number().optional(),
  tags: z.array(z.string()).optional(),
  origin: z.string().optional(),
  status: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type LegacyQuestionJson = z.infer<typeof legacyQuestionJsonShape>;
export type LegacyVisualAsset = z.infer<typeof legacyVisualAssetShape>;
export type LegacyAnswerKey = z.infer<typeof legacyAnswerKeyShape>;

export const reviewQueueWrapperShape = z.object({
  question: legacyQuestionJsonShape,
  skillId: z.string().optional(),
  sourcePromptId: z.string().optional(),
  validationStatus: z.string().optional(),
  validationErrors: z.array(z.string()).max(INGESTION_LIMITS.MAX_REVIEW_METADATA_ARRAY_LENGTH).optional(),
  reviewerStatus: z.string().optional(),
  reviewerComments: z.string().optional(),
  riskFlags: z.array(z.string()).max(INGESTION_LIMITS.MAX_REVIEW_METADATA_ARRAY_LENGTH).optional(),
  approvalStatus: z.string().optional(),
  createdAt: z.string().optional(),
});
export type ReviewQueueWrapper = z.infer<typeof reviewQueueWrapperShape>;

export const compiledQuestionArrayShape = z.array(legacyQuestionJsonShape).min(1);

export const csvRowShape = z
  .object({
    slug: z.string(),
    type: z.string().min(1),
    topic_slug: z.string().optional(),
    year_levels: z.string().min(1),
    difficulty: z.union([z.string(), z.number()]),
    prompt: z.string().optional(),
    tier_required: z.string().optional(),
    review_status: z.string().optional(),
    authored_by: z.string().optional(),
    reviewed_by: z.string().optional(),
    source_descriptor_id: z.string().optional(),
    version: z.string().optional(),
    content_data_json: z.string().min(1),
    group_slug: z.string().optional(),
    group_position: z.union([z.string(), z.number()]).optional(),
  })
  .catchall(z.unknown());
export type CsvRow = z.infer<typeof csvRowShape>;
