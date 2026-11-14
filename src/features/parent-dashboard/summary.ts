import { z } from "zod";

import { describeConfig } from "@/features/exam-engine/components/describe-config";
import { examSelectionConfigSchema } from "@/features/exam-engine/scoring/server-scoring-contract";
import { describeEvidence, hasEnoughEvidence } from "./evidence";
import { performanceBand } from "./performance-band";

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
  /**
   * Only used to order children deterministically when two of them share a
   * display name — see compareChildren in ./default-child.ts. Sorting on
   * name alone made the order of same-named siblings depend on the order
   * Postgres happened to return rows in.
   */
  createdAt: string;
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
  mode?: string;
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
  mode?: string;
}

export interface SubjectSummary {
  subject: string;
  label: string;
  /** Null when the subject has no objective marks (e.g. writing). */
  percentage: number | null;
  marksEarned: number;
  marksAvailable: number;
  questionCount: number;
  /** Finished papers that contributed marks to this subject. */
  paperCount: number;
  /**
   * True only when this subject rests on enough work to be described (see
   * ./evidence.ts). When false, no band, ranking or comparison is made for it.
   */
  sufficientEvidence: boolean;
}

export interface WeekDay {
  label: string;
  practised: boolean;
  isToday: boolean;
}

export interface RecommendedAction {
  id: string;
  title: string;
  description: string;
}

export interface ChildSummary {
  childId: string;
  /**
   * True when the child's login is paused (archived). Their results stay visible; set by the page from
   * Supabase Auth, not derived from attempts. Absent means active.
   */
  archived?: boolean;
  displayName: string;
  yearLevel: number | null;
  attemptCount: number;
  /** Rows whose stored result failed validation; excluded from all stats. */
  unreadableAttemptCount: number;
  latestPercentage: number | null;
  previousPercentage: number | null;
  averagePercentage: number | null;
  /**
   * True when the lifetime average rests on enough finished papers and marks to be shown as
   * a figure (see ./evidence.ts). When false the dashboard shows counts instead.
   */
  averageHasEvidence: boolean;
  attemptsThisWeek: number;
  timeThisWeekSeconds: number;
  streakDays: number;
  /** Last seven days, oldest first, ending today. */
  weekActivity: WeekDay[];
  /** Aggregated across attempts, strongest first; no-objective-marks last. */
  subjects: SubjectSummary[];
  /** Newest first, capped. */
  recentAttempts: AttemptSummary[];
  /**
   * Average objective percentage across the most recent attempts (see
   * RECENT_WINDOW), distinct from averagePercentage (which spans every
   * attempt ever recorded). It is an average, not a prediction, and is null
   * unless the window holds enough evidence (see ./evidence.ts).
   */
  recentAveragePercentage: number | null;
  /**
   * Subjects at or above the "strong" threshold AND resting on enough
   * evidence. A subject seen in one short paper is never counted.
   */
  strongSubjectCount: number;
  /** Short, plain-language observations for the parent dashboard's insights panel. */
  observations: string[];
  /** Suggested next steps, most relevant first. */
  recommendedActions: RecommendedAction[];
}

const RECENT_ATTEMPTS_LIMIT = 5;

/** How many of the most recent attempts feed the recent average. */
const RECENT_WINDOW = 5;

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isConfidenceAttempt(row: ParentAttemptRow): boolean {
  if (row.mode === "confidence") return true;
  if (isRecord(row.sessionConfig) && row.sessionConfig.confidenceMode === true) {
    return true;
  }
  return false;
}

function attemptLabel(sessionConfig: unknown, mode?: string): string {
  const config = examSelectionConfigSchema.safeParse(sessionConfig);
  const base = config.success ? describeConfig(config.data) : "Practice exam";
  const isConfidence =
    mode === "confidence" || (config.success && config.data.confidenceMode === true);
  return isConfidence ? `${base} (Confidence Mode)` : base;
}

function computeRecentAverage(parsed: ParsedAttempt[]): number | null {
  if (parsed.length === 0) return null;
  // parsed is already sorted newest-first.
  const window = parsed.slice(0, RECENT_WINDOW);
  const marksAvailable = window.reduce((total, a) => total + a.result.objectiveMarksAvailable, 0);
  if (!hasEnoughEvidence({ papers: window.length, marksAvailable })) return null;
  const sum = window.reduce((total, attempt) => total + attempt.result.objectivePercentage, 0);
  return Math.round(sum / window.length);
}

function buildObservations(params: {
  displayName: string;
  subjects: SubjectSummary[];
  streakDays: number;
  attemptsThisWeek: number;
}): string[] {
  const { displayName, subjects, streakDays, attemptsThisWeek } = params;
  const scored = subjects.filter((subject) => subject.percentage !== null);
  const claimable = scored.filter((subject) => subject.sufficientEvidence);
  const observations: string[] = [];

  if (claimable.length >= 2) {
    /* A comparison needs two subjects that each rest on enough work. */
    const strongest = claimable[0];
    const weakest = claimable[claimable.length - 1];
    if (strongest.percentage !== weakest.percentage) {
      observations.push(
        `${displayName} is strongest in ${strongest.label} (${strongest.percentage}%).`,
      );
      observations.push(`${weakest.label} could use more practice (${weakest.percentage}%).`);
    }
  }
  /* Where a subject is still thin, say so with the real counts rather than a
     verdict. */
  for (const subject of scored.filter((entry) => !entry.sufficientEvidence)) {
    observations.push(
      `${subject.label}: ${describeEvidence({
        papers: subject.paperCount,
        marksEarned: subject.marksEarned,
        marksAvailable: subject.marksAvailable,
      })}. Not enough yet to say how ${displayName} is doing here.`,
    );
  }

  if (streakDays >= 3) {
    observations.push(`${streakDays}-day practice streak — keep it up!`);
  }

  if (attemptsThisWeek === 0 && scored.length > 0) {
    observations.push("No practice sessions yet this week.");
  }

  return observations;
}

function buildRecommendedActions(params: {
  attemptCount: number;
  subjects: SubjectSummary[];
}): RecommendedAction[] {
  const { attemptCount, subjects } = params;

  if (attemptCount === 0) {
    return [
      {
        id: "first-exam",
        title: "Start a first practice exam",
        description: "Once they finish one, their progress will start showing up here.",
      },
    ];
  }

  const scored = subjects.filter((subject) => subject.percentage !== null);
  const actions: RecommendedAction[] = [];
  const focusSubject = scored.find(
    (subject) => subject.sufficientEvidence && performanceBand(subject.percentage as number) === "focus",
  );
  if (focusSubject) {
    actions.push({
      id: `focus-${focusSubject.subject}`,
      title: `Practise ${focusSubject.label.toLowerCase()}`,
      description: `Currently at ${focusSubject.percentage}% — more reps here will help the most.`,
    });
  }

  const unscored = subjects.filter((subject) => subject.percentage === null);
  for (const subject of unscored) {
    actions.push({
      id: `review-${subject.subject}`,
      title: `Check in on ${subject.label.toLowerCase()}`,
      description: "Marked by a person — worth a look once it's back.",
    });
  }

  if (actions.length === 0) {
    const anyClaim = scored.some((subject) => subject.sufficientEvidence);
    actions.push(
      anyClaim
        ? {
            id: "keep-going",
            title: "Keep up the regular practice",
            description: "Nothing here needs attention right now — steady practice keeps it that way.",
          }
        : {
            id: "more-evidence",
            title: "Another paper or two will make this clearer",
            description: "There is not yet enough finished work to say where to focus.",
          },
    );
  }

  return actions;
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

  const evaluableAttempts = parsed.filter((a) => !isConfidenceAttempt(a.row));

  const percentages = evaluableAttempts.map((a) => a.result.objectivePercentage);
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
    { earned: number; available: number; questionCount: number; papers: number }
  >();
  for (const attempt of evaluableAttempts) {
    for (const [subject, row] of Object.entries(attempt.result.breakdowns.bySubject)) {
      const totals = subjectTotals.get(subject) ?? {
        earned: 0,
        available: 0,
        questionCount: 0,
        papers: 0,
      };
      totals.earned += row.objectiveMarksEarned;
      totals.available += row.objectiveMarksAvailable;
      totals.questionCount += row.total;
      if (row.objectiveMarksAvailable > 0) totals.papers += 1;
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
      paperCount: totals.papers,
      sufficientEvidence: hasEnoughEvidence({ papers: totals.papers, marksAvailable: totals.available }),
    }))
    .sort((a, b) => (b.percentage ?? -1) - (a.percentage ?? -1));

  const recentAttempts: AttemptSummary[] = parsed
    .slice(0, RECENT_ATTEMPTS_LIMIT)
    .map((attempt) => ({
      id: attempt.row.id,
      submittedAt: attempt.row.submittedAt,
      submittedAtLabel: DATE_FORMAT.format(new Date(attempt.submittedAtMs)),
      label: attemptLabel(attempt.row.sessionConfig, attempt.row.mode),
      percentage: attempt.result.objectivePercentage,
      marksEarned: attempt.result.objectiveMarksEarned,
      marksAvailable: attempt.result.objectiveMarksAvailable,
      totalQuestions: attempt.result.totalQuestions,
      attemptedQuestions: attempt.result.attemptedQuestions,
      pendingManualReview: attempt.result.manualReviewQuestions > 0,
      mode: isConfidenceAttempt(attempt.row) ? "confidence" : "standard",
    }));

  const displayName = child.displayName?.trim() || "Your child";
  const strongSubjectCount = subjects.filter(
    (subject) =>
      subject.sufficientEvidence &&
      subject.percentage !== null &&
      performanceBand(subject.percentage) === "strong",
  ).length;

  return {
    childId: child.id,
    displayName,
    yearLevel: child.yearLevel,
    attemptCount: parsed.length,
    unreadableAttemptCount,
    latestPercentage,
    previousPercentage,
    averagePercentage,
    averageHasEvidence: hasEnoughEvidence({
      papers: evaluableAttempts.length,
      marksAvailable: evaluableAttempts.reduce((sum, a) => sum + a.result.objectiveMarksAvailable, 0),
    }),
    attemptsThisWeek: thisWeek.length,
    timeThisWeekSeconds,
    streakDays,
    weekActivity,
    subjects,
    recentAttempts,
    recentAveragePercentage: computeRecentAverage(evaluableAttempts),
    strongSubjectCount,
    observations: buildObservations({
      displayName,
      subjects,
      streakDays,
      attemptsThisWeek: thisWeek.length,
    }),
    recommendedActions: buildRecommendedActions({ attemptCount: parsed.length, subjects }),
  };
}

export {
  performanceBand,
  PERFORMANCE_BAND_LABELS,
  type PerformanceBand,
} from "./performance-band";
