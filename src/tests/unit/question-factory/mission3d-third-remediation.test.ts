import { mkdtemp, rm, writeFile } from "node:fs/promises";
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
  type CorrectnessPassAttestation,
  type StoredCorrectnessVerificationReport,
} from "@/features/question-factory/correctness";
import { FACTORY_VERSIONS } from "@/features/question-factory/config";
import { writeCorrectnessAttestation } from "@/features/question-factory/correctness/governed-attestation-writer";
import { orchestrateOriginalityReview } from "@/features/question-factory/originality";
import { runPipeline } from "@/features/question-factory/pipeline";
import { hashJson } from "@/features/question-factory/provenance";
import {
  buildSemanticCompletionReportId,
  computeSemanticCompletionFingerprint,
  type SemanticCompletionEvidence,
} from "@/features/question-factory/review";
import type { CreateResult, FactoryCompartment, FactoryRepository, UpdateResult } from "@/features/question-factory/storage";
import { FsFactoryRepository } from "@/features/question-factory/storage";
import { orchestrateStructuralValidation } from "@/features/question-factory/validation";

import {
  ensureMission3dBlueprintSeeded,
  mission3dQuestion,
  seedAtSemanticReviewPassed,
  seedAtSemanticReviewPassedViaIndependentReview,
  seedAtSemanticReviewPassedWithFabricatedCorrectness,
  seedGenerated,
} from "./mission3d-fixtures";

/**
 * Mission 3D third audit remediation — dedicated adversarial and
 * regression coverage for the governed correctness-pass attestation
 * (`cva-*`) and semantic-completion evidence (`sr-*`), run against a real
 * `FsFactoryRepository` throughout (never mocks), matching the third
 * remediation's own required-scenario list.
 */
let rootDir: string;
let repo: FsFactoryRepository;

beforeEach(async () => {
  rootDir = await mkdtemp(path.join(tmpdir(), "mission3d-third-remediation-"));
  repo = new FsFactoryRepository(rootDir);
});

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true });
});

function lockOptions(): { readonly lockRoot: string; readonly lockMaxWaitMs: number; readonly lockRetryDelayMs: number } {
  return { lockRoot: rootDir, lockMaxWaitMs: 200, lockRetryDelayMs: 10 };
}

// --- Shared fixture helpers --------------------------------------------------

interface GenuineChainSeed {
  readonly candidateId: string;
  readonly revision: number;
  readonly contentHash: string;
  readonly blueprintHash: string;
  readonly structuralFingerprint: string;
  readonly correctnessReportFingerprint: string;
}

/** Drives a `mission3dQuestion` (deterministically-derivable) candidate through the real structural + correctness + semantic-review orchestrators, reaching `semantic_review_passed` with genuine `sv-*`/`cv-*`/`cva-*`/`sr-*` records — no fabrication. */
async function seedGenuineChainToSemanticReviewPassed(question: Record<string, unknown>): Promise<GenuineChainSeed> {
  const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
  const { candidateId } = await seedAtSemanticReviewPassed(repo, question, blueprintHash);
  const correctnessReport = (await repo.read("reports", buildCorrectnessReportId(candidateId))) as StoredCorrectnessVerificationReport;
  return {
    candidateId,
    revision: correctnessReport.result.evidence.candidateRevision,
    contentHash: correctnessReport.result.evidence.candidateContentHash,
    blueprintHash,
    structuralFingerprint: correctnessReport.result.evidence.structuralEvidenceFingerprint as string,
    correctnessReportFingerprint: correctnessReport.result.evidence.verificationFingerprint,
  };
}

/** The exact valid attestation-fingerprint facts for a `GenuineChainSeed`'s deterministic pass — the base every "wrong X" test overrides exactly one field of. */
function validAttestationFacts(seed: GenuineChainSeed) {
  return {
    candidateId: seed.candidateId,
    candidateRevision: seed.revision,
    candidateContentHash: seed.contentHash,
    blueprintHash: seed.blueprintHash,
    structuralEvidenceFingerprint: seed.structuralFingerprint,
    correctnessOutcome: "passed" as const,
    correctnessCapability: "deterministically_verifiable" as const,
    correctnessReportFingerprint: seed.correctnessReportFingerprint,
    verifierVersion: CORRECTNESS_VERIFIER_VERSION,
    scorerVersion: CORRECTNESS_SCORER_VERSION,
    schemaVersion: FACTORY_VERSIONS.SCHEMA_VERSION,
    taxonomyVersion: FACTORY_VERSIONS.TAXONOMY_VERSION,
  };
}

/**
 * Out-of-scope staging: writes/removes a `reports`-compartment file
 * directly on disk, bypassing `FsFactoryRepository` entirely.
 *
 * Mission 3D governed-authority hardening closed `update()`/`remove()`
 * for trusted-family (`cva-*`/`sr-*`) ids through the repository API
 * itself (D2/D3 — see `trusted-policy-contract.test.ts`). The adversarial
 * tests below exist to prove a *different* invariant: that
 * `originality`'s own upstream-evidence validation correctly rejects a
 * tampered or missing trusted record when it *reads* one — which
 * requires staging that tampered/missing state by some means that does
 * not go through the now-closed repository API. Direct filesystem
 * tampering is explicitly out of scope for the repository-level write
 * boundary (see the governed-authority hardening report's threat model);
 * these two helpers simulate exactly that out-of-band condition — never
 * a supported application write path — and must never be mistaken for a
 * demonstration that the repository itself still permits this.
 */
function reportFilePath(candidateOrReportId: string): string {
  return path.join(rootDir, "reports", `${candidateOrReportId}.json`);
}

async function stageRawReportWrite(reportId: string, data: unknown): Promise<void> {
  await writeFile(reportFilePath(reportId), JSON.stringify(data, null, 2), "utf8");
}

async function stageRawReportRemoval(reportId: string): Promise<void> {
  await rm(reportFilePath(reportId), { force: true });
}

/** Overwrites the candidate's already-existing `cva-*` attestation with a hand-crafted, internally-fingerprint-consistent (but factually wrong relative to the real candidate) variant. Out-of-scope staging — see above. */
async function overwriteAttestation(
  candidateId: string,
  overrides: Partial<ReturnType<typeof validAttestationFacts>>,
  seed: GenuineChainSeed,
  attestedAt = "2026-05-01T00:00:00.000Z",
): Promise<void> {
  const facts = { ...validAttestationFacts(seed), ...overrides };
  const attestation: CorrectnessPassAttestation = {
    ...facts,
    attestedAt,
    attestationFingerprint: computeCorrectnessAttestationFingerprint(facts),
  };
  await stageRawReportWrite(buildCorrectnessAttestationId(candidateId), attestation);
}

/** Overwrites the candidate's already-existing `sr-*` semantic-completion evidence with a hand-crafted, internally-fingerprint-consistent (but factually wrong) variant. Out-of-scope staging — see above. */
async function overwriteSemanticEvidence(
  candidateId: string,
  overrides: Partial<Omit<SemanticCompletionEvidence, "completedAt" | "semanticCompletionFingerprint">>,
  seed: GenuineChainSeed,
  completedAt = "2026-05-01T00:00:00.000Z",
): Promise<void> {
  const facts = {
    candidateId: seed.candidateId,
    candidateRevision: seed.revision,
    candidateContentHash: seed.contentHash,
    blueprintHash: seed.blueprintHash,
    semanticClassification: "deterministically_computable" as const,
    completionPath: "deterministic_skip" as const,
    ...overrides,
  };
  const evidence: SemanticCompletionEvidence = {
    ...facts,
    completedAt,
    semanticCompletionFingerprint: computeSemanticCompletionFingerprint(facts),
  };
  await stageRawReportWrite(buildSemanticCompletionReportId(candidateId), evidence);
}

function buildCreateFailingForIdPrefix(realRepo: FactoryRepository, prefix: string): FactoryRepository {
  let failed = false;
  return {
    create: async (compartment: FactoryCompartment, id: string, data: unknown): Promise<CreateResult> => {
      if (!failed && compartment === "reports" && id.startsWith(prefix)) {
        failed = true;
        return { ok: false, candidateId: id, compartment, reason: "duplicate_candidate", message: `simulated crash before durably writing '${id}'` };
      }
      return realRepo.create(compartment, id, data);
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

function buildUpdateFailingForCompartment(realRepo: FactoryRepository, targetCompartment: FactoryCompartment): FactoryRepository {
  let failed = false;
  return {
    create: realRepo.create.bind(realRepo),
    read: realRepo.read.bind(realRepo),
    exists: realRepo.exists.bind(realRepo),
    remove: realRepo.remove.bind(realRepo),
    list: realRepo.list.bind(realRepo),
    reconcile: realRepo.reconcile.bind(realRepo),
    move: realRepo.move.bind(realRepo),
    update: async (compartment, id, data, options): Promise<UpdateResult> => {
      if (!failed && compartment === targetCompartment) {
        failed = true;
        return { ok: false, candidateId: id, compartment, reason: "lock_timeout", message: "simulated crash before the lifecycle transition durably lands" };
      }
      return realRepo.update(compartment, id, data, options);
    },
  };
}

async function countReportsWithPrefix(prefix: string): Promise<number> {
  return (await repo.list("reports")).filter((id) => id.startsWith(prefix)).length;
}

// --- 1/2. Fabricated correctness report / copied fields, no attestation ----

describe("third remediation — correctness report present, governed attestation absent", () => {
  it("1. authentic structural evidence plus a directly fabricated correctness report (deterministic pass) is refused, zero writes", async () => {
    const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const { candidateId } = await seedAtSemanticReviewPassedWithFabricatedCorrectness(repo, mission3dQuestion("no-attest-det-001"), blueprintHash);

    const reportsBefore = await repo.list("reports");
    const outcome = await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
    if (outcome.outcome === "upstream_evidence_invalid") {
      expect(outcome.issues.some((issue) => issue.path === "attestation" && issue.message.includes("No correctness-pass attestation"))).toBe(true);
    }

    // Zero writes: no og-* report, no state change, no compartment move.
    expect(await repo.list("reports")).toEqual(reportsBefore);
    const record = (await repo.read("review-queue", candidateId)) as { state: string };
    expect(record.state).toBe("semantic_review_passed");
  });

  it("2. copied authentic correctness fields (self-consistent, requires_independent_semantic_review pass) without a matching attestation is refused", async () => {
    const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    // A genuine sv-* is planted, and a cv-* report whose fields are exactly
    // what a legitimate `requires_independent_semantic_review` pass would
    // contain (built via the real `buildCorrectnessEvidence`, fingerprint
    // recomputes correctly) — but it was never produced by
    // `orchestrateCorrectnessVerification`, so no `cva-*` attestation
    // exists to bind it. This is the second of the two attestable
    // (outcome, capability) combinations, complementing test 1's
    // deterministic pass.
    const { candidateId } = await seedAtSemanticReviewPassedWithFabricatedCorrectness(repo, mission3dQuestion("no-attest-pending-001"), blueprintHash);

    const outcome = await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
    if (outcome.outcome === "upstream_evidence_invalid") {
      expect(outcome.issues.every((issue) => issue.code === "originality_upstream_evidence_invalid")).toBe(true);
    }
    expect(await countReportsWithPrefix("og-")).toBe(0);
  });
});

// --- 3. Missing / wrong / stale / duplicate attestation ---------------------

describe("third remediation — attestation existence and conflict handling", () => {
  it("3a. missing attestation is refused with a message naming it explicitly", async () => {
    const seed = await seedGenuineChainToSemanticReviewPassed(mission3dQuestion("attest-missing-001"));
    // Out-of-scope staging (see stageRawReportRemoval above) — D3
    // hardening means repo.remove() itself now refuses this record.
    await stageRawReportRemoval(buildCorrectnessAttestationId(seed.candidateId));

    const outcome = await orchestrateOriginalityReview(seed.candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
    if (outcome.outcome === "upstream_evidence_invalid") {
      expect(outcome.issues.some((issue) => issue.message.includes("No correctness-pass attestation exists"))).toBe(true);
    }
  });

  it("3b. an attestation bound to a different candidate's cv-* report is refused (wrong report binding)", async () => {
    const victim = await seedGenuineChainToSemanticReviewPassed(mission3dQuestion("attest-wrong-report-001"));
    await overwriteAttestation(victim.candidateId, { correctnessReportFingerprint: "not-the-real-report-fingerprint" }, victim);

    const outcome = await orchestrateOriginalityReview(victim.candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
    if (outcome.outcome === "upstream_evidence_invalid") {
      expect(outcome.issues.some((issue) => issue.message.includes("does not match the stored cv-* report's own verification fingerprint"))).toBe(true);
    }
  });

  it("3c. a stale attestation (candidate content changed since minting) is refused", async () => {
    const seed = await seedGenuineChainToSemanticReviewPassed(mission3dQuestion("attest-stale-001"));
    await overwriteAttestation(seed.candidateId, { candidateContentHash: "a-stale-content-hash-entirely" }, seed);

    const outcome = await orchestrateOriginalityReview(seed.candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
  });

  it("3d. a duplicate, conflicting attestation write through generic create() is refused before any conflict logic runs (capability-gated first)", async () => {
    const seed = await seedGenuineChainToSemanticReviewPassed(mission3dQuestion("attest-duplicate-001"));
    const facts = { ...validAttestationFacts(seed), candidateContentHash: "a-completely-different-content-hash" };
    const conflicting: CorrectnessPassAttestation = {
      ...facts,
      attestedAt: "2026-05-02T00:00:00.000Z",
      attestationFingerprint: computeCorrectnessAttestationFingerprint(facts),
    };
    const createResult = await repo.create("reports", buildCorrectnessAttestationId(seed.candidateId), conflicting);
    expect(createResult.ok).toBe(false);
    if (!createResult.ok) {
      expect(createResult.reason).toBe("trusted_family_reserved");
    }
    // The original, genuine attestation is untouched.
    const stored = (await repo.read("reports", buildCorrectnessAttestationId(seed.candidateId))) as CorrectnessPassAttestation;
    expect(stored.candidateContentHash).toBe(seed.contentHash);
  });

  it("3e. the governed writer itself refuses a conflicting re-mint for the same candidate (append-only, even with a valid capability)", async () => {
    const seed = await seedGenuineChainToSemanticReviewPassed(mission3dQuestion("attest-governed-conflict-001"));
    const conflicting = await writeCorrectnessAttestation(repo, {
      ...validAttestationFacts(seed),
      candidateContentHash: "a-completely-different-content-hash",
      attestedAt: "2026-05-02T00:00:00.000Z",
    });
    expect(conflicting.ok).toBe(false);
    if (!conflicting.ok) {
      expect(conflicting.message).toContain("already exists");
    }
    const stored = (await repo.read("reports", buildCorrectnessAttestationId(seed.candidateId))) as CorrectnessPassAttestation;
    expect(stored.candidateContentHash).toBe(seed.contentHash);
  });
});

// --- 4-9. Wrong candidate / content hash / blueprint hash / structural ------
// --- fingerprint / revision / correctness version ---------------------------

describe("third remediation — attestation field-by-field binding", () => {
  it("4. wrong candidate id is refused, message names the real owner", async () => {
    const victim = await seedGenuineChainToSemanticReviewPassed(mission3dQuestion("wrong-attest-cand-victim-001"));
    const attacker = await seedGenuineChainToSemanticReviewPassed(mission3dQuestion("wrong-attest-cand-attacker-001"));
    const attackerAttestation = await repo.read("reports", buildCorrectnessAttestationId(attacker.candidateId));
    // Out-of-scope staging (see stageRawReportWrite above) — D2 hardening
    // means repo.update() itself now refuses this record unconditionally.
    await stageRawReportWrite(buildCorrectnessAttestationId(victim.candidateId), attackerAttestation);

    const outcome = await orchestrateOriginalityReview(victim.candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
    if (outcome.outcome === "upstream_evidence_invalid") {
      expect(outcome.issues.some((issue) => issue.message.includes(attacker.candidateId))).toBe(true);
    }
  });

  it("5. wrong content hash is refused", async () => {
    const seed = await seedGenuineChainToSemanticReviewPassed(mission3dQuestion("wrong-attest-hash-001"));
    await overwriteAttestation(seed.candidateId, { candidateContentHash: "definitely-the-wrong-hash" }, seed);
    const outcome = await orchestrateOriginalityReview(seed.candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
    if (outcome.outcome === "upstream_evidence_invalid") {
      expect(outcome.issues.some((issue) => issue.path === "attestation.candidateContentHash")).toBe(true);
    }
  });

  it("6. wrong blueprint hash is refused", async () => {
    const seed = await seedGenuineChainToSemanticReviewPassed(mission3dQuestion("wrong-attest-bp-001"));
    await overwriteAttestation(seed.candidateId, { blueprintHash: "definitely-the-wrong-blueprint-hash" }, seed);
    const outcome = await orchestrateOriginalityReview(seed.candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
    if (outcome.outcome === "upstream_evidence_invalid") {
      expect(outcome.issues.some((issue) => issue.path === "attestation.blueprintHash")).toBe(true);
    }
  });

  it("7. wrong structural fingerprint is refused", async () => {
    const seed = await seedGenuineChainToSemanticReviewPassed(mission3dQuestion("wrong-attest-sv-fp-001"));
    await overwriteAttestation(seed.candidateId, { structuralEvidenceFingerprint: "definitely-the-wrong-structural-fingerprint" }, seed);
    const outcome = await orchestrateOriginalityReview(seed.candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
    if (outcome.outcome === "upstream_evidence_invalid") {
      expect(outcome.issues.some((issue) => issue.path === "attestation.structuralEvidenceFingerprint")).toBe(true);
    }
  });

  it("8. wrong revision is refused", async () => {
    const seed = await seedGenuineChainToSemanticReviewPassed(mission3dQuestion("wrong-attest-rev-001"));
    await overwriteAttestation(seed.candidateId, { candidateRevision: seed.revision + 7 }, seed);
    const outcome = await orchestrateOriginalityReview(seed.candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
    if (outcome.outcome === "upstream_evidence_invalid") {
      expect(outcome.issues.some((issue) => issue.path === "attestation.candidateRevision")).toBe(true);
    }
  });

  it("9. wrong correctness algorithm/configuration version (stale verifierVersion) is refused", async () => {
    const seed = await seedGenuineChainToSemanticReviewPassed(mission3dQuestion("wrong-attest-version-001"));
    // Hand-constructed directly (never via `buildCorrectnessAttestation`,
    // which always stamps the *current* version constants) so the
    // attestation is internally fingerprint-consistent for a version
    // combination that is nonetheless no longer current.
    const facts = { ...validAttestationFacts(seed), verifierVersion: "0-no-longer-current" };
    const stale: CorrectnessPassAttestation = {
      ...facts,
      attestedAt: "2026-05-01T00:00:00.000Z",
      attestationFingerprint: computeCorrectnessAttestationFingerprint(facts),
    };
    // Out-of-scope staging (see stageRawReportWrite above) — D2 hardening
    // means repo.update() itself now refuses this record unconditionally.
    await stageRawReportWrite(buildCorrectnessAttestationId(seed.candidateId), stale);

    const outcome = await orchestrateOriginalityReview(seed.candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
    if (outcome.outcome === "upstream_evidence_invalid") {
      expect(outcome.issues.some((issue) => issue.message.includes("verifier/scorer/schema/taxonomy version"))).toBe(true);
    }
  });
});

// --- 10/11. Fabricated semantic lifecycle state / mismatched evidence -------

describe("third remediation — semantic-completion evidence authentication", () => {
  it("10. fabricated semantic_review_passed lifecycle state with no sr-* evidence at all is refused", async () => {
    const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const { candidateId } = await seedGenerated(repo, mission3dQuestion("fabricated-semantic-state-001"));
    const structural = await orchestrateStructuralValidation(candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(structural.outcome).toBe("passed");
    const correctness = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-05-01T00:00:01.000Z" });
    expect(correctness.outcome).toBe("passed");
    if (correctness.outcome !== "passed") return;
    expect(correctness.evidence.blueprintHash).toBe(blueprintHash);

    // The lifecycle state is forced directly to `semantic_review_passed`,
    // bypassing `attemptSemanticReviewTransition` entirely — no `sr-*`
    // evidence is ever minted, even though a genuine cv-*/cva-* pair
    // exists from the real correctness pass above.
    const stored = (await repo.read("review-queue", candidateId)) as Record<string, unknown>;
    const updateResult = await repo.update("review-queue", candidateId, { ...stored, state: "semantic_review_passed" }, {
      expectedContentHash: hashJson(stored),
    });
    expect(updateResult.ok).toBe(true);
    expect(await repo.exists("reports", buildSemanticCompletionReportId(candidateId))).toBe(false);

    const outcome = await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-05-01T00:00:02.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
    if (outcome.outcome === "upstream_evidence_invalid") {
      expect(outcome.issues.some((issue) => issue.message.includes("No semantic-completion evidence exists"))).toBe(true);
    }
  });

  it("11. semantic-completion evidence whose declared classification mismatches the candidate's current, freshly recomputed classification is refused", async () => {
    const seed = await seedGenuineChainToSemanticReviewPassed(mission3dQuestion("mismatched-semantic-evidence-001"));
    // `mission3dQuestion` classifies as `deterministically_computable`; the
    // stored evidence is tampered to claim `semantic_objective` (a
    // classification-vs-evidence mismatch) with a self-consistent
    // fingerprint for that false claim.
    await overwriteSemanticEvidence(seed.candidateId, { semanticClassification: "semantic_objective", completionPath: "independent_review", satisfyingReviewHash: "not-a-real-review-hash" }, seed);

    const outcome = await orchestrateOriginalityReview(seed.candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
    if (outcome.outcome === "upstream_evidence_invalid") {
      expect(outcome.issues.some((issue) => issue.path === "semanticCompletionEvidence.semanticClassification")).toBe(true);
    }
  });

  it("11b. semantic-completion evidence declaring a fabricated satisfyingReviewHash for an independent-review candidate is refused", async () => {
    const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const question = {
      id: "mismatched-review-hash-001",
      type: "short_answer",
      yearLevel: 3,
      examStyle: "naplan_style",
      prompt: "What is the main idea?",
      options: [],
      visuals: [],
      answerKey: { kind: "text", acceptableAnswers: ["friendship"], caseSensitive: false, trimWhitespace: true },
      explanation: "The passage centres on friendship.",
      metadata: { subject: "numeracy", strand: "Number", skill: "num.addition.two-digit", difficulty: "easy", marks: 1, estimatedTimeSeconds: 60, tags: [] },
    };
    const { candidateId } = await seedAtSemanticReviewPassedViaIndependentReview(repo, question, blueprintHash);
    const stored = (await repo.read("review-queue", candidateId)) as Record<string, unknown>;
    const provenance = stored.provenance as Record<string, unknown>;
    await overwriteSemanticEvidence(
      candidateId,
      { satisfyingReviewHash: "a-fabricated-review-hash-never-in-the-chain" },
      {
        candidateId,
        revision: provenance.revision as number,
        contentHash: provenance.contentHash as string,
        blueprintHash,
        structuralFingerprint: "unused",
        correctnessReportFingerprint: "unused",
      },
    );
    // Override the classification/path back to the true independent-review shape.
    await overwriteSemanticEvidence(
      candidateId,
      { semanticClassification: "semantic_objective", completionPath: "independent_review", satisfyingReviewHash: "a-fabricated-review-hash-never-in-the-chain" },
      {
        candidateId,
        revision: provenance.revision as number,
        contentHash: provenance.contentHash as string,
        blueprintHash,
        structuralFingerprint: "unused",
        correctnessReportFingerprint: "unused",
      },
    );

    const outcome = await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");
    if (outcome.outcome === "upstream_evidence_invalid") {
      expect(outcome.issues.some((issue) => issue.path === "semanticCompletionEvidence.satisfyingReviewHash")).toBe(true);
    }
  });
});

// --- 12/13/14. Valid completion paths ---------------------------------------

describe("third remediation — valid completion paths", () => {
  it("12. valid deterministic semantic completion passes originality", async () => {
    const seed = await seedGenuineChainToSemanticReviewPassed(mission3dQuestion("valid-deterministic-001"));
    const outcome = await orchestrateOriginalityReview(seed.candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("passed");
  });

  it("13. valid independent semantic-review completion passes originality", async () => {
    const blueprintHash = await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const question = {
      id: "valid-independent-review-001",
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
    const outcome = await orchestrateOriginalityReview(candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("passed");
  });

  it("14. a valid full real-orchestrator chain reaches originality_review_passed and replays idempotently on a second call", async () => {
    const seed = await seedGenuineChainToSemanticReviewPassed(mission3dQuestion("valid-full-chain-001"));
    const first = await orchestrateOriginalityReview(seed.candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(first.outcome).toBe("passed");
    const record = (await repo.read("review-queue", seed.candidateId)) as { state: string };
    expect(record.state).toBe("originality_review_passed");

    const second = await orchestrateOriginalityReview(seed.candidateId, repo, { validatedAt: "2026-05-01T00:01:00.000Z" });
    expect(second.outcome).toBe("passed");
    if (second.outcome === "passed") {
      expect(second.replayed).toBe(true);
    }
  });
});

// --- 15/16/17. Crash-safety and retry convergence ---------------------------

describe("third remediation — crash-safety and retry convergence", () => {
  it("15. crash after cv-* report write but before cva-* attestation write fails closed and converges on retry", async () => {
    await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const question = mission3dQuestion("crash-report-attest-001");
    const { candidateId } = await seedGenerated(repo, question);
    const structural = await orchestrateStructuralValidation(candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(structural.outcome).toBe("passed");

    const flakyRepo = buildCreateFailingForIdPrefix(repo, "cva-");
    const firstAttempt = await orchestrateCorrectnessVerification(candidateId, flakyRepo, { verifiedAt: "2026-05-01T00:00:01.000Z" });
    expect(firstAttempt.outcome).toBe("repository_error");

    expect(await repo.exists("reports", buildCorrectnessReportId(candidateId))).toBe(true);
    expect(await repo.exists("reports", buildCorrectnessAttestationId(candidateId))).toBe(false);
    const midState = (await repo.read("review-queue", candidateId)) as { state: string };
    expect(midState.state).toBe("structural_validation_passed");

    const retry = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-05-01T00:00:02.000Z" });
    expect(retry.outcome).toBe("passed");
    expect(await repo.exists("reports", buildCorrectnessAttestationId(candidateId))).toBe(true);
    const finalState = (await repo.read("review-queue", candidateId)) as { state: string };
    expect(finalState.state).toBe("correctness_check_passed");

    expect(await countReportsWithPrefix("cv-")).toBe(1);
    expect(await countReportsWithPrefix("cva-")).toBe(1);
  });

  it("16. crash after cva-* attestation write but before the lifecycle transition converges on retry", async () => {
    await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const question = mission3dQuestion("crash-attest-transition-001");
    const { candidateId } = await seedGenerated(repo, question);
    const structural = await orchestrateStructuralValidation(candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(structural.outcome).toBe("passed");

    const flakyRepo = buildUpdateFailingForCompartment(repo, "review-queue");
    const firstAttempt = await orchestrateCorrectnessVerification(candidateId, flakyRepo, { verifiedAt: "2026-05-01T00:00:01.000Z" });
    expect(firstAttempt.outcome).toBe("repository_error");

    expect(await repo.exists("reports", buildCorrectnessReportId(candidateId))).toBe(true);
    expect(await repo.exists("reports", buildCorrectnessAttestationId(candidateId))).toBe(true);
    const midState = (await repo.read("review-queue", candidateId)) as { state: string };
    expect(midState.state).toBe("structural_validation_passed");

    const retry = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-05-01T00:00:02.000Z" });
    expect(retry.outcome).toBe("passed");
    const finalState = (await repo.read("review-queue", candidateId)) as { state: string };
    expect(finalState.state).toBe("correctness_check_passed");

    expect(await countReportsWithPrefix("cv-")).toBe(1);
    expect(await countReportsWithPrefix("cva-")).toBe(1);
  });

  it("17. retry convergence holds regardless of which crash window was hit — exactly one canonical report and one canonical attestation either way", async () => {
    await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const question = mission3dQuestion("retry-convergence-001");
    const { candidateId } = await seedGenerated(repo, question);
    const structural = await orchestrateStructuralValidation(candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(structural.outcome).toBe("passed");

    const flakyReportRepo = buildCreateFailingForIdPrefix(repo, "cv-");
    const attempt1 = await orchestrateCorrectnessVerification(candidateId, flakyReportRepo, { verifiedAt: "2026-05-01T00:00:01.000Z" });
    expect(attempt1.outcome).toBe("repository_error");
    expect(await countReportsWithPrefix("cv-")).toBe(0);
    expect(await countReportsWithPrefix("cva-")).toBe(0);

    const flakyAttestationRepo = buildCreateFailingForIdPrefix(repo, "cva-");
    const attempt2 = await orchestrateCorrectnessVerification(candidateId, flakyAttestationRepo, { verifiedAt: "2026-05-01T00:00:02.000Z" });
    expect(attempt2.outcome).toBe("repository_error");
    expect(await countReportsWithPrefix("cv-")).toBe(1);
    expect(await countReportsWithPrefix("cva-")).toBe(0);

    const attempt3 = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-05-01T00:00:03.000Z" });
    expect(attempt3.outcome).toBe("passed");
    expect(await countReportsWithPrefix("cv-")).toBe(1);
    expect(await countReportsWithPrefix("cva-")).toBe(1);
  });
});

// --- 18. Cached correctness replay remains valid ----------------------------

describe("third remediation — cached correctness replay remains valid", () => {
  it("18. a legitimate correctness_check_passed candidate replays successfully with no additional writes", async () => {
    await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    const question = mission3dQuestion("cached-replay-valid-001");
    const { candidateId } = await seedGenerated(repo, question);
    const structural = await orchestrateStructuralValidation(candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(structural.outcome).toBe("passed");
    const first = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-05-01T00:00:01.000Z" });
    expect(first.outcome).toBe("passed");

    const reportsAfterFirst = await repo.list("reports");
    const second = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-05-01T00:00:02.000Z" });
    expect(second.outcome).toBe("passed");
    if (second.outcome === "passed") {
      expect(second.replayed).toBe(true);
    }
    expect(await repo.list("reports")).toEqual(reportsAfterFirst);
  });
});

// --- 19. Zero writes on originality refusal ---------------------------------

describe("third remediation — zero writes on originality refusal", () => {
  it("19. an upstream_evidence_invalid refusal never creates a report, never transitions, never moves the candidate", async () => {
    const seed = await seedGenuineChainToSemanticReviewPassed(mission3dQuestion("zero-writes-001"));
    // Out-of-scope staging (see stageRawReportRemoval above) — D3
    // hardening means repo.remove() itself now refuses this record.
    await stageRawReportRemoval(buildCorrectnessAttestationId(seed.candidateId));

    const reportsBefore = await repo.list("reports");
    const stateBefore = ((await repo.read("review-queue", seed.candidateId)) as { state: string }).state;

    const outcome = await orchestrateOriginalityReview(seed.candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(outcome.outcome).toBe("upstream_evidence_invalid");

    expect(await repo.list("reports")).toEqual(reportsBefore);
    const stateAfter = ((await repo.read("review-queue", seed.candidateId)) as { state: string }).state;
    expect(stateAfter).toBe(stateBefore);
    expect(await repo.exists("rejected/originality", seed.candidateId)).toBe(false);
    expect(await repo.exists("quarantined", seed.candidateId)).toBe(false);
  });
});

// --- 20. Multi-candidate isolation ------------------------------------------

describe("third remediation — multi-candidate isolation", () => {
  it("20. swapping one candidate's attestation onto another's key is refused for the victim and never affects the swapped-from candidate", async () => {
    const candidateA = await seedGenuineChainToSemanticReviewPassed(mission3dQuestion("isolation-a-001"));
    const candidateB = await seedGenuineChainToSemanticReviewPassed(mission3dQuestion("isolation-b-001"));

    const attestationA = await repo.read("reports", buildCorrectnessAttestationId(candidateA.candidateId));
    // Out-of-scope staging (see stageRawReportWrite above) — D2 hardening
    // means repo.update() itself now refuses this record unconditionally.
    await stageRawReportWrite(buildCorrectnessAttestationId(candidateB.candidateId), attestationA);

    const outcomeB = await orchestrateOriginalityReview(candidateB.candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(outcomeB.outcome).toBe("upstream_evidence_invalid");
    if (outcomeB.outcome === "upstream_evidence_invalid") {
      expect(outcomeB.issues.some((issue) => issue.message.includes(candidateA.candidateId))).toBe(true);
    }

    const outcomeA = await orchestrateOriginalityReview(candidateA.candidateId, repo, { validatedAt: "2026-05-01T00:00:00.000Z" });
    expect(outcomeA.outcome).toBe("passed");
  });
});

// --- 21. Valid five-stage completion ----------------------------------------

describe("third remediation — valid five-stage completion", () => {
  it("21. a fully legitimate candidate reaches difficulty_review_passed through all five real gates in one runPipeline call", async () => {
    await ensureMission3dBlueprintSeeded(repo, "mission3d-fixture-blueprint");
    // `mission3dQuestion`'s 20-word filler padding (needed for confident
    // originality/correctness computation) genuinely deviates from the
    // blueprint's declared "easy" difficulty once the real difficulty
    // estimator sees it (the same real, non-test-artefact deviation
    // `pipeline-runner.test.ts` documents for its own semantic_objective
    // fixture) — a short, unpadded prompt is used here instead so this
    // test can assert the full five-stage *pass* path specifically.
    const { candidateId } = await seedGenerated(repo, {
      id: "five-stage-001",
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
      { pipelineRunId: "run-third-remediation-five-stage", batchId: "batch-third-remediation", candidateIds: [candidateId] },
      repo,
      lockOptions(),
    );
    expect(outcome.status).toBe("completed");
    if (outcome.status !== "completed") return;
    const result = outcome.report.candidateResults[0];
    expect(result?.endState).toBe("difficulty_review_passed");
    expect(result?.gateResults.map((g) => g.gate)).toEqual(["structural", "correctness", "semantic", "originality", "difficulty"]);
    expect(result?.gateResults.every((g) => g.outcome === "passed")).toBe(true);

    expect(await countReportsWithPrefix("sv-")).toBe(1);
    expect(await countReportsWithPrefix("cv-")).toBe(1);
    expect(await countReportsWithPrefix("cva-")).toBe(1);
    expect(await countReportsWithPrefix("sr-")).toBe(1);
    expect(await countReportsWithPrefix("og-")).toBe(1);
  });
});
