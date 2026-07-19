import { z } from "zod";

/**
 * Client-safe attempt summary used by the engagement page. Each summary is
 * one exam_attempts row reduced to the fields streaks/achievements need.
 * `result` jsonb is parsed loosely and fail-soft: a malformed result keeps
 * the attempt counting towards streaks (the practice happened) with a null
 * score.
 */

export const attemptResultSchema = z.looseObject({
  objectivePercentage: z.number().min(0).max(100),
});

export interface AttemptSummary {
  /** ISO timestamp of submission. */
  submittedAt: string;
  /** Whole-number objective percentage, or null when unparseable. */
  percentage: number | null;
}

export function toAttemptSummary(row: {
  submitted_at: string;
  result: unknown;
}): AttemptSummary {
  const parsed = attemptResultSchema.safeParse(row.result);
  return {
    submittedAt: row.submitted_at,
    percentage: parsed.success ? parsed.data.objectivePercentage : null,
  };
}
