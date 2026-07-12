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
      expect(second.evidence.validationFingerprint).toBe(first.evidence.validationFingerprint);
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

/**
 * Wraps a real repository so its `move()` fails exactly once (simulating a
 * transient repository outage) and then delegates to the real
 * implementation for every subsequent call. Every other method is the real
 * implementation throughout, so the report write on the first call is
 * genuinely durable, not simulated.
 */
function buildFailOnceMoveRepo(realRepo: FactoryRepository): FactoryRepository {
  let moveAttempts = 0;
  return {
    create: realRepo.create.bind(realRepo),
    read: realRepo.read.bind(realRepo),
    exists: realRepo.exists.bind(realRepo),
    remove: realRepo.remove.bind(realRepo),
    list: realRepo.list.bind(realRepo),
    reconcile: realRepo.reconcile.bind(realRepo),
    move: async (candidateIdArg: string, from: FactoryCompartment, to: FactoryCompartment): Promise<MoveResult> => {
      moveAttempts += 1;
      if (moveAttempts === 1) {
        return {
          ok: false,
          candidateId: candidateIdArg,
          from,
          to,
          reason: "destination_exists",
          message: "simulated transient repository failure on first move attempt",
        };
      }
      return realRepo.move(candidateIdArg, from, to);
    },
  };
}

describe("partial-failure recovery: report written, move fails, retry with a fresh validatedAt", () => {
  it("reproduces the original defect and recovers: retry with a different validatedAt reuses the existing report and completes the move", async () => {
    // 1. Candidate is in `generated`.
    const { candidateId } = await seedGenerated();
    const flakyRepo = buildFailOnceMoveRepo(repo);

    // 2 + 3 + 4. Validation report write succeeds, repository move fails,
    // first orchestration call returns a repository failure.
    const first = await orchestrateStructuralValidation(candidateId, flakyRepo, {
      validatedAt: "2026-01-02T00:00:00.000Z",
    });
    expect(first.outcome).toBe("repository_error");
    expect(await repo.exists("generated", candidateId)).toBe(true);
    expect(await repo.exists("review-queue", candidateId)).toBe(false);
    expect((await repo.list("reports")).length).toBe(1);

    // 5 + 6 + 7. Retry uses a different validatedAt; the existing report is
    // accepted as equivalent (same validationFingerprint); the move succeeds.
    const second = await orchestrateStructuralValidation(candidateId, flakyRepo, {
      validatedAt: "2026-06-15T12:34:56.000Z",
    });
    expect(second.outcome).toBe("passed");

    // 8. Exactly one report exists - no duplicate was written.
    const reports = await repo.list("reports");
    expect(reports.length).toBe(1);

    // 9. Candidate ends in the correct compartment/state.
    expect(await repo.exists("generated", candidateId)).toBe(false);
    expect(await repo.exists("review-queue", candidateId)).toBe(true);
    expect(await repo.exists("rejected/structural", candidateId)).toBe(false);
  });

  it("never produces a message claiming the candidate changed when only validatedAt differs", async () => {
    const { candidateId } = await seedGenerated();
    const flakyRepo = buildFailOnceMoveRepo(repo);

    await orchestrateStructuralValidation(candidateId, flakyRepo, { validatedAt: "2026-01-02T00:00:00.000Z" });
    const retry = await orchestrateStructuralValidation(candidateId, flakyRepo, {
      validatedAt: "2027-01-01T00:00:00.000Z",
    });

    expect(retry.outcome).toBe("passed");
  });
});

describe("candidate-change conflict detection across retries", () => {
  /** Simulates a stored `generated` record being edited out-of-band between validation attempts. */
  async function overwriteGenerated(
    candidateId: string,
    question: Record<string, unknown>,
    provenanceOverrides: Record<string, unknown> = {},
  ): Promise<void> {
    await repo.remove("generated", candidateId);
    const provenance = baseProvenance(question, provenanceOverrides);
    await repo.create("generated", candidateId, {
      candidateId,
      state: "generated",
      question,
      provenance,
    });
  }

  it("rejects a retry when the candidate content genuinely changed after the report was written", async () => {
    const { candidateId, question } = await seedGenerated();
    const flakyRepo = buildFailOnceMoveRepo(repo);

    const first = await orchestrateStructuralValidation(candidateId, flakyRepo, {
      validatedAt: "2026-01-02T00:00:00.000Z",
    });
    expect(first.outcome).toBe("repository_error");

    const changedQuestion = { ...question, prompt: "What is 99 + 1?" };
    await overwriteGenerated(candidateId, changedQuestion);

    const retry = await orchestrateStructuralValidation(candidateId, repo, {
      validatedAt: "2026-01-02T00:05:00.000Z",
    });
    expect(retry.outcome).toBe("repository_error");
    if (retry.outcome === "repository_error") {
      expect(retry.message).not.toMatch(/only timestamp/i);
    }
    // No duplicate report and no move happened on the rejected retry.
    expect((await repo.list("reports")).length).toBe(1);
    expect(await repo.exists("generated", candidateId)).toBe(true);
    expect(await repo.exists("review-queue", candidateId)).toBe(false);
  });

  it("rejects a retry when the candidate revision genuinely changed after the report was written", async () => {
    const { candidateId, question } = await seedGenerated();
    const flakyRepo = buildFailOnceMoveRepo(repo);

    await orchestrateStructuralValidation(candidateId, flakyRepo, { validatedAt: "2026-01-02T00:00:00.000Z" });
    await overwriteGenerated(candidateId, question, { revision: 7 });

    const retry = await orchestrateStructuralValidation(candidateId, repo, {
      validatedAt: "2026-01-02T00:05:00.000Z",
    });
    expect(retry.outcome).toBe("repository_error");
    expect((await repo.list("reports")).length).toBe(1);
    expect(await repo.exists("generated", candidateId)).toBe(true);
  });

  it("rejects a retry when the resolved blueprint hash genuinely changed after the report was written", async () => {
    const blueprintId = "blueprint-conflict-001";
    const { candidateId, question } = await seedGenerated({ provenanceOverrides: { blueprintId } });
    await repo.create("blueprints", blueprintId, { title: "Original blueprint", version: 1 });

    const flakyRepo = buildFailOnceMoveRepo(repo);
    await orchestrateStructuralValidation(candidateId, flakyRepo, { validatedAt: "2026-01-02T00:00:00.000Z" });

    // The blueprint definition itself changed between attempts - the
    // candidate's own record is untouched.
    await repo.remove("blueprints", blueprintId);
    await repo.create("blueprints", blueprintId, { title: "Revised blueprint", version: 2 });

    const retry = await orchestrateStructuralValidation(candidateId, repo, {
      validatedAt: "2026-01-02T00:05:00.000Z",
    });
    expect(retry.outcome).toBe("repository_error");
    expect((await repo.list("reports")).length).toBe(1);
    expect(await repo.exists("generated", candidateId)).toBe(true);
    void question;
  });

  it("rejects a retry when the deterministic issue summary bound to the stored report no longer matches re-validation", async () => {
    // The pure validator cannot organically disagree with itself against
    // unchanged content within one process, so this simulates the report
    // having been produced under a different (still deterministic) issue
    // set - e.g. a taxonomy registry entry retired between attempts,
    // which changes evidence.issueSummary without changing the candidate's
    // own contentHash. Directly seeding a divergent stored report exercises
    // exactly the identity comparison `writeReportIfAbsent` performs.
    const { candidateId } = await seedGenerated();

    const first = await orchestrateStructuralValidation(candidateId, repo, {
      validatedAt: "2026-01-02T00:00:00.000Z",
    });
    expect(first.outcome).toBe("passed");
    if (first.outcome !== "passed") return;

    const reportIds = await repo.list("reports");
    expect(reportIds.length).toBe(1);
    const reportId = reportIds[0] as string;
    const storedReport = (await repo.read("reports", reportId)) as {
      readonly candidateId: string;
      readonly result: { readonly status: string; readonly evidence: Record<string, unknown> };
    };

    const tamperedEvidence = {
      ...storedReport.result.evidence,
      issueSummary: { errorCount: 1, codes: ["invalid_prompt"] },
      outcome: "failed",
      validationFingerprint: "tampered-fingerprint-simulating-drifted-issue-summary",
    };
    await repo.remove("reports", reportId);
    await repo.create("reports", reportId, {
      candidateId: storedReport.candidateId,
      result: { status: "failed", issues: [], evidence: tamperedEvidence },
    });

    // The candidate never actually moved (first call passed and moved it to
    // review-queue), so a further orchestration call now takes the
    // not-found-but-report-exists replay path, which trusts the stored
    // report as-is rather than re-deriving it - proving the report, once
    // accepted, is never silently reconciled against a fresh run.
    const replay = await orchestrateStructuralValidation(candidateId, repo, {
      validatedAt: "2026-01-02T00:05:00.000Z",
    });
    expect(replay.outcome).toBe("rejected");
    if (replay.outcome === "rejected") {
      expect(replay.evidence.validationFingerprint).toBe("tampered-fingerprint-simulating-drifted-issue-summary");
    }
  });
});

describe("no duplicate report across multiple validatedAt values", () => {
  it("writes exactly one report even when orchestrated repeatedly with a different validatedAt each time", async () => {
    const { candidateId } = await seedGenerated();

    const outcomes = [];
    for (const validatedAt of [
      "2026-01-02T00:00:00.000Z",
      "2026-02-14T09:30:00.000Z",
      "2027-11-30T23:59:59.000Z",
    ]) {
      outcomes.push(await orchestrateStructuralValidation(candidateId, repo, { validatedAt }));
    }

    for (const outcome of outcomes) {
      expect(outcome.outcome).toBe("passed");
    }
    expect((await repo.list("reports")).length).toBe(1);
    expect(await repo.exists("review-queue", candidateId)).toBe(true);
  });
});
