/**
 * Row shapes for the admin aggregate views
 * (supabase/migrations/20260718120000_admin_aggregate_views.sql). Every
 * shape here is aggregated across students — no student identifier or
 * per-child figure ever appears, matching the rule in
 * docs/PRIVACY_AND_BILLING_GUARDRAILS.md that admin dashboards read
 * pre-aggregated views, not raw per-child rows.
 */

export interface PlatformTotals {
  totalAttempts: number;
  activeStudents: number;
  totalSessions: number;
  /** Null until at least one attempt exists. */
  avgScorePct: number | null;
  avgTimeSeconds: number | null;
}

export interface WeeklyActivityPoint {
  /** ISO date of the week's Monday. */
  weekStart: string;
  attempts: number;
  activeStudents: number;
  avgScorePct: number | null;
  avgTimeSeconds: number | null;
}

export interface ScoreBand {
  /** 0, 15, 30, …, 90; the top band spans 90–100. */
  bandStart: number;
  attempts: number;
}

/** One row of admin_subject_performance / admin_skill_performance. */
export interface DimensionPerformance {
  name: string;
  attempts: number;
  questionsTotal: number;
  questionsAttempted: number;
  questionsCorrect: number;
  questionsIncorrect: number;
  questionsUnanswered: number;
  marksEarned: number;
  marksAvailable: number;
}

/** One row of admin_question_stats — per-question item statistics. */
export interface QuestionStats {
  questionId: string;
  attempts: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  pendingManual: number;
  avgOverallWhenCorrect: number | null;
  avgOverallWhenMissed: number | null;
}

export type QuestionHealth =
  | "healthy"
  | "too_easy"
  | "too_hard"
  | "low_discrimination"
  | "insufficient_data";

/**
 * Bank metadata joined server-side onto QuestionStats. Deliberately
 * excludes the answer key, explanation and full visuals — the join in
 * src/server/admin-analytics.ts only ever copies these presentation
 * fields.
 */
export interface QuestionBankMeta {
  promptExcerpt: string;
  subject: string;
  strand: string;
  topic: string;
  skill: string | null;
  difficulty: string;
  yearLevel: number;
  examStyle: string;
}

export interface QuestionIntelligenceRow extends QuestionStats, QuestionBankMeta {
  /** correct / attempts, whole-number percent; null with zero attempts. */
  accuracyPct: number | null;
  /** See discriminationIndex — 0..1 gap-based approximation, or null. */
  discrimination: number | null;
  health: QuestionHealth;
}

/** Bank questions that have never been attempted, for coverage reporting. */
export interface UnattemptedQuestion extends QuestionBankMeta {
  questionId: string;
}

export type InsightTone = "good" | "warn" | "bad";

export interface Insight {
  tone: InsightTone;
  title: string;
  body: string;
  action: string;
}
