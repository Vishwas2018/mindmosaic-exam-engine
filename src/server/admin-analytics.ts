import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  accuracyPct,
  classifyQuestionHealth,
  discriminationIndex,
} from "@/features/admin-analytics";
import type {
  DimensionPerformance,
  PlatformTotals,
  QuestionBankMeta,
  QuestionIntelligenceRow,
  QuestionStats,
  ScoreBand,
  UnattemptedQuestion,
  WeeklyActivityPoint,
} from "@/features/admin-analytics";
import type { AuthoringQuestion } from "@/features/exam-engine/types";
import { getExamBank } from "@/server/exam-bank";

/**
 * The one sanctioned data path for the admin analytics and
 * content-intelligence dashboards. Everything read here comes from the
 * pre-aggregated admin_* views (see the migration
 * 20260718120000_admin_aggregate_views.sql), which are themselves gated on
 * the caller's admin role — this module never queries exam_attempts,
 * exam_sessions or profiles rows directly, so no per-child raw data can
 * leak through an aggregate screen (docs/PRIVACY_AND_BILLING_GUARDRAILS.md).
 *
 * Question metadata for the intelligence screen is joined here, server
 * side, from the server-only bank gateway. Only presentation fields are
 * copied out; answer keys and explanations never leave this module.
 */

const PROMPT_EXCERPT_LENGTH = 80;

function toMeta(question: AuthoringQuestion): QuestionBankMeta {
  const prompt = question.prompt.replace(/\s+/g, " ").trim();
  return {
    promptExcerpt:
      prompt.length > PROMPT_EXCERPT_LENGTH
        ? `${prompt.slice(0, PROMPT_EXCERPT_LENGTH - 1)}…`
        : prompt,
    subject: question.metadata.subject,
    strand: question.metadata.strand,
    topic: question.metadata.topic,
    skill: question.metadata.skill ?? null,
    difficulty: question.metadata.difficulty,
    yearLevel: question.yearLevel,
    examStyle: question.examStyle,
  };
}

/** Bank metadata by question id, across both banks (practice is a superset). */
function bankMetaById(): Map<string, QuestionBankMeta> {
  const byId = new Map<string, QuestionBankMeta>();
  for (const bankId of ["curated", "practice"] as const) {
    for (const question of getExamBank(bankId)) {
      if (!byId.has(question.id)) byId.set(question.id, toMeta(question));
    }
  }
  return byId;
}

type Row = Record<string, unknown>;

function num(row: Row, key: string): number {
  const value = row[key];
  return typeof value === "number" ? value : Number(value ?? 0);
}

function numOrNull(row: Row, key: string): number | null {
  const value = row[key];
  if (value === null || value === undefined) return null;
  return typeof value === "number" ? value : Number(value);
}

function dimensionRow(row: Row, nameKey: string): DimensionPerformance {
  return {
    name: String(row[nameKey] ?? ""),
    attempts: num(row, "attempts"),
    questionsTotal: num(row, "questions_total"),
    questionsAttempted: num(row, "questions_attempted"),
    questionsCorrect: num(row, "questions_correct"),
    questionsIncorrect: num(row, "questions_incorrect"),
    questionsUnanswered: num(row, "questions_unanswered"),
    marksEarned: num(row, "marks_earned"),
    marksAvailable: num(row, "marks_available"),
  };
}

export interface AdminAnalyticsData {
  totals: PlatformTotals;
  weekly: WeeklyActivityPoint[];
  distribution: ScoreBand[];
  subjects: DimensionPerformance[];
  skills: DimensionPerformance[];
}

export async function fetchAdminAnalytics(
  supabase: SupabaseClient,
): Promise<AdminAnalyticsData | null> {
  const [totals, weekly, distribution, subjects, skills] = await Promise.all([
    supabase.from("admin_platform_totals").select("*").maybeSingle(),
    supabase
      .from("admin_weekly_activity")
      .select("*")
      .order("week_start", { ascending: true }),
    supabase
      .from("admin_score_distribution")
      .select("*")
      .order("band_start", { ascending: true }),
    supabase.from("admin_subject_performance").select("*"),
    supabase.from("admin_skill_performance").select("*"),
  ]);

  if (totals.error || weekly.error || distribution.error || subjects.error || skills.error) {
    return null;
  }

  const totalsRow: Row = totals.data ?? {};
  return {
    totals: {
      totalAttempts: num(totalsRow, "total_attempts"),
      activeStudents: num(totalsRow, "active_students"),
      totalSessions: num(totalsRow, "total_sessions"),
      avgScorePct: numOrNull(totalsRow, "avg_score_pct"),
      avgTimeSeconds: numOrNull(totalsRow, "avg_time_seconds"),
    },
    weekly: (weekly.data ?? []).map((row: Row) => ({
      weekStart: String(row.week_start ?? ""),
      attempts: num(row, "attempts"),
      activeStudents: num(row, "active_students"),
      avgScorePct: numOrNull(row, "avg_score_pct"),
      avgTimeSeconds: numOrNull(row, "avg_time_seconds"),
    })),
    distribution: (distribution.data ?? []).map((row: Row) => ({
      bandStart: num(row, "band_start"),
      attempts: num(row, "attempts"),
    })),
    subjects: (subjects.data ?? []).map((row: Row) => dimensionRow(row, "subject")),
    skills: (skills.data ?? []).map((row: Row) => dimensionRow(row, "skill")),
  };
}

export interface AdminQuestionIntelligenceData {
  questions: QuestionIntelligenceRow[];
  unattempted: UnattemptedQuestion[];
}

export async function fetchAdminQuestionIntelligence(
  supabase: SupabaseClient,
): Promise<AdminQuestionIntelligenceData | null> {
  const { data, error } = await supabase.from("admin_question_stats").select("*");
  if (error) return null;

  const meta = bankMetaById();
  const seen = new Set<string>();
  const questions: QuestionIntelligenceRow[] = [];

  for (const raw of (data ?? []) as Row[]) {
    const stats: QuestionStats = {
      questionId: String(raw.question_id ?? ""),
      attempts: num(raw, "attempts"),
      correct: num(raw, "correct"),
      incorrect: num(raw, "incorrect"),
      unanswered: num(raw, "unanswered"),
      pendingManual: num(raw, "pending_manual"),
      avgOverallWhenCorrect: numOrNull(raw, "avg_overall_when_correct"),
      avgOverallWhenMissed: numOrNull(raw, "avg_overall_when_missed"),
    };
    const bankEntry = meta.get(stats.questionId);
    /* Stats for a question since removed from the bank still aggregate
       safely; without metadata they cannot be presented, so skip. */
    if (!bankEntry) continue;
    seen.add(stats.questionId);

    const accuracy = accuracyPct(stats);
    const discrimination = discriminationIndex(
      stats.avgOverallWhenCorrect,
      stats.avgOverallWhenMissed,
    );
    questions.push({
      ...stats,
      ...bankEntry,
      accuracyPct: accuracy,
      discrimination,
      health: classifyQuestionHealth({
        attempts: stats.attempts,
        accuracy,
        discrimination,
      }),
    });
  }

  questions.sort((a, b) => a.questionId.localeCompare(b.questionId));

  const unattempted: UnattemptedQuestion[] = [];
  for (const [questionId, bankEntry] of meta) {
    if (!seen.has(questionId)) unattempted.push({ questionId, ...bankEntry });
  }
  unattempted.sort((a, b) => a.questionId.localeCompare(b.questionId));

  return { questions, unattempted };
}
