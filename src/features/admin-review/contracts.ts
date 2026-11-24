import { z } from "zod";

import {
  questionBaseSchema,
  questionMetadataSchema,
} from "@/schemas/question.schema";
import type { WritingTask } from "@/features/writing/task";
import type { MockPaperSlot, ReviewPool } from "./pool-classification";

export const REVIEW_BANK_IDS = [
  "scholarship-y6-core",
  "vihaan-scholarship-500",
] as const;

export type ReviewBankId = (typeof REVIEW_BANK_IDS)[number];

export const reviewBankIdSchema = z.enum(REVIEW_BANK_IDS);

export const REVIEW_DECISION_KINDS = ["approve", "revise", "reject"] as const;
export type ReviewDecisionKind = (typeof REVIEW_DECISION_KINDS)[number];

export const reviewChecksSchema = z
  .object({
    correctness: z.boolean(),
    originality: z.boolean(),
    ageAppropriateness: z.boolean(),
    editorialInterpretation: z.boolean(),
    difficultyCalibrated: z.boolean(),
  })
  .strict();

export type ReviewChecks = z.infer<typeof reviewChecksSchema>;

// Review-local extensions: these do not widen the student bank or its taxonomy.
export const scholarshipReviewSchema = questionBaseSchema
  .extend({
    type: z.enum(["multiple_choice", "reading_comprehension"]),
    examStyle: z.literal("scholarship_style"),
    yearLevel: z.literal(6),
    status: z.literal("draft").default("draft"),
    answerKey: z.object({
      kind: z.literal("single_option"),
      optionId: z.string().min(1),
    }),
    metadata: questionMetadataSchema.extend({
      subject: z.enum([
        "verbal_reasoning",
        "numerical_reasoning",
        "reading",
        "numeracy",
      ]),
      topic: z.string().default("Scholarship reasoning"),
      difficulty: z.enum(["easy", "medium", "hard", "challenging"]),
    }),
  })
  .superRefine((question, context) => {
    const ids = question.options.map((option) => option.id);
    if (
      ids.length < 2 ||
      new Set(ids).size !== ids.length ||
      !ids.includes(question.answerKey.optionId)
    ) {
      context.addIssue({
        code: "custom",
        message: "Options must be unique and contain the declared answer.",
      });
    }
    if (question.type === "reading_comprehension" && !question.stimulus) {
      context.addIssue({
        code: "custom",
        message: "Reading questions require their shared passage.",
      });
    }
  });

/**
 * Review-local schema for Scholarship Written Expression drafts (40 items in
 * Codex expansion-500 + pilot-01). No new writing taxonomy is invented:
 * approved prompts flow into MindMosaic's existing `human_writing_prompt_approval`
 * pipeline via `scholarshipWritingItemToTask`.
 */
export const scholarshipWritingReviewSchema = questionBaseSchema
  .extend({
    type: z.literal("essay"),
    examStyle: z.literal("scholarship_style"),
    yearLevel: z.literal(6),
    status: z.literal("draft").default("draft"),
    options: z.array(z.never()).max(0).default([]),
    answerKey: z.object({
      kind: z.literal("manual"),
      rubric: z.string().min(10),
      sampleResponse: z.string().min(1).optional(),
      optionId: z.never().optional(),
    }),
    metadata: questionMetadataSchema.extend({
      subject: z.literal("writing"),
      topic: z.string().default("Written expression"),
      difficulty: z.enum(["easy", "medium", "hard", "challenging"]),
    }),
  });

export const reviewQuestionSchema = z.union([
  scholarshipReviewSchema,
  scholarshipWritingReviewSchema,
]);

export type ReviewQuestion = z.infer<typeof reviewQuestionSchema>;

export interface ReviewDecisionRecord {
  readonly id?: string;
  readonly decision: ReviewDecisionKind;
  readonly approvedBy: string;
  readonly reviewerName: string;
  readonly reviewerEmail: string;
  readonly decidedAt: string;
  readonly contentHash: string;
  readonly publishedContentHash?: string;
  readonly sourceRevision?: string;
  readonly revisionNumber?: number;
  readonly notes: string;
  readonly blindSolved: boolean;
  readonly checks: ReviewChecks;
  readonly evidenceFingerprint?: string;
  readonly matchesCurrentRevision: boolean;
  readonly isLegacyApproval?: boolean;
}

export type PublicationStatus =
  | "unpublished_draft"
  | "approved_in_review"
  | "revision_requested"
  | "rejected"
  | "published_in_git";

export interface ReviewBankSummary {
  readonly id: ReviewBankId;
  readonly label: string;
  readonly shortLabel: string;
  readonly description: string;
  readonly provisionalCanonical: boolean;
  readonly totalItems: number;
  readonly practiceItems: number;
  readonly mockItems: number;
  readonly writingItems: number;
  readonly sourceRevision: string;
}

export type ReviewEntry = {
  bankId?: ReviewBankId;
  batchId?: string;
  itemKind?: "question" | "writing_prompt";
  pool?: ReviewPool;
  designatedForMock?: boolean;
  mockPaper?: MockPaperSlot;
  mockPolicyNote?: string | null;
  source: string;
  /** D1: canonical SHA-256 of the raw draft question (incl. stimulus and visuals). */
  contentHash: string;
  /** D2: canonical SHA-256 of the factory candidate representation (non-writing). */
  candidateHash?: string;
  /** D3: canonical SHA-256 of the published Question or WritingTask. */
  publishedContentHash?: string;
  revisionNumber?: number;
  sourceRevision?: string;
  governance?: {
    bucket: string;
    reasons: string[];
    difficultyGate: string;
    estimator: string;
    candidateHash: string;
    publishedContentHash: string;
  };
  findings?: {
    reviewer: string;
    recommendation: string;
    difficultyEstimate?: string;
    difficultyVerdict?: string;
    notes?: string;
    semanticFlags: string[];
    originality?: string;
    myAnswer: string;
    working?: string;
    sourceRevision?: string;
    sourceContentHash?: string;
    matchesCurrentRevision?: boolean;
  };
  workedSolution?: readonly string[];
  reviewFocus?: readonly string[];
  arithmeticCheck?: {
    readonly expression: string;
    readonly expected: string;
  };
  writingGuidance?: {
    readonly rubricId: string;
    readonly rubricVersion: number;
    readonly successCriteria: readonly string[];
    readonly assessmentMode: string;
  };
  writingTask?: WritingTask;
  publicationStatus?: PublicationStatus;
  /** Legacy-compatible field populated when the current revision has a human approval. */
  approval?: {
    approvedBy: string;
    approvedAt: string;
    reviewerName?: string;
    reviewerEmail?: string;
  };
  latestDecision?: ReviewDecisionRecord;
  decisionHistory?: ReviewDecisionRecord[];
  kind: "scholarship";
  question: ReviewQuestion;
};

export interface ReviewCatalogue {
  activeBankId?: ReviewBankId;
  banks?: ReviewBankSummary[];
  entries: ReviewEntry[];
  issues: string[];
  approvalsAvailable: boolean;
  extendedDecisionsAvailable?: boolean;
  reviewer?: {
    readonly userId: string;
    readonly email: string;
    readonly displayName: string | null;
  };
}

export interface BatchProgressSummary {
  readonly batchId: string;
  readonly total: number;
  readonly approved: number;
  readonly revise: number;
  readonly reject: number;
  readonly pending: number;
  readonly publishedInGit: number;
  readonly practiceCount: number;
  readonly mockCount: number;
  readonly writingCount: number;
  readonly staleDecisionCount: number;
}

export function summariseBatchProgress(
  entries: readonly ReviewEntry[],
): BatchProgressSummary[] {
  const byBatch = new Map<string, ReviewEntry[]>();
  for (const entry of entries) {
    const batchKey = entry.batchId ?? entry.source;
    const group = byBatch.get(batchKey) ?? [];
    group.push(entry);
    byBatch.set(batchKey, group);
  }
  const summaries: BatchProgressSummary[] = [];
  for (const [batchId, group] of byBatch) {
    let approved = 0;
    let revise = 0;
    let reject = 0;
    let pending = 0;
    let publishedInGit = 0;
    let practiceCount = 0;
    let mockCount = 0;
    let writingCount = 0;
    let staleDecisionCount = 0;

    for (const entry of group) {
      if (entry.designatedForMock || entry.pool === "unseen_mock") mockCount++;
      else practiceCount++;
      if (entry.itemKind === "writing_prompt") writingCount++;
      if (entry.publicationStatus === "published_in_git") publishedInGit++;

      const current = entry.latestDecision;
      if (current && current.matchesCurrentRevision) {
        if (current.decision === "approve") approved++;
        else if (current.decision === "revise") revise++;
        else if (current.decision === "reject") reject++;
      } else if (entry.approval) {
        approved++;
      } else {
        pending++;
        if ((entry.decisionHistory ?? []).some((d) => !d.matchesCurrentRevision)) {
          staleDecisionCount++;
        }
      }
    }
    summaries.push({
      batchId,
      total: group.length,
      approved,
      revise,
      reject,
      pending,
      publishedInGit,
      practiceCount,
      mockCount,
      writingCount,
      staleDecisionCount,
    });
  }
  return summaries;
}
