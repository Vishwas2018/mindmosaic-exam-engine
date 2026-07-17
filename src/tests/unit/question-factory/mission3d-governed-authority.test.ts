import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  buildCorrectnessAttestationId,
  buildCorrectnessReportId,
  computeCorrectnessAttestationFingerprint,
  CORRECTNESS_SCORER_VERSION,
  CORRECTNESS_VERIFIER_VERSION,
  orchestrateCorrectnessVerification,
} from "@/features/question-factory/correctness";
import { writeCorrectnessAttestation } from "@/features/question-factory/correctness/governed-attestation-writer";
import { FACTORY_VERSIONS } from "@/features/question-factory/config";
import { orchestrateOriginalityReview } from "@/features/question-factory/originality";
import { runPipeline } from "@/features/question-factory/pipeline";
import { hashJson } from "@/features/question-factory/provenance";
import { attemptSemanticReviewTransition, buildSemanticCompletionReportId, computeSemanticCompletionFingerprint } from "@/features/question-factory/review";
import { writeSemanticCompletionEvidence } from "@/features/question-factory/review/governed-semantic-evidence-writer";
import type { CreateResult, FactoryCompartment, FactoryRepository } from "@/features/question-factory/storage";
import { FsFactoryRepository } from "@/features/question-factory/storage";
import { orchestrateStructuralValidation } from "@/features/question-factory/validation";

import {
  ensureMission3dBlueprintSeeded,
  mission3dQuestion,
  seedAtSemanticReviewPassedViaIndependentReview,
  seedAtState,
  seedGenerated,
  seedLegitimateCorrectnessReport,
  seedLegitimateStructuralReport,
} from "./mission3d-fixtures";

/**
 * Mission 3D governed-authority remediation — dedicated coverage for the
 * repository capability boundary: `cva-*`/`sr-*` are reserved trusted
 * report families that only the governed correctness/semantic
 * orchestrators can persist, never generic `repository.create()`, a
 * fixture helper, or any public barrel export. Run against a real
 * `FsFactoryRepository` throughout, matching every prior Mission 3D
 * remediation's own convention.
 */
let rootDir: string;
let repo: FsFactoryRepository;

beforeEach(async () => {
  rootDir = await mkdtemp(path.join(tmpdir(), "mission3d-governed-authority-"));
  repo = new FsFactoryRepository(rootDir);
});

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true });
});

function lockOptions(): { readonly lockRoot: string; readonly lockMaxWaitMs: number; readonly lockRetryDelayMs: number } {
  return { lockRoot: rootDir, lockMaxWaitMs: 200, lockRetryDelayMs: 10 };
}

async function countReportsWithPrefix(prefix: string): Promise<number> {
  return (await repo.list("reports")).filter((id) => id.startsWith(prefix)).length;
}

// --- 1/2. Generic create() refuses both trusted families --------------------

describe("governed-authority — generic repository.create() refuses reserved families", () => {
  it("1. refuses a cva-* id with no capability", async () => {
    const result = await repo.create("reports", "cva-0000000000000000000000000000000000000a", { fake: true });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("trusted_family_reserved");
  });

  it("2. refuses an sr-* id with no capability", async () => {
    const result = await repo.create("reports", "sr-0000000000000000000000000000000000000a", { fake: true });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("trusted_family_reserved");
  });

  it("refuses even a well-formed capability-shaped object obtained via a type assertion (never actually issued)", async () => {
    const forgedCapability = { reportFamily: "cva-" } as unknown as Parameters<FactoryRepository["create"]>[3];
    const result = await repo.create("reports", "cva-0000000000000000000000000000000000000b", { fake: true }, forgedCapability);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("trusted_family_reserved");
  });
});

// --- 3. Exported/public APIs cannot obtain the governed evidence capability -

describe("governed-authority — the capability and its writers are unreachable through any public barrel", () => {
  it("correctness/index.ts exports neither the builder, the writer, nor any capability primitive", async () => {
    const barrel: Record<string, unknown> = await import("@/features/question-factory/correctness");
    expect("buildCorrectnessAttestation" in barrel).toBe(false);
    expect("writeCorrectnessAttestation" in barrel).toBe(false);
    expect("GovernedWriteCapability" in barrel).toBe(false);
    expect("CorrectnessAttestationInput" in barrel).toBe(false);
  });

  it("review/index.ts exports neither the builder, the writer, nor any capability primitive", async () => {
    const barrel: Record<string, unknown> = await import("@/features/question-factory/review");
    expect("buildSemanticCompletionEvidence" in barrel).toBe(false);
    expect("writeSemanticCompletionEvidence" in barrel).toBe(false);
    expect("GovernedWriteCapability" in barrel).toBe(false);
    expect("SemanticCompletionEvidenceInput" in barrel).toBe(false);
  });

  it("storage/index.ts exports neither the capability class nor its issuance", async () => {
    const barrel: Record<string, unknown> = await import("@/features/question-factory/storage");
    expect("GovernedWriteCapability" in barrel).toBe(false);
    expect("issueGovernedWriteCapability" in barrel).toBe(false);
    expect("isValidGovernedWriteCapability" in barrel).toBe(false);
  });

  it("originality/index.ts exports neither builder", async () => {
    const barrel: Record<string, unknown> = await import("@/features/question-factory/originality");
    expect("buildCorrectnessAttestation" in barrel).toBe(false);
    expect("buildSemanticCompletionEvidence" in barrel).toBe(false);
  });

  it("mission3d-fixtures.ts no longer exports any helper that can mint trusted evidence directly (fixture helpers cannot mint trusted success evidence)", async () => {
    const fixtures: Record<string, unknown> = await import("./mission3d-fixtures");
    expect("seedLegitimateCorrectnessAttestation" in fixtures).toBe(false);
    expect("seedLegitimateSemanticCompletionEvidence" in fixtures).toBe(false);
  });
});

// --- 4. Complete self-consistent forged chain cannot be persisted -----------

describe("governed-authority — a complete, self-consistent forged chain is still refused", () => {
  it("a hand-crafted, internally-fingerprint-consistent cv-*/cva-*/sr-* trio cannot be persisted through any supported API", async () => {
    const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const question = mission3dQuestion("forged-full-chain-001");
    const { candidateId } = await seedAtState(repo, question, "semantic_review_passed");
    const stored = (await repo.read("review-queue", candidateId)) as Record<string, unknown>;
    const provenance = stored.provenance as Record<string, unknown>;
    const contentHash = provenance.contentHash as string;

    // sv-*/cv-* are not reserved families — a forger can still plant these
    // (already covered by the second/third remediations' own adversarial
    // coverage), self-consistently, via the real evidence builders.
    const structuralFingerprint = await seedLegitimateStructuralReport(repo, candidateId, 0, contentHash, blueprintHash);
    const correctnessReportFingerprint = await seedLegitimateCorrectnessReport(
      repo,
      candidateId,
      0,
      contentHash,
      blueprintHash,
      structuralFingerprint,
    );

    // cva-* — hand-crafted with a correctly recomputed fingerprint (a
    // forger who reads evidence.ts can always do this much), refused
    // purely by the capability gate, never reaching a fingerprint check.
    const attestationFacts = {
      candidateId,
      candidateRevision: 0,
      candidateContentHash: contentHash,
      blueprintHash,
      structuralEvidenceFingerprint: structuralFingerprint,
      correctnessOutcome: "passed" as const,
      correctnessCapability: "deterministically_verifiable" as const,
      correctnessReportFingerprint,
      verifierVersion: CORRECTNESS_VERIFIER_VERSION,
      scorerVersion: CORRECTNESS_SCORER_VERSION,
      schemaVersion: FACTORY_VERSIONS.SCHEMA_VERSION,
      taxonomyVersion: FACTORY_VERSIONS.TAXONOMY_VERSION,
    };
    const forgedAttestation = {
      ...attestationFacts,
      attestedAt: "2026-05-01T00:00:00.000Z",
      attestationFingerprint: computeCorrectnessAttestationFingerprint(attestationFacts),
    };
    const attestationCreate = await repo.create("reports", buildCorrectnessAttestationId(candidateId), forgedAttestation);
    expect(attestationCreate.ok).toBe(false);
    if (!attestationCreate.ok) expect(attestationCreate.reason).toBe("trusted_family_reserved");

    // sr-* — same story.
    const semanticFacts = {
      candidateId,
      candidateRevision: 0,
      candidateContentHash: contentHash,
      blueprintHash,
      semanticClassification: "deterministically_computable" as const,
      completionPath: "deterministic_skip" as const,
    };
    const forgedEvidence = {
      ...semanticFacts,
      completedAt: "2026-05-01T00:00:00.000Z",
      semanticCompletionFingerprint: computeSemanticCompletionFingerprint(semanticFacts),
    };
    const evidenceCreate = await repo.create("reports", buildSemanticCompletionReportId(candidateId), forgedEvidence);
    expect(evidenceCreate.ok).toBe(false);
    if (!evidenceCreate.ok) expect(evidenceCreate.reason).toBe("trusted_family_reserved");

    expect(await repo.exists("reports", buildCorrectnessAttestationId(candidateId))).toBe(false);
    expect(await repo.exists("reports", buildSemanticCompletionReportId(candidateId))).toBe(false);

    const outcome = await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-05-01T00:00:01.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
  });
});

// --- 5/6. Direct writes/lifecycle manipulation never mint trusted evidence --

describe("governed-authority — bypassing the orchestrator never mints trusted evidence as a side effect", () => {
  it("5. directly creating a cv-* report (bypassing orchestrateCorrectnessVerification) does not mint a cva-* attestation", async () => {
    const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const { candidateId } = await seedGenerated(repo, mission3dQuestion("direct-cv-no-attestation-001"));
    const structural = await orchestrateStructuralValidation(candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(structural.outcome).toBe("passed");
    const stored = (await repo.read("review-queue", candidateId)) as Record<string, unknown>;
    const provenance = stored.provenance as Record<string, unknown>;
    await seedLegitimateCorrectnessReport(
      repo,
      candidateId,
      provenance.revision as number,
      provenance.contentHash as string,
      blueprintHash,
      structural.outcome === "passed" ? structural.evidence.validationFingerprint : undefined,
    );
    expect(await repo.exists("reports", buildCorrectnessReportId(candidateId))).toBe(true);
    expect(await repo.exists("reports", buildCorrectnessAttestationId(candidateId))).toBe(false);
  });

  it("6. directly forcing lifecycle state to semantic_review_passed (bypassing attemptSemanticReviewTransition) does not mint an sr-* record", async () => {
    await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const { candidateId } = await seedGenerated(repo, mission3dQuestion("direct-state-no-evidence-001"));
    const structural = await orchestrateStructuralValidation(candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(structural.outcome).toBe("passed");
    const correctness = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-05-01T00:00:01.000Z" });
    expect(correctness.outcome).toBe("passed");

    const stored = (await repo.read("review-queue", candidateId)) as Record<string, unknown>;
    const updateResult = await repo.update("review-queue", candidateId, { ...stored, state: "semantic_review_passed" }, {
      expectedContentHash: hashJson(stored),
    });
    expect(updateResult.ok).toBe(true);
    expect(await repo.exists("reports", buildSemanticCompletionReportId(candidateId))).toBe(false);
  });
});

// --- 8/9/10. Real orchestration mints exactly one canonical record ---------

describe("governed-authority — real orchestration mints exactly one canonical record", () => {
  it("8. real correctness orchestration creates exactly one canonical cva-* attestation", async () => {
    await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const { candidateId } = await seedGenerated(repo, mission3dQuestion("canonical-attestation-001"));
    const structural = await orchestrateStructuralValidation(candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(structural.outcome).toBe("passed");
    const correctness = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-05-01T00:00:01.000Z" });
    expect(correctness.outcome).toBe("passed");
    expect(await countReportsWithPrefix("cva-")).toBe(1);
  });

  it("9. real deterministic semantic orchestration creates exactly one canonical sr-* record (deterministic_skip)", async () => {
    await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const { candidateId } = await seedGenerated(repo, mission3dQuestion("canonical-sr-deterministic-001"));
    const structural = await orchestrateStructuralValidation(candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(structural.outcome).toBe("passed");
    const correctness = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-05-01T00:00:01.000Z" });
    expect(correctness.outcome).toBe("passed");
    const semantic = await attemptSemanticReviewTransition(candidateId, repo);
    expect(semantic.outcome).toBe("passed");
    expect(await countReportsWithPrefix("sr-")).toBe(1);
    const evidence = await repo.read("reports", buildSemanticCompletionReportId(candidateId));
    expect((evidence as { completionPath: string }).completionPath).toBe("deterministic_skip");
  });

  it("10. real independent-review semantic orchestration creates exactly one canonical sr-* record (independent_review)", async () => {
    const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const question = {
      id: "canonical-sr-independent-001",
      type: "short_answer",
      yearLevel: 3,
      examStyle: "naplan_style",
      prompt: "What is the main idea of the passage?",
      options: [],
      visuals: [],
      answerKey: { kind: "text", acceptableAnswers: ["friendship"], caseSensitive: false, trimWhitespace: true },
      explanation: "The passage centres on friendship.",
      metadata: { subject: "numeracy", strand: "Number", skill: "num.addition.two-digit", difficulty: "easy", marks: 1, estimatedTimeSeconds: 60, tags: [] },
    };
    const { candidateId } = await seedAtSemanticReviewPassedViaIndependentReview(repo, question, blueprintHash);
    expect(await countReportsWithPrefix("sr-")).toBe(1);
    const evidence = await repo.read("reports", buildSemanticCompletionReportId(candidateId));
    expect((evidence as { completionPath: string }).completionPath).toBe("independent_review");
  });
});

// --- 11. Crash/retry and cached replay still converge -----------------------

describe("governed-authority — crash/retry and cached replay still converge under the capability boundary", () => {
  function buildCreateFailingForIdPrefix(realRepo: FactoryRepository, prefix: string): FactoryRepository {
    let failed = false;
    return {
      create: async (compartment: FactoryCompartment, id: string, data: unknown, capability?: Parameters<FactoryRepository["create"]>[3]): Promise<CreateResult> => {
        if (!failed && compartment === "reports" && id.startsWith(prefix)) {
          failed = true;
          return { ok: false, candidateId: id, compartment, reason: "duplicate_candidate", message: `simulated crash before durably writing '${id}'` };
        }
        return realRepo.create(compartment, id, data, capability);
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

  it("crash before cva-* durably lands still converges to exactly one attestation on retry", async () => {
    await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const { candidateId } = await seedGenerated(repo, mission3dQuestion("governed-crash-retry-001"));
    const structural = await orchestrateStructuralValidation(candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(structural.outcome).toBe("passed");

    const flaky = buildCreateFailingForIdPrefix(repo, "cva-");
    const first = await orchestrateCorrectnessVerification(candidateId, flaky, { verifiedAt: "2026-05-01T00:00:01.000Z" });
    expect(first.outcome).toBe("repository_error");
    expect(await countReportsWithPrefix("cva-")).toBe(0);

    const retry = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-05-01T00:00:02.000Z" });
    expect(retry.outcome).toBe("passed");
    expect(await countReportsWithPrefix("cv-")).toBe(1);
    expect(await countReportsWithPrefix("cva-")).toBe(1);
  });

  it("cached correctness replay remains valid — a second orchestrateCorrectnessVerification call is a zero-write replay", async () => {
    await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const { candidateId } = await seedGenerated(repo, mission3dQuestion("governed-cached-replay-001"));
    const structural = await orchestrateStructuralValidation(candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(structural.outcome).toBe("passed");
    const first = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-05-01T00:00:01.000Z" });
    expect(first.outcome).toBe("passed");
    const reportsAfterFirst = await repo.list("reports");

    const second = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-05-01T00:00:02.000Z" });
    expect(second.outcome).toBe("passed");
    if (second.outcome === "passed") expect(second.replayed).toBe(true);
    expect(await repo.list("reports")).toEqual(reportsAfterFirst);
  });
});

// --- 12. Conflicting trusted records fail closed -----------------------------

describe("governed-authority — conflicting trusted records fail closed", () => {
  it("the governed writer refuses a conflicting re-mint even when called again with a genuinely different input", async () => {
    await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const { candidateId } = await seedGenerated(repo, mission3dQuestion("governed-conflict-001"));
    const structural = await orchestrateStructuralValidation(candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(structural.outcome).toBe("passed");
    const correctness = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-05-01T00:00:01.000Z" });
    expect(correctness.outcome).toBe("passed");
    if (correctness.outcome !== "passed") return;

    const conflicting = await writeCorrectnessAttestation(repo, {
      candidateId,
      candidateRevision: correctness.evidence.candidateRevision,
      candidateContentHash: "a-conflicting-content-hash",
      blueprintHash: correctness.evidence.blueprintHash as string,
      structuralEvidenceFingerprint: correctness.evidence.structuralEvidenceFingerprint as string,
      correctnessOutcome: "passed",
      correctnessCapability: "deterministically_verifiable",
      correctnessReportFingerprint: correctness.evidence.verificationFingerprint,
      attestedAt: "2026-05-01T00:00:02.000Z",
    });
    expect(conflicting.ok).toBe(false);

    const semantic = await attemptSemanticReviewTransition(candidateId, repo);
    expect(semantic.outcome).toBe("passed");
    const conflictingEvidence = await writeSemanticCompletionEvidence(repo, {
      candidateId,
      candidateRevision: correctness.evidence.candidateRevision,
      candidateContentHash: "a-different-conflicting-content-hash",
      blueprintHash: correctness.evidence.blueprintHash as string,
      semanticClassification: "deterministically_computable",
      completionPath: "deterministic_skip",
      completedAt: "2026-05-01T00:00:03.000Z",
    });
    expect(conflictingEvidence.ok).toBe(false);

    expect(await countReportsWithPrefix("cva-")).toBe(1);
    expect(await countReportsWithPrefix("sr-")).toBe(1);
  });
});

// --- 13. Originality refusal remains zero-write ------------------------------

describe("governed-authority — originality refusal remains zero-write", () => {
  it("a refusal caused by a capability-blocked (never-persisted) attestation performs zero writes", async () => {
    const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const { candidateId } = await seedAtState(repo, mission3dQuestion("governed-zero-write-001"), "semantic_review_passed");
    const stored = (await repo.read("review-queue", candidateId)) as Record<string, unknown>;
    const provenance = stored.provenance as Record<string, unknown>;
    const structuralFingerprint = await seedLegitimateStructuralReport(repo, candidateId, 0, provenance.contentHash as string, blueprintHash);
    await seedLegitimateCorrectnessReport(repo, candidateId, 0, provenance.contentHash as string, blueprintHash, structuralFingerprint);

    const reportsBefore = await repo.list("reports");
    const stateBefore = ((await repo.read("review-queue", candidateId)) as { state: string }).state;

    const outcome = await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");

    expect(await repo.list("reports")).toEqual(reportsBefore);
    expect(((await repo.read("review-queue", candidateId)) as { state: string }).state).toBe(stateBefore);
    expect(await repo.exists("rejected/originality", candidateId)).toBe(false);
    expect(await repo.exists("quarantined", candidateId)).toBe(false);
  });
});

// --- 14. Valid five-stage completion still reaches difficulty_review_passed -

describe("governed-authority — valid five-stage completion still reaches difficulty_review_passed", () => {
  it("a fully legitimate candidate reaches difficulty_review_passed through all five real gates under the new capability boundary", async () => {
    await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const { candidateId } = await seedGenerated(repo, {
      id: "governed-five-stage-001",
      type: "number_entry",
      yearLevel: 3,
      examStyle: "naplan_style",
      prompt: "What is 7 + 5?",
      options: [],
      answerKey: { kind: "number", value: 12, tolerance: 0 },
      visuals: [],
      explanation: "7 + 5 equals 12.",
      metadata: { subject: "numeracy", strand: "Number", skill: "num.addition.two-digit", difficulty: "easy", marks: 1, estimatedTimeSeconds: 60, tags: [] },
    });

    const outcome = await runPipeline(
      { pipelineRunId: "run-governed-authority-five-stage", batchId: "batch-governed-authority", candidateIds: [candidateId] },
      repo,
      lockOptions(),
    );
    expect(outcome.status).toBe("completed");
    if (outcome.status !== "completed") return;
    const result = outcome.report.candidateResults[0];
    expect(result?.endState).toBe("difficulty_review_passed");
    expect(result?.gateResults.map((g) => g.gate)).toEqual(["structural", "correctness", "semantic", "originality", "difficulty"]);
    expect(result?.gateResults.every((g) => g.outcome === "passed")).toBe(true);

    expect(await countReportsWithPrefix("cva-")).toBe(1);
    expect(await countReportsWithPrefix("sr-")).toBe(1);
  });
});
