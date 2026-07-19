import { z } from "zod";

import { describeConfig } from "@/features/exam-engine/components/describe-config";
import { examSelectionConfigSchema } from "@/features/exam-engine/scoring/server-scoring-contract";

/**
 * Pure summarisation of a child's stored exam attempts for the parent
 * dashboard. Everything here is side-effect free and client-safe: the
 * inputs are rows a parent is already allowed to read under RLS
 * (exam_attempts / exam_sessions "parent reads linked children"), and the
 * stored result jsonb is re-validated before use rather than trusted as
 * `ExamResult` — a malformed row degrades gracefully instead of crashing
 * the dashboard.
 */

const breakdownRowSchema = z.object({
  total: z.number(),
  correct: z.number(),
  objectiveMarksEarned: z.number(),
  objectiveMarksAvailable: z.number(),
});

const storedResultSchema = z.object({
  totalQuestions: z.number(),
  attemptedQuestions: z.number(),
  manualReviewQuestions: z.number(),
  objectivePercentage: z.number(),
  objectiveMarksEarned: z.number(),
  objectiveMarksAvailable: z.number(),
  timeTakenSeconds: z.number(),
  breakdowns: z.object({
    bySubject: z.record(z.string(), breakdownRowSchema),
  }),
});

export interface ChildProfile {
  id: string;
  displayName: string | null;
  yearLevel: number | null;
}

/** One exam_attempts row (with its session's config) as read for a parent. */
export interface ParentAttemptRow {
  id: string;
  /** ISO timestamp from exam_attempts.submitted_at. */
  submittedAt: string;
  /** exam_attempts.result jsonb — validated here, never assumed. */
  result: unknown;
  /** exam_sessions.config jsonb for the attempt's session, if readable. */
  sessionConfig: unknown;
}

export interface AttemptSummary {
  id: string;
  submittedAt: string;
  submittedAtLabel: string;
  /** Human description of the exam config, e.g. "Grade 3 · NAPLAN-style…". */
  label: string;
  percentage: number;
  marksEarned: number;
  marksAvailable: number;
  totalQuestions: number;
  attemptedQuestions: number;
  pendingManualReview: boolean;
}

export interface SubjectSummary {
  subject: string;
  label: string;
  /** Null when the subject has no objective marks (e.g. writing). */
  percentage: number | null;
  marksEarned: number;
  marksAvailable: number;
  questionCount: number;
}

export interface WeekDay {
  label: string;
  practised: boolean;
  isToday: boolean;
}

export interface ChildSummary {
  childId: string;
  displayName: string;
  yearLevel: number | null;
  attemptCount: number;
  /** Rows whose stored result failed validation; excluded from all stats. */
  unreadableAttemptCount: number;
  latestPercentage: number | null;
  previousPercentage: number | null;
  averagePercentage: number | null;
  attemptsThisWeek: number;
  timeThisWeekSeconds: number;
  streakDays: number;
  /** Last seven days, oldest first, ending today. */
  weekActivity: WeekDay[];
  /** Aggregated across attempts, strongest first; no-objective-marks last. */
  subjects: SubjectSummary[];
  /** Newest first, capped. */
  recentAttempts: AttemptSummary[];
}

const RECENT_ATTEMPTS_LIMIT = 5;

const SUBJECT_LABELS: Record<string, string> = {
  numeracy: "Numeracy",
  reading: "Reading",
  writing: "Writing",
  language_conventions: "Language conventions",
};

const DAY_FORMAT = new Intl.DateTimeFormat("en-AU", { weekday: "short" });
const DATE_FORMAT = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function subjectLabel(subject: string): string {
  return SUBJECT_LABELS[subject] ?? subject.replace(/_/g, " ");
}

/** Calendar-day key in the runtime's local timezone. */
function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function daysAgo(now: Date, days: number): Date {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - days);
  return d;
}

interface ParsedAttempt {
  row: ParentAttemptRow;
  result: z.infer<typeof storedResultSchema>;
  submittedAtMs: number;
}

function attemptLabel(sessionConfig: unknown): string {
  const config = examSelectionConfigSchema.safeParse(sessionConfig);
  return config.success ? describeConfig(config.data) : "Practice exam";
}

export function buildChildSummary(
  child: ChildProfile,
  attempts: readonly ParentAttemptRow[],
  now: Date = new Date(),
): ChildSummary {
  const parsed: ParsedAttempt[] = [];
  let unreadableAttemptCount = 0;

  for (const row of attempts) {
    const result = storedResultSchema.safeParse(row.result);
    const submittedAtMs = Date.parse(row.submittedAt);
    if (!result.success || Number.isNaN(submittedAtMs)) {
      unreadableAttemptCount += 1;
      continue;
    }
    parsed.push({ row, result: result.data, submittedAtMs });
  }

  parsed.sort((a, b) => b.submittedAtMs - a.submittedAtMs);

  const percentages = parsed.map((a) => a.result.objectivePercentage);
  const latestPercentage = percentages[0] ?? null;
  const previousPercentage = percentages[1] ?? null;
  const averagePercentage =
    percentages.length === 0
      ? null
      : Math.round(percentages.reduce((sum, p) => sum + p, 0) / percentages.length);

  // Activity over the last seven local calendar days, ending today.
  const practisedDays = new Set(parsed.map((a) => dayKey(new Date(a.submittedAtMs))));
  const weekActivity: WeekDay[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = daysAgo(now, offset);
    weekActivity.push({
      label: DAY_FORMAT.format(day),
      practised: practisedDays.has(dayKey(day)),
      isToday: offset === 0,
    });
  }

  const weekStartMs = daysAgo(now, 6).getTime();
  const thisWeek = parsed.filter((a) => a.submittedAtMs >= weekStartMs);
  const timeThisWeekSeconds = thisWeek.reduce(
    (sum, a) => sum + Math.max(0, a.result.timeTakenSeconds),
    0,
  );

  // Streak: consecutive practised days ending today, or yesterday if today
  // has no attempt yet (today shouldn't break an ongoing streak).
  let streakDays = 0;
  let offset = practisedDays.has(dayKey(daysAgo(now, 0))) ? 0 : 1;
  while (practisedDays.has(dayKey(daysAgo(now, offset)))) {
    streakDays += 1;
    offset += 1;
  }

  const subjectTotals = new Map<
    string,
    { earned: number; available: number; questionCount: number }
  >();
  for (const attempt of parsed) {
    for (const [subject, row] of Object.entries(attempt.result.breakdowns.bySubject)) {
      const totals = subjectTotals.get(subject) ?? {
        earned: 0,
        available: 0,
        questionCount: 0,
      };
      totals.earned += row.objectiveMarksEarned;
      totals.available += row.objectiveMarksAvailable;
      totals.questionCount += row.total;
      subjectTotals.set(subject, totals);
    }
  }
  const subjects: SubjectSummary[] = [...subjectTotals.entries()]
    .map(([subject, totals]) => ({
      subject,
      label: subjectLabel(subject),
      percentage:
        totals.available > 0 ? Math.round((totals.earned / totals.available) * 100) : null,
      marksEarned: totals.earned,
      marksAvailable: totals.available,
      questionCount: totals.questionCount,
    }))
    .sort((a, b) => (b.percentage ?? -1) - (a.percentage ?? -1));

  const recentAttempts: AttemptSummary[] = parsed
    .slice(0, RECENT_ATTEMPTS_LIMIT)
    .map((attempt) => ({
      id: attempt.row.id,
      submittedAt: attempt.row.submittedAt,
      submittedAtLabel: DATE_FORMAT.format(new Date(attempt.submittedAtMs)),
      label: attemptLabel(attempt.row.sessionConfig),
      percentage: attempt.result.objectivePercentage,
      marksEarned: attempt.result.objectiveMarksEarned,
      marksAvailable: attempt.result.objectiveMarksAvailable,
      totalQuestions: attempt.result.totalQuestions,
      attemptedQuestions: attempt.result.attemptedQuestions,
      pendingManualReview: attempt.result.manualReviewQuestions > 0,
    }));

  return {
    childId: child.id,
    displayName: child.displayName?.trim() || "Your child",
    yearLevel: child.yearLevel,
    attemptCount: parsed.length,
    unreadableAttemptCount,
    latestPercentage,
    previousPercentage,
    averagePercentage,
    attemptsThisWeek: thisWeek.length,
    timeThisWeekSeconds,
    streakDays,
    weekActivity,
    subjects,
    recentAttempts,
  };
}

/**
 * Performance band for a percentage, mirroring the dashboard mockup's
 * Strong / Good / Building / Needs practice labels.
 */
export type PerformanceBand = "strong" | "good" | "building" | "focus";

export function performanceBand(percentage: number): PerformanceBand {
  if (percentage >= 80) return "strong";
  if (percentage >= 65) return "good";
  if (percentage >= 50) return "building";
  return "focus";
}
