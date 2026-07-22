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
  type ReviewRecord,
  type ReviewRecordDraft,
} from "../provenance";
import { resolveBoundBlueprint } from "../shared/bound-blueprint";
import { factoryIdentifierSchema } from "../shared/identifiers";
import type { FactoryRepository } from "../storage";
import { checkAgainstProductionSchema, parseCandidateProvenance, parseCandidateQuestion } from "../validation";
import { classifySemanticCategory } from "../workflow";
import { attemptSemanticReviewTransition, type SemanticReviewOrchestrationOutcome } from "./orchestrate-semantic-review";
import { computeReviewResultHash } from "./review-result-hash";

/**
 * External review-ingestion response schema (contract §9). `reviewId` is
 * a stable identity for *this submission*, distinct from `candidateId`.
 * `reviewerModel` is the reviewer's raw declared model/tool name,
 * resolved through the shared `normaliseIdentity` alias table — never
 * trusted as already-normalised, and there is deliberately no
 * self-declared "I am independent" field: independence is always
 * recomputed server-side (`identitiesAreIndependent`).
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

/**
 * `hashJson` over the submission's own content-bearing fields, excluding
 * `reviewedAt` (contract §9) — deliberately a *different* hash from
 * `ReviewRecord`'s own `reviewHash`/chain hash (which does include
 * `reviewedAt`, per the already-implemented `review-chain.ts` — see that
 * module's doc comment for why this implementation choice is preserved
 * as-is rather than "corrected"). This one exists purely to answer "is a
 * resubmission under the same `reviewId` literally the same review, or a
 * changed one" — a narrower, idempotency-only question, and (Mission 3B
 * P1-2) is stamped directly onto the durable `ReviewRecord` itself
 * (`reviewResultFingerprint`) rather than kept in a separate index.
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

/** Finds a record in an already chain-verified `reviewRecords` array matching `reviewId`, if any — the sole idempotency lookup this module performs. */
function findByReviewId(chain: readonly ReviewRecord[], reviewId: string): ReviewRecord | undefined {
  return chain.find((record) => record.reviewId === reviewId);
}

type IdempotencyResolution =
  | { readonly kind: "fresh" }
  | { readonly kind: "replay" }
  | { readonly kind: "conflict" };

/**
 * Mission 3B P1-2: resolves `reviewId` idempotency **from the chain
 * itself** — never from a separate sidecar report. A resubmission under
 * the same `reviewId` is a replay if the freshly computed
 * `reviewResultFingerprint` matches the one already stored on the
 * matching chain record, a conflict if it differs, and a fresh
 * submission if no record in `chain` declares this `reviewId` at all.
 * Because this reads only the chain the caller already holds (never a
 * second repository call), there is no window in which this decision
 * and the eventual append can observe different states of the world.
 */
function resolveIdempotency(chain: readonly ReviewRecord[], reviewId: string, freshFingerprint: string): IdempotencyResolution {
  const existing = findByReviewId(chain, reviewId);
  if (existing === undefined) return { kind: "fresh" };
  return existing.reviewResultFingerprint === freshFingerprint ? { kind: "replay" } : { kind: "conflict" };
}

interface CandidateReadResult {
  readonly record: Record<string, unknown>;
  readonly provenance: CandidateProvenance;
  readonly semanticClassification: ReturnType<typeof classifySemanticCategory>;
}

type CandidateReadOutcome =
  | { readonly ok: true; readonly data: CandidateReadResult }
  | { readonly ok: false; readonly issueCode: ReviewIngestionIssueCode; readonly message: string };

/** Reads and validates the candidate's current lifecycle state/shape — shared by the fresh-append path and the post-conflict re-read. */
async function readEligibleCandidate(candidateId: string, repository: FactoryRepository): Promise<CandidateReadOutcome> {
  const candidateRaw = await repository.read("review-queue", candidateId);
  if (candidateRaw === undefined) {
    return { ok: false, issueCode: "unknown_candidate", message: `No candidate '${candidateId}' found in review-queue.` };
  }
  if (typeof candidateRaw !== "object" || candidateRaw === null) {
    return { ok: false, issueCode: "repository_error", message: "Stored candidate record is not an object." };
  }
  const record = candidateRaw as Record<string, unknown>;
  const state = readStringField(record, "state") ?? "";
  if (state !== "correctness_check_passed" && state !== "semantic_review_passed") {
    return {
      ok: false,
      issueCode: "invalid_lifecycle_state_for_review",
      message: `Candidate '${candidateId}' is at lifecycle state '${state || "unknown"}', not eligible for review ingestion.`,
    };
  }

  const provenanceOutcome = parseCandidateProvenance(record.provenance);
  const questionOutcome = parseCandidateQuestion(record.question);
  if (!provenanceOutcome.ok || !questionOutcome.ok) {
    return {
      ok: false,
      issueCode: "repository_error",
      message: "Candidate does not parse against the required provenance/question schemas.",
    };
  }
  const productionSchemaOutcome = checkAgainstProductionSchema(questionOutcome.data);
  if (!productionSchemaOutcome.ok) {
    return { ok: false, issueCode: "repository_error", message: "Candidate question no longer satisfies the production schema." };
  }

  if (!verifyReviewChain(provenanceOutcome.data.reviewRecords).valid) {
    return {
      ok: false,
      issueCode: "review_chain_corrupt",
      message: `Candidate '${candidateId}''s existing review chain fails tamper-evidence verification — refusing to append onto it.`,
    };
  }

  return {
    ok: true,
    data: {
      record,
      provenance: provenanceOutcome.data,
      semanticClassification: classifySemanticCategory(productionSchemaOutcome.question),
    },
  };
}

/** Maximum times a fresh-append attempt is retried after losing an optimistic-concurrency race to an *unrelated* concurrent write (never to a retry storm — see the doc comment on `ingestExternalReview`). */
const MAX_APPEND_CONTENTION_RETRIES = 1;

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
 *
 * **Mission 3B P1-2 (crash-safety remediation).** Idempotency/conflict
 * detection for a reused `reviewId` is answered entirely from the
 * candidate's own `provenance.reviewRecords` chain (`reviewId`/
 * `reviewResultFingerprint`, stamped directly onto each record) — there
 * is no longer a separate sidecar write after the chain append. This
 * eliminates the crash window that separate write used to create: the
 * chain append (`repository.update`, guarded by `expectedContentHash`)
 * is now the *only* durable write this function performs before
 * attempting the semantic-gate transition, so a crash either leaves the
 * review entirely unappended (safe to retry from scratch) or durably
 * appended with its own idempotency key already embedded (safe to
 * replay). See `docs/reports/mission3-production/04-mission3b-semantic-review.md`
 * for the full before/after design.
 *
 * **Concurrency.** Two concurrent identical submissions race on the same
 * per-candidate lock `FactoryRepository.update()` already serialises:
 * both compute the same new chain from the same starting state, so
 * whichever writes first durably appends it and the second observes an
 * identical stored hash and replays (`update()`'s own content-hash
 * idempotency). Two concurrent submissions under the same `reviewId` but
 * different content race the same lock; the loser's `expectedContentHash`
 * guard fails (`state_mismatch`) because the winner's differently-hashed
 * write already landed — this function re-reads on that specific failure
 * and re-resolves idempotency against the now-current chain, which
 * correctly reports `review_id_conflict` once the winner's record (with
 * the same `reviewId`, a different `reviewResultFingerprint`) is visible.
 * A `state_mismatch` caused by some other, unrelated concurrent write is
 * retried once from a fresh read before giving up — bounded, never an
 * unbounded retry loop. A `lock_timeout` from losing the race for the
 * per-candidate lock is retried the same way, since it's indistinguishable
 * from a `state_mismatch` until the fresh read resolves it; a `lock_timeout`
 * that persists across the whole retry budget still surfaces as
 * `repository_error` rather than being reinterpreted as a conflict.
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
  const freshFingerprint = computeReviewResultFingerprint(input);

  return attemptIngest(input, freshFingerprint, repository, MAX_APPEND_CONTENTION_RETRIES);
}

async function attemptIngest(
  input: ReviewIngestionInput,
  freshFingerprint: string,
  repository: FactoryRepository,
  retriesRemaining: number,
): Promise<ReviewIngestionOutcome> {
  const candidateOutcome = await readEligibleCandidate(input.candidateId, repository);
  if (!candidateOutcome.ok) {
    return { status: "rejected", issueCode: candidateOutcome.issueCode, message: candidateOutcome.message };
  }
  const { record, provenance, semanticClassification } = candidateOutcome.data;

  // Mission 3B blueprint remediation: resolve and verify the candidate's
  // bound blueprint *before anything else this function decides* —
  // including the idempotent-replay acknowledgement below. Previously the
  // blueprint hash was only compared `if (blueprintRecord !== undefined)`,
  // so a missing/unreadable/invalid bound blueprint silently *skipped* the
  // comparison and the chain was appended with an unverifiable declared
  // hash. Now: no resolvable blueprint, no ingestion — fresh submissions
  // are rejected before any chain append, and replays fail closed rather
  // than re-acknowledging a review whose blueprint binding can no longer
  // be verified. No mutation of any kind precedes this check.
  const blueprintResolution = await resolveBoundBlueprint(provenance.blueprintId, repository);
  if (!blueprintResolution.ok) {
    return {
      status: "rejected",
      issueCode: "blueprint_binding_unresolved",
      message: `Candidate '${input.candidateId}''s bound blueprint '${provenance.blueprintId}' could not be resolved (${blueprintResolution.kind}): ${blueprintResolution.message}`,
    };
  }

  // Idempotency/conflict detection occurs before any remaining binding
  // check and before any mutation, reconstructed entirely from the chain
  // we just verified — no separate repository read, no separate durable
  // index.
  const idempotency = resolveIdempotency(provenance.reviewRecords, input.reviewId, freshFingerprint);
  if (idempotency.kind === "conflict") {
    return {
      status: "rejected",
      issueCode: "review_id_conflict",
      message: `Review id '${input.reviewId}' was already submitted for candidate '${input.candidateId}' with different content — use a new reviewId for a genuinely different review.`,
    };
  }
  if (idempotency.kind === "replay") {
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

  // --- Fresh submission: candidate-binding checks -------------------------
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

  // The blueprint resolved above is the sole authority; the reviewer's
  // declared hash must strictly equal its canonical hash. The resolver
  // guarantees `blueprintHash` is a non-empty string, and the input schema
  // guarantees `input.blueprintHash` is a non-empty string — so no
  // `undefined`/`null`/empty value can ever satisfy this comparison.
  if (input.blueprintHash !== blueprintResolution.blueprintHash) {
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

  // Contract §9: a "passed" result asserted with zero evidence references
  // is treated as an incomplete review, never a valid "passed" — the
  // chain still records it (a complete audit trail of every submission),
  // downgraded to "warning", and it never advances the lifecycle on its
  // own.
  const insufficientEvidenceDowngraded = input.result === "passed" && input.evidenceReferences.length === 0;
  const storedResult = insufficientEvidenceDowngraded ? "warning" : input.result;

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
    reviewId: input.reviewId,
    reviewResultFingerprint: freshFingerprint,
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

  // The single durable write: the review record (including its own
  // reviewId/reviewResultFingerprint) and the chain it joins are
  // persisted together, atomically, guarded by the exact content this
  // function read at the top of this attempt. There is no second write
  // this function ever performs to make the append "count" — the append
  // *is* the idempotency record.
  const updateResult = await repository.update("review-queue", input.candidateId, updatedRecord, {
    expectedContentHash: hashJson(record),
  });

  if (!updateResult.ok) {
    if ((updateResult.reason === "state_mismatch" || updateResult.reason === "lock_timeout") && retriesRemaining > 0) {
      // Someone else durably wrote to this candidate between our read and
      // our write (`state_mismatch`), or we simply lost the race for the
      // per-candidate lock and timed out waiting for it (`lock_timeout`) —
      // both are transient "someone else may have won" signals, not
      // evidence the lock itself is stuck. Re-read fresh state and
      // re-resolve idempotency against it: if the concurrent writer used
      // *our* reviewId, this correctly resolves to a replay or a conflict
      // without ever attempting a second append; if it was an unrelated
      // write (or the lock is genuinely stuck), this is a bounded retry of
      // the whole attempt (never an unbounded loop — `retriesRemaining`
      // decrements every call, and a `lock_timeout` that survives every
      // retry still falls through to `repository_error` below rather than
      // being masked as a conflict).
      return attemptIngest(input, freshFingerprint, repository, retriesRemaining - 1);
    }
    return {
      status: "rejected",
      issueCode: "repository_error",
      message: `Failed to append review record: ${updateResult.message}`,
    };
  }

  if (updateResult.replayed) {
    // The repository's own content-hash idempotency recognised this exact
    // write as already-durable (a genuinely concurrent identical
    // submission that landed first) — not this function's fresh-submission
    // path succeeding twice, just the storage layer's own no-op-on-replay
    // guarantee. Correctly reported as a replay to the caller.
    const gateOutcome = await attemptSemanticReviewTransition(input.candidateId, repository);
    return {
      status: "accepted",
      candidateId: input.candidateId,
      reviewId: input.reviewId,
      replayed: true,
      insufficientEvidenceDowngraded,
      gateOutcome,
    };
  }

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
