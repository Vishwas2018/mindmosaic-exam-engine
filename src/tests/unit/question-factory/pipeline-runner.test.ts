import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Blueprint } from "@/features/question-factory/blueprints";
import { normaliseIdentityOrThrow } from "@/features/question-factory/config";
import { orchestrateCorrectnessVerification } from "@/features/question-factory/correctness";
import { candidateQuestionSchema } from "@/features/question-factory/ingestion/candidate-question";
import { acquireBatchLock, runPipeline, type PipelineRunRequest } from "@/features/question-factory/pipeline";
import { appendReviewRecord, hashJson } from "@/features/question-factory/provenance";
import { FsFactoryRepository } from "@/features/question-factory/storage";
import { orchestrateStructuralValidation } from "@/features/question-factory/validation";

vi.setConfig({ testTimeout: 30_000 });

/** Mirrors `manual-ingestion/ingest.ts`'s best-effort preflight parse: when the raw content already satisfies the shared preflight schema, the *parsed* value (with schema defaults filled in) is what gets stored and hashed, so a later structural-validation re-parse recomputes the identical `contentHash`. */
function normaliseQuestion(question: Record<string, unknown>): Record<string, unknown> {
  const parsed = candidateQuestionSchema.safeParse(question);
  return parsed.success ? (parsed.data as unknown as Record<string, unknown>) : question;
}

let rootDir: string;
let repo: FsFactoryRepository;

beforeEach(async () => {
  rootDir = await mkdtemp(path.join(tmpdir(), "pipeline-runner-"));
  repo = new FsFactoryRepository(rootDir);
});

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});

function lockOptions(): { readonly lockRoot: string; readonly lockMaxWaitMs: number; readonly lockRetryDelayMs: number } {
  return { lockRoot: rootDir, lockMaxWaitMs: 100, lockRetryDelayMs: 10 };
}

function numeracyBlueprint(id = "bp-pipeline-numeracy"): Blueprint {
  return {
    id,
    batchId: "batch-pipeline-numeracy",
    yearLevel: "year-3",
    examStyle: "naplan_style",
    subject: "numeracy",
    strand: "Number",
    skill: "num.addition.two-digit",
    difficulty: "easy",
    questionType: "number_entry",
    targetCount: 1,
    marks: 1,
    estimatedTimeSeconds: 45,
    learningObjective: "Add two whole numbers.",
    misconceptionTargets: [],
    reasoningSteps: 1,
    accessibilityConstraints: [],
    originalityConstraints: [],
    generationConstraints: [],
  };
}

function readingBlueprint(id = "bp-pipeline-reading"): Blueprint {
  return {
    id,
    batchId: "batch-pipeline-reading",
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

function computableCandidate(id: string): Record<string, unknown> {
  return {
    id,
    type: "number_entry",
    yearLevel: 3,
    examStyle: "naplan_style",
    prompt: "What is 23 + 19?",
    options: [],
    visuals: [],
    answerKey: { kind: "number", value: 42, tolerance: 0 },
    explanation: "23 + 19 = 42.",
    metadata: {
      subject: "numeracy",
      strand: "Number",
      skill: "num.addition.two-digit",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 45,
      tags: [],
      locale: "en-AU",
      source: "original",
      schemaVersion: 1,
    },
  };
}

function underivableCandidate(id: string): Record<string, unknown> {
  return {
    id,
    type: "number_entry",
    yearLevel: 3,
    examStyle: "naplan_style",
    prompt: "Sam has some apples and gives some away. How many does Sam have left?",
    options: [],
    visuals: [],
    answerKey: { kind: "number", value: 3, tolerance: 0 },
    explanation: "Sam has 3 apples left.",
    metadata: {
      subject: "numeracy",
      strand: "Number",
      skill: "num.addition.two-digit",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 45,
      tags: [],
      locale: "en-AU",
      source: "original",
      schemaVersion: 1,
    },
  };
}

function semanticObjectiveCandidate(id: string): Record<string, unknown> {
  return {
    id,
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
  };
}

async function seedGenerated(candidateId: string, bp: Blueprint, rawQuestion: Record<string, unknown>): Promise<void> {
  const exists = await repo.exists("blueprints", bp.id);
  if (!exists) await repo.create("blueprints", bp.id, bp);
  const question = normaliseQuestion(rawQuestion);
  const contentHash = hashJson(question);
  await repo.create("generated", candidateId, {
    candidateId,
    state: "generated",
    question,
    provenance: {
      candidateId,
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
}

async function seedCorrectnessCheckPassed(candidateId: string, bp: Blueprint, rawQuestion: Record<string, unknown>, withReview: boolean): Promise<void> {
  const exists = await repo.exists("blueprints", bp.id);
  if (!exists) await repo.create("blueprints", bp.id, bp);
  const question = normaliseQuestion(rawQuestion);
  const contentHash = hashJson(question);
  const reviewRecords = withReview
    ? [
        appendReviewRecord([], {
          candidateId,
          stage: "correctness_check_passed",
          reviewerIdentity: normaliseIdentityOrThrow("claude"),
          reviewerVersion: "1.0.0",
          result: "passed",
          confidence: 0.95,
          findings: ["Main idea correctly identified."],
          evidenceReferences: ["passage closing paragraph"],
          ambiguityStatus: "none",
          reviewedAt: "2026-07-15T00:00:00.000Z",
          reviewPromptVersion: "v1",
          reviewPromptHash: "review-prompt-hash",
          evidenceBinding: {
            candidateContentHash: contentHash,
            blueprintHash: hashJson(bp),
            candidateRevision: 0,
            reviewResultHash: "result-hash",
          },
        }),
      ]
    : [];
  // Mission 3D third audit remediation: drive the candidate through the
  // *real* structural-validation and correctness-verification
  // orchestrators (never hand-fabricated `sv-*`/`cv-*` reports) so it
  // rests on a genuine governed correctness-pass attestation — required by
  // originality's own upstream-evidence check since the third remediation.
  // Seeded at `generated` (rather than directly at `correctness_check_passed`)
  // specifically so both real orchestrators run.
  await repo.create("generated", candidateId, {
    candidateId,
    state: "generated",
    question,
    provenance: {
      candidateId,
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
      reviewRecords,
    },
  });

  const structural = await orchestrateStructuralValidation(candidateId, repo, { validatedAt: "2026-07-13T00:00:00.000Z" });
  if (structural.outcome !== "passed") {
    throw new Error(`seedCorrectnessCheckPassed: candidate '${candidateId}' failed real structural validation: ${JSON.stringify(structural)}`);
  }
  const correctness = await orchestrateCorrectnessVerification(candidateId, repo, { verifiedAt: "2026-07-14T00:00:00.000Z" });
  if (correctness.outcome !== "passed_pending_semantic_review") {
    throw new Error(`seedCorrectnessCheckPassed: candidate '${candidateId}' did not reach 'passed_pending_semantic_review': ${JSON.stringify(correctness)}`);
  }
}

function baseRequest(overrides: Partial<PipelineRunRequest> = {}): PipelineRunRequest {
  return { pipelineRunId: "run-1", batchId: "batch-1", candidateIds: ["c1"], ...overrides };
}

describe("runPipeline — pre-flight, whole-batch refusals", () => {
  it("refuses an empty candidateIds list", async () => {
    const outcome = await runPipeline(baseRequest({ candidateIds: [] }), repo, lockOptions());
    expect(outcome.status).toBe("refused");
    if (outcome.status !== "refused") return;
    expect(outcome.issueCode).toBe("invalid_arguments");
  });

  it("refuses duplicate candidate ids, never touching any candidate", async () => {
    const outcome = await runPipeline(baseRequest({ candidateIds: ["c1", "c1"] }), repo, lockOptions());
    expect(outcome.status).toBe("refused");
    if (outcome.status !== "refused") return;
    expect(outcome.issueCode).toBe("pipeline_duplicate_candidate_id");
  });

  it("refuses a candidate list over the configured per-run limit", async () => {
    const tooMany = Array.from({ length: 501 }, (_, index) => `c${index}`);
    const outcome = await runPipeline(baseRequest({ candidateIds: tooMany }), repo, lockOptions());
    expect(outcome.status).toBe("refused");
    if (outcome.status !== "refused") return;
    expect(outcome.issueCode).toBe("pipeline_candidate_limit_exceeded");
  });

  it("refuses to run while the batch lock is held by another invocation", async () => {
    const held = await acquireBatchLock(rootDir, "batch-locked", "other-run", "fp", ["c1"]);
    expect(held.ok).toBe(true);

    const outcome = await runPipeline(baseRequest({ batchId: "batch-locked" }), repo, lockOptions());
    expect(outcome.status).toBe("refused");
    if (outcome.status !== "refused") return;
    expect(outcome.issueCode).toBe("pipeline_batch_lock_held");
  });

  it("refuses a reused pipelineRunId against a different candidate set", async () => {
    await seedGenerated("c1", numeracyBlueprint(), computableCandidate("c1"));
    const first = await runPipeline(baseRequest({ candidateIds: ["c1"] }), repo, lockOptions());
    expect(first.status).toBe("completed");

    await seedGenerated("c2", numeracyBlueprint(), computableCandidate("c2"));
    const second = await runPipeline(baseRequest({ candidateIds: ["c2"] }), repo, lockOptions());
    expect(second.status).toBe("refused");
    if (second.status !== "refused") return;
    expect(second.issueCode).toBe("pipeline_run_id_conflict");
  });
});

describe("runPipeline — full progression through structural -> correctness -> semantic", () => {
  it("a deterministically_computable candidate reaches difficulty_review_passed (Mission 3D's stop point) with zero reviews", async () => {
    await seedGenerated("c-computable", numeracyBlueprint(), computableCandidate("c-computable"));
    const outcome = await runPipeline(baseRequest({ candidateIds: ["c-computable"] }), repo, lockOptions());
    expect(outcome.status).toBe("completed");
    if (outcome.status !== "completed") return;

    const result = outcome.report.candidateResults[0];
    expect(result?.resultKind).toBe("advanced");
    expect(result?.startState).toBe("generated");
    expect(result?.endState).toBe("difficulty_review_passed");
    expect(result?.gateResults.map((g) => g.gate)).toEqual(["structural", "correctness", "semantic", "originality", "difficulty"]);
    expect(result?.gateResults.every((g) => g.outcome === "passed")).toBe(true);

    const stored = (await repo.read("review-queue", "c-computable")) as { readonly state: string };
    expect(stored.state).toBe("difficulty_review_passed");
  });

  it("a structurally invalid candidate is rejected at the structural stage", async () => {
    const invalid = { ...computableCandidate("c-invalid"), type: "not_a_real_type" };
    await seedGenerated("c-invalid", numeracyBlueprint(), invalid);
    const outcome = await runPipeline(baseRequest({ candidateIds: ["c-invalid"] }), repo, lockOptions());
    expect(outcome.status).toBe("completed");
    if (outcome.status !== "completed") return;

    const result = outcome.report.candidateResults[0];
    expect(result?.endState).toBe("rejected");
    expect(result?.gateResults).toEqual([{ gate: "structural", outcome: "failed", evidenceFingerprint: expect.any(String) }]);
  });

  it("a genuinely undecidable deterministically_computable candidate quarantines at the correctness stage", async () => {
    await seedGenerated("c-undecidable", numeracyBlueprint(), underivableCandidate("c-undecidable"));
    const outcome = await runPipeline(baseRequest({ candidateIds: ["c-undecidable"] }), repo, lockOptions());
    expect(outcome.status).toBe("completed");
    if (outcome.status !== "completed") return;

    const result = outcome.report.candidateResults[0];
    expect(result?.endState).toBe("quarantined");
    expect(result?.gateResults.map((g) => g.gate)).toEqual(["structural", "correctness"]);
  });

  it("a semantic_objective candidate with no independent review quarantines at the semantic stage", async () => {
    await seedCorrectnessCheckPassed("c-semantic-no-review", readingBlueprint(), semanticObjectiveCandidate("c-semantic-no-review"), false);
    const outcome = await runPipeline(baseRequest({ candidateIds: ["c-semantic-no-review"] }), repo, lockOptions());
    expect(outcome.status).toBe("completed");
    if (outcome.status !== "completed") return;

    const result = outcome.report.candidateResults[0];
    expect(result?.startState).toBe("correctness_check_passed");
    expect(result?.endState).toBe("quarantined");
    expect(result?.gateResults).toEqual([{ gate: "semantic", outcome: "quarantined" }]);
  });

  it("a semantic_objective candidate with a durable independent review passes the semantic stage (then continues into Mission 3D's gates)", async () => {
    await seedCorrectnessCheckPassed("c-semantic-reviewed", readingBlueprint(), semanticObjectiveCandidate("c-semantic-reviewed"), true);
    const outcome = await runPipeline(baseRequest({ candidateIds: ["c-semantic-reviewed"] }), repo, lockOptions());
    expect(outcome.status).toBe("completed");
    if (outcome.status !== "completed") return;

    const result = outcome.report.candidateResults[0];
    // The semantic stage itself still passes exactly as before — this
    // fixture's short, simple-vocabulary prompt then genuinely deviates
    // from its blueprint's declared "medium" difficulty (a real,
    // deterministic difficulty-gate finding, not a test artefact), so the
    // pipeline correctly continues past semantic_review_passed and stops
    // at needs_revision rather than difficulty_review_passed.
    expect(result?.gateResults.find((g) => g.gate === "semantic")?.outcome).toBe("passed");
    expect(result?.endState).toBe("needs_revision");
  });
});

describe("runPipeline — explicit-list semantics and stable ordering", () => {
  it("processes candidates in exactly the order given, never re-sorted", async () => {
    await seedGenerated("c-third", numeracyBlueprint(), computableCandidate("c-third"));
    await seedGenerated("c-first", numeracyBlueprint(), computableCandidate("c-first"));
    await seedGenerated("c-second", numeracyBlueprint(), computableCandidate("c-second"));

    const outcome = await runPipeline(baseRequest({ candidateIds: ["c-second", "c-first", "c-third"] }), repo, lockOptions());
    expect(outcome.status).toBe("completed");
    if (outcome.status !== "completed") return;
    expect(outcome.report.candidateResults.map((r) => r.candidateId)).toEqual(["c-second", "c-first", "c-third"]);
  });
});

describe("runPipeline — missing/ineligible candidates and per-candidate isolation", () => {
  it("reports a candidate id that does not exist as not_found, without crashing the batch", async () => {
    await seedGenerated("c-real", numeracyBlueprint(), computableCandidate("c-real"));
    const outcome = await runPipeline(baseRequest({ candidateIds: ["c-does-not-exist", "c-real"] }), repo, lockOptions());
    expect(outcome.status).toBe("completed");
    if (outcome.status !== "completed") return;

    const [missing, real] = outcome.report.candidateResults;
    expect(missing?.resultKind).toBe("not_found");
    expect(missing?.endState).toBe("not_found");
    expect(real?.endState).toBe("difficulty_review_passed");
  });

  it("reports a candidate already at difficulty_review_passed (Mission 3D's stop point) as ineligible_state (already done), not re-processed", async () => {
    const bp = readingBlueprint();
    const question = semanticObjectiveCandidate("c-already-passed");
    await repo.create("blueprints", bp.id, bp);
    await repo.create("review-queue", "c-already-passed", {
      candidateId: "c-already-passed",
      state: "difficulty_review_passed",
      question,
      provenance: {
        candidateId: "c-already-passed",
        blueprintId: bp.id,
        batchId: bp.batchId,
        pipelineRunId: "p",
        revision: 0,
        generatedAt: "2026-07-01T00:00:00.000Z",
        generatorAdapter: { class: "manual_external", identity: normaliseIdentityOrThrow("qwen") },
        generatorVersion: "1",
        promptVersion: "v1",
        schemaVersion: "1",
        taxonomyVersion: "1",
        contentHash: hashJson(question),
        reviewRecords: [],
      },
    });

    const outcome = await runPipeline(baseRequest({ candidateIds: ["c-already-passed"] }), repo, lockOptions());
    expect(outcome.status).toBe("completed");
    if (outcome.status !== "completed") return;
    const result = outcome.report.candidateResults[0];
    expect(result?.resultKind).toBe("ineligible_state");
    expect(result?.endState).toBe("difficulty_review_passed");
    expect(result?.gateResults).toEqual([]);
  });

  it("isolates one candidate's malformed persisted evidence to its own result — every sibling is unaffected", async () => {
    await seedGenerated("c-good", numeracyBlueprint(), computableCandidate("c-good"));
    const bp = numeracyBlueprint();
    await repo.create("generated", "c-corrupt", {
      candidateId: "c-corrupt",
      state: "generated",
      question: computableCandidate("c-corrupt"),
      provenance: { candidateId: "c-corrupt", blueprintId: bp.id }, // missing required fields — fails schema parse deep inside the gate
    });

    const outcome = await runPipeline(baseRequest({ candidateIds: ["c-corrupt", "c-good"] }), repo, lockOptions());
    expect(outcome.status).toBe("completed");
    if (outcome.status !== "completed") return;

    const [corrupt, good] = outcome.report.candidateResults;
    expect(corrupt?.candidateId).toBe("c-corrupt");
    expect(good?.candidateId).toBe("c-good");
    expect(good?.endState).toBe("difficulty_review_passed");
  });

  it("fails closed on a state/compartment inconsistency (claimed state not physically consistent with where it was found)", async () => {
    const bp = numeracyBlueprint();
    await repo.create("blueprints", bp.id, bp);
    const question = computableCandidate("c-inconsistent");
    // Claims 'structural_validation_passed' but physically sits in
    // 'generated' — never a legitimate state for that compartment.
    await repo.create("generated", "c-inconsistent", {
      candidateId: "c-inconsistent",
      state: "structural_validation_passed",
      question,
      provenance: {
        candidateId: "c-inconsistent",
        blueprintId: bp.id,
        batchId: bp.batchId,
        pipelineRunId: "p",
        revision: 0,
        generatedAt: "2026-07-01T00:00:00.000Z",
        generatorAdapter: { class: "manual_external", identity: normaliseIdentityOrThrow("qwen") },
        generatorVersion: "1",
        promptVersion: "v1",
        schemaVersion: "1",
        taxonomyVersion: "1",
        contentHash: hashJson(question),
        reviewRecords: [],
      },
    });

    const outcome = await runPipeline(baseRequest({ candidateIds: ["c-inconsistent"] }), repo, lockOptions());
    expect(outcome.status).toBe("completed");
    if (outcome.status !== "completed") return;
    expect(outcome.report.candidateResults[0]?.resultKind).toBe("error");
  });
});

describe("runPipeline — replay and dry-run", () => {
  it("an identical rerun (same pipelineRunId, same ordered candidate list) replays the whole report without re-running any gate", async () => {
    await seedGenerated("c-replay", numeracyBlueprint(), computableCandidate("c-replay"));
    const request = baseRequest({ candidateIds: ["c-replay"] });

    const first = await runPipeline(request, repo, lockOptions());
    expect(first.status).toBe("completed");
    if (first.status !== "completed") return;

    // Corrupt the candidate's stored record after the first run — if the
    // second call genuinely replayed (rather than reprocessing), it must
    // never observe this corruption at all.
    await repo.remove("review-queue", "c-replay");

    const second = await runPipeline(request, repo, lockOptions());
    expect(second.status).toBe("completed");
    if (second.status !== "completed") return;
    expect(second.report).toEqual(first.report);
  });

  it("a dry run previews the next eligible stage only, writes nothing, and is never persisted as a real report", async () => {
    await seedGenerated("c-dry", numeracyBlueprint(), computableCandidate("c-dry"));
    const outcome = await runPipeline(baseRequest({ candidateIds: ["c-dry"], dryRun: true }), repo, lockOptions());
    expect(outcome.status).toBe("completed");
    if (outcome.status !== "completed") return;
    expect(outcome.report.simulated).toBe(true);
    const result = outcome.report.candidateResults[0];
    expect(result?.gateResults).toHaveLength(1);
    expect(result?.gateResults[0]?.gate).toBe("structural");

    const stillGenerated = (await repo.read("generated", "c-dry")) as { readonly state: string };
    expect(stillGenerated.state).toBe("generated");
    expect(await repo.exists("review-queue", "c-dry")).toBe(false);
    expect(await repo.read("reports", "pipeline-run-run-1")).toBeUndefined();
  });
});

describe("runPipeline — legacy compatibility", () => {
  it("a batch of ordinary (non-revision) candidates behaves identically to manually invoking the three gates in sequence", async () => {
    await seedGenerated("c-legacy", numeracyBlueprint(), computableCandidate("c-legacy"));
    const outcome = await runPipeline(baseRequest({ candidateIds: ["c-legacy"] }), repo, lockOptions());
    expect(outcome.status).toBe("completed");
    if (outcome.status !== "completed") return;
    expect(outcome.report.candidateResults[0]?.endState).toBe("difficulty_review_passed");
    const stored = (await repo.read("review-queue", "c-legacy")) as {
      readonly provenance: { readonly parentCandidateId?: string; readonly supersededBy?: unknown };
    };
    expect(stored.provenance.parentCandidateId).toBeUndefined();
    expect(stored.provenance.supersededBy).toBeUndefined();
  });
});
