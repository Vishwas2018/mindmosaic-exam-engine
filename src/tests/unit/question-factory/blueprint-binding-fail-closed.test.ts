/**
 * Mission 3B blueprint remediation — end-to-end fail-closed coverage over a
 * REAL filesystem repository. Every scenario proves the same governance
 * invariant from a different angle: when a candidate's bound blueprint
 * cannot be resolved and verified, the correctness gate, the cached
 * correctness replay, external review ingestion and the semantic-review
 * gate all refuse deterministically — with **zero writes**:
 *   - no correctness/review evidence appended (reports compartment
 *     unchanged),
 *   - no review-chain append (provenance.reviewRecords unchanged),
 *   - no lifecycle progression (stored `state` unchanged),
 *   - no compartment movement (record still in `review-queue`, terminal
 *     compartments untouched),
 *   - no duplicate replay artefact (report file count for the candidate
 *     unchanged),
 *   - the candidate remains byte-for-byte in its prior valid state.
 */
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { Blueprint } from "@/features/question-factory/blueprints";
import { normaliseIdentityOrThrow } from "@/features/question-factory/config";
import {
  buildCorrectnessReportId,
  orchestrateCorrectnessVerification,
} from "@/features/question-factory/correctness/orchestrate-correctness-verification";
import { hashJson } from "@/features/question-factory/provenance";
import { attemptSemanticReviewTransition, ingestExternalReview } from "@/features/question-factory/review";
import { FsFactoryRepository } from "@/features/question-factory/storage";
import { buildStructuralValidationReportId } from "@/features/question-factory/validation";

import { additionQuestion, baseProvenance, passedStructuralEvidence } from "./correctness-fixtures";

let repoRoot: string;
let repo: FsFactoryRepository;

beforeEach(async () => {
  repoRoot = await mkdtemp(path.join(tmpdir(), "blueprint-fail-closed-"));
  repo = new FsFactoryRepository(repoRoot);
});

afterEach(async () => {
  await rm(repoRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});

const BP_ID = "bp-fail-closed";

function validBlueprint(overrides: Partial<Record<keyof Blueprint, unknown>> = {}): Record<string, unknown> {
  return {
    id: BP_ID,
    batchId: "batch-fail-closed",
    yearLevel: "year-3",
    examStyle: "naplan_style",
    subject: "numeracy",
    strand: "Number",
    skill: "num.addition.two-digit",
    difficulty: "medium",
    questionType: "number_entry",
    targetCount: 1,
    marks: 1,
    estimatedTimeSeconds: 60,
    learningObjective: "Practise two-digit addition.",
    misconceptionTargets: [],
    reasoningSteps: 1,
    accessibilityConstraints: [],
    originalityConstraints: [],
    generationConstraints: [],
    ...overrides,
  };
}

function blueprintFilePath(blueprintId: string): string {
  return path.join(repoRoot, "blueprints", `${blueprintId}.json`);
}

/** Seeds a candidate at `structural_validation_passed` in review-queue with a fingerprint-correct structural report bound to `blueprintHash`. */
async function seedAtStructuralPassed(candidateId: string, blueprintHash: string): Promise<Record<string, unknown>> {
  const question = { ...additionQuestion(), id: candidateId };
  const provenance = baseProvenance(question, { candidateId, blueprintId: BP_ID });
  const structuralEvidence = passedStructuralEvidence(question, provenance, { blueprintHash });
  await repo.create("reports", buildStructuralValidationReportId(candidateId), {
    candidateId,
    result: { status: "passed", evidence: structuralEvidence },
  });
  const record = { candidateId, state: "structural_validation_passed", question, provenance };
  await repo.create("review-queue", candidateId, record);
  return record;
}

async function readRawOrUndefined(filePath: string): Promise<string | undefined> {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return undefined;
  }
}

/**
 * Candidate-scoped pre/post snapshot for zero-write assertions: the
 * candidate's review-queue record bytes, its own structural and correctness
 * report bytes (by deterministic report id — another candidate's legitimate
 * progress never affects this snapshot), and its presence in every terminal
 * compartment this remediation's gates could have moved it to.
 */
async function snapshot(candidateId: string): Promise<{
  readonly reviewQueueRaw: string | undefined;
  readonly structuralReportRaw: string | undefined;
  readonly correctnessReportRaw: string | undefined;
  readonly rejectedStructural: unknown;
  readonly rejectedCorrectness: unknown;
  readonly rejectedSemantic: unknown;
  readonly quarantined: unknown;
}> {
  const reportsDir = path.join(repoRoot, "reports");
  const [reviewQueueRaw, structuralReportRaw, correctnessReportRaw] = await Promise.all([
    readRawOrUndefined(path.join(repoRoot, "review-queue", `${candidateId}.json`)),
    readRawOrUndefined(path.join(reportsDir, `${buildStructuralValidationReportId(candidateId)}.json`)),
    readRawOrUndefined(path.join(reportsDir, `${buildCorrectnessReportId(candidateId)}.json`)),
  ]);
  const [rejectedStructural, rejectedCorrectness, rejectedSemantic, quarantined] = await Promise.all([
    repo.read("rejected/structural", candidateId),
    repo.read("rejected/correctness", candidateId),
    repo.read("rejected/semantic", candidateId),
    repo.read("quarantined", candidateId),
  ]);
  return { reviewQueueRaw, structuralReportRaw, correctnessReportRaw, rejectedStructural, rejectedCorrectness, rejectedSemantic, quarantined };
}

async function expectZeroWrites(candidateId: string, before: Awaited<ReturnType<typeof snapshot>>): Promise<void> {
  const after = await snapshot(candidateId);
  expect(after.reviewQueueRaw).toBe(before.reviewQueueRaw); // byte-identical prior valid state, no lifecycle progression, no chain append
  expect(after.structuralReportRaw).toBe(before.structuralReportRaw); // structural evidence untouched
  expect(after.correctnessReportRaw).toBe(before.correctnessReportRaw); // no correctness evidence appended, no duplicate replay artefact
  expect(after.rejectedStructural).toBeUndefined();
  expect(after.rejectedCorrectness).toBeUndefined();
  expect(after.rejectedSemantic).toBeUndefined();
  expect(after.quarantined).toBeUndefined(); // no compartment movement
}

describe("correctness gate — fresh verification fails closed on the bound blueprint", () => {
  it("missing blueprint: typed refusal, zero writes, candidate untouched", async () => {
    // Deliberately never create the blueprint record at all.
    await seedAtStructuralPassed("cand-missing-bp", "any-hash");
    const before = await snapshot("cand-missing-bp");

    const outcome = await orchestrateCorrectnessVerification("cand-missing-bp", repo, { verifiedAt: new Date().toISOString() });

    expect(outcome.outcome).toBe("repository_error");
    if (outcome.outcome === "repository_error") expect(outcome.message).toContain(BP_ID);
    await expectZeroWrites("cand-missing-bp", before);
  });

  it("unreadable/malformed-JSON blueprint on disk: typed refusal, zero writes", async () => {
    const bp = validBlueprint();
    await repo.create("blueprints", BP_ID, bp);
    await seedAtStructuralPassed("cand-corrupt-bp", hashJson(bp));
    // Corrupt the stored blueprint file directly on the real filesystem.
    await writeFile(blueprintFilePath(BP_ID), "{ this is not json", "utf8");
    const before = await snapshot("cand-corrupt-bp");

    const outcome = await orchestrateCorrectnessVerification("cand-corrupt-bp", repo, { verifiedAt: new Date().toISOString() });

    expect(outcome.outcome).toBe("repository_error");
    await expectZeroWrites("cand-corrupt-bp", before);
  });

  it("schema-invalid blueprint: typed refusal, zero writes", async () => {
    const invalid = validBlueprint({ questionType: 42, yearLevel: "year-13" });
    await repo.create("blueprints", BP_ID, invalid);
    await seedAtStructuralPassed("cand-schema-bp", hashJson(invalid));
    const before = await snapshot("cand-schema-bp");

    const outcome = await orchestrateCorrectnessVerification("cand-schema-bp", repo, { verifiedAt: new Date().toISOString() });

    expect(outcome.outcome).toBe("repository_error");
    await expectZeroWrites("cand-schema-bp", before);
  });

  it("unresolvable taxonomy skill: typed refusal, zero writes", async () => {
    const invalid = validBlueprint({ skill: "no.such.skill.anywhere" });
    await repo.create("blueprints", BP_ID, invalid);
    await seedAtStructuralPassed("cand-tax-bp", hashJson(invalid));
    const before = await snapshot("cand-tax-bp");

    const outcome = await orchestrateCorrectnessVerification("cand-tax-bp", repo, { verifiedAt: new Date().toISOString() });

    expect(outcome.outcome).toBe("repository_error");
    if (outcome.outcome === "repository_error") expect(outcome.message).toContain("no.such.skill.anywhere");
    await expectZeroWrites("cand-tax-bp", before);
  });

  it("renderer-unsupported question type: typed refusal, zero writes", async () => {
    const invalid = validBlueprint({ questionType: "interpretive_dance" });
    await repo.create("blueprints", BP_ID, invalid);
    await seedAtStructuralPassed("cand-type-bp", hashJson(invalid));
    const before = await snapshot("cand-type-bp");

    const outcome = await orchestrateCorrectnessVerification("cand-type-bp", repo, { verifiedAt: new Date().toISOString() });

    expect(outcome.outcome).toBe("repository_error");
    await expectZeroWrites("cand-type-bp", before);
  });
});

describe("correctness gate — cached replay fails closed on the bound blueprint", () => {
  async function passCandidateThroughGate(candidateId: string): Promise<void> {
    const bp = validBlueprint();
    if (!(await repo.exists("blueprints", BP_ID))) await repo.create("blueprints", BP_ID, bp);
    await seedAtStructuralPassed(candidateId, hashJson(bp));
    const outcome = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: new Date().toISOString() });
    if (outcome.outcome !== "passed") throw new Error(`fixture candidate must pass the gate first, got '${outcome.outcome}'`);
  }

  it("replay after blueprint deletion: refusal with no mutation and no duplicate artefact; retry after restoration replays cleanly", async () => {
    await passCandidateThroughGate("cand-replay-del");
    const bp = validBlueprint();

    // Remove the blueprint through the repository (file + metadata), then attempt a replay.
    await repo.remove("blueprints", BP_ID);
    const before = await snapshot("cand-replay-del");
    const refused = await orchestrateCorrectnessVerification("cand-replay-del", repo, { verifiedAt: new Date().toISOString() });
    expect(refused.outcome).toBe("repository_error");
    await expectZeroWrites("cand-replay-del", before);

    // Restore the identical blueprint: the cached replay must succeed again,
    // without writing a second report.
    await repo.create("blueprints", BP_ID, bp);
    const replayed = await orchestrateCorrectnessVerification("cand-replay-del", repo, { verifiedAt: new Date().toISOString() });
    expect(replayed.outcome).toBe("passed");
    if (replayed.outcome === "passed") expect(replayed.replayed).toBe(true);
    const after = await snapshot("cand-replay-del");
    expect(after.correctnessReportRaw).toBe(before.correctnessReportRaw); // replay never duplicates the report
  });

  it("replay with a swapped (different-content) blueprint: replay integrity failure, no mutation", async () => {
    await passCandidateThroughGate("cand-replay-swap");
    // Replace the blueprint with a different, still-valid record — the
    // canonical hash changes, so the cached evidence no longer binds.
    await repo.remove("blueprints", BP_ID);
    await repo.create("blueprints", BP_ID, validBlueprint({ marks: 2, estimatedTimeSeconds: 90 }));
    const before = await snapshot("cand-replay-swap");

    const outcome = await orchestrateCorrectnessVerification("cand-replay-swap", repo, { verifiedAt: new Date().toISOString() });

    expect(outcome.outcome).toBe("replay_integrity_failure");
    if (outcome.outcome === "replay_integrity_failure") {
      expect(outcome.issues.map((issue) => issue.path)).toContain("correctnessReport.evidence.blueprintHash");
    }
    await expectZeroWrites("cand-replay-swap", before);
  });
});

describe("review ingestion — fails closed on the bound blueprint before any chain append", () => {
  async function seedAtCorrectnessPassed(candidateId: string): Promise<{ contentHash: string; blueprintHash: string }> {
    const bp = validBlueprint();
    if (!(await repo.exists("blueprints", BP_ID))) await repo.create("blueprints", BP_ID, bp);
    const question = {
      ...additionQuestion(),
      id: candidateId,
      type: "short_answer",
      answerKey: { kind: "text", acceptableAnswers: ["seventy-one"], caseSensitive: false, trimWhitespace: true },
      prompt: "Write seventy-one in words.",
    };
    const provenance = baseProvenance(question, {
      candidateId,
      blueprintId: BP_ID,
      generatorAdapter: { class: "manual_external", identity: normaliseIdentityOrThrow("qwen") },
    });
    await repo.create("review-queue", candidateId, { candidateId, state: "correctness_check_passed", question, provenance });
    return { contentHash: provenance.contentHash as string, blueprintHash: hashJson(bp) };
  }

  function reviewInput(candidateId: string, contentHash: string, blueprintHash: string) {
    return {
      reviewId: "rv-fail-closed-001",
      candidateId,
      candidateRevision: 0,
      candidateContentHash: contentHash,
      blueprintHash,
      reviewerModel: "claude",
      reviewerVersion: "1.0.0",
      result: "passed",
      confidence: 0.9,
      findings: ["Answer wording is correct."],
      evidenceReferences: ["answer key"],
      ambiguityStatus: "none",
      reviewedAt: "2026-07-15T00:00:00.000Z",
      reviewPromptVersion: "v1",
      reviewPromptHash: "review-prompt-hash",
    };
  }

  it("missing review blueprint: rejected with blueprint_binding_unresolved, no chain append, no lifecycle progression", async () => {
    const { contentHash, blueprintHash } = await seedAtCorrectnessPassed("cand-review-missing-bp");
    await repo.remove("blueprints", BP_ID);
    const before = await snapshot("cand-review-missing-bp");

    const outcome = await ingestExternalReview(reviewInput("cand-review-missing-bp", contentHash, blueprintHash), repo);

    expect(outcome.status).toBe("rejected");
    if (outcome.status === "rejected") expect(outcome.issueCode).toBe("blueprint_binding_unresolved");
    await expectZeroWrites("cand-review-missing-bp", before);
  });

  it("declared review hash mismatching the verified canonical hash: rejected, no chain append", async () => {
    const { contentHash } = await seedAtCorrectnessPassed("cand-review-mismatch");
    const before = await snapshot("cand-review-mismatch");

    const outcome = await ingestExternalReview(reviewInput("cand-review-mismatch", contentHash, "not-the-canonical-hash"), repo);

    expect(outcome.status).toBe("rejected");
    if (outcome.status === "rejected") expect(outcome.issueCode).toBe("blueprint_hash_mismatch");
    await expectZeroWrites("cand-review-mismatch", before);
  });
});

describe("semantic-review gate — fails closed on the bound blueprint before any transition or move", () => {
  it("blueprint deleted before the gate runs: typed refusal, candidate is NOT quarantined and NOT moved", async () => {
    const bp = validBlueprint();
    await repo.create("blueprints", BP_ID, bp);
    const question = { ...additionQuestion(), id: "cand-semantic-bp" };
    const provenance = baseProvenance(question, { candidateId: "cand-semantic-bp", blueprintId: BP_ID });
    await repo.create("review-queue", "cand-semantic-bp", {
      candidateId: "cand-semantic-bp",
      state: "correctness_check_passed",
      question,
      provenance,
    });
    await repo.remove("blueprints", BP_ID);
    const before = await snapshot("cand-semantic-bp");

    const outcome = await attemptSemanticReviewTransition("cand-semantic-bp", repo);

    // Previously this path silently used an empty-string hash, found "no
    // independent evidence", and MOVED the candidate to quarantine — a
    // lifecycle decision made on an unverifiable blueprint binding.
    expect(outcome.outcome).toBe("repository_error");
    await expectZeroWrites("cand-semantic-bp", before);
  });
});

describe("multi-candidate pipeline isolation", () => {
  it("one candidate's broken blueprint never blocks or contaminates another candidate's clean run", async () => {
    // Candidate A: bound to a valid blueprint of its own.
    const bpA = { ...validBlueprint(), id: "bp-isolated-a" };
    await repo.create("blueprints", "bp-isolated-a", bpA);
    const questionA = { ...additionQuestion(), id: "cand-iso-a" };
    const provenanceA = baseProvenance(questionA, { candidateId: "cand-iso-a", blueprintId: "bp-isolated-a" });
    const evidenceA = passedStructuralEvidence(questionA, provenanceA, { blueprintHash: hashJson(bpA) });
    await repo.create("reports", buildStructuralValidationReportId("cand-iso-a"), {
      candidateId: "cand-iso-a",
      result: { status: "passed", evidence: evidenceA },
    });
    await repo.create("review-queue", "cand-iso-a", {
      candidateId: "cand-iso-a",
      state: "structural_validation_passed",
      question: questionA,
      provenance: provenanceA,
    });

    // Candidate B: bound to a blueprint that never existed.
    const questionB = { ...additionQuestion(), id: "cand-iso-b" };
    const provenanceB = baseProvenance(questionB, { candidateId: "cand-iso-b", blueprintId: "bp-never-created" });
    const evidenceB = passedStructuralEvidence(questionB, provenanceB, { blueprintHash: "stale-hash" });
    await repo.create("reports", buildStructuralValidationReportId("cand-iso-b"), {
      candidateId: "cand-iso-b",
      result: { status: "passed", evidence: evidenceB },
    });
    await repo.create("review-queue", "cand-iso-b", {
      candidateId: "cand-iso-b",
      state: "structural_validation_passed",
      question: questionB,
      provenance: provenanceB,
    });

    const beforeB = await snapshot("cand-iso-b");

    const outcomeB = await orchestrateCorrectnessVerification("cand-iso-b", repo, { verifiedAt: new Date().toISOString() });
    const outcomeA = await orchestrateCorrectnessVerification("cand-iso-a", repo, { verifiedAt: new Date().toISOString() });

    // B refused with zero writes; A progressed normally.
    expect(outcomeB.outcome).toBe("repository_error");
    await expectZeroWrites("cand-iso-b", beforeB);

    expect(outcomeA.outcome).toBe("passed");
    const recordA = (await repo.read("review-queue", "cand-iso-a")) as Record<string, unknown>;
    expect(recordA.state).toBe("correctness_check_passed");
    expect(await repo.read("reports", buildCorrectnessReportId("cand-iso-a"))).toBeDefined();
    // B's report was never written.
    expect(await repo.read("reports", buildCorrectnessReportId("cand-iso-b"))).toBeUndefined();
  });
});
