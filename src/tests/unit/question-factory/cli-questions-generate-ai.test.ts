import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createSandbox, runCli, type CliInvocationResult } from "./cli-test-helpers";

const SCRIPT = "scripts/questions-generate-ai.mts";

vi.setConfig({ testTimeout: 30_000 });

let sandboxDir: string;
let cleanup: () => Promise<void>;

beforeEach(async () => {
  const sandbox = await createSandbox("mm-cli-generate-ai-");
  sandboxDir = sandbox.dir;
  cleanup = sandbox.cleanup;
});

afterEach(async () => {
  await cleanup();
});

function invoke(args: readonly string[], env: Record<string, string> = {}): CliInvocationResult {
  return runCli(SCRIPT, args, {
    workspaceRoot: path.join(sandboxDir, "workspace"),
    env: {
      // Never let a developer's real shell-exported provider secrets leak
      // into this CLI's "no provider configured" test path.
      QF_AI_PROVIDER: "",
      ANTHROPIC_API_KEY: "",
      OPENAI_API_KEY: "",
      ...env,
    },
  });
}

describe("questions:generate-ai CLI — argument validation", () => {
  it("--help prints usage and exits non-zero without touching the workspace", () => {
    const result = invoke(["--help"]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/Usage: questions:generate-ai/);
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
});

describe("questions:generate-ai CLI — no provider configured", () => {
  it("stops cleanly with a configuration message and never crashes when QF_AI_PROVIDER is unset", () => {
    const result = invoke(["--batch-id", "batch-001"]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/provider_not_configured/);
    expect(result.stderr).toMatch(/No AI provider configured/);
  });

  it("stops cleanly when QF_AI_PROVIDER=anthropic but ANTHROPIC_API_KEY is unset", () => {
    const result = invoke(["--batch-id", "batch-001"], { QF_AI_PROVIDER: "anthropic" });
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/ANTHROPIC_API_KEY/);
  });

  it("emits a single machine-readable JSON line with --json", () => {
    const result = invoke(["--batch-id", "batch-001", "--json"]);
    expect(result.exitCode).toBe(2);
    const payload = JSON.parse(result.stdout.trim()) as { ok: boolean; errorCode: string };
    expect(payload.ok).toBe(false);
    expect(payload.errorCode).toBe("provider_not_configured");
  });
});
