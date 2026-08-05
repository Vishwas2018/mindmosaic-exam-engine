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
  /* Optional: results written before this field existed still parse, and
     an absent value is treated as "unknown", not as "nothing answered". */
  attemptedQuestions: z.number().min(0).optional(),
});

export interface AttemptSummary {
  /** ISO timestamp of submission. */
  submittedAt: string;
  /** Whole-number objective percentage, or null when unparseable. */
  percentage: number | null;
  /**
   * Whether the student answered anything at all. A paper opened and
   * submitted blank scores a real, correct 0% — but averaging it with
   * papers that were actually sat reports a score for something nobody
   * attempted. See EngagementSummary.blankSessions.
   *
   * Null when the result predates `attemptedQuestions` and we cannot tell;
   * such an attempt is treated as sat, which is the safe direction (it
   * keeps counting exactly as it did before).
   */
  attemptedQuestions: number | null;
}

export function toAttemptSummary(row: {
  submitted_at: string;
  result: unknown;
}): AttemptSummary {
  const parsed = attemptResultSchema.safeParse(row.result);
  return {
    submittedAt: row.submitted_at,
    percentage: parsed.success ? parsed.data.objectivePercentage : null,
    attemptedQuestions: parsed.success ? (parsed.data.attemptedQuestions ?? null) : null,
  };
}
