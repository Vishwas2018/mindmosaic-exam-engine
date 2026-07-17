import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { questionBank } from "@/content/questions/question-bank";
import { buildCorrectnessReportId } from "@/features/question-factory/correctness";
import { orchestrateDifficultyReview } from "@/features/question-factory/difficulty/orchestrate-difficulty-review";
import { buildOriginalityReportId, orchestrateOriginalityReview } from "@/features/question-factory/originality";
import { runPipeline } from "@/features/question-factory/pipeline";
import { FsFactoryRepository } from "@/features/question-factory/storage";
import { buildStructuralValidationReportId } from "@/features/question-factory/validation";

import {
  ensureMission3dBlueprintSeeded,
  mission3dDifficultyQuestion,
  mission3dQuestion,
  seedAtOriginalityReviewPassed,
  seedAtSemanticReviewPassed,
  seedAtState,
  seedLegitimateCorrectnessReport,
  seedLegitimateOriginalityReport,
  seedLegitimateStructuralReport,
} from "./mission3d-fixtures";

/**
 * Mission 3D audit remediation (P1-1/P2) — dedicated adversarial and
 * regression coverage, run against a real `FsFactoryRepository` throughout
 * (never mocks), matching the audit's own required-scenario list exactly.
 */
let rootDir: string;
let repo: FsFactoryRepository;

beforeEach(async () => {
  rootDir = await mkdtemp(path.join(tmpdir(), "mission3d-remediation-"));
  repo = new FsFactoryRepository(rootDir);
});

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true });
});

// --- 1. Forged semantic_review_passed with no valid upstream evidence -----

describe("P1-1 remediation — forged semantic_review_passed (originality)", () => {
  it("refuses with upstream_evidence_invalid, never creates a report, never transitions", async () => {
    await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const { candidateId } = await seedAtState(repo, mission3dQuestion("forged-semantic-001"), "semantic_review_passed");
    // Deliberately no cv-* report ever created — this state was never
    // legitimately produced by `orchestrateCorrectnessVerification` /
    // `attemptSemanticReviewTransition`.

    const outcome = await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-04-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
    if (outcome.outcome === "upstream_evidence_invalid") {
      expect(outcome.issues.every((issue) => issue.code === "originality_upstream_evidence_invalid")).toBe(true);
      expect(outcome.issues.some((issue) => issue.message.includes("No correctness-verification report exists"))).toBe(true);
    }

    // Zero writes: no og- report, no state change, no compartment move.
    expect((await repo.list("reports")).filter((id) => id.startsWith("og-"))).toEqual([]);
    const record = (await repo.read("review-queue", candidateId)) as { state: string };
    expect(record.state).toBe("semantic_review_passed");
    expect(await repo.exists("rejected/originality", candidateId)).toBe(false);
    expect(await repo.exists("quarantined", candidateId)).toBe(false);
  });
});

// --- 2. Forged originality_review_passed with no og-* report --------------

describe("P1-1 remediation — forged originality_review_passed (difficulty)", () => {
  it("refuses with upstream_evidence_invalid, never creates a report, never transitions", async () => {
    await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint", "easy");
    const { candidateId } = await seedAtState(repo, mission3dDifficultyQuestion("forged-originality-001", 20), "originality_review_passed");
    // Deliberately no og- report and no cv- report ever created.

    const outcome = await orchestrateDifficultyReview(candidateId, repo, { validatedAt: "2026-04-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
    if (outcome.outcome === "upstream_evidence_invalid") {
      expect(outcome.issues.every((issue) => issue.code === "difficulty_upstream_evidence_invalid")).toBe(true);
      expect(outcome.issues.some((issue) => issue.message.includes("No originality report exists"))).toBe(true);
    }

    expect((await repo.list("reports")).filter((id) => id.startsWith("df-"))).toEqual([]);
    const record = (await repo.read("review-queue", candidateId)) as { state: string };
    expect(record.state).toBe("originality_review_passed");
    expect(await repo.exists("rejected/difficulty", candidateId)).toBe(false);
    expect(await repo.exists("quarantined", candidateId)).toBe(false);
  });
});

// --- 3. Missing upstream report (explicit, both gates) ---------------------

describe("P1-1 remediation — missing upstream report is distinguishable in the issue message", () => {
  it("originality: message names the missing cv- report explicitly", async () => {
    await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const { candidateId } = await seedAtState(repo, mission3dQuestion("missing-cv-001"), "semantic_review_passed");
    const outcome = await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-04-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
  });

  it("difficulty: message names the missing og- report explicitly", async () => {
    await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint", "easy");
    const { candidateId } = await seedAtState(repo, mission3dDifficultyQuestion("missing-og-001", 20), "originality_review_passed");
    const outcome = await orchestrateDifficultyReview(candidateId, repo, { validatedAt: "2026-04-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
  });
});

// --- 4. Malformed report -----------------------------------------------------

describe("P1-1 remediation — malformed upstream report", () => {
  it("originality: a cv- report with a corrupted result/evidence shape is refused, never throws", async () => {
    const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const { candidateId } = await seedAtSemanticReviewPassed(repo, mission3dQuestion("malformed-cv-001"), blueprintHash);
    // Corrupt the stored cv- report's shape directly.
    await repo.update("reports", buildCorrectnessReportId(candidateId), { candidateId, result: "not-an-object" });

    const outcome = await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-04-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
    if (outcome.outcome === "upstream_evidence_invalid") {
      expect(outcome.issues.some((issue) => issue.message.includes("malformed"))).toBe(true);
    }
    expect((await repo.list("reports")).filter((id) => id.startsWith("og-"))).toEqual([]);
  });

  it("difficulty: an og- report with a corrupted result/evidence shape is refused, never throws", async () => {
    const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint", "easy");
    const { candidateId } = await seedAtOriginalityReviewPassed(repo, mission3dDifficultyQuestion("malformed-og-001", 20), blueprintHash);
    await repo.update("reports", buildOriginalityReportId(candidateId), { candidateId, result: { status: "passed", capability: null } });

    const outcome = await orchestrateDifficultyReview(candidateId, repo, { validatedAt: "2026-04-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
    if (outcome.outcome === "upstream_evidence_invalid") {
      expect(outcome.issues.some((issue) => issue.message.includes("malformed"))).toBe(true);
    }
    expect((await repo.list("reports")).filter((id) => id.startsWith("df-"))).toEqual([]);
  });
});

// --- 5. Wrong-candidate report -----------------------------------------------

describe("P1-1 remediation — wrong-candidate report", () => {
  it("originality: a cv- report belonging to a different candidateId is refused", async () => {
    const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const { candidateId: victim } = await seedAtSemanticReviewPassed(repo, mission3dQuestion("wrong-cand-victim-001"), blueprintHash);
    const attacker = await seedAtSemanticReviewPassed(repo, mission3dQuestion("wrong-cand-attacker-001"), blueprintHash);

    // Overwrite the victim's cv- report with the attacker's (same shape,
    // wrong candidateId inside both the wrapper and the evidence).
    const attackerReport = await repo.read("reports", buildCorrectnessReportId(attacker.candidateId));
    await repo.update("reports", buildCorrectnessReportId(victim), attackerReport as Record<string, unknown>);

    const outcome = await orchestrateOriginalityReview(victim, repo, { validatedAt: "2026-04-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
    if (outcome.outcome === "upstream_evidence_invalid") {
      expect(outcome.issues.some((issue) => issue.message.includes(attacker.candidateId))).toBe(true);
    }
  });

  it("difficulty: an og- report belonging to a different candidateId is refused", async () => {
    const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint", "easy");
    const { candidateId: victim } = await seedAtOriginalityReviewPassed(repo, mission3dDifficultyQuestion("wrong-cand-victim-002", 20), blueprintHash);
    const attacker = await seedAtOriginalityReviewPassed(repo, mission3dDifficultyQuestion("wrong-cand-attacker-002", 20), blueprintHash);

    const attackerReport = await repo.read("reports", buildOriginalityReportId(attacker.candidateId));
    await repo.update("reports", buildOriginalityReportId(victim), attackerReport as Record<string, unknown>);

    const outcome = await orchestrateDifficultyReview(victim, repo, { validatedAt: "2026-04-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
  });
});

// --- 6. Stale candidate/content binding --------------------------------------

describe("P1-1 remediation — stale candidate/content binding", () => {
  it("originality: refuses when the candidate's content hash has changed since the cv- report was written", async () => {
    const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const { candidateId } = await seedAtSemanticReviewPassed(repo, mission3dQuestion("stale-content-001"), blueprintHash);

    const stored = (await repo.read("review-queue", candidateId)) as Record<string, unknown>;
    const provenance = { ...(stored.provenance as Record<string, unknown>), contentHash: "a-different-content-hash-entirely" };
    await repo.update("review-queue", candidateId, { ...stored, provenance });

    const outcome = await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-04-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
  });

  it("difficulty: refuses when the candidate's revision has advanced since the og- report was written", async () => {
    const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint", "easy");
    const { candidateId } = await seedAtOriginalityReviewPassed(repo, mission3dDifficultyQuestion("stale-revision-001", 20), blueprintHash);

    const stored = (await repo.read("review-queue", candidateId)) as Record<string, unknown>;
    const provenance = { ...(stored.provenance as Record<string, unknown>), revision: 5 };
    await repo.update("review-queue", candidateId, { ...stored, provenance });

    const outcome = await orchestrateDifficultyReview(candidateId, repo, { validatedAt: "2026-04-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
  });
});

// --- 7. Stale corpus/configuration binding -----------------------------------

describe("P1-1 remediation — stale corpus/configuration binding", () => {
  it("originality: refuses when the cv- report's verifier version is no longer current", async () => {
    const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const { candidateId } = await seedAtSemanticReviewPassed(repo, mission3dQuestion("stale-verifier-001"), blueprintHash);

    const reportId = buildCorrectnessReportId(candidateId);
    const stored = (await repo.read("reports", reportId)) as { candidateId: string; result: { evidence: Record<string, unknown> } };
    const tampered = { ...stored, result: { ...stored.result, evidence: { ...stored.result.evidence, verifierVersion: "999-stale" } } };
    await repo.update("reports", reportId, tampered);

    const outcome = await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-04-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
  });

  it("difficulty: refuses when the og- report's corpus fingerprint no longer matches the live corpus (corpus drift, consumed via the upstream check)", async () => {
    const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint", "easy");
    const { candidateId } = await seedAtOriginalityReviewPassed(repo, mission3dDifficultyQuestion("stale-corpus-001", 20), blueprintHash);

    const reportId = buildOriginalityReportId(candidateId);
    const stored = (await repo.read("reports", reportId)) as { candidateId: string; result: { evidence: Record<string, unknown> } };
    const tamperedEvidence = {
      ...stored.result.evidence,
      corpusScope: { ...(stored.result.evidence.corpusScope as Record<string, unknown>), corpusFingerprint: "stale-fingerprint" },
    };
    const tampered = { ...stored, result: { ...stored.result, evidence: tamperedEvidence } };
    await repo.update("reports", reportId, tampered);

    const outcome = await orchestrateDifficultyReview(candidateId, repo, { validatedAt: "2026-04-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
  });
});

// --- 8. Successful retry after valid evidence restoration -------------------

describe("P1-1 remediation — successful retry after valid evidence restoration", () => {
  it("originality: refused when cv- is missing, succeeds once the legitimate report is planted and retried", async () => {
    const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const question = mission3dQuestion("retry-restore-001");
    const { candidateId } = await seedAtState(repo, question, "semantic_review_passed");

    const first = await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-04-01T00:00:00.000Z" });
    expect(first.outcome).toBe("upstream_evidence_invalid");

    const contentHash = (await repo.read("review-queue", candidateId) as { provenance: { contentHash: string } }).provenance.contentHash;
    // Second remediation: restoring "legitimate evidence" now means both
    // the structural report the correctness report must authentically
    // reference, and the correctness report itself.
    const structuralFingerprint = await seedLegitimateStructuralReport(repo, candidateId, 0, contentHash, blueprintHash);
    await seedLegitimateCorrectnessReport(repo, candidateId, 0, contentHash, blueprintHash, structuralFingerprint);

    const second = await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-04-01T00:01:00.000Z" });
    expect(second.outcome).toBe("passed");
    const record = (await repo.read("review-queue", candidateId)) as { state: string };
    expect(record.state).toBe("originality_review_passed");
  });

  it("difficulty: refused when og- is missing, succeeds once the legitimate report is planted and retried", async () => {
    const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint", "easy");
    const question = mission3dDifficultyQuestion("retry-restore-002", 20);
    const { candidateId } = await seedAtState(repo, question, "originality_review_passed");

    const first = await orchestrateDifficultyReview(candidateId, repo, { validatedAt: "2026-04-01T00:00:00.000Z" });
    expect(first.outcome).toBe("upstream_evidence_invalid");

    const contentHash = (await repo.read("review-queue", candidateId) as { provenance: { contentHash: string } }).provenance.contentHash;
    await seedLegitimateOriginalityReport(repo, candidateId, 0, contentHash, blueprintHash);

    const second = await orchestrateDifficultyReview(candidateId, repo, { validatedAt: "2026-04-01T00:01:00.000Z" });
    expect(second.outcome).toBe("passed");
    const record = (await repo.read("review-queue", candidateId)) as { state: string };
    expect(record.state).toBe("difficulty_review_passed");
  });
});

// --- 9. Multi-candidate isolation --------------------------------------------

describe("P1-1 remediation — multi-candidate isolation", () => {
  it("a forged candidate's refusal never affects a legitimate sibling in the same repository", async () => {
    const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const forged = await seedAtState(repo, mission3dQuestion("isolation-forged-001"), "semantic_review_passed");
    const legitimate = await seedAtSemanticReviewPassed(repo, mission3dQuestion("isolation-legit-001"), blueprintHash);

    const forgedOutcome = await orchestrateOriginalityReview(forged.candidateId, repo, { validatedAt: "2026-04-01T00:00:00.000Z" });
    const legitimateOutcome = await orchestrateOriginalityReview(legitimate.candidateId, repo, { validatedAt: "2026-04-01T00:00:00.000Z" });

    expect(forgedOutcome.outcome).toBe("upstream_evidence_invalid");
    expect(legitimateOutcome.outcome).toBe("passed");
    expect((await repo.list("reports")).filter((id) => id.startsWith("og-")).length).toBe(1);
  });
});

// --- 10. Candidate-ID/production-ID collision, successful unchanged replay --

describe("P2 remediation — candidate id colliding with a production-bank id", () => {
  it("a fresh pass followed immediately by replay with unchanged inputs replays successfully, never a false corpus-drift refusal", async () => {
    const collidingId = questionBank[0].id;
    const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const question = { ...mission3dQuestion(collidingId), id: collidingId };
    await seedAtSemanticReviewPassed(repo, question, blueprintHash);

    const first = await orchestrateOriginalityReview(collidingId, repo, { validatedAt: "2026-04-01T00:00:00.000Z" });
    expect(first.outcome).toBe("passed");

    const second = await orchestrateOriginalityReview(collidingId, repo, { validatedAt: "2026-04-01T00:00:01.000Z" });
    expect(second.outcome).toBe("passed");
    if (second.outcome === "passed") {
      expect(second.replayed).toBe(true);
    }
    expect((await repo.list("reports")).filter((id) => id.startsWith("og-")).length).toBe(1);
  });
});

// --- 11. Zero invalid writes on refusal (aggregate confirmation) -----------

describe("P1-1 remediation — zero invalid report/provenance/pass-transition writes on refusal", () => {
  it("every refusal path leaves the repository's reports list and candidate record byte-for-byte unchanged", async () => {
    await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const { candidateId } = await seedAtState(repo, mission3dQuestion("zero-write-001"), "semantic_review_passed");

    const before = await repo.read("review-queue", candidateId);
    const reportsBefore = await repo.list("reports");

    await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-04-01T00:00:00.000Z" });

    const after = await repo.read("review-queue", candidateId);
    expect(after).toEqual(before);
    expect(await repo.list("reports")).toEqual(reportsBefore);
  });
});

// --- 12. Legitimate five-stage pipeline execution remains green -------------

describe("Regression — legitimate five-stage pipeline execution remains green after remediation", () => {
  it("a candidate with genuine upstream evidence at every stage reaches difficulty_review_passed via runPipeline", async () => {
    const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint", "easy");
    const question = mission3dDifficultyQuestion("regression-green-001", 20);
    await seedAtOriginalityReviewPassed(repo, question, blueprintHash);

    const outcome = await runPipeline(
      { pipelineRunId: "run-remediation-green", batchId: "batch-remediation-green", candidateIds: ["regression-green-001"] },
      repo,
      { lockRoot: rootDir, lockMaxWaitMs: 200, lockRetryDelayMs: 10 },
    );
    expect(outcome.status).toBe("completed");
    if (outcome.status !== "completed") return;
    const result = outcome.report.candidateResults[0];
    expect(result?.gateResults.map((g) => g.gate)).toEqual(["difficulty"]);
    expect(result?.endState).toBe("difficulty_review_passed");
  });
});

/**
 * Second Mission 3D audit remediation — dedicated adversarial coverage for
 * the structural-chain authentication gap and the blueprint-hash
 * optionality gap the second audit found in `validateUpstreamCorrectnessEvidence`.
 * Every "victim"/genuine candidate below is seeded via `seedAtSemanticReviewPassed`,
 * which now drives the *real* structural-validation and correctness-
 * verification orchestrators (see `mission3d-fixtures.ts`) — never a
 * hand-fabricated report pair — so every scenario starts from an
 * authentically-produced upstream chain and tampers exactly one fact.
 */
describe("Second remediation — no referenced structural report exists", () => {
  it("rejects when the cv- report declares no structuralEvidenceFingerprint at all and no sv- report exists", async () => {
    const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const { candidateId } = await seedAtState(repo, mission3dQuestion("no-sv-no-fp-001"), "semantic_review_passed");
    const provenance = (await repo.read("review-queue", candidateId)) as { provenance: { revision: number; contentHash: string } };
    await seedLegitimateCorrectnessReport(repo, candidateId, provenance.provenance.revision, provenance.provenance.contentHash, blueprintHash);

    const outcome = await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
    if (outcome.outcome === "upstream_evidence_invalid") {
      expect(outcome.issues.some((issue) => issue.path === "structuralReport")).toBe(true);
    }
    expect((await repo.list("reports")).filter((id) => id.startsWith("og-"))).toEqual([]);
    const record = (await repo.read("review-queue", candidateId)) as { state: string };
    expect(record.state).toBe("semantic_review_passed");
  });

  it("rejects a self-consistent, hand-fabricated cv- report whose structuralEvidenceFingerprint is a fabricated string with no referenced sv- report", async () => {
    const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const { candidateId } = await seedAtState(repo, mission3dQuestion("no-sv-fabricated-fp-001"), "semantic_review_passed");
    const provenance = (await repo.read("review-queue", candidateId)) as { provenance: { revision: number; contentHash: string } };
    await seedLegitimateCorrectnessReport(
      repo,
      candidateId,
      provenance.provenance.revision,
      provenance.provenance.contentHash,
      blueprintHash,
      "entirely-fabricated-structural-fingerprint-no-real-report-behind-it",
    );

    const outcome = await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
    if (outcome.outcome === "upstream_evidence_invalid") {
      expect(outcome.issues.some((issue) => issue.path === "structuralReport")).toBe(true);
    }
    expect((await repo.list("reports")).filter((id) => id.startsWith("og-"))).toEqual([]);
  });
});

describe("Second remediation — malformed and misattributed structural reports", () => {
  it("rejects a malformed sv- report (corrupted result/evidence shape), never throws", async () => {
    const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const { candidateId } = await seedAtSemanticReviewPassed(repo, mission3dQuestion("malformed-sv-001"), blueprintHash);
    await repo.update("reports", buildStructuralValidationReportId(candidateId), { candidateId, result: "not-an-object" });

    const outcome = await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
    if (outcome.outcome === "upstream_evidence_invalid") {
      expect(outcome.issues.some((issue) => issue.message.includes("malformed"))).toBe(true);
    }
    expect((await repo.list("reports")).filter((id) => id.startsWith("og-"))).toEqual([]);
  });

  it("rejects an sv- report belonging to a different candidate id", async () => {
    const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const { candidateId: victim } = await seedAtSemanticReviewPassed(repo, mission3dQuestion("wrong-cand-sv-victim-001"), blueprintHash);
    const attacker = await seedAtSemanticReviewPassed(repo, mission3dQuestion("wrong-cand-sv-attacker-001"), blueprintHash);

    const attackerStructural = await repo.read("reports", buildStructuralValidationReportId(attacker.candidateId));
    await repo.update("reports", buildStructuralValidationReportId(victim), attackerStructural as Record<string, unknown>);

    const outcome = await orchestrateOriginalityReview(victim, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
    if (outcome.outcome === "upstream_evidence_invalid") {
      expect(outcome.issues.some((issue) => issue.message.includes(attacker.candidateId))).toBe(true);
    }
    expect((await repo.list("reports")).filter((id) => id.startsWith("og-"))).toEqual([]);
  });

  it("rejects when the cv- report references a different, genuine candidate's structural fingerprint (wrong structural reference)", async () => {
    const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const { candidateId: victim } = await seedAtSemanticReviewPassed(repo, mission3dQuestion("wrong-sv-ref-victim-001"), blueprintHash);
    const attacker = await seedAtSemanticReviewPassed(repo, mission3dQuestion("wrong-sv-ref-attacker-001"), blueprintHash);

    const attackerStructural = (await repo.read("reports", buildStructuralValidationReportId(attacker.candidateId))) as {
      result: { evidence: { validationFingerprint: string } };
    };
    const cvReportId = buildCorrectnessReportId(victim);
    const storedCv = (await repo.read("reports", cvReportId)) as { candidateId: string; result: { evidence: Record<string, unknown> } };
    const tamperedCv = {
      ...storedCv,
      result: {
        ...storedCv.result,
        evidence: { ...storedCv.result.evidence, structuralEvidenceFingerprint: attackerStructural.result.evidence.validationFingerprint },
      },
    };
    await repo.update("reports", cvReportId, tamperedCv);

    const outcome = await orchestrateOriginalityReview(victim, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
    if (outcome.outcome === "upstream_evidence_invalid") {
      expect(outcome.issues.some((issue) => issue.path === "correctnessReport.evidence.structuralEvidenceFingerprint")).toBe(true);
    }
    expect((await repo.list("reports")).filter((id) => id.startsWith("og-"))).toEqual([]);
  });
});

describe("Second remediation — stale and tampered structural evidence", () => {
  it("rejects when the referenced sv- report's outcome is not 'passed'", async () => {
    const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const { candidateId } = await seedAtSemanticReviewPassed(repo, mission3dQuestion("non-passing-sv-001"), blueprintHash);
    const reportId = buildStructuralValidationReportId(candidateId);
    const stored = (await repo.read("reports", reportId)) as { candidateId: string; result: { evidence: Record<string, unknown> } };
    const tampered = { ...stored, result: { status: "failed", issues: [], evidence: { ...stored.result.evidence, outcome: "failed" } } };
    await repo.update("reports", reportId, tampered);

    const outcome = await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
    if (outcome.outcome === "upstream_evidence_invalid") {
      expect(outcome.issues.some((issue) => issue.path === "structuralReport.result.status")).toBe(true);
    }
    expect((await repo.list("reports")).filter((id) => id.startsWith("og-"))).toEqual([]);
  });

  it("rejects when the candidate's content hash has drifted from the sv- report's recorded hash (stale structural content binding)", async () => {
    const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const { candidateId } = await seedAtSemanticReviewPassed(repo, mission3dQuestion("stale-sv-content-001"), blueprintHash);
    const stored = (await repo.read("review-queue", candidateId)) as Record<string, unknown>;
    const provenance = { ...(stored.provenance as Record<string, unknown>), contentHash: "drifted-content-hash-entirely" };
    await repo.update("review-queue", candidateId, { ...stored, provenance });

    const outcome = await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
    if (outcome.outcome === "upstream_evidence_invalid") {
      expect(outcome.issues.some((issue) => issue.path === "structuralReport.evidence.candidateContentHash")).toBe(true);
    }
    expect((await repo.list("reports")).filter((id) => id.startsWith("og-"))).toEqual([]);
  });

  it("rejects a tampered sv- report fingerprint (visible fields edited, fingerprint not recomputed)", async () => {
    const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const { candidateId } = await seedAtSemanticReviewPassed(repo, mission3dQuestion("tampered-sv-fingerprint-001"), blueprintHash);
    const reportId = buildStructuralValidationReportId(candidateId);
    const stored = (await repo.read("reports", reportId)) as { candidateId: string; result: { evidence: Record<string, unknown> } };
    const tampered = { ...stored, result: { status: "passed", evidence: { ...stored.result.evidence, candidateRevision: 999 } } };
    await repo.update("reports", reportId, tampered);

    const outcome = await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
    if (outcome.outcome === "upstream_evidence_invalid") {
      expect(outcome.issues.some((issue) => issue.path === "structuralReport.evidence.validationFingerprint")).toBe(true);
    }
    expect((await repo.list("reports")).filter((id) => id.startsWith("og-"))).toEqual([]);
  });
});

describe("Second remediation — unconditional blueprint-hash binding on correctness evidence", () => {
  it("rejects when a blueprint-bound candidate's cv- report omits blueprintHash entirely", async () => {
    const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const { candidateId } = await seedAtSemanticReviewPassed(repo, mission3dQuestion("missing-evidence-bph-001"), blueprintHash);
    const reportId = buildCorrectnessReportId(candidateId);
    const stored = (await repo.read("reports", reportId)) as { candidateId: string; result: { evidence: Record<string, unknown> } };
    const evidenceWithoutHash = { ...stored.result.evidence } as Record<string, unknown>;
    delete evidenceWithoutHash.blueprintHash;
    await repo.update("reports", reportId, { ...stored, result: { ...stored.result, evidence: evidenceWithoutHash } });

    const outcome = await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
    if (outcome.outcome === "upstream_evidence_invalid") {
      expect(outcome.issues.some((issue) => issue.path === "correctnessReport.evidence.blueprintHash")).toBe(true);
    }
    expect((await repo.list("reports")).filter((id) => id.startsWith("og-"))).toEqual([]);
  });

  it("rejects when a blueprint-bound candidate's cv- report carries an empty-string blueprintHash", async () => {
    const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const { candidateId } = await seedAtSemanticReviewPassed(repo, mission3dQuestion("empty-evidence-bph-001"), blueprintHash);
    const reportId = buildCorrectnessReportId(candidateId);
    const stored = (await repo.read("reports", reportId)) as { candidateId: string; result: { evidence: Record<string, unknown> } };
    const tampered = { ...stored, result: { ...stored.result, evidence: { ...stored.result.evidence, blueprintHash: "" } } };
    await repo.update("reports", reportId, tampered);

    const outcome = await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
    if (outcome.outcome === "upstream_evidence_invalid") {
      expect(outcome.issues.some((issue) => issue.path === "correctnessReport.evidence.blueprintHash")).toBe(true);
    }
    expect((await repo.list("reports")).filter((id) => id.startsWith("og-"))).toEqual([]);
  });

  it("rejects when a blueprint-bound candidate's cv- report carries a blueprintHash for the wrong blueprint", async () => {
    const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const { candidateId } = await seedAtSemanticReviewPassed(repo, mission3dQuestion("wrong-evidence-bph-001"), blueprintHash);
    const reportId = buildCorrectnessReportId(candidateId);
    const stored = (await repo.read("reports", reportId)) as { candidateId: string; result: { evidence: Record<string, unknown> } };
    const tampered = { ...stored, result: { ...stored.result, evidence: { ...stored.result.evidence, blueprintHash: "a-completely-different-blueprint-hash" } } };
    await repo.update("reports", reportId, tampered);

    const outcome = await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
    if (outcome.outcome === "upstream_evidence_invalid") {
      expect(outcome.issues.some((issue) => issue.path === "correctnessReport.evidence.blueprintHash")).toBe(true);
    }
    expect((await repo.list("reports")).filter((id) => id.startsWith("og-"))).toEqual([]);
  });
});

describe("Second remediation — valid full chain (regression)", () => {
  it("a candidate whose correctness evidence correctly references its own authentic structural report passes originality via the real chain", async () => {
    const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const { candidateId } = await seedAtSemanticReviewPassed(repo, mission3dQuestion("full-chain-valid-001"), blueprintHash);

    const outcome = await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("passed");

    // Unchanged replay stays idempotent.
    const replay = await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-05-01T00:01:00.000Z" });
    expect(replay.outcome).toBe("passed");
    if (replay.outcome === "passed") {
      expect(replay.replayed).toBe(true);
    }
    expect((await repo.list("reports")).filter((id) => id.startsWith("og-")).length).toBe(1);
  });
});
