import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { questionBank } from "@/content/questions/question-bank";
import {
  buildOriginalityReportId,
  orchestrateOriginalityReview,
} from "@/features/question-factory/originality/orchestrate-originality-review";
import type { FactoryCompartment, FactoryRepository, MoveResult, UpdateResult } from "@/features/question-factory/storage";
import { FsFactoryRepository } from "@/features/question-factory/storage";

import {
  ensureMission3dBlueprintSeeded,
  mission3dQuestion,
  seedAtSemanticReviewPassed,
  seedAtSemanticReviewPassedWithFabricatedCorrectness,
  seedAtState,
} from "./mission3d-fixtures";

let rootDir: string;
let repo: FsFactoryRepository;

beforeEach(async () => {
  rootDir = await mkdtemp(path.join(tmpdir(), "originality-orchestration-test-"));
  repo = new FsFactoryRepository(rootDir);
});

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true });
});

/**
 * Seeds a candidate at `semantic_review_passed` with a genuine, legitimate
 * upstream `cv-*` correctness report — Mission 3D audit remediation
 * (P1-1) means a bare `state` seed is no longer sufficient; the
 * originality gate now independently verifies real upstream evidence
 * exists before running.
 */
async function seedDistinctCandidate(id: string): Promise<{ readonly candidateId: string }> {
  const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
  return seedAtSemanticReviewPassed(repo, mission3dQuestion(id), blueprintHash);
}

/** Builds a candidate whose comparable text is byte-identical to a real, currently-existing production-bank question — proving the orchestrator is wired to the *live* corpus, not a mock. */
function exactDuplicateOfProductionBankEntry(candidateId: string): Record<string, unknown> {
  const target = questionBank[0];
  return {
    id: candidateId,
    type: "number_entry",
    yearLevel: 3,
    examStyle: "naplan_style",
    prompt: target.prompt,
    ...(target.stimulus ? { stimulus: { body: target.stimulus.body } } : {}),
    options: target.options.map((option, index) => ({ id: `dup-opt-${index}`, text: option.text })),
    answerKey: { kind: "number", value: 1, tolerance: 0 },
    visuals: [],
    explanation: "An unrelated explanation — never part of the comparison.",
    metadata: { subject: "numeracy", strand: "Number", skill: "num.addition.two-digit", difficulty: "easy", marks: 1, estimatedTimeSeconds: 60, tags: [] },
  };
}

/** Seeds a hard-duplicate-of-production-content candidate at `semantic_review_passed`, with a genuine, legitimate upstream `cv-*` report so only the originality decision itself is under test. */
async function seedHardDuplicateCandidate(candidateId: string): Promise<{ readonly candidateId: string }> {
  const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
  return seedAtSemanticReviewPassedWithFabricatedCorrectness(repo, exactDuplicateOfProductionBankEntry(candidateId), blueprintHash);
}

describe("orchestrateOriginalityReview — fresh pass", () => {
  it("passes a distinct candidate and advances to originality_review_passed without a physical move", async () => {
    const { candidateId } = await seedDistinctCandidate("og-orch-distinct-001");
    const outcome = await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-03-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("passed");
    expect(await repo.exists("review-queue", candidateId)).toBe(true);
    const stored = (await repo.read("review-queue", candidateId)) as { state: string };
    expect(stored.state).toBe("originality_review_passed");
  });

  it("writes exactly one originality report, keyed with the og- prefix", async () => {
    const { candidateId } = await seedDistinctCandidate("og-orch-distinct-002");
    await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-03-01T00:00:00.000Z" });
    const reportId = buildOriginalityReportId(candidateId);
    expect(reportId.startsWith("og-")).toBe(true);
    expect(await repo.exists("reports", reportId)).toBe(true);
  });
});

describe("orchestrateOriginalityReview — exact duplicate against the live production corpus", () => {
  it("rejects a candidate whose comparable text is byte-identical to a real production-bank question", async () => {
    const candidateId = "og-orch-exact-dup-001";
    const { candidateId: seededId } = await seedHardDuplicateCandidate(candidateId);
    const outcome = await orchestrateOriginalityReview(seededId, repo, { validatedAt: "2026-03-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("rejected");
    expect(await repo.exists("review-queue", seededId)).toBe(false);
    expect(await repo.exists("rejected/originality", seededId)).toBe(true);
    if (outcome.outcome === "rejected") {
      expect(outcome.evidence.classification).toBe("exact_duplicate");
      expect(outcome.issues.some((issue) => issue.code === "originality_exact_duplicate")).toBe(true);
    }
  });

  it("never consumes a revision slot for a hard-duplicate rejection (routes to rejected directly, not needs_revision)", async () => {
    const candidateId = "og-orch-exact-dup-002";
    await seedHardDuplicateCandidate(candidateId);
    const outcome = await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-03-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("rejected");
    expect(await repo.exists("review-queue", candidateId)).toBe(false);
  });
});

describe("orchestrateOriginalityReview — replay safety", () => {
  it("is idempotent on a second call — same fingerprint, no duplicate report", async () => {
    const { candidateId } = await seedDistinctCandidate("og-orch-replay-001");
    const first = await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-03-01T00:00:00.000Z" });
    const second = await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2027-01-01T00:00:00.000Z" });
    expect(first.outcome).toBe("passed");
    expect(second.outcome).toBe("passed");
    if (first.outcome === "passed" && second.outcome === "passed") {
      expect(first.evidence.originalityFingerprint).toBe(second.evidence.originalityFingerprint);
    }
    expect((await repo.list("reports")).filter((id) => id.startsWith("og-")).length).toBe(1);
  });

  it("replays a cached originality_review_passed report without re-running the pure verifier's write path", async () => {
    const { candidateId } = await seedDistinctCandidate("og-orch-replay-002");
    await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-03-01T00:00:00.000Z" });
    const replay = await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-03-02T00:00:00.000Z" });
    expect(replay.outcome).toBe("passed");
    if (replay.outcome === "passed") {
      expect(replay.replayed).toBe(true);
    }
  });
});

describe("orchestrateOriginalityReview — corpus-drift replay refusal", () => {
  it("refuses to replay a cached pass when the stored corpusFingerprint no longer matches the live corpus", async () => {
    const { candidateId } = await seedDistinctCandidate("og-orch-drift-001");
    await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-03-01T00:00:00.000Z" });

    const reportId = buildOriginalityReportId(candidateId);
    const stored = (await repo.read("reports", reportId)) as { candidateId: string; result: { evidence: Record<string, unknown> } };
    const tamperedEvidence = {
      ...stored.result.evidence,
      corpusScope: { ...(stored.result.evidence.corpusScope as Record<string, unknown>), corpusFingerprint: "stale-fingerprint-simulating-corpus-drift" },
    };
    const tampered = { ...stored, result: { ...stored.result, evidence: tamperedEvidence } };
    await repo.update("reports", reportId, tampered);

    const replay = await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-03-03T00:00:00.000Z" });
    expect(replay.outcome).toBe("replay_integrity_failure");
    if (replay.outcome === "replay_integrity_failure") {
      expect(replay.issues.some((issue) => issue.code === "originality_corpus_drift_detected")).toBe(true);
    }
    // A drift refusal never mutates the candidate or writes a new report.
    const record = (await repo.read("review-queue", candidateId)) as { state: string };
    expect(record.state).toBe("originality_review_passed");
    expect((await repo.list("reports")).filter((id) => id.startsWith("og-")).length).toBe(1);
  });

  it("refuses to replay when the checkerVersion no longer matches the current comparison-algorithm version", async () => {
    const { candidateId } = await seedDistinctCandidate("og-orch-drift-002");
    await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-03-01T00:00:00.000Z" });

    const reportId = buildOriginalityReportId(candidateId);
    const stored = (await repo.read("reports", reportId)) as { candidateId: string; result: { evidence: Record<string, unknown> } };
    const tampered = { ...stored, result: { ...stored.result, evidence: { ...stored.result.evidence, checkerVersion: "999-stale" } } };
    await repo.update("reports", reportId, tampered);

    const replay = await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-03-03T00:00:00.000Z" });
    expect(replay.outcome).toBe("replay_integrity_failure");
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

describe("orchestrateOriginalityReview — crash recovery", () => {
  it("recovers when the report write succeeds but the same-compartment update fails (pass path)", async () => {
    const { candidateId } = await seedDistinctCandidate("og-orch-crash-update-001");
    const flakyRepo = buildFailOnceUpdateRepo(repo);

    const first = await orchestrateOriginalityReview(candidateId, flakyRepo, { validatedAt: "2026-03-01T00:00:00.000Z" });
    expect(first.outcome).toBe("repository_error");
    const midway = (await repo.read("review-queue", candidateId)) as { state: string };
    expect(midway.state).toBe("semantic_review_passed");
    expect((await repo.list("reports")).filter((id) => id.startsWith("og-")).length).toBe(1);

    const second = await orchestrateOriginalityReview(candidateId, flakyRepo, { validatedAt: "2026-03-02T00:00:00.000Z" });
    expect(second.outcome).toBe("passed");
    expect((await repo.list("reports")).filter((id) => id.startsWith("og-")).length).toBe(1);
  });

  it("recovers when the report write succeeds but the rejecting move fails", async () => {
    const candidateId = "og-orch-crash-move-001";
    await seedHardDuplicateCandidate(candidateId);
    const flakyRepo = buildFailOnceMoveRepo(repo);

    const first = await orchestrateOriginalityReview(candidateId, flakyRepo, { validatedAt: "2026-03-01T00:00:00.000Z" });
    expect(first.outcome).toBe("repository_error");
    expect(await repo.exists("review-queue", candidateId)).toBe(true);
    expect((await repo.list("reports")).filter((id) => id.startsWith("og-")).length).toBe(1);

    const second = await orchestrateOriginalityReview(candidateId, flakyRepo, { validatedAt: "2026-03-02T00:00:00.000Z" });
    expect(second.outcome).toBe("rejected");
    expect((await repo.list("reports")).filter((id) => id.startsWith("og-")).length).toBe(1);
    expect(await repo.exists("review-queue", candidateId)).toBe(false);
    expect(await repo.exists("rejected/originality", candidateId)).toBe(true);
  });
});

describe("orchestrateOriginalityReview — lifecycle-state enforcement", () => {
  it("refuses with invalid_lifecycle_state for a candidate in the wrong state, with zero writes", async () => {
    await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const { candidateId } = await seedAtState(repo, mission3dQuestion("og-orch-invalid-state-001"), "structural_validation_passed");
    const reportsBefore = await repo.list("reports");

    const outcome = await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-03-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("invalid_lifecycle_state");
    expect(await repo.list("reports")).toEqual(reportsBefore);
    const record = (await repo.read("review-queue", candidateId)) as { state: string };
    expect(record.state).toBe("structural_validation_passed");
  });

  it("returns not_found for a candidate that does not exist anywhere", async () => {
    const outcome = await orchestrateOriginalityReview("og-orch-missing-001", repo, { validatedAt: "2026-03-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("not_found");
  });
});

describe("orchestrateOriginalityReview — missing blueprint: zero progression", () => {
  it("refuses with blueprint_unresolved when the declared blueprint id does not exist, with zero writes", async () => {
    const candidateId = "og-orch-missing-blueprint-001";
    await seedAtState(repo, mission3dQuestion(candidateId), "semantic_review_passed", { blueprintId: "does-not-exist-blueprint" });

    const outcome = await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-03-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("blueprint_unresolved");
    if (outcome.outcome === "blueprint_unresolved") {
      expect(outcome.kind).toBe("missing");
    }
    expect(await repo.list("reports")).toEqual([]);
    const record = (await repo.read("review-queue", candidateId)) as { state: string };
    expect(record.state).toBe("semantic_review_passed");
  });
});

describe("orchestrateOriginalityReview — multi-candidate isolation", () => {
  it("processing one candidate never affects another's report, state, or corpus fingerprint", async () => {
    const a = await seedDistinctCandidate("og-orch-isolation-a");
    const b = await seedDistinctCandidate("og-orch-isolation-b");

    const outcomeA = await orchestrateOriginalityReview(a.candidateId, repo, { validatedAt: "2026-03-01T00:00:00.000Z" });
    const outcomeB = await orchestrateOriginalityReview(b.candidateId, repo, { validatedAt: "2026-03-01T00:00:00.000Z" });

    expect(outcomeA.outcome).toBe("passed");
    expect(outcomeB.outcome).toBe("passed");
    const recordA = (await repo.read("review-queue", a.candidateId)) as { state: string; candidateId: string };
    const recordB = (await repo.read("review-queue", b.candidateId)) as { state: string; candidateId: string };
    expect(recordA.candidateId).toBe(a.candidateId);
    expect(recordB.candidateId).toBe(b.candidateId);
    expect((await repo.list("reports")).filter((id) => id.startsWith("og-")).length).toBe(2);
  });

  it("a hard-duplicate candidate does not affect a distinct candidate processed in the same repository", async () => {
    const dupId = "og-orch-isolation-dup";
    await seedHardDuplicateCandidate(dupId);
    const distinct = await seedDistinctCandidate("og-orch-isolation-distinct");

    const dupOutcome = await orchestrateOriginalityReview(dupId, repo, { validatedAt: "2026-03-01T00:00:00.000Z" });
    const distinctOutcome = await orchestrateOriginalityReview(distinct.candidateId, repo, { validatedAt: "2026-03-01T00:00:00.000Z" });

    expect(dupOutcome.outcome).toBe("rejected");
    expect(distinctOutcome.outcome).toBe("passed");
  });
});

describe("orchestrateOriginalityReview — never reaches staging or publication", () => {
  it("does not create staged or published-manifests records for any outcome", async () => {
    const dupId = "og-orch-no-staging-001";
    await seedHardDuplicateCandidate(dupId);
    const distinct = await seedDistinctCandidate("og-orch-no-staging-002");

    await orchestrateOriginalityReview(dupId, repo, { validatedAt: "2026-03-01T00:00:00.000Z" });
    await orchestrateOriginalityReview(distinct.candidateId, repo, { validatedAt: "2026-03-01T00:00:00.000Z" });

    expect(await repo.list("staged")).toEqual([]);
    expect(await repo.list("published-manifests")).toEqual([]);
  });
});
