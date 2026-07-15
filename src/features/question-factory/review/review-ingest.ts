import { createHash } from "node:crypto";

import { z } from "zod";

import { FACTORY_LIMITS, identitiesAreIndependent, normaliseIdentity } from "../config";
import type { ReviewIngestionIssueCode } from "../config";
import {
  AMBIGUITY_STATUSES,
  REVIEW_RESULTS,
  appendReviewRecord,
  hashJson,
  verifyReviewChain,
  type CandidateProvenance,
  type ReviewRecordDraft,
} from "../provenance";
import { factoryIdentifierSchema } from "../shared/identifiers";
import type { FactoryRepository } from "../storage";
import { checkAgainstProductionSchema, parseCandidateProvenance, parseCandidateQuestion } from "../validation";
import { classifySemanticCategory } from "../workflow";
import { attemptSemanticReviewTransition, type SemanticReviewOrchestrationOutcome } from "./orchestrate-semantic-review";
import { computeReviewResultHash } from "./review-result-hash";

/**
 * External review-ingestion response schema (contract §9). `reviewId` is
 * a stable identity for *this submission*, distinct from `candidateId`
 * (used for idempotent-replay/conflict detection — see
 * `buildReviewIdempotencyReportId`). `reviewerModel` is the reviewer's
 * raw declared model/tool name, resolved through the shared
 * `normaliseIdentity` alias table — never trusted as already-normalised,
 * and there is deliberately no self-declared "I am independent" field:
 * independence is always recomputed server-side (`identitiesAreIndependent`).
 */
export const reviewIngestionInputSchema = z.object({
  reviewId: factoryIdentifierSchema,
  candidateId: factoryIdentifierSchema,
  candidateRevision: z.number().int().nonnegative(),
  candidateContentHash: z.string().trim().min(1).max(FACTORY_LIMITS.PROVENANCE_MAX_HASH_LENGTH),
  blueprintHash: z.string().trim().min(1).max(FACTORY_LIMITS.PROVENANCE_MAX_HASH_LENGTH),
  reviewerModel: z.string().trim().min(1).max(FACTORY_LIMITS.IDENTITY_MODEL_ID_MAX_LENGTH),
  reviewerVersion: z.string().trim().min(1).max(FACTORY_LIMITS.PROVENANCE_MAX_VERSION_LENGTH),
  result: z.enum(REVIEW_RESULTS),
  confidence: z.number().min(0).max(1),
  findings: z
    .array(z.string().trim().min(1).max(FACTORY_LIMITS.REVIEW_MAX_FINDING_LENGTH))
    .max(FACTORY_LIMITS.REVIEW_MAX_FINDINGS),
  evidenceReferences: z
    .array(z.string().trim().min(1).max(FACTORY_LIMITS.REVIEW_MAX_EVIDENCE_REFERENCE_LENGTH))
    .max(FACTORY_LIMITS.REVIEW_MAX_EVIDENCE_REFERENCES),
  recommendedCorrections: z
    .array(z.string().trim().min(1).max(FACTORY_LIMITS.REVIEW_MAX_FINDING_LENGTH))
    .max(FACTORY_LIMITS.MAX_RECOMMENDED_CORRECTIONS)
    .optional(),
  ambiguityStatus: z.enum(AMBIGUITY_STATUSES),
  reviewedAt: z.iso.datetime(),
  reviewPromptVersion: z.string().trim().min(1).max(FACTORY_LIMITS.PROVENANCE_MAX_VERSION_LENGTH),
  reviewPromptHash: z.string().trim().min(1).max(FACTORY_LIMITS.PROVENANCE_MAX_HASH_LENGTH),
});

export type ReviewIngestionInput = z.infer<typeof reviewIngestionInputSchema>;

/** Distinct id namespace from every other report key (`sv-`, `cv-`, `prompt-pack-`, `review-pack-`) so idempotency records can never collide with them. */
export function buildReviewIdempotencyReportId(candidateId: string, reviewId: string): string {
  const digest = createHash("sha256").update(`${candidateId}:${reviewId}`, "utf8").digest("hex").slice(0, 40);
  return `rv-${digest}`;
}

interface StoredReviewIdempotencyRecord {
  readonly candidateId: string;
  readonly reviewId: string;
  readonly reviewResultFingerprint: string;
  readonly reviewHash: string;
}

/**
 * `hashJson` over the response's own content-bearing fields, excluding
 * `reviewedAt` (contract §9) — this is deliberately a *different* hash
 * from `ReviewRecord`'s own `reviewHash`/chain hash (which does include
 * `reviewedAt`, per the already-implemented `review-chain.ts` — see that
 * module's doc comment for why this implementation choice is preserved
 * as-is rather than "corrected"). This one exists purely to answer "is a
 * resubmission under the same `reviewId` literally the same review, or a
 * changed one" — a narrower, idempotency-only question.
 */
function computeReviewResultFingerprint(input: ReviewIngestionInput): string {
  return hashJson({
    candidateId: input.candidateId,
    candidateRevision: input.candidateRevision,
    candidateContentHash: input.candidateContentHash,
    blueprintHash: input.blueprintHash,
    reviewerModel: input.reviewerModel,
    reviewerVersion: input.reviewerVersion,
    result: input.result,
    confidence: input.confidence,
    findings: input.findings,
    evidenceReferences: input.evidenceReferences,
    recommendedCorrections: input.recommendedCorrections,
    ambiguityStatus: input.ambiguityStatus,
    reviewPromptVersion: input.reviewPromptVersion,
    reviewPromptHash: input.reviewPromptHash,
  });
}

export type ReviewIngestionOutcome =
  | {
      readonly status: "accepted";
      readonly candidateId: string;
      readonly reviewId: string;
      readonly replayed: boolean;
      readonly insufficientEvidenceDowngraded: boolean;
      readonly gateOutcome: SemanticReviewOrchestrationOutcome;
    }
  | { readonly status: "rejected"; readonly issueCode: ReviewIngestionIssueCode; readonly message: string };

function readStringField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

/**
 * `questions:review-ingest`'s core logic (contract §9): validates an
 * already-JSON-parsed external reviewer response, resolves and
 * independence-checks the reviewer identity, checks every binding field
 * against the candidate's *current* stored state, appends a
 * `ReviewRecord` via `appendReviewRecord` (never hand-assembled), and
 * attempts the `semantic_review_passed` transition. Every rejection path
 * performs no mutation whatsoever — no chain append, no idempotency
 * record, no lifecycle change — matching the "no mutation" column of the
 * contract's outcome table.
 */
export async function ingestExternalReview(
  rawInput: unknown,
  repository: FactoryRepository,
): Promise<ReviewIngestionOutcome> {
  const parsed = reviewIngestionInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      status: "rejected",
      issueCode: "malformed_review_response",
      message: `Review response failed schema validation: ${parsed.error.issues.map((issue) => issue.message).join("; ")}`,
    };
  }
  const input = parsed.data;

  const reviewResultFingerprint = computeReviewResultFingerprint(input);
  const idempotencyReportId = buildReviewIdempotencyReportId(input.candidateId, input.reviewId);
  const existingIdempotency = (await repository.read("reports", idempotencyReportId)) as
    | StoredReviewIdempotencyRecord
    | undefined;

  if (existingIdempotency !== undefined) {
    if (existingIdempotency.reviewResultFingerprint !== reviewResultFingerprint) {
      return {
        status: "rejected",
        issueCode: "review_id_conflict",
        message: `Review id '${input.reviewId}' was already submitted for candidate '${input.candidateId}' with different content — use a new reviewId for a genuinely different review.`,
      };
    }
    // Idempotent replay: the chain append already happened. Re-run the
    // gate attempt (itself replay-safe) so the caller always sees the
    // current lifecycle outcome, without appending a second time.
    const gateOutcome = await attemptSemanticReviewTransition(input.candidateId, repository);
    return {
      status: "accepted",
      candidateId: input.candidateId,
      reviewId: input.reviewId,
      replayed: true,
      insufficientEvidenceDowngraded: false,
      gateOutcome,
    };
  }

  const candidateRaw = await repository.read("review-queue", input.candidateId);
  if (candidateRaw === undefined) {
    return {
      status: "rejected",
      issueCode: "unknown_candidate",
      message: `No candidate '${input.candidateId}' found in review-queue.`,
    };
  }
  if (typeof candidateRaw !== "object" || candidateRaw === null) {
    return { status: "rejected", issueCode: "repository_error", message: "Stored candidate record is not an object." };
  }
  const record = candidateRaw as Record<string, unknown>;
  const state = readStringField(record, "state") ?? "";
  if (state !== "correctness_check_passed" && state !== "semantic_review_passed") {
    return {
      status: "rejected",
      issueCode: "invalid_lifecycle_state_for_review",
      message: `Candidate '${input.candidateId}' is at lifecycle state '${state || "unknown"}', not eligible for review ingestion.`,
    };
  }

  const provenanceOutcome = parseCandidateProvenance(record.provenance);
  const questionOutcome = parseCandidateQuestion(record.question);
  if (!provenanceOutcome.ok || !questionOutcome.ok) {
    return {
      status: "rejected",
      issueCode: "repository_error",
      message: "Candidate does not parse against the required provenance/question schemas.",
    };
  }
  const productionSchemaOutcome = checkAgainstProductionSchema(questionOutcome.data);
  if (!productionSchemaOutcome.ok) {
    return {
      status: "rejected",
      issueCode: "repository_error",
      message: "Candidate question no longer satisfies the production schema.",
    };
  }
  const provenance: CandidateProvenance = provenanceOutcome.data;

  if (input.candidateRevision !== provenance.revision) {
    return {
      status: "rejected",
      issueCode: "stale_review_revision",
      message: `Review declares revision ${input.candidateRevision}, but candidate '${input.candidateId}' is now at revision ${provenance.revision}.`,
    };
  }
  if (input.candidateContentHash !== provenance.contentHash) {
    return {
      status: "rejected",
      issueCode: "content_hash_mismatch",
      message: `Review's declared candidateContentHash does not match candidate '${input.candidateId}''s current content hash.`,
    };
  }

  let blueprintHash: string | undefined;
  const blueprintRecord = await repository.read("blueprints", provenance.blueprintId);
  if (blueprintRecord !== undefined) {
    blueprintHash = hashJson(blueprintRecord);
  }
  if (blueprintHash !== undefined && input.blueprintHash !== blueprintHash) {
    return {
      status: "rejected",
      issueCode: "blueprint_hash_mismatch",
      message: `Review's declared blueprintHash does not match candidate '${input.candidateId}''s current blueprint.`,
    };
  }

  const reviewPackReport = (await repository.read("reports", `review-pack-${input.candidateId}`)) as
    | { readonly promptHash?: string; readonly pack?: { readonly reviewPromptVersion?: string } }
    | undefined;
  if (reviewPackReport !== undefined) {
    const mismatchedHash = reviewPackReport.promptHash !== undefined && reviewPackReport.promptHash !== input.reviewPromptHash;
    const mismatchedVersion =
      reviewPackReport.pack?.reviewPromptVersion !== undefined &&
      reviewPackReport.pack.reviewPromptVersion !== input.reviewPromptVersion;
    if (mismatchedHash || mismatchedVersion) {
      return {
        status: "rejected",
        issueCode: "review_prompt_reference_mismatch",
        message: `Declared reviewPromptHash/reviewPromptVersion do not match the review pack actually issued for candidate '${input.candidateId}'.`,
      };
    }
  }

  const reviewerIdentity = normaliseIdentity(input.reviewerModel);
  if (!reviewerIdentity) {
    return {
      status: "rejected",
      issueCode: "unsupported_reviewer_identity",
      message: `Declared reviewer model '${input.reviewerModel}' does not resolve through the identity-alias table.`,
    };
  }

  if (!identitiesAreIndependent(provenance.generatorAdapter.identity, reviewerIdentity)) {
    return {
      status: "rejected",
      issueCode: "self_review_rejected",
      message: `Reviewer identity is not independent of the candidate's generator identity — self-review is never accepted as evidence.`,
    };
  }

  if (provenance.reviewRecords.length >= FACTORY_LIMITS.PROVENANCE_MAX_REVIEW_RECORDS) {
    return {
      status: "rejected",
      issueCode: "review_chain_limit_exceeded",
      message: `Candidate '${input.candidateId}' already has ${provenance.reviewRecords.length} review records, at the configured bound.`,
    };
  }
  if (!verifyReviewChain(provenance.reviewRecords).valid) {
    return {
      status: "rejected",
      issueCode: "review_chain_corrupt",
      message: `Candidate '${input.candidateId}''s existing review chain fails tamper-evidence verification — refusing to append onto it.`,
    };
  }

  // Contract §9: a "passed" result asserted with zero evidence references
  // is treated as an incomplete review, never a valid "passed" — the
  // chain still records it (a complete audit trail of every submission),
  // downgraded to "warning", and it never advances the lifecycle on its
  // own.
  const insufficientEvidenceDowngraded = input.result === "passed" && input.evidenceReferences.length === 0;
  const storedResult = insufficientEvidenceDowngraded ? "warning" : input.result;

  const semanticClassification = classifySemanticCategory(productionSchemaOutcome.question);

  const draft: ReviewRecordDraft = {
    candidateId: input.candidateId,
    stage: "correctness_check_passed",
    reviewerIdentity,
    reviewerVersion: input.reviewerVersion,
    result: storedResult,
    confidence: input.confidence,
    findings: input.findings,
    evidenceReferences: input.evidenceReferences,
    ...(input.recommendedCorrections !== undefined ? { recommendedCorrections: input.recommendedCorrections } : {}),
    ambiguityStatus: input.ambiguityStatus,
    reviewedAt: input.reviewedAt,
    reviewPromptVersion: input.reviewPromptVersion,
    reviewPromptHash: input.reviewPromptHash,
    evidenceBinding: {
      candidateContentHash: input.candidateContentHash,
      blueprintHash: input.blueprintHash,
      candidateRevision: input.candidateRevision,
      reviewResultHash: computeReviewResultHash({
        result: storedResult,
        confidence: input.confidence,
        findings: input.findings,
        evidenceReferences: input.evidenceReferences,
        ambiguityStatus: input.ambiguityStatus,
        recommendedCorrections: input.recommendedCorrections,
      }),
      semanticClassification,
    },
  };

  const newRecord = appendReviewRecord(provenance.reviewRecords, draft);
  const newChain = [...provenance.reviewRecords, newRecord];
  const updatedRecord: Record<string, unknown> = {
    ...record,
    provenance: { ...provenance, reviewRecords: newChain },
  };

  const updateResult = await repository.update("review-queue", input.candidateId, updatedRecord, {
    expectedContentHash: hashJson(record),
  });
  if (!updateResult.ok) {
    return {
      status: "rejected",
      issueCode: "repository_error",
      message: `Failed to append review record: ${updateResult.message}`,
    };
  }

  // Idempotency record is written only after the append durably
  // succeeds — a failure here is fine to ignore (the append itself is
  // the source of truth; this is a fast-path lookup index, not the
  // authority), so a benign duplicate-create race never masks a real
  // append success.
  await repository.create("reports", idempotencyReportId, {
    candidateId: input.candidateId,
    reviewId: input.reviewId,
    reviewResultFingerprint,
    reviewHash: newRecord.reviewHash,
  } satisfies StoredReviewIdempotencyRecord);

  const gateOutcome = await attemptSemanticReviewTransition(input.candidateId, repository);

  return {
    status: "accepted",
    candidateId: input.candidateId,
    reviewId: input.reviewId,
    replayed: false,
    insufficientEvidenceDowngraded,
    gateOutcome,
  };
}
