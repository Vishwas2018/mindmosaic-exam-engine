import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";

import { questionSchema } from "@/schemas/question.schema";

export const CONTENT_SCHEMA_VERSION = 2 as const;
export const authoringOriginSchema = z.enum([
  "manual_owner",
  "ai_codex",
  "ai_claude",
  "structured_import",
  "legacy_import",
  "future_external_import",
]);
export const lifecycleStateSchema = z.enum([
  "draft", "generated", "validated", "reviewed", "approved", "published", "retired",
]);
export const frameworkSourceTypeSchema = z.enum([
  "official_framework", "official_curriculum", "official_subject_framework", "owner_policy",
]);

export const frameworkReferenceSchema = z.object({
  frameworkId: z.string().min(1).max(100),
  version: z.string().min(1).max(80),
  sourceType: frameworkSourceTypeSchema,
  sourceUrl: z.string().url(),
  retrievedAt: z.string().datetime(),
}).strict();

export const assetReferenceSchema = z.object({
  assetId: z.string().uuid(),
  revision: z.number().int().positive(),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/),
  role: z.enum(["stimulus_image", "question_image", "audio", "transcript", "other"]),
  altText: z.string().trim().min(1).max(500).optional(),
}).strict().superRefine((asset, context) => {
  if (["stimulus_image", "question_image"].includes(asset.role) && !asset.altText) {
    context.addIssue({ code: "custom", path: ["altText"], message: "Image assets require alt text." });
  }
});

export const privateAuthoringEvidenceSchema = z.object({
  gradingRationale: z.string().min(1).max(6000).optional(),
  writingRubric: z.string().min(1).max(12000).optional(),
  validatorHints: z.record(z.string(), z.unknown()).default({}),
}).strict();

/** Authoring envelope. Runtime projection deliberately strips privateEvidence. */
export const canonicalQuestionRevisionSchema = z.object({
  schemaVersion: z.literal(CONTENT_SCHEMA_VERSION),
  logicalQuestionId: z.string().uuid(),
  revision: z.number().int().positive(),
  origin: authoringOriginSchema,
  question: questionSchema,
  learnerExplanation: z.string().trim().min(1).max(4000),
  privateEvidence: privateAuthoringEvidenceSchema.default({ validatorHints: {} }),
  assets: z.array(assetReferenceSchema).max(12).default([]),
  frameworkReferences: z.array(frameworkReferenceSchema).min(1),
}).strict().superRefine((value, context) => {
  if (value.question.explanation !== value.learnerExplanation) {
    context.addIssue({ code: "custom", path: ["learnerExplanation"], message: "During v2 compatibility, learnerExplanation must equal question.explanation." });
  }
});

export const reviewDecisionSchema = z.enum(["pass", "revise", "reject", "escalate"]);
export const independentReviewSchema = z.object({
  reviewerKind: z.enum(["ai_codex", "ai_claude", "human_owner", "future_human_reviewer"]),
  reviewerId: z.string().min(1).max(160),
  generatorKind: authoringOriginSchema,
  independentlySolvedAnswer: z.unknown(),
  suppliedAnswerAgreement: z.boolean(),
  decision: reviewDecisionSchema,
  issueCodes: z.array(z.string().regex(/^[a-z0-9_]+$/)).max(40),
  rationale: z.string().min(1).max(6000),
  confidenceEvidence: z.number().min(0).max(1).optional(),
}).strict().superRefine((review, context) => {
  const sameAgentFamily =
    (review.generatorKind === "ai_codex" && review.reviewerKind === "ai_codex") ||
    (review.generatorKind === "ai_claude" && review.reviewerKind === "ai_claude");
  if (sameAgentFamily) context.addIssue({ code: "custom", path: ["reviewerKind"], message: "An AI family cannot be the sole reviewer of its own output." });
});

export const riskLevelSchema = z.enum(["low", "elevated", "high"]);
export const riskAssessmentSchema = z.object({
  level: riskLevelSchema,
  signals: z.array(z.string().regex(/^[a-z0-9_]+$/)),
  requiresIndividualOwnerReview: z.boolean(),
}).strict();

export type CanonicalQuestionRevision = z.infer<typeof canonicalQuestionRevisionSchema>;
export type IndependentReview = z.infer<typeof independentReviewSchema>;

export function canonicalContentHash(value: unknown): string {
  const stable = JSON.stringify(sortJson(value));
  return createHash("sha256").update(stable).digest("hex");
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, sortJson(v)]));
  }
  return value;
}

export function newLogicalQuestionId(): string { return randomUUID(); }
