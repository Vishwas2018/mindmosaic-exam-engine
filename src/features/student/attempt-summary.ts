import type { ExamResult } from "@/features/exam-engine/scoring/exam-report";
import type {
  ExamSelectionConfig,
  SubjectFilter,
  TimingMode,
} from "@/features/exam-engine/selection";

/**
 * Pure display-model derivations for the student home and learning hub.
 * Everything here works on already-fetched `exam_attempts` rows (see
 * ./data.ts) and stays free of Supabase or React so it is unit-testable.
 *
 * The `result` column holds the server-computed ExamResult and `config`
 * the session's ExamSelectionConfig, but both arrive as jsonb — treat
 * every field as potentially absent rather than trusting the cast.
 */

export interface AttemptRow {
  id: string;
  submitted_at: string;
  result: unknown;
  session: { config: unknown } | null;
}

export interface AttemptSummary {
  id: string;
  submittedAt: string;
  /** e.g. "NAPLAN-style Numeracy" — mirrors the session title in the mockups. */
  title: string;
  subjectLabel: string;
  timing: TimingMode | null;
  totalQuestions: number | null;
  /** Whole-number objective percentage; null when nothing was auto-marked. */
  scorePercent: number | null;
  pendingManualReview: boolean;
}

export interface SubjectMastery {
  /** Question-bank subject key, e.g. "numeracy", "language_conventions". */
  subject: string;
  label: string;
  /** Aggregate objective percentage across every attempt. */
  percent: number;
  marksEarned: number;
  marksAvailable: number;
}

export interface StudentAttemptOverview {
  attempts: readonly AttemptSummary[];
  mastery: readonly SubjectMastery[];
  /** Weakest subject by aggregate percentage; null with no scored data. */
  recommendedFocus: SubjectMastery | null;
}

const CONFIG_SUBJECT_LABELS: Record<SubjectFilter, string> = {
  numeracy: "Numeracy",
  reading: "Reading",
  language: "Language conventions",
  mixed: "Mixed subjects",
};

/** Labels for question-metadata subject keys found in result breakdowns. */
const BANK_SUBJECT_LABELS: Record<string, string> = {
  numeracy: "Numeracy",
  reading: "Reading",
  writing: "Writing",
  language_conventions: "Language conventions",
};

const EXAM_STYLE_LABELS: Record<string, string> = {
  naplan_style: "NAPLAN-style",
  icas_style: "ICAS-style",
  mixed: "Mixed-style",
};

export function subjectLabel(subject: string): string {
  return (
    BANK_SUBJECT_LABELS[subject] ??
    subject.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase())
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseConfig(value: unknown): Partial<ExamSelectionConfig> {
  return isRecord(value) ? (value as Partial<ExamSelectionConfig>) : {};
}

function parseResult(value: unknown): Partial<ExamResult> {
  return isRecord(value) ? (value as Partial<ExamResult>) : {};
}

export function summarizeAttempt(row: AttemptRow): AttemptSummary {
  const config = parseConfig(row.session?.config);
  const result = parseResult(row.result);

  const styleLabel =
    typeof config.examStyle === "string"
      ? EXAM_STYLE_LABELS[config.examStyle]
      : undefined;
  const subject =
    typeof config.subject === "string" && config.subject in CONFIG_SUBJECT_LABELS
      ? CONFIG_SUBJECT_LABELS[config.subject as SubjectFilter]
      : undefined;
  const title =
    [styleLabel, subject].filter(Boolean).join(" ") || "Practice session";

  const marksAvailable =
    typeof result.objectiveMarksAvailable === "number"
      ? result.objectiveMarksAvailable
      : 0;
  const scorePercent =
    marksAvailable > 0 && typeof result.objectivePercentage === "number"
      ? result.objectivePercentage
      : null;

  return {
    id: row.id,
    submittedAt: row.submitted_at,
    title,
    subjectLabel: subject ?? "Practice session",
    timing:
      config.timing === "timed" || config.timing === "untimed"
        ? config.timing
        : null,
    totalQuestions:
      typeof result.totalQuestions === "number" ? result.totalQuestions : null,
    scorePercent,
    pendingManualReview:
      typeof result.pendingManualMarks === "number" &&
      result.pendingManualMarks > 0,
  };
}

/**
 * Aggregate per-subject mastery across attempts by summing objective marks
 * from each result's bySubject breakdown — marks-weighted, so a 30-question
 * exam counts for more than a 10-question one.
 */
export function aggregateMastery(
  rows: readonly AttemptRow[],
): SubjectMastery[] {
  const totals = new Map<string, { earned: number; available: number }>();

  for (const row of rows) {
    const result = parseResult(row.result);
    const bySubject = isRecord(result.breakdowns)
      ? result.breakdowns.bySubject
      : undefined;
    if (!isRecord(bySubject)) continue;

    for (const [subject, value] of Object.entries(bySubject)) {
      if (!isRecord(value)) continue;
      const earned =
        typeof value.objectiveMarksEarned === "number"
          ? value.objectiveMarksEarned
          : 0;
      const available =
        typeof value.objectiveMarksAvailable === "number"
          ? value.objectiveMarksAvailable
          : 0;
      if (available <= 0) continue;
      const entry = totals.get(subject) ?? { earned: 0, available: 0 };
      entry.earned += earned;
      entry.available += available;
      totals.set(subject, entry);
    }
  }

  return [...totals.entries()]
    .map(([subject, { earned, available }]) => ({
      subject,
      label: subjectLabel(subject),
      percent: Math.round((earned / available) * 100),
      marksEarned: earned,
      marksAvailable: available,
    }))
    .sort((a, b) => b.percent - a.percent);
}

export function buildOverview(rows: readonly AttemptRow[]): StudentAttemptOverview {
  const attempts = rows.map(summarizeAttempt);
  const mastery = aggregateMastery(rows);
  return {
    attempts,
    mastery,
    recommendedFocus: mastery.length > 0 ? mastery[mastery.length - 1] : null,
  };
}

/**
 * Human date for an attempt row: "Today", "Yesterday", or "7 Apr 2026".
 * Rendered server-side only, so a day boundary between render and view is
 * the same staleness any server-rendered date has.
 */
export function formatSubmittedAt(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round(
    (startOfDay(now) - startOfDay(date)) / (24 * 60 * 60 * 1000),
  );
  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Yesterday";
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
