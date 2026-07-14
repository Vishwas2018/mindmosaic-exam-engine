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

export function getWorkspaceRoot(cwd: string = process.cwd()): string {
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
