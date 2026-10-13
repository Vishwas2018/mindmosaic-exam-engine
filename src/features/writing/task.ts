import { z } from "zod";

import { scholarshipWrittenExpressionRubric } from "./rubrics/scholarship-written-expression";
import { isWritingPreviewAllowed } from "./preview-gate";
import type { WritingRubric } from "./rubric";

export const WRITING_FORMS = ["narrative", "persuasive", "descriptive", "informative", "expository"] as const;
export type WritingForm = (typeof WRITING_FORMS)[number];

/**
 * A writing task, independent of any exam style, subject or catalogue entry.
 * Scholarship, NAPLAN-style and ICAS-style writing all describe themselves with
 * this one shape; which programme a task belongs to is catalogue work and is
 * deliberately not modelled here.
 */
export const writingTaskSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/).max(80),
  title: z.string().min(1).max(100),
  form: z.enum(WRITING_FORMS),
  yearLevel: z.number().int().min(1).max(12),
  /** Everything the child reads. Never contains marking guidance. */
  prompt: z.string().min(40).max(1200),
  timeLimitMinutes: z.number().int().min(5).max(60),
  /** A guide, not a rule. The child is never stopped at a word count. */
  suggestedWords: z.object({ min: z.number().int().min(1), max: z.number().int().min(1) }).optional(),
  rubricId: z.string().default(scholarshipWrittenExpressionRubric.id),
});

export type WritingTask = z.infer<typeof writingTaskSchema>;

/**
 * Tasks a child may reach. EMPTY ON PURPOSE.
 *
 * The first set of prompts lives in content/writing-drafts as unsigned drafts.
 * Nothing under src/ imports that folder (src/tests/unit/writing-drafts.test.ts
 * enforces it), and a prompt joins this list only through the same human
 * approval (`approvedBy`) every other piece of MindMosaic content goes through.
 * Until then the real routes answer 404 for every task id: fail closed.
 */
export const PUBLISHED_WRITING_TASKS: readonly WritingTask[] = [];

/**
 * Dev preview only. Reachable exactly when the preview gate is open, which is
 * never in production and never when VERCEL_ENV is "production". It is not one
 * of the draft prompts and is not meant to be a good one.
 */
export const DEV_FIXTURE_WRITING_TASK: WritingTask = writingTaskSchema.parse({
  id: "dev-fixture-written-expression",
  title: "Dev fixture: a day something small changed",
  form: "narrative",
  yearLevel: 6,
  prompt:
    "Write about a day when something small changed everything. It could be a lost key, a late bus or an unexpected message. Show what happened and how the day ended.",
  timeLimitMinutes: 15,
  suggestedWords: { min: 150, max: 350 },
});

type Env = Readonly<Record<string, string | undefined>>;

export function listWritingTasks(env: Env = process.env): readonly WritingTask[] {
  return isWritingPreviewAllowed(env) ? [...PUBLISHED_WRITING_TASKS, DEV_FIXTURE_WRITING_TASK] : PUBLISHED_WRITING_TASKS;
}

export function resolveWritingTask(id: string, env: Env = process.env): WritingTask | null {
  return listWritingTasks(env).find((task) => task.id === id) ?? null;
}

const RUBRICS: readonly WritingRubric[] = [scholarshipWrittenExpressionRubric];

export function resolveWritingRubric(id: string, version?: number): WritingRubric | null {
  return RUBRICS.find((rubric) => rubric.id === id && (version === undefined || rubric.version === version)) ?? null;
}

export function rubricForTask(task: WritingTask): WritingRubric {
  return resolveWritingRubric(task.rubricId) ?? scholarshipWrittenExpressionRubric;
}
