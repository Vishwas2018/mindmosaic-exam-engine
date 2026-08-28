/**
 * Deterministic recommendation engine for the "Practise missed skills" loop.
 *
 * Pure, framework-independent module. Accepts a completed assessment result,
 * the questions used, and derived scoring details. Returns up to three
 * recommended skill targets ranked deterministically.
 *
 * Rules:
 * - Only objectively scored questions are considered.
 * - Manual-review (essay/writing) items are excluded from weakness calculations.
 * - Incorrect and unanswered objective questions are grouped by:
 *     subject → skill (when available) → topic (as fallback).
 * - Targets are ranked by:
 *     1. Most lost objective marks (descending)
 *     2. Lowest accuracy (ascending)
 *     3. Largest attempted sample (descending)
 *     4. Stable alphabetical tie-breaking on the group key
 * - No random numbers, current time, or browser state.
 *
 * @module
 */

import type { ExamResult } from "../scoring/exam-report";
import type { Question } from "@/schemas/question.schema";
import type { SubjectId } from "@/features/taxonomy/subject-registry";

// ---------------------------------------------------------------------------
// Public contracts
// ---------------------------------------------------------------------------

/** A single skill-level recommendation target. */
export interface SkillRecommendation {
  /** The canonical question-bank subject key, e.g. "numeracy", "language_conventions". */
  subject: SubjectId;
  /**
   * The grouping key used for this target — the question's `skill` when
   * available, or its `topic` as a fallback.
   */
  skillOrTopic: string;
  /** Whether `skillOrTopic` came from the question's `skill` or `topic`. */
  source: "skill" | "topic";
  /** Total objective marks lost (incorrect + unanswered) in this group. */
  lostMarks: number;
  /** Objective accuracy as a 0–100 integer. 0 when nothing was available. */
  accuracy: number;
  /** Number of objective questions in this group that were attempted. */
  attemptedCount: number;
  /** Total objective questions in this group. */
  totalCount: number;
  /** A human-readable reason suitable for display. */
  reason: string;
}

/** The result of the recommendation engine. */
export interface RecommendationResult {
  /** Up to three recommended skill targets, in priority order. */
  recommendations: readonly SkillRecommendation[];
  /**
   * True when the assessment had no eligible objective mistakes —
   * everything was correct, or every question was manual-review.
   */
  perfectObjective: boolean;
}

// ---------------------------------------------------------------------------
// Internal grouping
// ---------------------------------------------------------------------------

interface SkillGroup {
  subject: SubjectId;
  skillOrTopic: string;
  source: "skill" | "topic";
  earnedMarks: number;
  availableMarks: number;
  attemptedCount: number;
  totalCount: number;
  incorrectCount: number;
  unansweredCount: number;
}

function groupKey(subject: string, skillOrTopic: string): string {
  return `${subject}\0${skillOrTopic}`;
}

// ---------------------------------------------------------------------------
// Core algorithm
// ---------------------------------------------------------------------------

/**
 * Build deterministic skill recommendations from a completed assessment.
 *
 * @param result - The ExamResult from `buildExamResult`.
 * @param questions - The full authoring questions used in the assessment.
 *   Only their metadata is read (subject, skill, topic); answer keys are
 *   not needed since scoring has already been done.
 */
export function recommendSkills(
  result: ExamResult,
  questions: readonly Question[],
): RecommendationResult {
  const questionById = new Map(questions.map((q) => [q.id, q]));
  const groups = new Map<string, SkillGroup>();

  // Build groups from question details, excluding manual-review items.
  for (const detail of result.questionDetails) {
    if (detail.requiresManualMarking) continue;

    const question = questionById.get(detail.questionId);
    if (!question) continue;

    const subject = question.metadata.subject;
    const skill = question.metadata.skill;
    const topic = question.metadata.topic;
    const skillOrTopic = skill ?? topic;
    const source: "skill" | "topic" = skill ? "skill" : "topic";
    const key = groupKey(subject, skillOrTopic);

    let group = groups.get(key);
    if (!group) {
      group = {
        subject,
        skillOrTopic,
        source,
        earnedMarks: 0,
        availableMarks: 0,
        attemptedCount: 0,
        totalCount: 0,
        incorrectCount: 0,
        unansweredCount: 0,
      };
      groups.set(key, group);
    }

    group.totalCount += 1;
    group.availableMarks += detail.availableMarks;
    group.earnedMarks += detail.awardedMarks;

    if (detail.attempted) {
      group.attemptedCount += 1;
    }
    if (detail.status === "incorrect") {
      group.incorrectCount += 1;
    }
    if (detail.status === "unanswered") {
      group.unansweredCount += 1;
    }
  }

  // Filter to groups that have at least one incorrect or unanswered question.
  const weakGroups = [...groups.values()].filter(
    (g) => g.incorrectCount > 0 || g.unansweredCount > 0,
  );

  if (weakGroups.length === 0) {
    return { recommendations: [], perfectObjective: true };
  }

  // Sort deterministically by the specified ranking criteria.
  weakGroups.sort((a, b) => {
    const lostA = a.availableMarks - a.earnedMarks;
    const lostB = b.availableMarks - b.earnedMarks;

    // 1. Most lost objective marks (descending).
    if (lostA !== lostB) return lostB - lostA;

    // 2. Lowest accuracy (ascending).
    const accA = a.availableMarks > 0 ? a.earnedMarks / a.availableMarks : 0;
    const accB = b.availableMarks > 0 ? b.earnedMarks / b.availableMarks : 0;
    if (accA !== accB) return accA - accB;

    // 3. Largest attempted sample (descending).
    if (a.attemptedCount !== b.attemptedCount)
      return b.attemptedCount - a.attemptedCount;

    // 4. Stable alphabetical tie-breaking.
    const keyA = groupKey(a.subject, a.skillOrTopic);
    const keyB = groupKey(b.subject, b.skillOrTopic);
    return keyA.localeCompare(keyB);
  });

  // Take up to three.
  const top = weakGroups.slice(0, 3);

  const recommendations: SkillRecommendation[] = top.map((g) => {
    const lostMarks = g.availableMarks - g.earnedMarks;
    const accuracy =
      g.availableMarks > 0
        ? Math.round((g.earnedMarks / g.availableMarks) * 100)
        : 0;

    return {
      subject: g.subject,
      skillOrTopic: g.skillOrTopic,
      source: g.source,
      lostMarks,
      accuracy,
      attemptedCount: g.attemptedCount,
      totalCount: g.totalCount,
      reason: buildReason(g),
    };
  });

  return { recommendations, perfectObjective: false };
}

// ---------------------------------------------------------------------------
// Human-readable reason builder
// ---------------------------------------------------------------------------

function buildReason(group: SkillGroup): string {
  const lostMarks = group.availableMarks - group.earnedMarks;
  const label = formatLabel(group.skillOrTopic);
  const needsLook = group.incorrectCount + group.unansweredCount;

  // When every question in the group was missed/unanswered:
  if (needsLook === group.totalCount && group.totalCount > 1) {
    return `All ${group.totalCount} ${label} questions need another look.`;
  }

  // When most lost marks are from this group (≥2 marks lost):
  if (lostMarks >= 2) {
    return `${needsLook} of ${group.totalCount} ${label} question${group.totalCount === 1 ? "" : "s"} need${needsLook === 1 ? "s" : ""} another look.`;
  }

  // Single mark lost:
  if (group.totalCount === 1) {
    return `Your ${label} question needs another look.`;
  }

  return `${needsLook} of ${group.totalCount} ${label} question${group.totalCount === 1 ? "" : "s"} need${needsLook === 1 ? "s" : ""} another look.`;
}

/** Title-case a skill or topic name for display, preserving acronyms. */
function formatLabel(raw: string): string {
  // The raw value is already human-readable in the bank (e.g. "Fractions",
  // "Punctuation and grammar"). Return as-is.
  return raw;
}
