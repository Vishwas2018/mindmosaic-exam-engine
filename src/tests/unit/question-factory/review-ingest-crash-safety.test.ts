import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { Blueprint } from "@/features/question-factory/blueprints";
import { normaliseIdentityOrThrow } from "@/features/question-factory/config";
import {
  appendReviewRecord,
  hashJson,
  reviewRecordSchema,
  verifyReviewChain,
  type ReviewRecordDraft,
} from "@/features/question-factory/provenance";
import { ingestExternalReview, type ReviewIngestionInput } from "@/features/question-factory/review";
import type { FactoryRepository, UpdateFailureReason, UpdateOptions, UpdateResult } from "@/features/question-factory/storage";
import { FsFactoryRepository } from "@/features/question-factory/storage";

/**
 * Mission 3B P1-2 remediation: regression coverage for the crash-safety
 * and concurrency properties of `ingestExternalReview`'s durable-append
 * mechanism, which now stores `reviewId`/`reviewResultFingerprint`
 * directly on the `ReviewRecord` (see `provenance/review-record.ts`)
 * rather than in a second, separately-written sidecar report. There is
 * no longer an "append succeeded, index write failed" window at all —
 * these tests prove that architecturally, not just by assertion.
 */
let rootDir: string;
let repo: FsFactoryRepository;

beforeEach(async () => {
  rootDir = await mkdtemp(path.join(tmpdir(), "review-ingest-crash-safety-"));
  repo = new FsFactoryRepository(rootDir);
});

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});

function blueprint(): Blueprint {
  return {
    id: "bp-crash",
    batchId: "batch-crash",
    yearLevel: "year-5",
    examStyle: "naplan_style",
    subject: "reading",
    strand: "Comprehension",
    skill: "lit.reading.inference",
    difficulty: "medium",
    questionType: "short_answer",
    targetCount: 1,
    marks: 2,
    estimatedTimeSeconds: 90,
    learningObjective: "Answer a short inferential question.",
    misconceptionTargets: [],
    reasoningSteps: 2,
    accessibilityConstraints: [],
    originalityConstraints: [],
    generationConstraints: [],
  };
}

function question(): Record<string, unknown> {
  return {
    id: "candidate-crash",
    type: "short_answer",
    yearLevel: 5,
    examStyle: "naplan_style",
    prompt: "What is the main idea of the passage?",
    options: [],
    visuals: [],
    answerKey: { kind: "text", acceptableAnswers: ["friendship"] },
    explanation: "The passage centres on friendship.",
    metadata: {
      subject: "reading",
      strand: "Comprehension",
      skill: "lit.reading.inference",
      difficulty: "medium",
      marks: 2,
      estimatedTimeSeconds: 90,
      tags: [],
      locale: "en-AU",
      source: "original",
      schemaVersion: 1,
    },
  };
}

async function seedCandidate(candidateId: string, generatorModel: string): Promise<{ readonly contentHash: string; readonly blueprintHash: string }> {
  const bp = blueprint();
  await repo.create("blueprints", bp.id, bp);
  const q = question();
  const contentHash = hashJson(q);
  await repo.create("review-queue", candidateId, {
    candidateId,
    state: "correctness_check_passed",
    question: q,
    provenance: {
      candidateId,
      blueprintId: bp.id,
      batchId: bp.batchId,
      pipelineRunId: `${bp.batchId}-pipeline`,
      revision: 0,
      generatedAt: "2026-07-01T00:00:00.000Z",
      generatorAdapter: { class: "manual_external", identity: normaliseIdentityOrThrow(generatorModel) },
      generatorVersion: "1",
      promptVersion: "v1",
      schemaVersion: "1",
      taxonomyVersion: "1",
      contentHash,
      reviewRecords: [],
    },
  });
  return { contentHash, blueprintHash: hashJson(bp) };
}

function baseInput(overrides: Partial<ReviewIngestionInput> = {}): ReviewIngestionInput {
  return {
    reviewId: "review-crash-1",
    candidateId: "candidate-crash",
    candidateRevision: 0,
    candidateContentHash: "placeholder",
    blueprintHash: "placeholder",
    reviewerModel: "claude",
    reviewerVersion: "1.0.0",
    result: "passed",
    confidence: 0.9,
    findings: ["Main idea correctly identified."],
    evidenceReferences: ["passage paragraph 2"],
    ambiguityStatus: "none",
    reviewedAt: "2026-07-15T00:00:00.000Z",
    reviewPromptVersion: "v1",
    reviewPromptHash: "review-prompt-hash",
    ...overrides,
  };
}

/** Wraps a real repository so its `update()` fails (a chosen reason) exactly `failCount` times, then delegates to the real implementation — mirrors the pattern in `mission3a-integration.test.ts`. */
function buildFailingUpdateRepo(
  realRepo: FactoryRepository,
  failCount: number,
  reason: UpdateFailureReason = "lock_timeout",
): FactoryRepository {
  let attempts = 0;
  return {
    create: realRepo.create.bind(realRepo),
    read: realRepo.read.bind(realRepo),
    exists: realRepo.exists.bind(realRepo),
    remove: realRepo.remove.bind(realRepo),
    list: realRepo.list.bind(realRepo),
    reconcile: realRepo.reconcile.bind(realRepo),
    move: realRepo.move.bind(realRepo),
    update: async (
      compartment: Parameters<FactoryRepository["update"]>[0],
      candidateId: string,
      data: unknown,
      options?: UpdateOptions,
    ): Promise<UpdateResult> => {
      attempts += 1;
      if (attempts <= failCount) {
        return {
          ok: false,
          candidateId,
          compartment,
          reason,
          message: `simulated transient failure on attempt ${attempts}`,
        };
      }
      return realRepo.update(compartment, candidateId, data, options);
    },
  };
}

describe("ingestExternalReview — crash-window recovery (append is the only durable write)", () => {
  it("performs no mutation when the single durable write fails, and a retry (new call, process-equivalent) completes cleanly with exactly one chain entry", async () => {
    const { contentHash, blueprintHash } = await seedCandidate("candidate-crash", "qwen");
    const failingRepo = buildFailingUpdateRepo(repo, 1, "lock_timeout");

    const input = baseInput({ candidateContentHash: contentHash, blueprintHash });

    const first = await ingestExternalReview(input, failingRepo);
    expect(first.status).toBe("rejected");
    if (first.status !== "rejected") return;
    expect(first.issueCode).toBe("repository_error");

    // Nothing was durably written by the failed attempt.
    const afterFailure = (await repo.read("review-queue", "candidate-crash")) as {
      readonly provenance: { readonly reviewRecords: readonly unknown[] };
    };
    expect(afterFailure.provenance.reviewRecords.length).toBe(0);

    // A fresh call (process-equivalent retry) against the same, still-real repository succeeds.
    const second = await ingestExternalReview(input, repo);
    expect(second.status).toBe("accepted");
    if (second.status !== "accepted") return;
    expect(second.replayed).toBe(false);

    const stored = (await repo.read("review-queue", "candidate-crash")) as {
      readonly provenance: { readonly reviewRecords: readonly unknown[] };
    };
    expect(stored.provenance.reviewRecords.length).toBe(1);
  });

  it("an identical resubmission after a prior failed attempt replays cleanly, never appending twice", async () => {
    const { contentHash, blueprintHash } = await seedCandidate("candidate-crash", "qwen");
    const failingRepo = buildFailingUpdateRepo(repo, 1, "lock_timeout");
    const input = baseInput({ candidateContentHash: contentHash, blueprintHash });

    await ingestExternalReview(input, failingRepo); // fails, no mutation
    const first = await ingestExternalReview(input, repo); // succeeds
    expect(first.status).toBe("accepted");
    if (first.status !== "accepted") return;
    expect(first.replayed).toBe(false);

    const second = await ingestExternalReview(input, repo); // identical resubmission
    expect(second.status).toBe("accepted");
    if (second.status !== "accepted") return;
    expect(second.replayed).toBe(true);

    const stored = (await repo.read("review-queue", "candidate-crash")) as {
      readonly provenance: { readonly reviewRecords: readonly unknown[] };
    };
    expect(stored.provenance.reviewRecords.length).toBe(1);
  });
});

describe("ingestExternalReview — concurrency", () => {
  it("two concurrent identical submissions produce exactly one chain append; the second reports replayed:true", async () => {
    const { contentHash, blueprintHash } = await seedCandidate("candidate-crash", "qwen");
    const input = baseInput({ candidateContentHash: contentHash, blueprintHash });

    const [resultA, resultB] = await Promise.all([
      ingestExternalReview(input, repo),
      ingestExternalReview(input, repo),
    ]);

    expect(resultA.status).toBe("accepted");
    expect(resultB.status).toBe("accepted");
    if (resultA.status !== "accepted" || resultB.status !== "accepted") return;

    const replayedFlags = [resultA.replayed, resultB.replayed].sort();
    expect(replayedFlags).toEqual([false, true]);

    const stored = (await repo.read("review-queue", "candidate-crash")) as {
      readonly provenance: { readonly reviewRecords: readonly unknown[] };
    };
    expect(stored.provenance.reviewRecords.length).toBe(1);
  });

  it("two concurrent submissions under the same reviewId but different content: exactly one appends, the other reports review_id_conflict, never a second chain entry", async () => {
    const { contentHash, blueprintHash } = await seedCandidate("candidate-crash", "qwen");
    const inputA = baseInput({ candidateContentHash: contentHash, blueprintHash, confidence: 0.9, findings: ["Finding A."] });
    const inputB = baseInput({ candidateContentHash: contentHash, blueprintHash, confidence: 0.5, findings: ["Finding B (different)."] });

    const [resultA, resultB] = await Promise.all([
      ingestExternalReview(inputA, repo),
      ingestExternalReview(inputB, repo),
    ]);

    const results = [resultA, resultB];
    const accepted = results.filter((r) => r.status === "accepted");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(accepted.length).toBe(1);
    expect(rejected.length).toBe(1);
    if (rejected[0]?.status === "rejected") {
      expect(rejected[0].issueCode).toBe("review_id_conflict");
    }

    const stored = (await repo.read("review-queue", "candidate-crash")) as {
      readonly provenance: { readonly reviewRecords: readonly unknown[] };
    };
    expect(stored.provenance.reviewRecords.length).toBe(1);
  });
});

describe("ingestExternalReview — backward compatibility with legacy (pre-P1-2) chain records", () => {
  it("accepts and correctly chains onto a legacy review record with no reviewId/reviewResultFingerprint", async () => {
    const { contentHash, blueprintHash } = await seedCandidate("candidate-crash", "qwen");

    // A legacy record, exactly as Mission 3B's first cut would have
    // produced it: no reviewId, no reviewResultFingerprint.
    const legacyDraft: ReviewRecordDraft = {
      candidateId: "candidate-crash",
      stage: "correctness_check_passed",
      reviewerIdentity: normaliseIdentityOrThrow("chatgpt"),
      reviewerVersion: "1.0.0",
      result: "warning",
      confidence: 0.6,
      findings: ["Legacy finding, pre-P1-2."],
      evidenceReferences: ["legacy evidence"],
      ambiguityStatus: "none",
      reviewedAt: "2026-06-01T00:00:00.000Z",
      reviewPromptVersion: "v1",
      reviewPromptHash: "legacy-prompt-hash",
      evidenceBinding: {
        candidateContentHash: contentHash,
        blueprintHash,
        candidateRevision: 0,
        reviewResultHash: "legacy-result-hash",
      },
    };
    const legacyRecord = appendReviewRecord([], legacyDraft);
    expect(reviewRecordSchema.safeParse(legacyRecord).success).toBe(true);
    expect(legacyRecord.reviewId).toBeUndefined();

    const existing = (await repo.read("review-queue", "candidate-crash")) as Record<string, unknown>;
    const existingProvenance = existing.provenance as Record<string, unknown>;
    await repo.update("review-queue", "candidate-crash", {
      ...existing,
      provenance: { ...existingProvenance, reviewRecords: [legacyRecord] },
    });

    // A brand-new submission (a different reviewId) must append cleanly
    // after the legacy record — the legacy record's absent reviewId can
    // never be matched by any real reviewId scan.
    const input = baseInput({ reviewId: "review-after-legacy", candidateContentHash: contentHash, blueprintHash });
    const outcome = await ingestExternalReview(input, repo);
    expect(outcome.status).toBe("accepted");
    if (outcome.status !== "accepted") return;
    expect(outcome.replayed).toBe(false);

    const stored = (await repo.read("review-queue", "candidate-crash")) as {
      readonly provenance: { readonly reviewRecords: readonly unknown[] };
    };
    expect(stored.provenance.reviewRecords.length).toBe(2);
    expect(verifyReviewChain(stored.provenance.reviewRecords as never).valid).toBe(true);
  });

  it("breaks chain verification if a stored record's reviewId or reviewResultFingerprint is tampered with after the fact", async () => {
    const { contentHash, blueprintHash } = await seedCandidate("candidate-crash", "qwen");
    const input = baseInput({ candidateContentHash: contentHash, blueprintHash });
    await ingestExternalReview(input, repo);

    const stored = (await repo.read("review-queue", "candidate-crash")) as {
      readonly provenance: { readonly reviewRecords: readonly (Record<string, unknown> & { readonly reviewId?: string })[] };
    };
    const [record] = stored.provenance.reviewRecords;

    const tamperedReviewId = [{ ...record, reviewId: "a-different-review-id" }];
    expect(verifyReviewChain(tamperedReviewId as never).valid).toBe(false);

    const tamperedFingerprint = [{ ...record, reviewResultFingerprint: "forged-fingerprint" }];
    expect(verifyReviewChain(tamperedFingerprint as never).valid).toBe(false);
  });
});
