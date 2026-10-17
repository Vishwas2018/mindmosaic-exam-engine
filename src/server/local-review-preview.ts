import "server-only";

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { candidateQuestionSchema } from "@/features/question-factory/ingestion/candidate-question";
import { buildPublishedQuestion } from "@/features/question-factory/publication/build-published-question";
import type { AuthoringQuestion } from "@/features/exam-engine/types";

/**
 * LOCAL REVIEW PREVIEW ONLY. Lets the owner sit staged, governed-but-not-yet-human-approved
 * questions through the real learner journey on their own machine.
 *
 * Off unless MINDMOSAIC_LOCAL_REVIEW_PREVIEW=1, and unconditionally off for any production
 * build or Vercel deployment, so it cannot reach production or a child's session. Preview
 * questions are appended AFTER the publication gate and never recorded as approved.
 */
export function isLocalReviewPreviewEnabled(env: Readonly<Record<string, string | undefined>> = process.env): boolean {
  if (env.NODE_ENV === "production" || env.VERCEL || env.VERCEL_ENV) return false;
  return env.MINDMOSAIC_LOCAL_REVIEW_PREVIEW === "1";
}

let cache: readonly AuthoringQuestion[] | undefined;

export function getLocalReviewPreviewQuestions(): readonly AuthoringQuestion[] {
  if (!isLocalReviewPreviewEnabled()) return [];
  if (cache) return cache;
  const dir = path.join(process.cwd(), "content/question-factory/staged");
  const out: AuthoringQuestion[] = [];
  if (existsSync(dir)) {
    for (const file of readdirSync(dir).sort()) {
      if (!file.endsWith(".json")) continue;
      const record = JSON.parse(readFileSync(path.join(dir, file), "utf8")) as { state?: string; question?: unknown };
      if (record.state !== "staged") continue;
      const candidate = candidateQuestionSchema.safeParse(record.question);
      if (!candidate.success) continue;
      const built = buildPublishedQuestion(candidate.data);
      if (built.ok) out.push(built.question as AuthoringQuestion);
    }
  }
  cache = Object.freeze(out);
  return cache;
}
