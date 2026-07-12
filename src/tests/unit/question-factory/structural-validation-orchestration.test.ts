import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { FactoryCompartment, FactoryRepository, MoveResult } from "@/features/question-factory/storage";
import { FsFactoryRepository } from "@/features/question-factory/storage";
import { orchestrateStructuralValidation } from "@/features/question-factory/validation";
import { buildEvidence } from "@/features/question-factory/validation/evidence";
import type {
  StructuralValidationIssue,
  StructuralValidationResult,
} from "@/features/question-factory/validation";

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
    // 1. Candidate is in `generated`.
    const { candidateId } = await seedGenerated();
    const flakyRepo = buildFailOnceMoveRepo(repo);

    // 2 + 3. Validation report is written for real, the repository move
    // fails, and the candidate remains in `generated` - identical setup to
    // the content/revision/blueprint conflict tests above.
    const first = await orchestrateStructuralValidation(candidateId, flakyRepo, {
      validatedAt: "2026-01-02T00:00:00.000Z",
    });
    expect(first.outcome).toBe("repository_error");
    expect(await repo.exists("generated", candidateId)).toBe(true);
    expect(await repo.exists("review-queue", candidateId)).toBe(false);

    // 4. Exactly one report exists.
    const reportIds = await repo.list("reports");
    expect(reportIds.length).toBe(1);
    const reportId = reportIds[0] as string;
    const storedReport = (await repo.read("reports", reportId)) as {
      readonly candidateId: string;
      readonly result: StructuralValidationResult;
    };
    expect(storedReport.result.status).toBe("passed");
    if (storedReport.result.status !== "passed") return;
    const realEvidence = storedReport.result.evidence;

    // 5. Genuine issue-summary divergence, same candidate binding fields.
    // Simulates the report having been produced under a different, still
    // deterministic issue set - e.g. a taxonomy registry entry retired
    // between attempts - by running the real evidence builder
    // (`buildEvidence`) over a different issue list while holding
    // candidateId, revision, contentHash, blueprintHash, and
    // validator/schema/taxonomy version identical to the genuine record.
    // This is never a hand-edited fingerprint: the fingerprint is derived
    // the same way production derives it.
    const divergentIssues: readonly StructuralValidationIssue[] = [
      {
        code: "unknown_taxonomy_skill",
        path: "question.metadata.skill",
        message: "simulated retired taxonomy entry between validation attempts",
        severity: "error",
      },
    ];
    const divergentEvidence = buildEvidence({
      candidateId: realEvidence.candidateId,
      candidateRevision: realEvidence.candidateRevision,
      candidateContentHash: realEvidence.candidateContentHash,
      ...(realEvidence.blueprintHash !== undefined ? { blueprintHash: realEvidence.blueprintHash } : {}),
      validatedAt: realEvidence.validatedAt,
      issues: divergentIssues,
    });
    expect(divergentEvidence.validationFingerprint).not.toBe(realEvidence.validationFingerprint);

    await repo.remove("reports", reportId);
    await repo.create("reports", reportId, {
      candidateId: storedReport.candidateId,
      result: { status: "failed", issues: divergentIssues, evidence: divergentEvidence },
    });

    // 6. Retry while the candidate is still in `generated`: this re-reads
    // the untouched candidate, re-validates it for real (reproducing the
    // original, non-divergent evidence), and reaches
    // `writeReportIfAbsent`'s fingerprint comparison against the divergent
    // stored report - the real conflict path, not the not-found replay
    // path a candidate that had actually moved would take.
    const retry = await orchestrateStructuralValidation(candidateId, repo, {
      validatedAt: "2026-01-02T00:05:00.000Z",
    });

    // 7. Conflict, not a silent overwrite or a replay.
    expect(retry.outcome).toBe("repository_error");
    if (retry.outcome === "repository_error") {
      expect(retry.message).toMatch(/validation fingerprint/i);
    }
    expect((await repo.list("reports")).length).toBe(1);
    expect(await repo.exists("generated", candidateId)).toBe(true);
    expect(await repo.exists("review-queue", candidateId)).toBe(false);
    expect(await repo.exists("rejected/structural", candidateId)).toBe(false);
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

describe("rejected-state replay safety", () => {
  it("replays the same rejected outcome, with no second report and no second move, on retry with a different validatedAt", async () => {
    // 1. Run a failing structural validation to completion.
    const { candidateId } = await seedGenerated({ questionOverrides: { prompt: "" } });
    const first = await orchestrateStructuralValidation(candidateId, repo, {
      validatedAt: "2026-01-02T00:00:00.000Z",
    });
    expect(first.outcome).toBe("rejected");

    // 2. Candidate is rejected, gone from `generated`, exactly one report.
    expect(await repo.exists("rejected/structural", candidateId)).toBe(true);
    expect(await repo.exists("generated", candidateId)).toBe(false);
    expect((await repo.list("reports")).length).toBe(1);

    // 3. Retry with a different validatedAt. The candidate is no longer in
    // `generated`, so this takes the not-found-but-report-exists replay
    // path and returns the stored outcome directly, without re-validating.
    const second = await orchestrateStructuralValidation(candidateId, repo, {
      validatedAt: "2027-01-01T00:00:00.000Z",
    });

    // 4. Same rejected outcome, no second report, no second move, no later
    // lifecycle state reached.
    expect(second.outcome).toBe("rejected");
    if (first.outcome === "rejected" && second.outcome === "rejected") {
      expect(second.replayed).toBe(true);
      expect(second.evidence.validationFingerprint).toBe(first.evidence.validationFingerprint);
    }
    expect((await repo.list("reports")).length).toBe(1);
    expect(await repo.exists("rejected/structural", candidateId)).toBe(true);
    expect(await repo.exists("generated", candidateId)).toBe(false);
    expect(await repo.exists("review-queue", candidateId)).toBe(false);
  });
});
