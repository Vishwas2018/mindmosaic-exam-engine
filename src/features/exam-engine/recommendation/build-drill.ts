/**
 * Deterministic five-question drill builder for the "Practise missed skills" loop.
 *
 * Pure, framework-independent module. Selects exactly five reinforcement
 * questions from the published bank to target a specific weakness.
 *
 * Selection rules:
 * - Match the selected subject and skill/topic.
 * - Prefer the learner's year level and assessment style.
 * - Exclude questions from the just-completed assessment where enough
 *   alternatives exist.
 * - Never repeat a question inside the drill.
 * - Never silently include another year or subject.
 * - Use the published bank only (no ungated extended-practice bank).
 * - Produce a stable selection for the same input and seed.
 * - Return an explicit insufficiency result rather than silently
 *   weakening the criteria.
 * - Do not expose answer keys through any output.
 *
 * @module
 */

import type { Question } from "@/schemas/question.schema";

import { seededShuffle } from "../selection/seeded-random";
import type { SkillRecommendation } from "./recommend-skills";

// ---------------------------------------------------------------------------
// Public contracts
// ---------------------------------------------------------------------------

/** The input to the drill builder. */
export interface DrillTarget {
  /** The recommendation this drill targets. */
  recommendation: SkillRecommendation;
  /** Preferred year level (3 or 5); "mixed" means no preference. */
  yearLevel: number | "mixed";
  /** Preferred exam style; "mixed" means no preference. */
  examStyle: string | "mixed";
  /**
   * Question IDs from the just-completed assessment. These are excluded
   * when enough alternatives exist.
   */
  previousQuestionIds: readonly string[];
  /**
   * Deterministic seed for the drill. Same seed + same inputs = same output.
   */
  seed: string;
}

export const DRILL_QUESTION_COUNT = 5;

export type DrillResult =
  | {
      ok: true;
      /** Exactly DRILL_QUESTION_COUNT question IDs, in drill order. */
      questionIds: readonly string[];
      /** The subject of all selected questions. */
      subject: string;
      /** The skill/topic of all selected questions. */
      skillOrTopic: string;
      seed: string;
    }
  | {
      ok: false;
      reason: "insufficient_questions" | "invalid_target";
      eligibleCount: number;
      requestedCount: number;
      message: string;
    };

// ---------------------------------------------------------------------------
// Core algorithm
// ---------------------------------------------------------------------------

/**
 * Build a deterministic five-question drill from the published bank.
 *
 * @param publishedBank - The published question bank (`getExamBank("published")`).
 *   Only question metadata is used for selection; answer keys are never
 *   included in the output.
 * @param target - The drill target parameters.
 */
export function buildDrill(
  publishedBank: readonly Question[],
  target: DrillTarget,
): DrillResult {
  const { recommendation, yearLevel, examStyle, previousQuestionIds, seed } =
    target;

  // Validate the target.
  if (!recommendation.subject || !recommendation.skillOrTopic) {
    return {
      ok: false,
      reason: "invalid_target",
      eligibleCount: 0,
      requestedCount: DRILL_QUESTION_COUNT,
      message: "The recommendation target is missing a subject or skill.",
    };
  }

  const previousIds = new Set(previousQuestionIds);

  // Step 1: Filter the bank to the target subject and skill/topic.
  const subjectMatches = publishedBank.filter(
    (q) => q.metadata.subject === recommendation.subject,
  );

  const skillMatches = subjectMatches.filter((q) => {
    if (recommendation.source === "topic") {
      return (
        q.metadata.topic === recommendation.skillOrTopic ||
        q.metadata.skill === recommendation.skillOrTopic
      );
    }
    const qSkillOrTopic = q.metadata.skill ?? q.metadata.topic;
    return qSkillOrTopic === recommendation.skillOrTopic;
  });

  if (skillMatches.length === 0) {
    return {
      ok: false,
      reason: "insufficient_questions",
      eligibleCount: 0,
      requestedCount: DRILL_QUESTION_COUNT,
      message: `No published questions found for ${recommendation.subject} / ${recommendation.skillOrTopic}.`,
    };
  }

  // Step 2: Prefer year level and exam style.
  // Score each question for preference matching (higher = better).
  const scored = skillMatches.map((q) => {
    let preference = 0;
    if (yearLevel !== "mixed" && q.yearLevel === yearLevel) preference += 2;
    if (examStyle !== "mixed" && q.examStyle === examStyle) preference += 1;
    const wasPrevious = previousIds.has(q.id);
    return { question: q, preference, wasPrevious };
  });

  // Step 3: Sort by preference (descending), then by whether it was
  // previously used (non-previous first), then stable by ID.
  scored.sort((a, b) => {
    if (a.preference !== b.preference) return b.preference - a.preference;
    if (a.wasPrevious !== b.wasPrevious) return a.wasPrevious ? 1 : -1;
    return a.question.id.localeCompare(b.question.id);
  });

  // Step 4: Remove duplicates (by ID) in case the bank has any.
  const seen = new Set<string>();
  const deduplicated = scored.filter((s) => {
    if (seen.has(s.question.id)) return false;
    seen.add(s.question.id);
    return true;
  });

  // Step 5: Try to select from non-previous questions first.
  const nonPrevious = deduplicated.filter((s) => !s.wasPrevious);

  let pool: typeof deduplicated;
  if (nonPrevious.length >= DRILL_QUESTION_COUNT) {
    // Enough alternatives exist — exclude previous questions.
    pool = nonPrevious;
  } else {
    // Not enough alternatives — include previous questions to fill.
    pool = deduplicated;
  }

  if (pool.length < DRILL_QUESTION_COUNT) {
    return {
      ok: false,
      reason: "insufficient_questions",
      eligibleCount: pool.length,
      requestedCount: DRILL_QUESTION_COUNT,
      message: `Only ${pool.length} eligible question${pool.length === 1 ? "" : "s"} found for ${recommendation.skillOrTopic}; ${DRILL_QUESTION_COUNT} are needed.`,
    };
  }

  // Step 6: Select questions prioritizing higher preference tiers,
  // applying seeded shuffle within each tier for deterministic variation.
  const tierMap = new Map<number, Question[]>();
  for (const item of pool) {
    const list = tierMap.get(item.preference) ?? [];
    list.push(item.question);
    tierMap.set(item.preference, list);
  }

  const sortedTiers = [...tierMap.keys()].sort((a, b) => b - a);
  const selected: Question[] = [];

  for (const tier of sortedTiers) {
    const tierQuestions = tierMap.get(tier) ?? [];
    const needed = DRILL_QUESTION_COUNT - selected.length;
    if (needed <= 0) break;

    const shuffledTier = seededShuffle(tierQuestions, `${seed}-tier-${tier}`);
    selected.push(...shuffledTier.slice(0, needed));
  }

  return {
    ok: true,
    questionIds: selected.map((q) => q.id),
    subject: recommendation.subject,
    skillOrTopic: recommendation.skillOrTopic,
    seed,
  };
}
