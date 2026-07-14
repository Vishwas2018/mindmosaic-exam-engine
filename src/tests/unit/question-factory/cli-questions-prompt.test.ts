import { mkdir, readFile, writeFile } from "node:fs/promises";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createSandbox, runCli, type CliInvocationResult } from "./cli-test-helpers";

const SCRIPT = "scripts/questions-prompt.mts";

// Each test spawns a real `tsx` subprocess (a full TypeScript module-graph
// cold start, ~1s in isolation) — under a fully parallel full-suite run
// that can stretch well past the default 5s test timeout, so bump this
// file's default rather than risk a loaded-CI-box flake.
vi.setConfig({ testTimeout: 30_000 });

function validBlueprint(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "batch-cli-bp-001",
    batchId: "batch-cli",
    yearLevel: "year-5",
    examStyle: "naplan_style",
    subject: "numeracy",
    strand: "Number and Algebra",
    skill: "numeracy.addition.two-digit",
    difficulty: "easy",
    questionType: "number_entry",
    targetCount: 5,
    marks: 1,
    estimatedTimeSeconds: 45,
    learningObjective: "Add two whole numbers.",
    misconceptionTargets: [],
    reasoningSteps: 1,
    accessibilityConstraints: [],
    originalityConstraints: [],
    generationConstraints: [],
    ...overrides,
  };
}

let sandboxDir: string;
let cleanup: () => Promise<void>;

beforeEach(async () => {
  const sandbox = await createSandbox("mm-cli-prompt-");
  sandboxDir = sandbox.dir;
  cleanup = sandbox.cleanup;
});

afterEach(async () => {
  await cleanup();
});

function invoke(args: readonly string[]): CliInvocationResult {
  return runCli(SCRIPT, args, { workspaceRoot: path.join(sandboxDir, "workspace") });
}

describe("questions:prompt CLI — help and argument validation", () => {
  it("--help prints usage and exits non-zero without touching the workspace", () => {
    const result = invoke(["--help"]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/Usage: questions:prompt/);
  });

  it("-h behaves identically to --help", () => {
    const result = invoke(["-h"]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/Usage: questions:prompt/);
  });

  it("exits 2 with usage when no selection flag is given", () => {
    const result = invoke([]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/Exactly one of --blueprint, --blueprint-id, or --batch-id is required/);
  });

  it("exits 2 on an unrecognised argument", () => {
    const result = invoke(["--not-a-real-flag"]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/Unrecognised argument/);
  });

  it("exits 2 when more than one selection flag is given", () => {
    const result = invoke(["--blueprint", "a.json", "--blueprint-id", "bp-1"]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/Exactly one of/);
  });
});

describe("questions:prompt CLI — successful build", () => {
  it("--blueprint plus --stdout --json prints a single JSON result line and exits 0", async () => {
    const bpPath = path.join(sandboxDir, "bp.json");
    await writeFile(bpPath, JSON.stringify(validBlueprint()), "utf8");

    const result = invoke(["--blueprint", bpPath, "--stdout", "--json"]);
    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout.trim());
    expect(payload.ok).toBe(true);
    expect(payload.batchId).toBe("batch-cli");
    expect(typeof payload.promptHash).toBe("string");
    expect(payload.stdoutOnly).toBe(true);
  });

  it("--stdout without --json prints the full pack JSON, including the governance/blueprint fencing fields", async () => {
    const bpPath = path.join(sandboxDir, "bp.json");
    await writeFile(bpPath, JSON.stringify(validBlueprint()), "utf8");

    const result = invoke(["--blueprint", bpPath, "--stdout"]);
    expect(result.exitCode).toBe(0);
    const pack = JSON.parse(result.stdout.trim());
    expect(pack.batchId).toBe("batch-cli");
    expect(pack.blueprintDataNotice).toMatch(/untrusted candidate data/i);
    expect(pack.responseSchemaDescription).toMatch(/stimulus/i);
    expect(pack.responseSchemaDescription).toMatch(/interaction/i);
    expect(Array.isArray(pack.instructions)).toBe(true);
  });

  it("--out writes the pack to the given file and exits 0", async () => {
    const bpPath = path.join(sandboxDir, "bp.json");
    const outPath = path.join(sandboxDir, "out", "pack.json");
    await writeFile(bpPath, JSON.stringify(validBlueprint()), "utf8");

    const result = invoke(["--blueprint", bpPath, "--out", outPath, "--json"]);
    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout.trim());
    expect(payload.ok).toBe(true);
    expect(payload.promptPackPath).toBe(outPath);

    const written = JSON.parse(await readFile(outPath, "utf8"));
    expect(written.pack.batchId).toBe("batch-cli");
    expect(written.promptHash).toBe(payload.promptHash);
  });
});

describe("questions:prompt CLI — overwrite refusal", () => {
  it("refuses to overwrite an existing --out file without --force (exit 5)", async () => {
    const bpPath = path.join(sandboxDir, "bp.json");
    const outPath = path.join(sandboxDir, "pack.json");
    await writeFile(bpPath, JSON.stringify(validBlueprint()), "utf8");

    const first = invoke(["--blueprint", bpPath, "--out", outPath, "--json"]);
    expect(first.exitCode).toBe(0);

    const second = invoke(["--blueprint", bpPath, "--out", outPath, "--json"]);
    expect(second.exitCode).toBe(5);
    const payload = JSON.parse(second.stdout.trim());
    expect(payload.ok).toBe(false);
    expect(payload.errorCode).toBe("prompt_output_exists");
  });

  it("overwrites an existing --out file when --force is passed (exit 0)", async () => {
    const bpPath = path.join(sandboxDir, "bp.json");
    const outPath = path.join(sandboxDir, "pack.json");
    await writeFile(bpPath, JSON.stringify(validBlueprint()), "utf8");

    const first = invoke(["--blueprint", bpPath, "--out", outPath, "--json"]);
    expect(first.exitCode).toBe(0);

    const second = invoke(["--blueprint", bpPath, "--out", outPath, "--force", "--json"]);
    expect(second.exitCode).toBe(0);
    const payload = JSON.parse(second.stdout.trim());
    expect(payload.ok).toBe(true);
  });

  it("refuses to overwrite an existing repository-backed report without --force (exit 5)", async () => {
    const bpPath = path.join(sandboxDir, "bp.json");
    await writeFile(bpPath, JSON.stringify(validBlueprint()), "utf8");

    const first = invoke(["--blueprint", bpPath, "--json"]);
    expect(first.exitCode).toBe(0);

    const second = invoke(["--blueprint", bpPath, "--json"]);
    expect(second.exitCode).toBe(5);
    const payload = JSON.parse(second.stdout.trim());
    expect(payload.errorCode).toBe("prompt_output_exists");
  });
});

describe("questions:prompt CLI — failure exit codes", () => {
  it("exits 1 (internal_error) when the --blueprint file does not exist", () => {
    const result = invoke(["--blueprint", path.join(sandboxDir, "does-not-exist.json"), "--json"]);
    expect(result.exitCode).toBe(1);
    const payload = JSON.parse(result.stdout.trim());
    expect(payload.errorCode).toBe("internal_error");
  });

  it("exits 4 (not_found) for an unknown --blueprint-id", () => {
    const result = invoke(["--blueprint-id", "does-not-exist", "--json"]);
    expect(result.exitCode).toBe(4);
    const payload = JSON.parse(result.stdout.trim());
    expect(payload.errorCode).toBe("not_found");
  });

  it("exits 4 (not_found) for a --batch-id with no persisted blueprints", () => {
    const result = invoke(["--batch-id", "no-such-batch", "--json"]);
    expect(result.exitCode).toBe(4);
    const payload = JSON.parse(result.stdout.trim());
    expect(payload.errorCode).toBe("not_found");
  });

  it("exits 2 (prompt_blueprint_invalid) for a blueprint that fails schema validation", async () => {
    const bpPath = path.join(sandboxDir, "bp.json");
    await writeFile(bpPath, JSON.stringify(validBlueprint({ marks: -1 })), "utf8");

    const result = invoke(["--blueprint", bpPath, "--json"]);
    expect(result.exitCode).toBe(2);
    const payload = JSON.parse(result.stdout.trim());
    expect(payload.errorCode).toBe("prompt_blueprint_invalid");
  });
});

describe("questions:prompt CLI — path handling", () => {
  it("handles a --blueprint path and --out path that both contain spaces", async () => {
    const spacedDir = path.join(sandboxDir, "dir with spaces");
    await mkdir(spacedDir, { recursive: true });
    const bpPath = path.join(spacedDir, "blue print.json");
    const outPath = path.join(spacedDir, "out pack.json");
    await writeFile(bpPath, JSON.stringify(validBlueprint()), "utf8");

    const result = invoke(["--blueprint", bpPath, "--out", outPath, "--json"]);
    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout.trim());
    expect(payload.ok).toBe(true);
    expect(payload.promptPackPath).toBe(outPath);
    const written = JSON.parse(await readFile(outPath, "utf8"));
    expect(written.pack.batchId).toBe("batch-cli");
  });

  it("accepts a --blueprint path using forward slashes on a native Windows path (mixed separators)", async () => {
    const bpPath = path.join(sandboxDir, "bp.json");
    await writeFile(bpPath, JSON.stringify(validBlueprint()), "utf8");
    const forwardSlashed = bpPath.replaceAll("\\", "/");

    const result = invoke(["--blueprint", forwardSlashed, "--stdout", "--json"]);
    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout.trim());
    expect(payload.ok).toBe(true);
  });

  it("writes correctly to an --out path nested under a directory that does not yet exist", async () => {
    const bpPath = path.join(sandboxDir, "bp.json");
    const outPath = path.join(sandboxDir, "nested", "deeper", "pack.json");
    await writeFile(bpPath, JSON.stringify(validBlueprint()), "utf8");

    const result = invoke(["--blueprint", bpPath, "--out", outPath, "--json"]);
    expect(result.exitCode).toBe(0);
    const written = JSON.parse(await readFile(outPath, "utf8"));
    expect(written.pack.batchId).toBe("batch-cli");
  });
});
