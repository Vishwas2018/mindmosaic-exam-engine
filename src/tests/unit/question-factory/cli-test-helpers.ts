import { spawnSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Real-subprocess CLI test support for the Mission 3A `questions:prompt`
 * and `questions:ingest` scripts. Spawns the actual `tsx`-run entry point
 * (never calls an internal command function directly), so these tests
 * exercise argument parsing, exit codes, and stdout/stderr framing exactly
 * as a real operator invocation would.
 *
 * Sandboxing: the CLI scripts resolve their repository root via
 * `getWorkspaceRoot()`, which joins `process.cwd()` with the fixed
 * `content/question-factory` path and has no CLI flag to override it.
 * Because `tsx`'s own `@/*` alias resolution requires the subprocess's
 * `cwd` to stay the real repo root, these tests can't redirect the
 * workspace by changing `cwd`. Instead they set
 * `MINDMOSAIC_QUESTION_FACTORY_ROOT` (see `config/paths.ts`), an opt-in
 * environment override read only when present, to point the CLI's
 * repository root at a disposable temp directory — the real
 * `content/question-factory/` is never touched by these tests.
 */

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const TSX_CLI = path.join(REPO_ROOT, "node_modules", "tsx", "dist", "cli.mjs");

export interface CliInvocationResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly timedOut: boolean;
}

export function runCli(
  scriptRelativePath: string,
  args: readonly string[],
  options: { readonly workspaceRoot?: string; readonly env?: Readonly<Record<string, string>> } = {},
): CliInvocationResult {
  const scriptPath = path.join(REPO_ROOT, scriptRelativePath);
  const result = spawnSync(process.execPath, [TSX_CLI, scriptPath, ...args], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    timeout: 20_000,
    env: {
      ...process.env,
      ...(options.workspaceRoot !== undefined
        ? { MINDMOSAIC_QUESTION_FACTORY_ROOT: options.workspaceRoot }
        : {}),
      ...options.env,
    },
  });

  return {
    exitCode: result.status ?? -1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    timedOut: result.signal === "SIGTERM" && result.status === null,
  };
}

/** Creates a fresh disposable sandbox directory for one test's CLI invocation(s); caller must `await cleanup()`. */
export async function createSandbox(prefix: string): Promise<{ readonly dir: string; readonly cleanup: () => Promise<void> }> {
  const dir = await mkdtemp(path.join(tmpdir(), prefix));
  // maxRetries/retryDelay: a just-exited subprocess can leave Windows still
  // releasing a file handle for a moment after this process observes it as
  // exited, which makes an immediate rmdir fail with ENOTEMPTY/EBUSY under
  // load — retry rather than let cleanup itself flake the suite.
  return { dir, cleanup: () => rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }) };
}
