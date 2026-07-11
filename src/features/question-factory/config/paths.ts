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
