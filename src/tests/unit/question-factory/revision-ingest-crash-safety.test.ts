import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Blueprint } from "@/features/question-factory/blueprints";
import { normaliseIdentityOrThrow } from "@/features/question-factory/config";
import { hashJson } from "@/features/question-factory/provenance";
import { ingestRevision, type ReviseIngestionInput } from "@/features/question-factory/revision";

vi.setConfig({ testTimeout: 30_000 });
import type { CreateResult, FactoryRepository, UpdateFailureReason, UpdateOptions, UpdateResult } from "@/features/question-factory/storage";
import { FsFactoryRepository } from "@/features/question-factory/storage";

/**
 * Mission 3C: regression coverage for the crash-safety and concurrency
 * properties of `ingestRevision`'s `supersededBy` claim mechanism — the
 * direct application of the Mission 3B P1-2 lesson (durable idempotency
 * embedded on the record the caller already reads/writes atomically,
 * never a separate sidecar index) to the revision-conflict problem.
 */
let rootDir: string;
let repo: FsFactoryRepository;

beforeEach(async () => {
  rootDir = await mkdtemp(path.join(tmpdir(), "revision-crash-safety-"));
  repo = new FsFactoryRepository(rootDir);
});

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});

function blueprint(): Blueprint {
  return {
    id: "bp-revision-crash",
    batchId: "batch-revision-crash",
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

function question(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "candidate-parent-crash",
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
    ...overrides,
  };
}

async function seedParent(): Promise<{ readonly contentHash: string; readonly blueprintHash: string }> {
  const bp = blueprint();
  await repo.create("blueprints", bp.id, bp);
  const q = question();
  const contentHash = hashJson(q);
  await repo.create("review-queue", "candidate-parent-crash", {
    candidateId: "candidate-parent-crash",
    state: "needs_revision",
    question: q,
    provenance: {
      candidateId: "candidate-parent-crash",
      blueprintId: bp.id,
      batchId: bp.batchId,
      pipelineRunId: `${bp.batchId}-pipeline`,
      revision: 0,
      generatedAt: "2026-07-01T00:00:00.000Z",
      generatorAdapter: { class: "manual_external", identity: normaliseIdentityOrThrow("qwen") },
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

function baseInput(overrides: Partial<ReviseIngestionInput> = {}): ReviseIngestionInput {
  return {
    revisionRequestId: "rev-req-crash-1",
    parentCandidateId: "candidate-parent-crash",
    parentContentHash: "placeholder",
    parentRevision: 0,
    parentBlueprintHash: "placeholder",
    revisedContent: question({ prompt: "What is the main idea of the passage, revised?" }),
    authorModel: "claude",
    requestedAt: "2026-07-16T00:00:00.000Z",
    ...overrides,
  };
}

/** Fails `update()` (the parent-claim write) exactly `failCount` times, then delegates to the real implementation — mirrors `review-ingest-crash-safety.test.ts`'s `buildFailingUpdateRepo`. */
function buildFailingUpdateRepo(realRepo: FactoryRepository, failCount: number, reason: UpdateFailureReason = "lock_timeout"): FactoryRepository {
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
        return { ok: false, candidateId, compartment, reason, message: `simulated transient failure on attempt ${attempts}` };
      }
      return realRepo.update(compartment, candidateId, data, options);
    },
  };
}

/** Throws (never resolves normally) on exactly the Nth `create()` call — simulates a genuine crash/unhandled I/O failure during child creation, distinct from the domain-specific `duplicate_candidate` refusal `CreateResult` can represent. */
function buildThrowingCreateRepo(realRepo: FactoryRepository, failOnCallNumber: number): FactoryRepository {
  let attempts = 0;
  return {
    create: async (compartment: Parameters<FactoryRepository["create"]>[0], candidateId: string, data: unknown): Promise<CreateResult> => {
      attempts += 1;
      if (attempts === failOnCallNumber) {
        throw new Error(`simulated crash during create() call ${attempts}`);
      }
      return realRepo.create(compartment, candidateId, data);
    },
    read: realRepo.read.bind(realRepo),
    exists: realRepo.exists.bind(realRepo),
    remove: realRepo.remove.bind(realRepo),
    list: realRepo.list.bind(realRepo),
    reconcile: realRepo.reconcile.bind(realRepo),
    move: realRepo.move.bind(realRepo),
    update: realRepo.update.bind(realRepo),
  };
}

describe("ingestRevision — crash mid-claim (parent update fails)", () => {
  it("performs no mutation when the claim write fails, and a clean retry succeeds", async () => {
    const { contentHash, blueprintHash } = await seedParent();
    const failingRepo = buildFailingUpdateRepo(repo, 1, "lock_timeout");
    const input = baseInput({ parentContentHash: contentHash, parentBlueprintHash: blueprintHash });

    const first = await ingestRevision(input, failingRepo);
    expect(first.status).toBe("rejected");
    if (first.status !== "rejected") return;
    expect(first.issueCode).toBe("repository_error");

    const parentAfterFailure = (await repo.read("review-queue", "candidate-parent-crash")) as {
      readonly provenance: { readonly supersededBy?: unknown };
    };
    expect(parentAfterFailure.provenance.supersededBy).toBeUndefined();
    expect(await repo.list("generated")).toEqual([]);

    const second = await ingestRevision(input, repo);
    expect(second.status).toBe("accepted");
    if (second.status !== "accepted") return;
    expect(second.replayed).toBe(false);
    expect(await repo.list("generated")).toEqual([second.candidateId]);
  });
});

describe("ingestRevision — crash between claim and child creation", () => {
  it("self-heals on a same-request retry, and never appends a second candidate", async () => {
    const { contentHash, blueprintHash } = await seedParent();
    const input = baseInput({ parentContentHash: contentHash, parentBlueprintHash: blueprintHash });
    const throwingRepo = buildThrowingCreateRepo(repo, 1);

    await expect(ingestRevision(input, throwingRepo)).rejects.toThrow();

    const parentAfterCrash = (await repo.read("review-queue", "candidate-parent-crash")) as {
      readonly provenance: { readonly supersededBy?: { readonly candidateId: string; readonly revisionRequestId: string } };
    };
    expect(parentAfterCrash.provenance.supersededBy?.revisionRequestId).toBe("rev-req-crash-1");
    const claimedCandidateId = parentAfterCrash.provenance.supersededBy?.candidateId;
    expect(claimedCandidateId).toBeDefined();
    // The claim landed durably, but the child was never actually created —
    // proves the append-before-crash property explicitly, not just by
    // inference from the outcome.
    expect(await repo.list("generated")).toEqual([]);

    const retry = await ingestRevision(input, repo);
    expect(retry.status).toBe("accepted");
    if (retry.status !== "accepted") return;
    expect(retry.candidateId).toBe(claimedCandidateId);
    expect(await repo.list("generated")).toEqual([claimedCandidateId]);
  });

  it("refuses a different concurrent request during the same crash window — the claim alone is authoritative, never the child's mere existence", async () => {
    const { contentHash, blueprintHash } = await seedParent();
    const input = baseInput({ parentContentHash: contentHash, parentBlueprintHash: blueprintHash });
    const throwingRepo = buildThrowingCreateRepo(repo, 1);

    await expect(ingestRevision(input, throwingRepo)).rejects.toThrow();
    expect(await repo.list("generated")).toEqual([]);

    const divergentInput = baseInput({
      parentContentHash: contentHash,
      parentBlueprintHash: blueprintHash,
      revisionRequestId: "rev-req-crash-divergent",
      revisedContent: question({ prompt: "A completely different correction." }),
    });
    const divergentOutcome = await ingestRevision(divergentInput, repo);
    expect(divergentOutcome.status).toBe("rejected");
    if (divergentOutcome.status !== "rejected") return;
    expect(divergentOutcome.issueCode).toBe("revision_parent_conflict");
    expect(await repo.list("generated")).toEqual([]);
  });
});

describe("ingestRevision — concurrency", () => {
  it("two concurrent identical requests produce exactly one child; the second reports replayed:true", async () => {
    const { contentHash, blueprintHash } = await seedParent();
    const input = baseInput({ parentContentHash: contentHash, parentBlueprintHash: blueprintHash });

    const [resultA, resultB] = await Promise.all([ingestRevision(input, repo), ingestRevision(input, repo)]);

    expect(resultA.status).toBe("accepted");
    expect(resultB.status).toBe("accepted");
    if (resultA.status !== "accepted" || resultB.status !== "accepted") return;
    expect(resultA.candidateId).toBe(resultB.candidateId);

    const replayedFlags = [resultA.replayed, resultB.replayed].sort();
    expect(replayedFlags).toEqual([false, true]);
    expect(await repo.list("generated")).toEqual([resultA.candidateId]);
  });

  it("two concurrent divergent requests against the same parent: exactly one succeeds, the other returns revision_parent_conflict, never two children", async () => {
    const { contentHash, blueprintHash } = await seedParent();
    const inputA = baseInput({
      parentContentHash: contentHash,
      parentBlueprintHash: blueprintHash,
      revisionRequestId: "rev-req-a",
      revisedContent: question({ prompt: "Correction A." }),
    });
    const inputB = baseInput({
      parentContentHash: contentHash,
      parentBlueprintHash: blueprintHash,
      revisionRequestId: "rev-req-b",
      revisedContent: question({ prompt: "Correction B." }),
    });

    const [resultA, resultB] = await Promise.all([ingestRevision(inputA, repo), ingestRevision(inputB, repo)]);
    const results = [resultA, resultB];
    const accepted = results.filter((r) => r.status === "accepted");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(accepted.length).toBe(1);
    expect(rejected.length).toBe(1);
    if (rejected[0]?.status === "rejected") {
      expect(rejected[0].issueCode).toBe("revision_parent_conflict");
    }
    expect(await repo.list("generated")).toHaveLength(1);

    const parent = (await repo.read("review-queue", "candidate-parent-crash")) as {
      readonly provenance: { readonly supersededBy?: { readonly revisionRequestId: string } };
    };
    expect(["rev-req-a", "rev-req-b"]).toContain(parent.provenance.supersededBy?.revisionRequestId);
  });

  it("a reused revisionRequestId with different content is refused as revision_request_conflict, never silently overwriting", async () => {
    const { contentHash, blueprintHash } = await seedParent();
    const input = baseInput({ parentContentHash: contentHash, parentBlueprintHash: blueprintHash });
    const first = await ingestRevision(input, repo);
    expect(first.status).toBe("accepted");

    const changed = await ingestRevision(
      { ...input, revisedContent: question({ prompt: "A different correction under the same request id." }) },
      repo,
    );
    expect(changed.status).toBe("rejected");
    if (changed.status !== "rejected") return;
    expect(changed.issueCode).toBe("revision_request_conflict");
    expect(await repo.list("generated")).toHaveLength(1);
  });

  it("two concurrent, divergent, blueprint-incompatible requests against the same parent produce zero children and zero parent mutation — no partial successor", async () => {
    const { contentHash, blueprintHash } = await seedParent();
    const inputA = baseInput({
      parentContentHash: contentHash,
      parentBlueprintHash: blueprintHash,
      revisionRequestId: "rev-req-incompatible-a",
      revisedContent: question({ yearLevel: 3, prompt: "Wrong cohort, attempt A." }),
    });
    const inputB = baseInput({
      parentContentHash: contentHash,
      parentBlueprintHash: blueprintHash,
      revisionRequestId: "rev-req-incompatible-b",
      revisedContent: question({ examStyle: "icas_style", prompt: "Wrong exam style, attempt B." }),
    });

    const [resultA, resultB] = await Promise.all([ingestRevision(inputA, repo), ingestRevision(inputB, repo)]);

    for (const result of [resultA, resultB]) {
      expect(result.status).toBe("rejected");
      if (result.status !== "rejected") continue;
      expect(result.issueCode).toBe("revision_blueprint_mismatch");
    }
    expect(await repo.list("generated")).toEqual([]);

    const parent = (await repo.read("review-queue", "candidate-parent-crash")) as {
      readonly state: string;
      readonly provenance: { readonly contentHash: string; readonly supersededBy?: unknown };
    };
    expect(parent.state).toBe("needs_revision");
    expect(parent.provenance.contentHash).toBe(contentHash);
    expect(parent.provenance.supersededBy).toBeUndefined();
  });
});
