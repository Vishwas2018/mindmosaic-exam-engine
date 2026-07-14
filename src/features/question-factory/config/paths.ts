import * as path from "node:path";

/**
 * Repo-relative path roots. `getWorkspaceRoot` resolves against
 * `process.cwd()`, matching how CLI scripts (`scripts/*.mts`, run via
 * tsx from the repo root) and Next.js both resolve paths - callers that
 * need a different root (tests, an isolated fixture bank) construct
 * their own path instead of relying on the default.
 */
export const CONTENT_WORKSPACE_RELATIVE_PATH = path.join("content", "question-factory");
export const PRODUCTION_QUESTIONS_RELATIVE_PATH = path.join("src", "content", "questions");
export const GENERATED_QUESTIONS_RELATIVE_PATH = path.join(
  PRODUCTION_QUESTIONS_RELATIVE_PATH,
  "generated",
);

/**
 * Opt-in escape hatch, read only when set: lets a real `tsx`-invoked CLI
 * subprocess (`scripts/questions-prompt.mts`, `scripts/questions-ingest.mts`)
 * be pointed at an isolated, disposable workspace directory in a test
 * rather than the real `content/question-factory/` — the CLI scripts have
 * no other way to accept an injected repository root, and `tsx`'s own
 * `@/*` alias resolution requires the process's `cwd` to stay the real repo
 * root, so redirecting via `cwd` alone isn't an option. Never read by
 * production application code paths that already pass their own `cwd`.
 */
const WORKSPACE_ROOT_OVERRIDE_ENV_VAR = "MINDMOSAIC_QUESTION_FACTORY_ROOT";

export function getWorkspaceRoot(cwd: string = process.cwd()): string {
  const override = process.env[WORKSPACE_ROOT_OVERRIDE_ENV_VAR];
  if (override) {
    return path.isAbsolute(override) ? override : path.join(cwd, override);
  }
  return path.join(cwd, CONTENT_WORKSPACE_RELATIVE_PATH);
}

export function getProductionQuestionsRoot(cwd: string = process.cwd()): string {
  return path.join(cwd, PRODUCTION_QUESTIONS_RELATIVE_PATH);
}

/**
 * Root of the Mission 3A inbox — the workspace's reserved `inbox`
 * compartment directory (`content/question-factory/inbox/`). Unprocessed
 * drops live directly here; `manual-ingestion/inbox-transaction.ts` derives
 * its `processed/`, `quarantine/`, `.processing/`, and `.locks/`
 * sub-paths from whichever inbox root a run actually resolves to (this
 * default, or a caller-supplied override), rather than each having its own
 * `cwd`-rooted helper here — a caller-supplied override would otherwise
 * have no matching helper to derive its own sub-paths from.
 */
export function getInboxRoot(cwd: string = process.cwd()): string {
  return path.join(getWorkspaceRoot(cwd), "inbox");
}
