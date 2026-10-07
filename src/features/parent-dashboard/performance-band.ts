/**
 * Canonical performance bands for objective percentages, shared between the
 * parent dashboard and landing Chapter 4 ("Progress & Parents").
 *
 * Thresholds:
 *   >= 80% -> strong ("Strong")
 *   >= 65% -> good   ("Good")
 *   >= 50% -> building ("Building")
 *   < 50%  -> focus  ("Needs practice")
 */

export type PerformanceBand = "strong" | "good" | "building" | "focus";

export function performanceBand(percentage: number): PerformanceBand {
  if (percentage >= 80) return "strong";
  if (percentage >= 65) return "good";
  if (percentage >= 50) return "building";
  return "focus";
}

export const PERFORMANCE_BAND_LABELS: Record<PerformanceBand, string> = {
  strong: "Strong",
  good: "Good",
  building: "Building",
  focus: "Needs practice",
} as const;
