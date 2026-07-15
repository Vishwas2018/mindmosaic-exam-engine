import { mkdir, readdir, writeFile } from "node:fs/promises";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createSandbox, runCli, type CliInvocationResult } from "./cli-test-helpers";

const SCRIPT = "scripts/questions-ingest.mts";

// Each test spawns a real `tsx` subprocess (a full TypeScript module-graph
// cold start, ~1s in isolation) — under a fully parallel full-suite run
// that can stretch well past the default 5s test timeout, so bump this
// file's default rather than risk a loaded-CI-box flake.
vi.setConfig({ testTimeout: 30_000 });

function validCandidate(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
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
      strand: "Number and Algebra",
      skill: "numeracy.addition.two-digit",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 45,
      tags: [],
    },
    ...overrides,
  };
}

let sandboxDir: string;
let cleanup: () => Promise<void>;

beforeEach(async () => {
  const sandbox = await createSandbox("mm-cli-ingest-");
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

async function writeInboxFile(inboxDir: string, fileName: string, content: unknown): Promise<void> {
  await mkdir(inboxDir, { recursive: true });
  await writeFile(
    path.join(inboxDir, fileName),
    typeof content === "string" ? content : JSON.stringify(content),
    "utf8",
  );
}

describe("questions:ingest CLI — help and argument validation", () => {
  it("--help prints usage and exits non-zero", () => {
    const result = invoke(["--help"]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/Usage: questions:ingest/);
  });

  it("exits 2 with usage when no arguments are given", () => {
    const result = invoke([]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/--source is required/);
  });

  it("exits 2 when --source is missing", () => {
    const result = invoke(["--batch-id", "b1", "--prompt-version", "v1"]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/--source is required/);
  });

  it("exits 2 for an invalid --source value", () => {
    const result = invoke(["--source", "not-a-real-source", "--batch-id", "b1", "--prompt-version", "v1"]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/--source is required and must be one of/);
  });

  it("exits 2 when --source other is given without --model", () => {
    const result = invoke(["--source", "other", "--batch-id", "b1", "--prompt-version", "v1"]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/--model is required when --source is 'other'/);
  });

  it("exits 2 when --batch-id is missing", () => {
    const result = invoke(["--source", "claude", "--prompt-version", "v1"]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/--batch-id is required/);
  });

  it("exits 2 when --prompt-version is missing", () => {
    const result = invoke(["--source", "claude", "--batch-id", "b1"]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/--prompt-version is required/);
  });

  it("exits 2 on an unrecognised argument", () => {
    const result = invoke(["--not-a-real-flag"]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/Unrecognised argument/);
  });
});

describe("questions:ingest CLI — successful ingestion", () => {
  it("ingests one valid candidate and exits 0 with a parseable --json summary", async () => {
    const inboxDir = path.join(sandboxDir, "inbox");
    await writeInboxFile(inboxDir, "candidate1.json", validCandidate());

    const result = invoke([
      "--source",
      "claude",
      "--batch-id",
      "batch-cli-ingest",
      "--prompt-version",
      "v1",
      "--inbox",
      inboxDir,
      "--json",
    ]);

    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout.trim());
    expect(payload.status).toBe("completed");
    expect(payload.result.filesScanned).toBe(1);
    expect(payload.result.candidatesCreated).toBe(1);
    expect(payload.result.filesQuarantined).toBe(0);
    expect(payload.result.candidatesRejected).toBe(0);
  });

  it("prints a human-readable summary without --json", async () => {
    const inboxDir = path.join(sandboxDir, "inbox");
    await writeInboxFile(inboxDir, "candidate1.json", validCandidate());

    const result = invoke([
      "--source",
      "claude",
      "--batch-id",
      "batch-cli-ingest",
      "--prompt-version",
      "v1",
      "--inbox",
      inboxDir,
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/Ingestion complete for batch 'batch-cli-ingest'/);
    expect(result.stdout).toMatch(/candidates created:\s*1/);
  });

  it("--dry-run performs no repository writes", async () => {
    const inboxDir = path.join(sandboxDir, "inbox");
    await writeInboxFile(inboxDir, "candidate1.json", validCandidate());

    const result = invoke([
      "--source",
      "claude",
      "--batch-id",
      "batch-cli-ingest",
      "--prompt-version",
      "v1",
      "--inbox",
      inboxDir,
      "--dry-run",
      "--json",
    ]);

    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout.trim());
    expect(payload.result.dryRun).toBe(true);
    // Dry run never writes, so `candidatesCreated` (a `written === true` count)
    // is legitimately 0 — the candidate was still recognised as valid and
    // "accepted" within the simulated file result, just never persisted.
    expect(payload.result.candidatesCreated).toBe(0);
    const fileResult = payload.result.fileResults[0];
    expect(fileResult.candidateResults[0].status).toBe("accepted");
    expect(fileResult.candidateResults[0].written).toBe(false);

    await expect(readdir(path.join(workspaceRoot(), "generated"))).rejects.toThrow();
  });

  it("a second identical run replays rather than duplicating (already-processed inbox file yields zero new candidates)", async () => {
    const inboxDir = path.join(sandboxDir, "inbox");
    await writeInboxFile(inboxDir, "candidate1.json", validCandidate());

    const first = invoke([
      "--source",
      "claude",
      "--batch-id",
      "batch-cli-ingest",
      "--prompt-version",
      "v1",
      "--inbox",
      inboxDir,
      "--json",
    ]);
    expect(first.exitCode).toBe(0);
    expect(JSON.parse(first.stdout.trim()).result.candidatesCreated).toBe(1);

    const second = invoke([
      "--source",
      "claude",
      "--batch-id",
      "batch-cli-ingest",
      "--prompt-version",
      "v1",
      "--inbox",
      inboxDir,
      "--json",
    ]);
    expect(second.exitCode).toBe(0);
    const secondPayload = JSON.parse(second.stdout.trim());
    expect(secondPayload.result.filesScanned).toBe(0);
    expect(secondPayload.result.candidatesCreated).toBe(0);
  });
});

describe("questions:ingest CLI — PB1 provenance remediation (claude-fable-5)", () => {
  it("--model claude-fable-5 is accepted and records the real identity, not a claude-sonnet-5 fallback", async () => {
    const inboxDir = path.join(sandboxDir, "inbox");
    await writeInboxFile(inboxDir, "candidate1.json", validCandidate());

    const result = invoke([
      "--source",
      "claude",
      "--model",
      "claude-fable-5",
      "--batch-id",
      "batch-cli-ingest-fable",
      "--prompt-version",
      "v1",
      "--inbox",
      inboxDir,
      "--json",
    ]);

    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout.trim());
    expect(payload.status).toBe("completed");
    expect(payload.result.candidatesCreated).toBe(1);

    const candidate = payload.result.fileResults[0].candidateResults[0].candidate;
    expect(candidate.provenance.generatorAdapter.identity).toEqual({
      provider: "anthropic",
      modelId: "claude-fable-5",
      modelFamily: "claude",
      interactionMode: "api",
    });
    expect(candidate.provenance.generatorAdapter.identity.modelId).not.toBe("claude-sonnet-5");
  });

  it("bare --source claude (no --model) still records claude-sonnet-5 — unrelated Claude aliases are unaffected by the new entry", async () => {
    const inboxDir = path.join(sandboxDir, "inbox");
    await writeInboxFile(inboxDir, "candidate1.json", validCandidate());

    const result = invoke([
      "--source",
      "claude",
      "--batch-id",
      "batch-cli-ingest-default",
      "--prompt-version",
      "v1",
      "--inbox",
      inboxDir,
      "--json",
    ]);

    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout.trim());
    const candidate = payload.result.fileResults[0].candidateResults[0].candidate;
    expect(candidate.provenance.generatorAdapter.identity.modelId).toBe("claude-sonnet-5");
  });

  it("an unrecognised model is still rejected outright, never silently mapped to claude-fable-5 or any other identity", () => {
    const inboxDir = path.join(sandboxDir, "inbox");
    const result = invoke([
      "--source",
      "claude",
      "--model",
      "claude-fable-6-does-not-exist",
      "--batch-id",
      "batch-cli-ingest-bad-model",
      "--prompt-version",
      "v1",
      "--inbox",
      inboxDir,
      "--json",
    ]);

    expect(result.exitCode).toBe(2);
    const payload = JSON.parse(result.stdout.trim());
    expect(payload.status).toBe("request_invalid");
    expect(payload.errorCode).toBe("source_identity_invalid");
  });
});

describe("questions:ingest CLI — failure and partial-failure exit codes", () => {
  it("exits 3 (partial) and quarantines a malformed (unparseable) inbox file", async () => {
    const inboxDir = path.join(sandboxDir, "inbox");
    await writeInboxFile(inboxDir, "broken.json", "{ this is not valid json");

    const result = invoke([
      "--source",
      "claude",
      "--batch-id",
      "batch-cli-ingest",
      "--prompt-version",
      "v1",
      "--inbox",
      inboxDir,
      "--json",
    ]);

    expect(result.exitCode).toBe(3);
    const payload = JSON.parse(result.stdout.trim());
    expect(payload.result.filesQuarantined).toBe(1);
  });

  it("exits 0 cleanly on an empty inbox (nothing to process is not a failure)", async () => {
    const inboxDir = path.join(sandboxDir, "inbox");
    await mkdir(inboxDir, { recursive: true });

    const result = invoke([
      "--source",
      "claude",
      "--batch-id",
      "batch-cli-ingest",
      "--prompt-version",
      "v1",
      "--inbox",
      inboxDir,
      "--json",
    ]);

    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout.trim());
    expect(payload.result.filesScanned).toBe(0);
  });
});

describe("questions:ingest CLI — path handling", () => {
  it("handles an --inbox path containing spaces", async () => {
    const inboxDir = path.join(sandboxDir, "inbox with spaces");
    await writeInboxFile(inboxDir, "candidate one.json", validCandidate());

    const result = invoke([
      "--source",
      "claude",
      "--batch-id",
      "batch-cli-ingest",
      "--prompt-version",
      "v1",
      "--inbox",
      inboxDir,
      "--json",
    ]);

    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout.trim());
    expect(payload.result.candidatesCreated).toBe(1);
  });

  it("accepts an --inbox path using forward slashes on a native Windows path (mixed separators)", async () => {
    const inboxDir = path.join(sandboxDir, "inbox");
    await writeInboxFile(inboxDir, "candidate1.json", validCandidate());
    const forwardSlashed = inboxDir.replaceAll("\\", "/");

    const result = invoke([
      "--source",
      "claude",
      "--batch-id",
      "batch-cli-ingest",
      "--prompt-version",
      "v1",
      "--inbox",
      forwardSlashed,
      "--json",
    ]);

    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout.trim());
    expect(payload.result.candidatesCreated).toBe(1);
  });
});
