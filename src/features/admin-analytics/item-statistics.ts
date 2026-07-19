import type { QuestionHealth, QuestionStats } from "./types";

/**
 * Pure item-statistics helpers for the admin content-intelligence screen.
 * Inputs are aggregate view rows (never per-student data); everything here
 * is deterministic and side-effect free so thresholds are testable.
 */

/** Below this many attempts, item statistics are noise, not signal. */
export const MIN_ATTEMPTS_FOR_SIGNAL = 20;

/** Accuracy at or above this marks an item as too easy. */
export const TOO_EASY_ACCURACY_PCT = 90;

/** Accuracy below this marks an item as too hard. */
export const TOO_HARD_ACCURACY_PCT = 40;

/** Discrimination below this fails to separate strong from weak attempts. */
export const LOW_DISCRIMINATION = 0.15;

/** Whole-number percent of deliveries answered correctly; null when unused. */
export function accuracyPct(stats: Pick<QuestionStats, "attempts" | "correct">): number | null {
  if (stats.attempts <= 0) return null;
  return Math.round((stats.correct / stats.attempts) * 100);
}

/**
 * Gap-based discrimination approximation: how much higher the average
 * overall exam score is on attempts that answered this item correctly
 * versus attempts that missed it, scaled to 0..1. A classical
 * point-biserial needs per-student rows, which the aggregate views
 * deliberately do not expose; this gap statistic is computable from the
 * two aggregate averages alone and preserves the ranking use case
 * (identifying items that fail to separate strong from weak attempts).
 */
export function discriminationIndex(
  avgOverallWhenCorrect: number | null,
  avgOverallWhenMissed: number | null,
): number | null {
  if (avgOverallWhenCorrect === null || avgOverallWhenMissed === null) return null;
  const gap = (avgOverallWhenCorrect - avgOverallWhenMissed) / 100;
  return Math.min(1, Math.max(0, Number(gap.toFixed(2))));
}

export function classifyQuestionHealth({
  attempts,
  accuracy,
  discrimination,
}: {
  attempts: number;
  accuracy: number | null;
  discrimination: number | null;
}): QuestionHealth {
  if (attempts < MIN_ATTEMPTS_FOR_SIGNAL || accuracy === null) {
    return "insufficient_data";
  }
  if (accuracy >= TOO_EASY_ACCURACY_PCT) return "too_easy";
  if (accuracy < TOO_HARD_ACCURACY_PCT) return "too_hard";
  if (discrimination !== null && discrimination < LOW_DISCRIMINATION) {
    return "low_discrimination";
  }
  return "healthy";
}

/** marksEarned / marksAvailable as a whole-number percent; null when unused. */
export function masteryPct(row: {
  marksEarned: number;
  marksAvailable: number;
}): number | null {
  if (row.marksAvailable <= 0) return null;
  return Math.round((row.marksEarned / row.marksAvailable) * 100);
}

export const SCORE_BAND_STARTS = [0, 15, 30, 45, 60, 75, 90] as const;

export function scoreBandLabel(bandStart: number): string {
  return bandStart >= 90 ? "90–100" : `${bandStart}–${bandStart + 15}`;
}
