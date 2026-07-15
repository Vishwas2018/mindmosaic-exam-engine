import { readFile } from "node:fs/promises";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createSandbox, runCli, type CliInvocationResult } from "./cli-test-helpers";

const SCRIPT = "scripts/questions-review-prompt.mts";

vi.setConfig({ testTimeout: 30_000 });

let sandboxDir: string;
let cleanup: () => Promise<void>;

beforeEach(async () => {
  const sandbox = await createSandbox("mm-cli-review-prompt-");
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

describe("questions:review-prompt CLI — help and argument validation", () => {
  it("--help prints usage and exits non-zero", () => {
    const result = invoke(["--help"]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/Usage: questions:review-prompt/);
  });

  it("exits 2 when --candidate-id is missing", () => {
    const result = invoke([]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/--candidate-id is required/);
  });

  it("exits 2 on an unrecognised argument", () => {
    const result = invoke(["--not-a-real-flag"]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/Unrecognised argument/);
  });
});

describe("questions:review-prompt CLI — not found", () => {
  it("exits 4 for a candidate that does not exist", () => {
    const result = invoke(["--candidate-id", "does-not-exist", "--json"]);
    expect(result.exitCode).toBe(4);
  });
});

describe("questions:review-prompt CLI — happy path", () => {
  async function seedRepo(): Promise<void> {
    const workspace = workspaceRoot();
    const { FsFactoryRepository } = await import("@/features/question-factory/storage");
    const { hashJson } = await import("@/features/question-factory/provenance");
    const repo = new FsFactoryRepository(workspace);
    const blueprint = {
      id: "bp-cli-review",
      batchId: "batch-cli-review",
      yearLevel: "year-5",
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
    await repo.create("blueprints", blueprint.id, blueprint);
    const question = {
      id: "candidate-cli",
      type: "number_entry",
      yearLevel: 5,
      examStyle: "naplan_style",
      prompt: "What is 4 + 5?",
      options: [],
      visuals: [],
      answerKey: { kind: "number", value: 9, tolerance: 0 },
      explanation: "4 + 5 = 9.",
      metadata: {
        subject: "numeracy",
        strand: "Number",
        topic: "Addition",
        difficulty: "easy",
        marks: 1,
        estimatedTimeSeconds: 45,
        tags: [],
        locale: "en-AU",
        source: "original",
        schemaVersion: 1,
      },
    };
    await repo.create("review-queue", "candidate-cli", {
      candidateId: "candidate-cli",
      state: "correctness_check_passed",
      question,
      provenance: {
        candidateId: "candidate-cli",
        blueprintId: blueprint.id,
        batchId: blueprint.batchId,
        pipelineRunId: `${blueprint.batchId}-pipeline`,
        revision: 0,
        generatedAt: "2026-07-01T00:00:00.000Z",
        generatorAdapter: { class: "manual_external", identity: { provider: "qwen", modelId: "qwen-max", modelFamily: "qwen", interactionMode: "external_manual" } },
        generatorVersion: "1",
        promptVersion: "v1",
        schemaVersion: "1",
        taxonomyVersion: "1",
        contentHash: hashJson(question),
        reviewRecords: [],
      },
    });
  }

  it("builds and writes a review pack, printing a parseable --json summary", async () => {
    await seedRepo();
    const result = invoke(["--candidate-id", "candidate-cli", "--json"]);
    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout.trim());
    expect(payload.ok).toBe(true);
    expect(typeof payload.promptHash).toBe("string");
    const written = JSON.parse(await readFile(payload.reviewPackPath, "utf8"));
    expect(written.pack.candidateId).toBe("candidate-cli");
  });

  it("refuses to overwrite an existing report without --force", async () => {
    await seedRepo();
    const first = invoke(["--candidate-id", "candidate-cli", "--json"]);
    expect(first.exitCode).toBe(0);
    const second = invoke(["--candidate-id", "candidate-cli", "--json"]);
    expect(second.exitCode).toBe(5);
  });

  it("--stdout prints the pack without writing a report file", async () => {
    await seedRepo();
    const result = invoke(["--candidate-id", "candidate-cli", "--stdout"]);
    expect(result.exitCode).toBe(0);
    const pack = JSON.parse(result.stdout.trim());
    expect(pack.candidateId).toBe("candidate-cli");
  });
});
