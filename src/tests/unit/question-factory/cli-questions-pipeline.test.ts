import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createSandbox, runCli, type CliInvocationResult } from "./cli-test-helpers";

const SCRIPT = "scripts/questions-pipeline.mts";

vi.setConfig({ testTimeout: 30_000 });

let sandboxDir: string;
let cleanup: () => Promise<void>;

beforeEach(async () => {
  const sandbox = await createSandbox("mm-cli-pipeline-");
  sandboxDir = sandbox.dir;
  cleanup = sandbox.cleanup;
});

afterEach(async () => {
  await cleanup();
});

function workspaceRoot(): string {
  return path.join(sandboxDir, "workspace");
}

function invoke(args: readonly string[]): CliInvocationResult {
  return runCli(SCRIPT, args, { workspaceRoot: workspaceRoot() });
}

async function seedGeneratedCandidate(candidateId: string): Promise<void> {
  const { FsFactoryRepository } = await import("@/features/question-factory/storage");
  const { hashJson } = await import("@/features/question-factory/provenance");
  const { normaliseIdentityOrThrow } = await import("@/features/question-factory/config");
  const { candidateQuestionSchema } = await import("@/features/question-factory/ingestion/candidate-question");
  const repo = new FsFactoryRepository(workspaceRoot());

  const blueprint = {
    id: "bp-cli-pipeline",
    batchId: "batch-cli-pipeline",
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
  const exists = await repo.exists("blueprints", blueprint.id);
  if (!exists) await repo.create("blueprints", blueprint.id, blueprint);

  const rawQuestion = {
    id: candidateId,
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
  const parsed = candidateQuestionSchema.safeParse(rawQuestion);
  const question = parsed.success ? (parsed.data as unknown as Record<string, unknown>) : rawQuestion;
  const contentHash = hashJson(question);
  await repo.create("generated", candidateId, {
    candidateId,
    state: "generated",
    question,
    provenance: {
      candidateId,
      blueprintId: blueprint.id,
      batchId: blueprint.batchId,
      pipelineRunId: `${blueprint.batchId}-pipeline`,
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

describe("questions:pipeline CLI — help and argument validation", () => {
  it("--help prints usage and exits non-zero", () => {
    const result = invoke(["--help"]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/Usage: questions:pipeline/);
  });

  it("exits 2 when --pipeline-run-id is missing", () => {
    const result = invoke(["--batch-id", "b1", "--candidate-ids", "c1"]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/--pipeline-run-id is required/);
  });

  it("exits 2 when --batch-id is missing", () => {
    const result = invoke(["--pipeline-run-id", "r1", "--candidate-ids", "c1"]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/--batch-id is required/);
  });

  it("exits 2 when --candidate-ids is missing", () => {
    const result = invoke(["--pipeline-run-id", "r1", "--batch-id", "b1"]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/--candidate-ids is required/);
  });

  it("exits 2 for a duplicate candidate id in the list", async () => {
    const result = invoke(["--pipeline-run-id", "r1", "--batch-id", "b1", "--candidate-ids", "c1,c1", "--json"]);
    expect(result.exitCode).toBe(2);
    const payload = JSON.parse(result.stdout.trim());
    expect(payload.issueCode).toBe("pipeline_duplicate_candidate_id");
  });
});

describe("questions:pipeline CLI — happy path, partial batch, and dry-run", () => {
  it("exits 0 and reports semantic_review_passed for a fully passing candidate", async () => {
    await seedGeneratedCandidate("c-cli-pipeline-pass");
    const result = invoke(["--pipeline-run-id", "r-pass", "--batch-id", "b-pass", "--candidate-ids", "c-cli-pipeline-pass", "--json"]);
    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout.trim());
    expect(payload.status).toBe("completed");
    expect(payload.report.candidateResults[0].endState).toBe("semantic_review_passed");
  });

  it("exits 3 for a partial batch (a candidate that does not exist)", async () => {
    const result = invoke(["--pipeline-run-id", "r-partial", "--batch-id", "b-partial", "--candidate-ids", "c-does-not-exist", "--json"]);
    expect(result.exitCode).toBe(3);
    const payload = JSON.parse(result.stdout.trim());
    expect(payload.report.candidateResults[0].resultKind).toBe("not_found");
  });

  it("--dry-run simulates without mutating repository state (exit 3: the simulated preview never reaches semantic_review_passed for real)", async () => {
    await seedGeneratedCandidate("c-cli-pipeline-dry");
    const result = invoke(["--pipeline-run-id", "r-dry", "--batch-id", "b-dry", "--candidate-ids", "c-cli-pipeline-dry", "--dry-run", "--json"]);
    expect(result.exitCode).toBe(3);
    const payload = JSON.parse(result.stdout.trim());
    expect(payload.report.simulated).toBe(true);
    expect(payload.report.candidateResults[0].endState).toBe("generated");

    const { FsFactoryRepository } = await import("@/features/question-factory/storage");
    const repo = new FsFactoryRepository(workspaceRoot());
    const stillGenerated = (await repo.read("generated", "c-cli-pipeline-dry")) as { readonly state: string };
    expect(stillGenerated.state).toBe("generated");
  });
});

describe("questions:pipeline CLI — batch-lock conflict", () => {
  it("exits 9 when the batch lock is already held", async () => {
    const { acquireBatchLock } = await import("@/features/question-factory/pipeline");
    const held = await acquireBatchLock(workspaceRoot(), "b-locked", "other-run", "fp", ["c1"]);
    expect(held.ok).toBe(true);

    const result = invoke(["--pipeline-run-id", "r-locked", "--batch-id", "b-locked", "--candidate-ids", "c1", "--json"]);
    expect(result.exitCode).toBe(9);
    const payload = JSON.parse(result.stdout.trim());
    expect(payload.issueCode).toBe("pipeline_batch_lock_held");
  });
});
