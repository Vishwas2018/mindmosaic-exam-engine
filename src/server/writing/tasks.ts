import "server-only";

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  selectApprovedWritingPrompts,
  type WritingPromptEligibilityReport,
} from "@/features/content-governance/publication-integrity";
import { isWritingPreviewAllowed } from "@/features/writing/preview-gate";
import { DEV_FIXTURE_WRITING_TASK, type WritingTask } from "@/features/writing/task";

/** Where `content:record-approvals` writes writing-prompt approval records. */
export const WRITING_APPROVALS_RELATIVE_PATH = "content/publication-approvals/writing-prompts";

type Env = Readonly<Record<string, string | undefined>>;

/**
 * Reads and verifies the approval records. A missing directory is simply "no
 * prompt has been approved yet". An unreadable file is a problem, and any
 * problem serves nothing at all (fail closed), as the question loader does.
 */
export function loadApprovedWritingPrompts(directory: string): WritingPromptEligibilityReport {
  const records: unknown[] = [];
  const readProblems: string[] = [];
  let files: string[] = [];
  try {
    files = readdirSync(directory).filter((file) => file.endsWith(".json")).sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      readProblems.push(`Unreadable writing approval directory: ${path.basename(directory)}`);
    }
  }
  for (const file of files) {
    try {
      records.push(JSON.parse(readFileSync(path.join(directory, file), "utf8")));
    } catch {
      readProblems.push(`Unreadable writing approval evidence: ${file}`);
    }
  }
  const report = selectApprovedWritingPrompts(records);
  const problems = [...readProblems, ...report.problems];
  return problems.length > 0
    ? { prompts: Object.freeze([]), approvals: new Map(), problems }
    : report;
}

let cached: WritingPromptEligibilityReport | undefined;

/** Node-only and immutable within a deployment; traced into the server bundle by next.config.ts. */
export function getWritingPromptEligibility(): WritingPromptEligibilityReport {
  cached ??= loadApprovedWritingPrompts(path.join(process.cwd(), WRITING_APPROVALS_RELATIVE_PATH));
  return cached;
}

/**
 * The tasks a child may reach: approved prompts (the verified snapshot inside
 * each approval record) and, only when the dev preview gate is open, the
 * seeded fixture. With no approval records this is empty and every real
 * writing route answers 404.
 */
export function listWritingTasks(
  env: Env = process.env,
  approved: readonly WritingTask[] = getWritingPromptEligibility().prompts,
): readonly WritingTask[] {
  return isWritingPreviewAllowed(env) ? [...approved, DEV_FIXTURE_WRITING_TASK] : approved;
}

export function resolveWritingTask(
  id: string,
  env: Env = process.env,
  approved?: readonly WritingTask[],
): WritingTask | null {
  return listWritingTasks(env, approved).find((task) => task.id === id) ?? null;
}
