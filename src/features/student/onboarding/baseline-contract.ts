/**
 * Student Initial Skill Baseline Contract (Guardrail G3).
 *
 * Defines the canonical per-skill baseline record generated from the 5-question
 * diagnostic warmup. This baseline is designed to match the attempt and
 * skill-result shape consumed by the multi-sitting deficit engine
 * (aggregateHistoricalDeficits, recommendSkills, and aggregateMastery)
 * so Priority A and Priority B compose directly without a data rewrite.
 *
 * @module
 */

import type { ExamResult } from "@/features/exam-engine/scoring/exam-report";
import type { Question } from "@/schemas/question.schema";

/**
 * A single skill baseline entry derived from diagnostic performance.
 * Directly maps to multi-sitting deficit aggregation structures.
 */
export interface SkillBaselineEntry {
  /** Canonical question-bank subject key, e.g. "numeracy", "reading", "language_conventions". */
  readonly subject: string;
  /** Subject strand from question metadata, e.g. "Number & Arithmetic", "Grammar". */
  readonly strand: string;
  /** Specific skill tag from question metadata, e.g. "Multiplication facts". */
  readonly skill: string;
  /** Whether the grouping key was sourced from metadata.skill or metadata.topic. */
  readonly source: "skill" | "topic";
  /** Total objective marks earned on this skill. */
  readonly marksEarned: number;
  /** Total objective marks available for this skill. */
  readonly marksAvailable: number;
  /** Whole-number accuracy percentage (0-100). */
  readonly accuracy: number;
  /** Number of attempted questions on this skill. */
  readonly attemptedCount: number;
  /** Total questions presented for this skill. */
  readonly totalCount: number;
  /** Number of incorrect questions. */
  readonly incorrectCount: number;
  /** Diagnostic performance category: strength (>=80%), developing (50-79%), or focus_area (<50%). */
  readonly performanceTier: "strength" | "developing" | "focus_area";
}

/**
 * Subject-level rollup within the baseline record.
 */
export interface SubjectBaselineRollup {
  readonly subject: string;
  readonly marksEarned: number;
  readonly marksAvailable: number;
  readonly accuracy: number;
  readonly total: number;
}

/**
 * Complete persisted diagnostic baseline record for a student.
 */
export interface DiagnosticBaselineRecord {
  readonly version: 1;
  readonly studentId: string;
  readonly yearLevel: number;
  readonly completedAt: string;
  readonly totalQuestions: number;
  readonly attemptedQuestions: number;
  readonly correctCount: number;
  readonly overallAccuracy: number;
  readonly objectiveMarksEarned: number;
  readonly objectiveMarksAvailable: number;
  readonly skills: readonly SkillBaselineEntry[];
  readonly subjects: Readonly<Record<string, SubjectBaselineRollup>>;
}

/**
 * Determine performance tier from accuracy percentage.
 */
export function derivePerformanceTier(accuracy: number): "strength" | "developing" | "focus_area" {
  if (accuracy >= 80) return "strength";
  if (accuracy >= 50) return "developing";
  return "focus_area";
}

/**
 * Builds the canonical initial skill baseline record from an ExamResult
 * and its source questions.
 *
 * Pure, deterministic function.
 */
export function buildDiagnosticBaseline(
  result: ExamResult,
  questions: readonly Question[],
  studentId: string,
  yearLevel: number,
): DiagnosticBaselineRecord {
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  // Group performance by subject + skill/topic
  const skillGroups = new Map<
    string,
    {
      subject: string;
      strand: string;
      skill: string;
      source: "skill" | "topic";
      marksEarned: number;
      marksAvailable: number;
      attemptedCount: number;
      totalCount: number;
      incorrectCount: number;
    }
  >();

  for (const detail of result.questionDetails) {
    const question = questionMap.get(detail.questionId);
    if (!question) continue;

    const subject = question.metadata.subject;
    const strand = question.metadata.strand ?? "General";
    const skillOrTopic = question.metadata.skill ?? question.metadata.topic ?? "General";
    const source: "skill" | "topic" = question.metadata.skill ? "skill" : "topic";
    const key = `${subject}:${skillOrTopic}`;

    const existing = skillGroups.get(key) ?? {
      subject,
      strand,
      skill: skillOrTopic,
      source,
      marksEarned: 0,
      marksAvailable: 0,
      attemptedCount: 0,
      totalCount: 0,
      incorrectCount: 0,
    };

    existing.totalCount += 1;
    if (detail.attempted) existing.attemptedCount += 1;
    if (detail.status === "incorrect") existing.incorrectCount += 1;
    if (!detail.requiresManualMarking) {
      existing.marksEarned += detail.awardedMarks;
      existing.marksAvailable += detail.availableMarks;
    }

    skillGroups.set(key, existing);
  }

  const skills: SkillBaselineEntry[] = Array.from(skillGroups.values()).map((group) => {
    const accuracy =
      group.marksAvailable > 0
        ? Math.round((group.marksEarned / group.marksAvailable) * 100)
        : 0;
    return {
      subject: group.subject,
      strand: group.strand,
      skill: group.skill,
      source: group.source,
      marksEarned: group.marksEarned,
      marksAvailable: group.marksAvailable,
      accuracy,
      attemptedCount: group.attemptedCount,
      totalCount: group.totalCount,
      incorrectCount: group.incorrectCount,
      performanceTier: derivePerformanceTier(accuracy),
    };
  });

  const subjects: Record<string, SubjectBaselineRollup> = {};
  for (const [subject, breakdown] of Object.entries(result.breakdowns.bySubject)) {
    const accuracy =
      breakdown.objectiveMarksAvailable > 0
        ? Math.round(
            (breakdown.objectiveMarksEarned / breakdown.objectiveMarksAvailable) * 100,
          )
        : 0;
    subjects[subject] = {
      subject,
      marksEarned: breakdown.objectiveMarksEarned,
      marksAvailable: breakdown.objectiveMarksAvailable,
      accuracy,
      total: breakdown.total,
    };
  }

  return {
    version: 1,
    studentId,
    yearLevel,
    completedAt: new Date(result.submittedAt).toISOString(),
    totalQuestions: result.totalQuestions,
    attemptedQuestions: result.attemptedQuestions,
    correctCount: result.correctCount,
    overallAccuracy: result.objectivePercentage,
    objectiveMarksEarned: result.objectiveMarksEarned,
    objectiveMarksAvailable: result.objectiveMarksAvailable,
    skills,
    subjects,
  };
}
