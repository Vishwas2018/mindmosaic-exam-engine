import { mkdir, writeFile } from "node:fs/promises";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createSandbox, runCli, type CliInvocationResult } from "./cli-test-helpers";

const SCRIPT = "scripts/questions-review-ingest.mts";

vi.setConfig({ testTimeout: 30_000 });

let sandboxDir: string;
let cleanup: () => Promise<void>;

beforeEach(async () => {
  const sandbox = await createSandbox("mm-cli-review-ingest-");
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

async function seedCandidate(candidateId: string, generatorModel: string): Promise<{ readonly contentHash: string; readonly blueprintHash: string }> {
  const { FsFactoryRepository } = await import("@/features/question-factory/storage");
  const { hashJson } = await import("@/features/question-factory/provenance");
  const repo = new FsFactoryRepository(workspaceRoot());
  const blueprint = {
    id: "bp-cli-ri",
    batchId: "batch-cli-ri",
    yearLevel: "year-5",
    examStyle: "naplan_style",
    subject: "reading",
    strand: "Reading",
    skill: "reading.inference.basic",
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
  await repo.create("blueprints", blueprint.id, blueprint);
  const question = {
    id: candidateId,
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
      strand: "Reading",
      topic: "Inference",
      difficulty: "medium",
      marks: 2,
      estimatedTimeSeconds: 90,
      tags: [],
      locale: "en-AU",
      source: "original",
      schemaVersion: 1,
    },
  };
  const contentHash = hashJson(question);
  await repo.create("review-queue", candidateId, {
    candidateId,
    state: "correctness_check_passed",
    question,
    provenance: {
      candidateId,
      blueprintId: blueprint.id,
      batchId: blueprint.batchId,
      pipelineRunId: `${blueprint.batchId}-pipeline`,
      revision: 0,
      generatedAt: "2026-07-01T00:00:00.000Z",
      generatorAdapter: {
        class: "manual_external",
        identity:
          generatorModel === "qwen"
            ? { provider: "qwen", modelId: "qwen-max", modelFamily: "qwen", interactionMode: "external_manual" }
            : { provider: "anthropic", modelId: "claude-sonnet-5", modelFamily: "claude", interactionMode: "api" },
      },
      generatorVersion: "1",
      promptVersion: "v1",
      schemaVersion: "1",
      taxonomyVersion: "1",
      contentHash,
      reviewRecords: [],
    },
  });
  return { contentHash, blueprintHash: hashJson(blueprint) };
}

function reviewResponse(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    reviewId: "review-cli-1",
    candidateId: "candidate-cli-ri",
    candidateRevision: 0,
    candidateContentHash: "placeholder",
    blueprintHash: "placeholder",
    reviewerModel: "claude",
    reviewerVersion: "1.0.0",
    result: "passed",
    confidence: 0.9,
    findings: ["Main idea correctly identified."],
    evidenceReferences: ["passage paragraph 2"],
    ambiguityStatus: "none",
    reviewedAt: "2026-07-15T00:00:00.000Z",
    reviewPromptVersion: "v1",
    reviewPromptHash: "review-prompt-hash",
    ...overrides,
  };
}

describe("questions:review-ingest CLI — help and argument validation", () => {
  it("--help prints usage and exits non-zero", () => {
    const result = invoke(["--help"]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/Usage: questions:review-ingest/);
  });

  it("exits 2 when --response is missing", () => {
    const result = invoke([]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/--response is required/);
  });

  it("exits 4 when the response file does not exist", () => {
    const result = invoke(["--response", path.join(sandboxDir, "does-not-exist.json"), "--json"]);
    expect(result.exitCode).toBe(4);
  });
});

describe("questions:review-ingest CLI — malformed input", () => {
  it("exits 2 on unparseable JSON", async () => {
    const responsePath = path.join(sandboxDir, "broken.json");
    await mkdir(sandboxDir, { recursive: true });
    await writeFile(responsePath, "{ this is not valid json", "utf8");

    const result = invoke(["--response", responsePath, "--json"]);
    expect(result.exitCode).toBe(2);
    const payload = JSON.parse(result.stdout.trim());
    expect(payload.issueCode).toBe("malformed_review_response");
  });
});

describe("questions:review-ingest CLI — happy path and conflict", () => {
  it("accepts a valid independent review and advances the candidate, exiting 0", async () => {
    const { contentHash, blueprintHash } = await seedCandidate("candidate-cli-ri", "qwen");
    const responsePath = path.join(sandboxDir, "response.json");
    await writeFile(responsePath, JSON.stringify(reviewResponse({ candidateContentHash: contentHash, blueprintHash })), "utf8");

    const result = invoke(["--response", responsePath, "--json"]);
    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout.trim());
    expect(payload.status).toBe("accepted");
    expect(payload.gateOutcome.outcome).toBe("passed");
  });

  it("exits 5 on a changed review resubmitted under the same reviewId", async () => {
    const { contentHash, blueprintHash } = await seedCandidate("candidate-cli-ri", "qwen");
    const responsePath = path.join(sandboxDir, "response.json");
    await writeFile(responsePath, JSON.stringify(reviewResponse({ candidateContentHash: contentHash, blueprintHash })), "utf8");

    const first = invoke(["--response", responsePath, "--json"]);
    expect(first.exitCode).toBe(0);

    await writeFile(
      responsePath,
      JSON.stringify(reviewResponse({ candidateContentHash: contentHash, blueprintHash, confidence: 0.99, findings: ["Changed."] })),
      "utf8",
    );
    const second = invoke(["--response", responsePath, "--json"]);
    expect(second.exitCode).toBe(5);
    const payload = JSON.parse(second.stdout.trim());
    expect(payload.issueCode).toBe("review_id_conflict");
  });

  it("exits 2 and rejects (no mutation) a self-review attempt", async () => {
    const { contentHash, blueprintHash } = await seedCandidate("candidate-cli-ri", "claude");
    const responsePath = path.join(sandboxDir, "response.json");
    await writeFile(
      responsePath,
      JSON.stringify(reviewResponse({ candidateContentHash: contentHash, blueprintHash, reviewerModel: "claude" })),
      "utf8",
    );

    const result = invoke(["--response", responsePath, "--json"]);
    expect(result.exitCode).toBe(2);
    const payload = JSON.parse(result.stdout.trim());
    expect(payload.issueCode).toBe("self_review_rejected");
  });
});
