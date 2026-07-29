import { attemptResultSliceSchema, type StudentAttempt } from "./analytics";

/**
 * Chart-ready aggregation for the Teacher Analytics "Topic Analysis" tab —
 * a plain array of {subject, percentage, studentCount} points, sorted
 * weakest-first since that is the actionable order for a teacher. Kept
 * separate from analytics.ts's per-student/per-class summaries because
 * this is a class-wide, subject-keyed view rather than a roster rollup.
 */
export interface TopicAnalysisPoint {
  subject: string;
  percentage: number;
  studentCount: number;
}

interface TopicTotals {
  earned: number;
  available: number;
  students: Set<string>;
}

export function topicAnalysis(attempts: readonly StudentAttempt[]): TopicAnalysisPoint[] {
  const totals = new Map<string, TopicTotals>();
  for (const attempt of attempts) {
    const parsed = attemptResultSliceSchema.safeParse(attempt.result);
    if (!parsed.success) continue;
    for (const [subject, row] of Object.entries(parsed.data.breakdowns.bySubject)) {
      const entry = totals.get(subject) ?? { earned: 0, available: 0, students: new Set() };
      entry.earned += row.objectiveMarksEarned;
      entry.available += row.objectiveMarksAvailable;
      entry.students.add(attempt.studentId);
      totals.set(subject, entry);
    }
  }
  return [...totals.entries()]
    .filter(([, entry]) => entry.available > 0)
    .map(([subject, entry]) => ({
      subject,
      percentage: Math.round((entry.earned / entry.available) * 100),
      studentCount: entry.students.size,
    }))
    .sort((a, b) => a.percentage - b.percentage);
}
