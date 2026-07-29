import { z } from "zod";

/**
 * Pure derivations for the teacher views: per-student summaries and
 * class-level aggregates computed from server-scored `exam_attempts.result`
 * rows (the full ExamResult jsonb). Everything here is side-effect free and
 * tolerant of malformed rows — an attempt that fails parsing is skipped
 * rather than crashing a dashboard that other students' data could still
 * populate.
 */

/** The slice of a stored ExamResult the teacher views actually need. */
const breakdownRowSchema = z.object({
  objectiveMarksEarned: z.number(),
  objectiveMarksAvailable: z.number(),
});

export const attemptResultSliceSchema = z.object({
  totalQuestions: z.number(),
  attemptedQuestions: z.number(),
  objectivePercentage: z.number(),
  timeTakenSeconds: z.number(),
  breakdowns: z.object({
    bySubject: z.record(z.string(), breakdownRowSchema),
  }),
});

export type AttemptResultSlice = z.infer<typeof attemptResultSliceSchema>;

export interface StudentAttempt {
  studentId: string;
  submittedAt: string;
  result: unknown;
}

export type StudentStanding = "on_track" | "needs_attention" | "at_risk";

export interface StudentSummary {
  studentId: string;
  attemptCount: number;
  /** ISO timestamp of the most recent attempt; null when none. */
  lastActiveAt: string | null;
  /** Mean whole-number objective percentage across parseable attempts. */
  averagePercentage: number | null;
  questionsAttempted: number;
  timeSpentSeconds: number;
  strongestSubject: string | null;
  weakestSubject: string | null;
  standing: StudentStanding;
}

export interface SubjectMastery {
  subject: string;
  /** Whole-number percentage of objective marks earned across attempts. */
  percentage: number;
}

/**
 * Standing thresholds. Documented rule, not a guess pulled per-render:
 * no attempts at all is at_risk (the mockup's "No activity" rows), then
 * average objective percentage bands.
 */
export const ON_TRACK_MINIMUM_PERCENTAGE = 65;
export const NEEDS_ATTENTION_MINIMUM_PERCENTAGE = 50;

export function standingFor(
  averagePercentage: number | null,
  attemptCount: number,
): StudentStanding {
  if (attemptCount === 0 || averagePercentage === null) return "at_risk";
  if (averagePercentage >= ON_TRACK_MINIMUM_PERCENTAGE) return "on_track";
  if (averagePercentage >= NEEDS_ATTENTION_MINIMUM_PERCENTAGE) {
    return "needs_attention";
  }
  return "at_risk";
}

function parseResult(result: unknown): AttemptResultSlice | null {
  const parsed = attemptResultSliceSchema.safeParse(result);
  return parsed.success ? parsed.data : null;
}

interface SubjectTotals {
  earned: number;
  available: number;
}

function accumulateSubjects(
  totals: Map<string, SubjectTotals>,
  slice: AttemptResultSlice,
): void {
  for (const [subject, row] of Object.entries(slice.breakdowns.bySubject)) {
    const entry = totals.get(subject) ?? { earned: 0, available: 0 };
    entry.earned += row.objectiveMarksEarned;
    entry.available += row.objectiveMarksAvailable;
    totals.set(subject, entry);
  }
}

function subjectMastery(totals: Map<string, SubjectTotals>): SubjectMastery[] {
  return [...totals.entries()]
    .filter(([, entry]) => entry.available > 0)
    .map(([subject, entry]) => ({
      subject,
      percentage: Math.round((entry.earned / entry.available) * 100),
    }))
    .sort((a, b) => b.percentage - a.percentage);
}

/** Summarise one student's attempts (already scoped to that student). */
export function summariseStudent(
  studentId: string,
  attempts: readonly StudentAttempt[],
): StudentSummary {
  const own = attempts.filter((attempt) => attempt.studentId === studentId);
  const slices = own
    .map((attempt) => parseResult(attempt.result))
    .filter((slice): slice is AttemptResultSlice => slice !== null);

  const lastActiveAt =
    own.length === 0
      ? null
      : own
          .map((attempt) => attempt.submittedAt)
          .sort((a, b) => Date.parse(b) - Date.parse(a))[0];

  const averagePercentage =
    slices.length === 0
      ? null
      : Math.round(
          slices.reduce((sum, slice) => sum + slice.objectivePercentage, 0) /
            slices.length,
        );

  const totals = new Map<string, SubjectTotals>();
  for (const slice of slices) accumulateSubjects(totals, slice);
  const mastery = subjectMastery(totals);

  return {
    studentId,
    attemptCount: own.length,
    lastActiveAt,
    averagePercentage,
    questionsAttempted: slices.reduce(
      (sum, slice) => sum + slice.attemptedQuestions,
      0,
    ),
    timeSpentSeconds: slices.reduce(
      (sum, slice) => sum + slice.timeTakenSeconds,
      0,
    ),
    strongestSubject: mastery.at(0)?.subject ?? null,
    weakestSubject: mastery.length > 1 ? mastery.at(-1)!.subject : null,
    standing: standingFor(averagePercentage, own.length),
  };
}

/** Per-subject mastery for a single student's attempts. */
export function studentSubjectMastery(
  studentId: string,
  attempts: readonly StudentAttempt[],
): SubjectMastery[] {
  const totals = new Map<string, SubjectTotals>();
  for (const attempt of attempts) {
    if (attempt.studentId !== studentId) continue;
    const slice = parseResult(attempt.result);
    if (slice) accumulateSubjects(totals, slice);
  }
  return subjectMastery(totals);
}

export interface ClassOverview {
  studentCount: number;
  activeThisWeekCount: number;
  averagePercentage: number | null;
  atRiskCount: number;
  subjectMastery: SubjectMastery[];
  summaries: StudentSummary[];
}

export const ACTIVE_WINDOW_DAYS = 7;

/**
 * Aggregate a whole roster. `now` is injectable so the "active this week"
 * window is testable without faking timers.
 */
export function summariseClass(
  studentIds: readonly string[],
  attempts: readonly StudentAttempt[],
  now: number = Date.now(),
): ClassOverview {
  const summaries = studentIds.map((studentId) =>
    summariseStudent(studentId, attempts),
  );

  const windowStart = now - ACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const activeThisWeekCount = summaries.filter(
    (summary) =>
      summary.lastActiveAt !== null && Date.parse(summary.lastActiveAt) >= windowStart,
  ).length;

  const scored = summaries.filter((summary) => summary.averagePercentage !== null);
  const averagePercentage =
    scored.length === 0
      ? null
      : Math.round(
          scored.reduce((sum, summary) => sum + (summary.averagePercentage ?? 0), 0) /
            scored.length,
        );

  const totals = new Map<string, SubjectTotals>();
  for (const attempt of attempts) {
    const slice = parseResult(attempt.result);
    if (slice) accumulateSubjects(totals, slice);
  }

  return {
    studentCount: studentIds.length,
    activeThisWeekCount,
    averagePercentage,
    atRiskCount: summaries.filter((summary) => summary.standing === "at_risk").length,
    subjectMastery: subjectMastery(totals),
    summaries,
  };
}

/** Completion percentage for an assignment from its per-student statuses. */
export function assignmentCompletionPercentage(
  statuses: readonly string[],
): number {
  if (statuses.length === 0) return 0;
  const submitted = statuses.filter((status) => status === "submitted").length;
  return Math.round((submitted / statuses.length) * 100);
}

export type TrendDirection = "up" | "down" | "flat";

export interface TrendResult {
  direction: TrendDirection;
  deltaPoints: number;
}

/**
 * Below this many points, a shift reads as noise rather than a real trend
 * — small enough to catch a genuine multi-week drift, large enough that a
 * single unusually hard or easy attempt doesn't flip the indicator.
 */
const TREND_FLAT_THRESHOLD_POINTS = 3;

/**
 * Split a chronologically ordered (oldest first) list of objective
 * percentages into two halves and compare the recent mean against the
 * prior one. Fewer than two data points is always flat — there is nothing
 * to compare yet.
 */
export function percentageTrend(percentagesOldestFirst: readonly number[]): TrendResult {
  if (percentagesOldestFirst.length < 2) return { direction: "flat", deltaPoints: 0 };
  const midpoint = Math.ceil(percentagesOldestFirst.length / 2);
  const earlier = percentagesOldestFirst.slice(0, midpoint);
  const recent = percentagesOldestFirst.slice(midpoint);
  const mean = (values: readonly number[]) =>
    values.reduce((sum, value) => sum + value, 0) / values.length;
  const deltaPoints = Math.round(mean(recent) - mean(earlier));
  if (deltaPoints > TREND_FLAT_THRESHOLD_POINTS) return { direction: "up", deltaPoints };
  if (deltaPoints < -TREND_FLAT_THRESHOLD_POINTS) return { direction: "down", deltaPoints };
  return { direction: "flat", deltaPoints };
}

function orderedPercentages(attempts: readonly StudentAttempt[]): number[] {
  return attempts
    .slice()
    .sort((a, b) => Date.parse(a.submittedAt) - Date.parse(b.submittedAt))
    .flatMap((attempt) => {
      const slice = parseResult(attempt.result);
      return slice ? [slice.objectivePercentage] : [];
    });
}

/** Score trend for one student's own attempts, oldest first. */
export function studentPercentageTrend(
  studentId: string,
  attempts: readonly StudentAttempt[],
): TrendResult {
  return percentageTrend(
    orderedPercentages(attempts.filter((attempt) => attempt.studentId === studentId)),
  );
}

/** Score trend across a whole class's attempts, oldest first. */
export function classPercentageTrend(attempts: readonly StudentAttempt[]): TrendResult {
  return percentageTrend(orderedPercentages(attempts));
}
