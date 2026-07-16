import { mkdir, writeFile } from "node:fs/promises";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createSandbox, runCli, type CliInvocationResult } from "./cli-test-helpers";

const SCRIPT = "scripts/questions-revise.mts";

vi.setConfig({ testTimeout: 30_000 });

let sandboxDir: string;
let cleanup: () => Promise<void>;

beforeEach(async () => {
  const sandbox = await createSandbox("mm-cli-revise-");
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

async function seedParent(candidateId: string): Promise<{ readonly contentHash: string; readonly blueprintHash: string }> {
  const { FsFactoryRepository } = await import("@/features/question-factory/storage");
  const { hashJson } = await import("@/features/question-factory/provenance");
  const { normaliseIdentityOrThrow } = await import("@/features/question-factory/config");
  const repo = new FsFactoryRepository(workspaceRoot());

  const blueprint = {
    id: "bp-cli-revise",
    batchId: "batch-cli-revise",
    yearLevel: "year-5",
    examStyle: "naplan_style",
    subject: "reading",
    strand: "Reading",
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
  const contentHash = hashJson(question);
  await repo.create("review-queue", candidateId, {
    candidateId,
    state: "needs_revision",
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
  return { contentHash, blueprintHash: hashJson(blueprint) };
}

function revisionRequest(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    revisionRequestId: "rev-req-cli-1",
    parentCandidateId: "candidate-cli-revise",
    parentContentHash: "placeholder",
    parentRevision: 0,
    parentBlueprintHash: "placeholder",
    revisedContent: {
      id: "candidate-cli-revise",
      type: "short_answer",
      yearLevel: 5,
      examStyle: "naplan_style",
      prompt: "What is the main idea of the passage, corrected?",
      options: [],
      visuals: [],
      answerKey: { kind: "text", acceptableAnswers: ["friendship"] },
      explanation: "The passage centres on friendship.",
      metadata: {
        subject: "reading",
        strand: "Reading",
        topic: "Inference",
        skill: "lit.reading.inference",
        difficulty: "medium",
        marks: 2,
        estimatedTimeSeconds: 90,
        tags: [],
        locale: "en-AU",
        source: "original",
        schemaVersion: 1,
      },
    },
    authorModel: "claude",
    requestedAt: "2026-07-16T00:00:00.000Z",
    ...overrides,
  };
}

describe("questions:revise CLI — help and argument validation", () => {
  it("--help prints usage and exits non-zero", () => {
    const result = invoke(["--help"]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/Usage: questions:revise/);
  });

  it("exits 2 when --request is missing", () => {
    const result = invoke([]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/--request is required/);
  });

  it("exits 4 when the request file does not exist", () => {
    const result = invoke(["--request", path.join(sandboxDir, "does-not-exist.json"), "--json"]);
    expect(result.exitCode).toBe(4);
  });

  it("exits 2 on unparseable JSON", async () => {
    const requestPath = path.join(sandboxDir, "broken.json");
    await mkdir(sandboxDir, { recursive: true });
    await writeFile(requestPath, "{ this is not valid json", "utf8");

    const result = invoke(["--request", requestPath, "--json"]);
    expect(result.exitCode).toBe(2);
    const payload = JSON.parse(result.stdout.trim());
    expect(payload.issueCode).toBe("malformed_revision_request");
  });
});

describe("questions:revise CLI — eligibility", () => {
  it("exits 4 for an unknown parent candidate", async () => {
    const requestPath = path.join(sandboxDir, "request.json");
    await mkdir(sandboxDir, { recursive: true });
    await writeFile(requestPath, JSON.stringify(revisionRequest()), "utf8");

    const result = invoke(["--request", requestPath, "--json"]);
    expect(result.exitCode).toBe(4);
    const payload = JSON.parse(result.stdout.trim());
    expect(payload.issueCode).toBe("unknown_parent_candidate");
  });

  it("exits 2 for a parent not at needs_revision", async () => {
    const { FsFactoryRepository } = await import("@/features/question-factory/storage");
    const repo = new FsFactoryRepository(workspaceRoot());
    await repo.create("review-queue", "candidate-cli-revise", { candidateId: "candidate-cli-revise", state: "generated", question: {}, provenance: {} });

    const requestPath = path.join(sandboxDir, "request.json");
    await mkdir(sandboxDir, { recursive: true });
    await writeFile(requestPath, JSON.stringify(revisionRequest()), "utf8");

    const result = invoke(["--request", requestPath, "--json"]);
    expect(result.exitCode).toBe(2);
    const payload = JSON.parse(result.stdout.trim());
    expect(payload.issueCode).toBe("invalid_revision_source_state");
  });
});

describe("questions:revise CLI — happy path, replay and conflicts", () => {
  it("accepts a valid revision and creates the linked successor, exiting 0", async () => {
    const { contentHash, blueprintHash } = await seedParent("candidate-cli-revise");
    const requestPath = path.join(sandboxDir, "request.json");
    await mkdir(sandboxDir, { recursive: true });
    await writeFile(requestPath, JSON.stringify(revisionRequest({ parentContentHash: contentHash, parentBlueprintHash: blueprintHash })), "utf8");

    const result = invoke(["--request", requestPath, "--json"]);
    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout.trim());
    expect(payload.status).toBe("accepted");
    expect(payload.candidateId).toMatch(/^rev-/);
    expect(payload.replayed).toBe(false);
  });

  it("an identical resubmission replays cleanly, exit 0", async () => {
    const { contentHash, blueprintHash } = await seedParent("candidate-cli-revise");
    const requestPath = path.join(sandboxDir, "request.json");
    await mkdir(sandboxDir, { recursive: true });
    await writeFile(requestPath, JSON.stringify(revisionRequest({ parentContentHash: contentHash, parentBlueprintHash: blueprintHash })), "utf8");

    const first = invoke(["--request", requestPath, "--json"]);
    expect(first.exitCode).toBe(0);
    const second = invoke(["--request", requestPath, "--json"]);
    expect(second.exitCode).toBe(0);
    const payload = JSON.parse(second.stdout.trim());
    expect(payload.replayed).toBe(true);
  });

  it("exits 5 with revision_request_conflict when the same revisionRequestId is resubmitted with different content", async () => {
    const { contentHash, blueprintHash } = await seedParent("candidate-cli-revise");
    const requestPath = path.join(sandboxDir, "request.json");
    await mkdir(sandboxDir, { recursive: true });
    await writeFile(requestPath, JSON.stringify(revisionRequest({ parentContentHash: contentHash, parentBlueprintHash: blueprintHash })), "utf8");
    expect(invoke(["--request", requestPath, "--json"]).exitCode).toBe(0);

    const changed = revisionRequest({
      parentContentHash: contentHash,
      parentBlueprintHash: blueprintHash,
      revisedContent: { ...revisionRequest().revisedContent as Record<string, unknown>, prompt: "A completely different corrected prompt." },
    });
    await writeFile(requestPath, JSON.stringify(changed), "utf8");
    const result = invoke(["--request", requestPath, "--json"]);
    expect(result.exitCode).toBe(5);
    const payload = JSON.parse(result.stdout.trim());
    expect(payload.issueCode).toBe("revision_request_conflict");
  });

  it("exits 5 with revision_parent_conflict when a different revisionRequestId targets an already-claimed parent", async () => {
    const { contentHash, blueprintHash } = await seedParent("candidate-cli-revise");
    const requestPath = path.join(sandboxDir, "request.json");
    await mkdir(sandboxDir, { recursive: true });
    await writeFile(requestPath, JSON.stringify(revisionRequest({ parentContentHash: contentHash, parentBlueprintHash: blueprintHash })), "utf8");
    expect(invoke(["--request", requestPath, "--json"]).exitCode).toBe(0);

    const divergent = revisionRequest({
      revisionRequestId: "rev-req-cli-divergent",
      parentContentHash: contentHash,
      parentBlueprintHash: blueprintHash,
      revisedContent: { ...revisionRequest().revisedContent as Record<string, unknown>, prompt: "A divergent correction." },
    });
    await writeFile(requestPath, JSON.stringify(divergent), "utf8");
    const result = invoke(["--request", requestPath, "--json"]);
    expect(result.exitCode).toBe(5);
    const payload = JSON.parse(result.stdout.trim());
    expect(payload.issueCode).toBe("revision_parent_conflict");
  });
});
