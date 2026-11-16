import "server-only";

import { createHash } from "node:crypto";
import { z } from "zod";

import rawPilotBatch from "../../../../../content/vihaan-scholarship/pilot-01/draft.json";
import rawPublishedManifest from "../../../../../content/vihaan-scholarship/pilot-01/published-manifest.json";
import rawValidationReport from "../../../../../content/vihaan-scholarship/pilot-01/validation-report.json";
import {
  canonicalQuestionHash,
  humanPublicationApprovalSchema,
  validateHumanApproval,
  type HumanPublicationApproval,
} from "@/features/content-governance/publication-integrity";
import { hashJson } from "@/features/question-factory/provenance/content-hash";
import type { VihaanSolutionDetail } from "@/features/scholarship-prep/lib/practice";
import { questionBaseSchema, questionSchema, type Question } from "@/schemas/question.schema";

/**
 * Vihaan Scholarship Prep — canonical 20-question pilot bank (`vihaan-pilot-01`).
 *
 * Re-exported strictly on the server from the schema-validated draft JSON at
 * `content/vihaan-scholarship/pilot-01/draft.json` so there is a single canonical
 * question source across content governance, validation scripts, and tests.
 * All items remain `status: "draft"` with `approvedBy: null` per ADR-017.
 */

export interface VihaanPilotDraftItem {
  readonly question: Question;
  readonly workedSolution: readonly string[];
  readonly reviewFocus: readonly string[];
  readonly writingGuidance: {
    readonly rubricId: string;
    readonly rubricVersion: number;
    readonly successCriteria: readonly string[];
    readonly assessmentMode: string;
  } | null;
}

export interface VihaanPilotBatch {
  readonly batchId: string;
  readonly version: number;
  readonly provenance: Record<string, unknown>;
  readonly approvedBy: null;
  readonly items: readonly VihaanPilotDraftItem[];
}

function assertDraftPilotBatch(batch: typeof rawPilotBatch): VihaanPilotBatch {
  if (batch.approvedBy !== null) {
    throw new Error("vihaan-pilot-01 draft bank must remain unapproved (approvedBy: null)");
  }

  for (const item of batch.items) {
    if (item.question.status !== "draft") {
      throw new Error(
        `vihaan-pilot-01 item ${item.question.id} must remain in draft status until governed approval`,
      );
    }
  }

  return batch as unknown as VihaanPilotBatch;
}

export const VIHAAN_PILOT_BATCH: VihaanPilotBatch = assertDraftPilotBatch(rawPilotBatch);

export const VIHAAN_PILOT_ITEMS: readonly VihaanPilotDraftItem[] = VIHAAN_PILOT_BATCH.items;

export const VIHAAN_PILOT_QUESTIONS: readonly Question[] = VIHAAN_PILOT_ITEMS.map(
  (item) => item.question,
);

export const MATH_QUESTIONS: readonly Question[] = VIHAAN_PILOT_QUESTIONS.filter(
  (question) => question.metadata.subject === "numeracy",
);

export const NR_QUESTIONS: readonly Question[] = VIHAAN_PILOT_QUESTIONS.filter(
  (question) => question.metadata.subject === "numerical_reasoning",
);

export const VR_QUESTIONS: readonly Question[] = VIHAAN_PILOT_QUESTIONS.filter(
  (question) => question.metadata.subject === "verbal_reasoning",
);

export const RC_QUESTIONS: readonly Question[] = VIHAAN_PILOT_QUESTIONS.filter(
  (question) => question.metadata.subject === "reading",
);

export const WE_QUESTIONS: readonly Question[] = VIHAAN_PILOT_QUESTIONS.filter(
  (question) => question.metadata.subject === "writing",
);

export const VIHAAN_PILOT_COUNTS = {
  numeracy: MATH_QUESTIONS.length,
  numerical_reasoning: NR_QUESTIONS.length,
  verbal_reasoning: VR_QUESTIONS.length,
  reading: RC_QUESTIONS.length,
  writing: WE_QUESTIONS.length,
  mathematics: MATH_QUESTIONS.length,
  reading_comprehension: RC_QUESTIONS.length,
  written_expression: WE_QUESTIONS.length,
  total: VIHAAN_PILOT_QUESTIONS.length,
} as const;

export const VIHAAN_QUESTION_METADATA_BY_ID: ReadonlyMap<
  string,
  { readonly subject: string; readonly topic: string }
> = new Map(
  VIHAAN_PILOT_QUESTIONS.map((question) => [
    question.id,
    {
      subject: question.metadata.subject,
      topic: question.metadata.topic,
    },
  ]),
);

export type { VihaanSolutionDetail };

export const VIHAAN_SOLUTIONS_BY_ID: ReadonlyMap<string, VihaanSolutionDetail> = new Map(
  VIHAAN_PILOT_ITEMS.map((item) => {
    const manualKey =
      item.question.answerKey.kind === "manual" ? item.question.answerKey : undefined;
    const detail: VihaanSolutionDetail = {
      workedSolution: item.workedSolution,
      ...(manualKey?.rubric ? { rubric: manualKey.rubric } : {}),
      ...(manualKey?.sampleResponse ? { sampleResponse: manualKey.sampleResponse } : {}),
    };
    return [item.question.id, detail];
  }),
);

export function getVihaanSolutionsRecord(
  questions: readonly Question[] = VIHAAN_PILOT_QUESTIONS,
): Readonly<Record<string, VihaanSolutionDetail>> {
  const out: Record<string, VihaanSolutionDetail> = {};
  for (const question of questions) {
    const detail = VIHAAN_SOLUTIONS_BY_ID.get(question.id);
    if (detail) {
      out[question.id] = detail;
    }
  }
  return out;
}

const NON_HUMAN_APPROVER =
  /\b(?:claude|anthropic|opus|sonnet|haiku|gpt|chatgpt|openai|gemini|copilot|codex|llm|bot|automated?|ai|antigravity)\b/i;

const hexDigest = z.string().regex(/^[a-f0-9]{64}$/);

const canonicalPilotQuestionSchema = questionBaseSchema
  .strict()
  .extend({
    status: z.literal("draft"),
    yearLevel: z.literal(6),
    examStyle: z.literal("scholarship_style"),
    id: z.string().regex(/^vihaan-p01-(m0[1-6]|n0[1-5]|v0[1-4]|r0[1-3]|w0[1-2])$/),
    metadata: questionBaseSchema.shape.metadata.strict().extend({
      tags: z.array(z.enum(["vihaan-pilot", "year-5-stretch", "manual-assessment"])),
    }),
    options: z.array(z.object({ id: z.enum(["a", "b", "c", "d"]), text: z.string().min(1) }).strict()),
    answerKey: z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("single_option"), optionId: z.enum(["a", "b", "c", "d"]) }).strict(),
      z
        .object({
          kind: z.literal("manual"),
          rubric: z.string().min(10),
          sampleResponse: z.string().min(1).optional(),
        })
        .strict(),
    ]),
    stimulus: z
      .object({
        title: z.string().min(1),
        body: z.string().min(1),
        attribution: z.literal("MindMosaic original"),
      })
      .strict()
      .optional(),
    visuals: z.array(z.never()).length(0),
    media: z.never().optional(),
    interaction: z.never().optional(),
  })
  .superRefine((q, ctx) => {
    const result = questionSchema.safeParse(q);
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({ code: "custom", message: issue.message, path: issue.path });
      }
    }
  });

const canonicalPilotSchema = z
  .object({
    batchId: z.literal("vihaan-pilot-01"),
    version: z.literal(1),
    provenance: z
      .object({
        adapter: z.literal("manual_external"),
        author: z.string().min(1),
        model: z.null(),
        generatedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        originalGenerationEvidence: z.string().min(1),
        externalSourceMaterialUsed: z.literal(false),
        qwenStatus: z.string().min(1),
        promptFile: z.literal("authoring-brief.md"),
      })
      .strict(),
    approvedBy: z.null(),
    items: z
      .array(
        z
          .object({
            question: canonicalPilotQuestionSchema,
            workedSolution: z.array(z.string().min(10)).min(2),
            reviewFocus: z.array(z.string().min(10)).min(1),
            writingGuidance: z
              .object({
                rubricId: z.literal("scholarship-written-expression"),
                rubricVersion: z.literal(1),
                successCriteria: z.array(z.string().min(10)).min(3),
                assessmentMode: z.literal("human_only"),
              })
              .strict()
              .nullable(),
          })
          .strict(),
      )
      .length(20),
  })
  .strict();

const adr017EvidenceSchema = z
  .object({
    questionId: z.string().min(1),
    draftItemHash: hexDigest,
    draftQuestionHash: hexDigest,
    publishedQuestionHash: hexDigest,
    recomputePassed: z.boolean().nullable(),
    editorialInterpretationVerified: z.literal(true),
    originalityVerified: z.literal(true),
    ageSuitabilityVerified: z.literal(true),
  })
  .strict();

export const vihaanPilotPublishedManifestSchema = z
  .object({
    kind: z.literal("vihaan_pilot_publication_manifest"),
    schemaVersion: z.literal(1),
    batchId: z.string().min(1),
    revision: z.number().int().positive(),
    draftBatchHash: hexDigest,
    approvedBy: z.string().trim().min(1),
    approvedAt: z.iso.datetime({ offset: true }),
    publishedAt: z.iso.datetime({ offset: true }),
    adr017Evidence: z.array(adr017EvidenceSchema),
    approvals: z.array(humanPublicationApprovalSchema),
    manifestFingerprint: hexDigest,
  })
  .strict();

export type VihaanPilotPublishedManifestEntry = HumanPublicationApproval;
export type VihaanPilotPublishedManifest = z.infer<typeof vihaanPilotPublishedManifestSchema>;

export type VihaanPilotVerificationResult =
  | {
      readonly ok: true;
      readonly batchId: string;
      readonly approvedBy: string;
      readonly approvedAt: string;
      readonly draftBatchHash: string;
      readonly manifestFingerprint: string;
      readonly questions: readonly Question[];
    }
  | {
      readonly ok: false;
      readonly reason: string;
      readonly questions: readonly [];
    };

function sha256JsonStringify(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function isValidHumanApproverName(approvedBy: string): boolean {
  const trimmed = approvedBy.trim();
  return trimmed.split(/\s+/).filter(Boolean).length >= 2 && !NON_HUMAN_APPROVER.test(trimmed);
}

/**
 * Verifies Vihaan Pilot publication manifest and every per-item ADR-017 human approval
 * record against the schema-validated draft batch and automated validation report.
 * Always fails closed (returning `questions: []`) on any mismatch or missing evidence.
 */
export function verifyVihaanPilotPublication(
  manifestInput: unknown = rawPublishedManifest,
): VihaanPilotVerificationResult {
  const parsedManifest = vihaanPilotPublishedManifestSchema.safeParse(manifestInput);
  if (!parsedManifest.success) {
    return { ok: false, reason: "invalid_published_manifest", questions: [] };
  }

  const manifest = parsedManifest.data;
  if (manifest.batchId !== VIHAAN_PILOT_BATCH.batchId) {
    return { ok: false, reason: "batch_id_mismatch", questions: [] };
  }
  if (!isValidHumanApproverName(manifest.approvedBy)) {
    return { ok: false, reason: "invalid_human_approver", questions: [] };
  }
  if (Number.isNaN(Date.parse(manifest.approvedAt)) || Number.isNaN(Date.parse(manifest.publishedAt))) {
    return { ok: false, reason: "invalid_approval_timestamp", questions: [] };
  }

  const { manifestFingerprint, ...manifestFacts } = manifest;
  if (manifestFingerprint !== hashJson(manifestFacts)) {
    return { ok: false, reason: "manifest_fingerprint_mismatch", questions: [] };
  }

  const parsedDraft = canonicalPilotSchema.safeParse(rawPilotBatch);
  if (!parsedDraft.success) {
    return { ok: false, reason: "invalid_draft_batch", questions: [] };
  }
  const actualBatchHash = sha256JsonStringify(parsedDraft.data);
  if (manifest.draftBatchHash !== actualBatchHash) {
    return { ok: false, reason: "draft_batch_hash_mismatch", questions: [] };
  }

  if (
    !rawValidationReport.schemaPassed ||
    rawValidationReport.errors.length > 0 ||
    rawValidationReport.batchHash !== manifest.draftBatchHash
  ) {
    return { ok: false, reason: "validation_report_mismatch", questions: [] };
  }

  if (
    manifest.approvals.length !== parsedDraft.data.items.length ||
    manifest.adr017Evidence.length !== parsedDraft.data.items.length
  ) {
    return { ok: false, reason: "item_count_mismatch", questions: [] };
  }

  const approvalById = new Map<string, HumanPublicationApproval>();
  for (const approval of manifest.approvals) {
    if (approvalById.has(approval.questionId)) {
      return { ok: false, reason: `duplicate_approval_${approval.questionId}`, questions: [] };
    }
    approvalById.set(approval.questionId, approval);
  }

  const evidenceById = new Map<string, (typeof manifest.adr017Evidence)[number]>();
  for (const evidence of manifest.adr017Evidence) {
    if (evidenceById.has(evidence.questionId)) {
      return { ok: false, reason: `duplicate_evidence_${evidence.questionId}`, questions: [] };
    }
    evidenceById.set(evidence.questionId, evidence);
  }

  const verifiedQuestions: Question[] = [];
  for (const draftItem of parsedDraft.data.items) {
    const questionId = draftItem.question.id;
    const approval = approvalById.get(questionId);
    const evidence = evidenceById.get(questionId);
    if (!approval || !evidence) {
      return { ok: false, reason: `missing_publication_record_${questionId}`, questions: [] };
    }
    if (approval.approvedBy !== manifest.approvedBy) {
      return { ok: false, reason: `approver_mismatch_${questionId}`, questions: [] };
    }
    if (approval.question.status !== "published") {
      return { ok: false, reason: `unpublished_status_${questionId}`, questions: [] };
    }

    const expectedDraftItemHash = sha256JsonStringify(draftItem);
    const approvalResult = validateHumanApproval(
      approval,
      approval.question,
      manifest.revision,
      expectedDraftItemHash,
    );
    if (!approvalResult.ok) {
      return {
        ok: false,
        reason: `${questionId}_${approvalResult.reason}`,
        questions: [],
      };
    }

    const expectedPublishedHash = canonicalQuestionHash({
      ...draftItem.question,
      status: "published",
    });
    if (approval.contentHash !== expectedPublishedHash) {
      return { ok: false, reason: `draft_drift_${questionId}`, questions: [] };
    }

    const requiresNumericRecompute =
      draftItem.question.metadata.subject === "numeracy" ||
      draftItem.question.metadata.subject === "numerical_reasoning";
    if (
      evidence.draftItemHash !== expectedDraftItemHash ||
      evidence.publishedQuestionHash !== approval.contentHash ||
      (requiresNumericRecompute && evidence.recomputePassed !== true)
    ) {
      return { ok: false, reason: `adr017_evidence_mismatch_${questionId}`, questions: [] };
    }

    verifiedQuestions.push(Object.freeze(approval.question));
  }

  return {
    ok: true,
    batchId: manifest.batchId,
    approvedBy: manifest.approvedBy,
    approvedAt: manifest.approvedAt,
    draftBatchHash: manifest.draftBatchHash,
    manifestFingerprint: manifest.manifestFingerprint,
    questions: Object.freeze(verifiedQuestions),
  };
}

let cachedVerification: VihaanPilotVerificationResult | undefined;

export function getVerifiedVihaanPilotPublication(): VihaanPilotVerificationResult {
  cachedVerification ??= verifyVihaanPilotPublication(rawPublishedManifest);
  return cachedVerification;
}
