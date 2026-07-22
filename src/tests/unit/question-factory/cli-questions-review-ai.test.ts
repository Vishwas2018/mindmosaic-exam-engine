import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createSandbox, runCli, type CliInvocationResult } from "./cli-test-helpers";

const SCRIPT = "scripts/questions-review-ai.mts";

vi.setConfig({ testTimeout: 30_000 });

let sandboxDir: string;
let cleanup: () => Promise<void>;

beforeEach(async () => {
  const sandbox = await createSandbox("mm-cli-review-ai-");
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
      QF_AI_PROVIDER: "",
      ANTHROPIC_API_KEY: "",
      OPENAI_API_KEY: "",
      ...env,
    },
  });
}

describe("questions:review-ai CLI — argument validation", () => {
  it("--help prints usage and exits non-zero without touching the workspace", () => {
    const result = invoke(["--help"]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/Usage: questions:review-ai/);
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

describe("questions:review-ai CLI — no provider configured", () => {
  it("stops cleanly with a configuration message and never crashes when QF_AI_PROVIDER is unset", () => {
    const result = invoke(["--candidate-id", "man-does-not-exist"]);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/provider_not_configured/);
    expect(result.stderr).toMatch(/No AI provider configured/);
  });

  it("stops cleanly when QF_AI_PROVIDER=openai but OPENAI_API_KEY is unset", () => {
    const result = invoke(["--candidate-id", "man-does-not-exist"], { QF_AI_PROVIDER: "openai" });
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/OPENAI_API_KEY/);
  });

  it("emits a single machine-readable JSON line with --json", () => {
    const result = invoke(["--candidate-id", "man-does-not-exist", "--json"]);
    expect(result.exitCode).toBe(2);
    const payload = JSON.parse(result.stdout.trim()) as { status: string; errorCode: string };
    expect(payload.status).toBe("rejected");
    expect(payload.errorCode).toBe("provider_not_configured");
  });
});
