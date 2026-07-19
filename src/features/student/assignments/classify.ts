import {
  STYLE_LABELS,
  SUBJECT_LABELS,
  YEAR_LABELS,
} from "@/features/exam-engine/components/describe-config";

import type { StudentAssignment } from "./types";

/**
 * Pure presentation logic for the assignments list: due-date urgency,
 * human labels, and tab grouping. No React, no Supabase — unit tested
 * directly with fixed clocks.
 */

export type DueState = "overdue" | "due_soon" | "upcoming" | "no_due_date";

/** Due within this window counts as "due soon". */
const DUE_SOON_HOURS = 48;

const DUE_DATE_FORMAT = new Intl.DateTimeFormat("en-AU", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

/** Local-calendar day key; streaks and day-diffs are calendar-based. */
function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function calendarDaysBetween(from: Date, to: Date): number {
  const ms = startOfDay(to).getTime() - startOfDay(from).getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

export function dueState(dueAt: string | null, now: Date): DueState {
  if (!dueAt) return "no_due_date";
  const due = new Date(dueAt);
  if (due.getTime() < now.getTime()) return "overdue";
  if (due.getTime() - now.getTime() <= DUE_SOON_HOURS * 60 * 60 * 1000) {
    return "due_soon";
  }
  return "upcoming";
}

/** "Was due Mon 7 Apr — 3 days overdue" / "Due Thu 11 Apr — tomorrow" … */
export function dueLabel(dueAt: string | null, now: Date): string | null {
  if (!dueAt) return null;
  const due = new Date(dueAt);
  const dateText = DUE_DATE_FORMAT.format(due);
  const days = calendarDaysBetween(now, due);

  if (due.getTime() < now.getTime()) {
    if (days === 0) return `Was due today (${dateText})`;
    const overdueDays = Math.abs(days);
    return `Was due ${dateText} — ${overdueDays} ${overdueDays === 1 ? "day" : "days"} overdue`;
  }
  if (days === 0) return `Due today (${dateText})`;
  if (days === 1) return `Due ${dateText} — tomorrow`;
  return `Due ${dateText} — ${days} days left`;
}

/** "Grade 5 · NAPLAN-style practice · Numeracy · 20 questions · Timed",
    from whichever config fields are present. */
export function describeAssignmentConfig(
  config: StudentAssignment["config"],
): string {
  const parts: string[] = [];
  if (config.yearLevel !== undefined) {
    parts.push(YEAR_LABELS[String(config.yearLevel)] ?? String(config.yearLevel));
  }
  if (config.examStyle) parts.push(STYLE_LABELS[config.examStyle]);
  if (config.subject) parts.push(SUBJECT_LABELS[config.subject]);
  if (config.questionCount !== undefined) {
    parts.push(
      config.questionCount === "full"
        ? "Full set"
        : `${config.questionCount} questions`,
    );
  }
  if (config.timing) parts.push(config.timing === "timed" ? "Timed" : "Untimed");
  return parts.join(" · ");
}

/** Title shown on the card: explicit title if the row carries one,
    otherwise the most specific labels the config offers. */
export function assignmentTitle(assignment: StudentAssignment): string {
  if (assignment.config.title) return assignment.config.title;
  const subject = assignment.config.subject
    ? SUBJECT_LABELS[assignment.config.subject]
    : null;
  const style = assignment.config.examStyle
    ? STYLE_LABELS[assignment.config.examStyle]
    : null;
  if (subject && style) return `${style} — ${subject}`;
  return subject ?? style ?? "Practice assignment";
}

export interface GroupedAssignments {
  toDo: StudentAssignment[];
  inProgress: StudentAssignment[];
  completed: StudentAssignment[];
  overdueCount: number;
}

function byDueDateThenCreated(a: StudentAssignment, b: StudentAssignment): number {
  if (a.dueAt && b.dueAt) return a.dueAt.localeCompare(b.dueAt);
  if (a.dueAt) return -1;
  if (b.dueAt) return 1;
  return a.createdAt.localeCompare(b.createdAt);
}

function bySubmittedDesc(a: StudentAssignment, b: StudentAssignment): number {
  return (b.submittedAt ?? "").localeCompare(a.submittedAt ?? "");
}

export function groupAssignments(
  assignments: readonly StudentAssignment[],
  now: Date,
): GroupedAssignments {
  const toDo = assignments.filter((a) => a.status === "assigned");
  const inProgress = assignments.filter((a) => a.status === "in_progress");
  const completed = assignments.filter((a) => a.status === "submitted");
  return {
    toDo: [...toDo].sort(byDueDateThenCreated),
    inProgress: [...inProgress].sort(byDueDateThenCreated),
    completed: [...completed].sort(bySubmittedDesc),
    overdueCount: [...toDo, ...inProgress].filter(
      (a) => dueState(a.dueAt, now) === "overdue",
    ).length,
  };
}
