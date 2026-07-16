import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  buildDifficultyReportId,
  orchestrateDifficultyReview,
} from "@/features/question-factory/difficulty/orchestrate-difficulty-review";
import type { FactoryCompartment, FactoryRepository, MoveResult, UpdateResult } from "@/features/question-factory/storage";
import { FsFactoryRepository } from "@/features/question-factory/storage";

import { ensureMission3dBlueprintSeeded, mission3dDifficultyQuestion, seedAtState } from "./mission3d-fixtures";

let rootDir: string;
let repo: FsFactoryRepository;

beforeEach(async () => {
  rootDir = await mkdtemp(path.join(tmpdir(), "difficulty-orchestration-test-"));
  repo = new FsFactoryRepository(rootDir);
});

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true });
});

async function seedConfirmed(id: string): Promise<{ readonly candidateId: string }> {
  await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint", "easy");
  return seedAtState(repo, mission3dDifficultyQuestion(id, 20), "originality_review_passed");
}

async function seedMismatch(id: string): Promise<{ readonly candidateId: string }> {
  await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint", "easy");
  return seedAtState(repo, mission3dDifficultyQuestion(id, 70), "originality_review_passed");
}

async function seedInsufficientEvidence(id: string): Promise<{ readonly candidateId: string }> {
  await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint", "easy");
  return seedAtState(repo, mission3dDifficultyQuestion(id, 3), "originality_review_passed");
}

describe("orchestrateDifficultyReview — confirmed", () => {
  it("passes and advances to difficulty_review_passed without a physical move", async () => {
    const { candidateId } = await seedConfirmed("df-orch-confirmed-001");
    const outcome = await orchestrateDifficultyReview(candidateId, repo, { validatedAt: "2026-03-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("passed");
    expect(await repo.exists("review-queue", candidateId)).toBe(true);
    const stored = (await repo.read("review-queue", candidateId)) as { state: string };
    expect(stored.state).toBe("difficulty_review_passed");
  });

  it("writes exactly one difficulty report, keyed with the df- prefix", async () => {
    const { candidateId } = await seedConfirmed("df-orch-confirmed-002");
    await orchestrateDifficultyReview(candidateId, repo, { validatedAt: "2026-03-01T00:00:00.000Z" });
    const reportId = buildDifficultyReportId(candidateId);
    expect(reportId.startsWith("df-")).toBe(true);
    expect(await repo.exists("reports", reportId)).toBe(true);
  });
});

describe("orchestrateDifficultyReview — mismatch", () => {
  it("routes a confident, real difficulty mismatch to needs_revision (budget remains)", async () => {
    const { candidateId } = await seedMismatch("df-orch-mismatch-001");
    const outcome = await orchestrateDifficultyReview(candidateId, repo, { validatedAt: "2026-03-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("needs_revision");
    const stored = (await repo.read("review-queue", candidateId)) as { state: string };
    expect(stored.state).toBe("needs_revision");
    if (outcome.outcome === "needs_revision") {
      expect(outcome.issues.some((issue) => issue.code === "difficulty_deviation_exceeded")).toBe(true);
    }
  });

  it("routes to rejected once the revision budget is exhausted", async () => {
    await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint", "easy");
    const candidateId = "df-orch-mismatch-budget-001";
    await seedAtState(repo, mission3dDifficultyQuestion(candidateId, 70), "originality_review_passed", { revision: 2 });
    const outcome = await orchestrateDifficultyReview(candidateId, repo, { validatedAt: "2026-03-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("rejected");
    expect(await repo.exists("review-queue", candidateId)).toBe(false);
    expect(await repo.exists("rejected/difficulty", candidateId)).toBe(true);
  });
});

describe("orchestrateDifficultyReview — insufficient_evidence (unsupported)", () => {
  it("quarantines, never passes or fails, when confidence is below the floor", async () => {
    const { candidateId } = await seedInsufficientEvidence("df-orch-insufficient-001");
    const outcome = await orchestrateDifficultyReview(candidateId, repo, { validatedAt: "2026-03-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("quarantined");
    expect(await repo.exists("review-queue", candidateId)).toBe(false);
    expect(await repo.exists("quarantined", candidateId)).toBe(true);
    if (outcome.outcome === "quarantined") {
      expect(outcome.issues.some((issue) => issue.code === "difficulty_estimate_low_confidence")).toBe(true);
    }
  });
});

describe("orchestrateDifficultyReview — replay safety", () => {
  it("is idempotent on a second call — same fingerprint, no duplicate report", async () => {
    const { candidateId } = await seedConfirmed("df-orch-replay-001");
    const first = await orchestrateDifficultyReview(candidateId, repo, { validatedAt: "2026-03-01T00:00:00.000Z" });
    const second = await orchestrateDifficultyReview(candidateId, repo, { validatedAt: "2027-01-01T00:00:00.000Z" });
    expect(first.outcome).toBe("passed");
    expect(second.outcome).toBe("passed");
    if (first.outcome === "passed" && second.outcome === "passed") {
      expect(first.evidence.difficultyFingerprint).toBe(second.evidence.difficultyFingerprint);
    }
    expect((await repo.list("reports")).filter((id) => id.startsWith("df-")).length).toBe(1);
  });

  it("replays a cached difficulty_review_passed report", async () => {
    const { candidateId } = await seedConfirmed("df-orch-replay-002");
    await orchestrateDifficultyReview(candidateId, repo, { validatedAt: "2026-03-01T00:00:00.000Z" });
    const replay = await orchestrateDifficultyReview(candidateId, repo, { validatedAt: "2026-03-02T00:00:00.000Z" });
    expect(replay.outcome).toBe("passed");
    if (replay.outcome === "passed") {
      expect(replay.replayed).toBe(true);
    }
  });

  it("refuses to replay when the estimator (checkerVersion) no longer matches the current version", async () => {
    const { candidateId } = await seedConfirmed("df-orch-replay-drift-001");
    await orchestrateDifficultyReview(candidateId, repo, { validatedAt: "2026-03-01T00:00:00.000Z" });

    const reportId = buildDifficultyReportId(candidateId);
    const stored = (await repo.read("reports", reportId)) as { result: { evidence: Record<string, unknown> } };
    const tampered = { ...stored, result: { ...stored.result, evidence: { ...stored.result.evidence, checkerVersion: "999-stale" } } };
    await repo.update("reports", reportId, tampered);

    const replay = await orchestrateDifficultyReview(candidateId, repo, { validatedAt: "2026-03-03T00:00:00.000Z" });
    expect(replay.outcome).toBe("replay_integrity_failure");
    if (replay.outcome === "replay_integrity_failure") {
      expect(replay.issues.some((issue) => issue.code === "difficulty_replay_drift_detected")).toBe(true);
    }
    const record = (await repo.read("review-queue", candidateId)) as { state: string };
    expect(record.state).toBe("difficulty_review_passed");
    expect((await repo.list("reports")).filter((id) => id.startsWith("df-")).length).toBe(1);
  });
});

/** Wraps a real repository so `update()` fails exactly once, then delegates to the real implementation. */
function buildFailOnceUpdateRepo(realRepo: FactoryRepository): FactoryRepository {
  let updateAttempts = 0;
  return {
    create: realRepo.create.bind(realRepo),
    read: realRepo.read.bind(realRepo),
    exists: realRepo.exists.bind(realRepo),
    remove: realRepo.remove.bind(realRepo),
    list: realRepo.list.bind(realRepo),
    reconcile: realRepo.reconcile.bind(realRepo),
    move: realRepo.move.bind(realRepo),
    update: async (
      compartment: FactoryCompartment,
      candidateId: string,
      data: unknown,
      options?: { readonly expectedContentHash?: string },
    ): Promise<UpdateResult> => {
      updateAttempts += 1;
      if (updateAttempts === 1) {
        return { ok: false, candidateId, compartment, reason: "state_mismatch", message: "simulated transient repository failure" };
      }
      return realRepo.update(compartment, candidateId, data, options);
    },
  };
}

/** Wraps a real repository so `move()` fails exactly once, then delegates to the real implementation. */
function buildFailOnceMoveRepo(realRepo: FactoryRepository): FactoryRepository {
  let moveAttempts = 0;
  return {
    create: realRepo.create.bind(realRepo),
    read: realRepo.read.bind(realRepo),
    exists: realRepo.exists.bind(realRepo),
    remove: realRepo.remove.bind(realRepo),
    list: realRepo.list.bind(realRepo),
    reconcile: realRepo.reconcile.bind(realRepo),
    update: realRepo.update.bind(realRepo),
    move: async (candidateId: string, from: FactoryCompartment, to: FactoryCompartment): Promise<MoveResult> => {
      moveAttempts += 1;
      if (moveAttempts === 1) {
        return { ok: false, candidateId, from, to, reason: "destination_exists", message: "simulated transient repository failure" };
      }
      return realRepo.move(candidateId, from, to);
    },
  };
}

describe("orchestrateDifficultyReview — crash recovery", () => {
  it("recovers when the report write succeeds but the same-compartment update fails (pass path)", async () => {
    const { candidateId } = await seedConfirmed("df-orch-crash-update-001");
    const flakyRepo = buildFailOnceUpdateRepo(repo);

    const first = await orchestrateDifficultyReview(candidateId, flakyRepo, { validatedAt: "2026-03-01T00:00:00.000Z" });
    expect(first.outcome).toBe("repository_error");
    const midway = (await repo.read("review-queue", candidateId)) as { state: string };
    expect(midway.state).toBe("originality_review_passed");
    expect((await repo.list("reports")).filter((id) => id.startsWith("df-")).length).toBe(1);

    const second = await orchestrateDifficultyReview(candidateId, flakyRepo, { validatedAt: "2026-03-02T00:00:00.000Z" });
    expect(second.outcome).toBe("passed");
    expect((await repo.list("reports")).filter((id) => id.startsWith("df-")).length).toBe(1);
  });

  it("recovers when the report write succeeds but the quarantine move fails", async () => {
    const { candidateId } = await seedInsufficientEvidence("df-orch-crash-move-001");
    const flakyRepo = buildFailOnceMoveRepo(repo);

    const first = await orchestrateDifficultyReview(candidateId, flakyRepo, { validatedAt: "2026-03-01T00:00:00.000Z" });
    expect(first.outcome).toBe("repository_error");
    expect(await repo.exists("review-queue", candidateId)).toBe(true);
    expect((await repo.list("reports")).filter((id) => id.startsWith("df-")).length).toBe(1);

    const second = await orchestrateDifficultyReview(candidateId, flakyRepo, { validatedAt: "2026-03-02T00:00:00.000Z" });
    expect(second.outcome).toBe("quarantined");
    expect((await repo.list("reports")).filter((id) => id.startsWith("df-")).length).toBe(1);
    expect(await repo.exists("review-queue", candidateId)).toBe(false);
    expect(await repo.exists("quarantined", candidateId)).toBe(true);
  });
});

describe("orchestrateDifficultyReview — lifecycle-state enforcement", () => {
  it("refuses with invalid_lifecycle_state for a candidate in the wrong state, with zero writes", async () => {
    await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint", "easy");
    const { candidateId } = await seedAtState(repo, mission3dDifficultyQuestion("df-orch-invalid-state-001", 20), "semantic_review_passed");
    const reportsBefore = await repo.list("reports");

    const outcome = await orchestrateDifficultyReview(candidateId, repo, { validatedAt: "2026-03-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("invalid_lifecycle_state");
    expect(await repo.list("reports")).toEqual(reportsBefore);
  });

  it("returns not_found for a candidate that does not exist anywhere", async () => {
    const outcome = await orchestrateDifficultyReview("df-orch-missing-001", repo, { validatedAt: "2026-03-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("not_found");
  });
});

describe("orchestrateDifficultyReview — missing blueprint: zero progression", () => {
  it("refuses with blueprint_unresolved (kind missing) when no blueprint id is declared at all, with zero writes", async () => {
    await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint", "easy");
    const candidateId = "df-orch-no-blueprint-id-001";
    await seedAtState(repo, mission3dDifficultyQuestion(candidateId, 20), "originality_review_passed");
    // Simulate a candidate whose provenance never declared a blueprint id
    // at all (the field is absent, not merely unresolvable).
    const record = (await repo.read("review-queue", candidateId)) as Record<string, unknown>;
    const provenance = { ...(record.provenance as Record<string, unknown>) };
    delete provenance.blueprintId;
    await repo.update("review-queue", candidateId, { ...record, provenance });

    const outcome = await orchestrateDifficultyReview(candidateId, repo, { validatedAt: "2026-03-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("blueprint_unresolved");
    if (outcome.outcome === "blueprint_unresolved") {
      expect(outcome.kind).toBe("missing");
    }
    expect(await repo.list("reports")).toEqual([]);
  });

  it("refuses with blueprint_unresolved (kind missing) when the declared blueprint id does not resolve, with zero writes", async () => {
    const candidateId = "df-orch-missing-blueprint-001";
    await seedAtState(repo, mission3dDifficultyQuestion(candidateId, 20), "originality_review_passed", { blueprintId: "does-not-exist-blueprint" });

    const outcome = await orchestrateDifficultyReview(candidateId, repo, { validatedAt: "2026-03-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("blueprint_unresolved");
    if (outcome.outcome === "blueprint_unresolved") {
      expect(outcome.kind).toBe("missing");
    }
    expect(await repo.list("reports")).toEqual([]);
    const record = (await repo.read("review-queue", candidateId)) as { state: string };
    expect(record.state).toBe("originality_review_passed");
  });
});

describe("orchestrateDifficultyReview — multi-candidate isolation", () => {
  it("processing one candidate never affects another's report or state", async () => {
    const a = await seedConfirmed("df-orch-isolation-a");
    const b = await seedMismatch("df-orch-isolation-b");

    const outcomeA = await orchestrateDifficultyReview(a.candidateId, repo, { validatedAt: "2026-03-01T00:00:00.000Z" });
    const outcomeB = await orchestrateDifficultyReview(b.candidateId, repo, { validatedAt: "2026-03-01T00:00:00.000Z" });

    expect(outcomeA.outcome).toBe("passed");
    expect(outcomeB.outcome).toBe("needs_revision");
    expect((await repo.list("reports")).filter((id) => id.startsWith("df-")).length).toBe(2);
  });
});

describe("orchestrateDifficultyReview — never reaches staging or publication", () => {
  it("does not create staged or published-manifests records for any outcome", async () => {
    const confirmed = await seedConfirmed("df-orch-no-staging-001");
    const mismatch = await seedMismatch("df-orch-no-staging-002");

    await orchestrateDifficultyReview(confirmed.candidateId, repo, { validatedAt: "2026-03-01T00:00:00.000Z" });
    await orchestrateDifficultyReview(mismatch.candidateId, repo, { validatedAt: "2026-03-01T00:00:00.000Z" });

    expect(await repo.list("staged")).toEqual([]);
    expect(await repo.list("published-manifests")).toEqual([]);
  });
});
