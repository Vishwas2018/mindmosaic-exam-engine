import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { FactoryCompartment, FactoryRepository, MoveResult } from "@/features/question-factory/storage";
import { FsFactoryRepository } from "@/features/question-factory/storage";
import { orchestrateStructuralValidation } from "@/features/question-factory/validation";

import { baseProvenance, baseQuestion, buildCandidate } from "./structural-validation-fixtures";

let rootDir: string;
let repo: FsFactoryRepository;

beforeEach(async () => {
  rootDir = await mkdtemp(path.join(tmpdir(), "structural-validation-test-"));
  repo = new FsFactoryRepository(rootDir);
});

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true });
});

async function seedGenerated(overrides: Parameters<typeof buildCandidate>[0] = {}) {
  const { candidate, question } = buildCandidate(overrides);
  await repo.create("generated", candidate.candidateId, {
    candidateId: candidate.candidateId,
    state: "generated",
    question: candidate.question,
    provenance: candidate.provenance,
    ...(candidate.ingestion ? { ingestion: candidate.ingestion } : {}),
  });
  return { candidateId: candidate.candidateId, question };
}

describe("passing candidates", () => {
  it("moves generated -> structural_validation_passed (review-queue) on pass", async () => {
    const { candidateId } = await seedGenerated();
    const outcome = await orchestrateStructuralValidation(candidateId, repo, {
      validatedAt: "2026-01-02T00:00:00.000Z",
    });
    expect(outcome.outcome).toBe("passed");
    expect(await repo.exists("generated", candidateId)).toBe(false);
    expect(await repo.exists("review-queue", candidateId)).toBe(true);
    expect(await repo.exists("rejected/structural", candidateId)).toBe(false);
    expect(await repo.exists("quarantined", candidateId)).toBe(false);
  });

  it("is idempotent and replay-safe on a second call", async () => {
    const { candidateId } = await seedGenerated();
    const first = await orchestrateStructuralValidation(candidateId, repo, {
      validatedAt: "2026-01-02T00:00:00.000Z",
    });
    const second = await orchestrateStructuralValidation(candidateId, repo, {
      validatedAt: "2026-01-02T00:00:00.000Z",
    });

    expect(first.outcome).toBe("passed");
    expect(second.outcome).toBe("passed");
    if (first.outcome === "passed" && second.outcome === "passed") {
      expect(second.replayed).toBe(true);
      expect(second.evidence.evidenceHash).toBe(first.evidence.evidenceHash);
    }
    expect(await repo.exists("review-queue", candidateId)).toBe(true);
  });

  it("does not duplicate the stored evidence report on replay", async () => {
    const { candidateId } = await seedGenerated();
    await orchestrateStructuralValidation(candidateId, repo, { validatedAt: "2026-01-02T00:00:00.000Z" });
    await orchestrateStructuralValidation(candidateId, repo, { validatedAt: "2026-01-02T00:00:00.000Z" });
    const reports = await repo.list("reports");
    expect(reports.length).toBe(1);
  });
});

describe("failing candidates", () => {
  it("moves generated -> rejected (rejected/structural) on structural failure, never review-queue", async () => {
    const { candidateId } = await seedGenerated({ questionOverrides: { prompt: "" } });
    const outcome = await orchestrateStructuralValidation(candidateId, repo, {
      validatedAt: "2026-01-02T00:00:00.000Z",
    });
    expect(outcome.outcome).toBe("rejected");
    expect(await repo.exists("generated", candidateId)).toBe(false);
    expect(await repo.exists("rejected/structural", candidateId)).toBe(true);
    expect(await repo.exists("review-queue", candidateId)).toBe(false);
  });

  it("rejects a stale candidate whose expected content hash no longer matches", async () => {
    const { candidateId } = await seedGenerated();
    const outcome = await orchestrateStructuralValidation(candidateId, repo, {
      validatedAt: "2026-01-02T00:00:00.000Z",
      expected: { contentHash: "an-outdated-hash-the-caller-remembered" },
    });
    expect(outcome.outcome).toBe("rejected");
    if (outcome.outcome === "rejected") {
      expect(outcome.issues.map((issue) => issue.code)).toContain("stale_content_hash");
    }
    expect(await repo.exists("rejected/structural", candidateId)).toBe(true);
  });
});

describe("not-found and wrong-state handling", () => {
  it("reports not_found for an unknown candidate id", async () => {
    const outcome = await orchestrateStructuralValidation("does-not-exist", repo, {
      validatedAt: "2026-01-02T00:00:00.000Z",
    });
    expect(outcome.outcome).toBe("not_found");
  });

  it("reports not_generated for a candidate stored at the wrong lifecycle state", async () => {
    const question = baseQuestion({ id: "candidate-wrong-state" });
    const provenance = baseProvenance(question);
    await repo.create("generated", "candidate-wrong-state", {
      candidateId: "candidate-wrong-state",
      state: "structural_validation_passed",
      question,
      provenance,
    });
    const outcome = await orchestrateStructuralValidation("candidate-wrong-state", repo, {
      validatedAt: "2026-01-02T00:00:00.000Z",
    });
    expect(outcome.outcome).toBe("not_generated");
  });
});

describe("repository failure handling", () => {
  it("leaves no partial state when the repository move fails", async () => {
    const { candidateId } = await seedGenerated();

    const brokenRepo: FactoryRepository = {
      ...repo,
      create: repo.create.bind(repo),
      read: repo.read.bind(repo),
      exists: repo.exists.bind(repo),
      remove: repo.remove.bind(repo),
      list: repo.list.bind(repo),
      reconcile: repo.reconcile.bind(repo),
      move: async (
        candidateIdArg: string,
        from: FactoryCompartment,
        to: FactoryCompartment,
      ): Promise<MoveResult> => ({
        ok: false,
        candidateId: candidateIdArg,
        from,
        to,
        reason: "destination_exists",
        message: "forced failure for test",
      }),
    };

    const outcome = await orchestrateStructuralValidation(candidateId, brokenRepo, {
      validatedAt: "2026-01-02T00:00:00.000Z",
    });

    expect(outcome.outcome).toBe("repository_error");
    // The candidate must still be exactly where it started - no partial move.
    expect(await repo.exists("generated", candidateId)).toBe(true);
    expect(await repo.exists("review-queue", candidateId)).toBe(false);
  });
});
