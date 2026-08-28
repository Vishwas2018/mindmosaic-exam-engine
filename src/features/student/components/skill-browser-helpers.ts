import type { SkillSummary, SubjectFilter } from "@/features/exam-engine/selection";

export const MIN_DRILL_QUESTION_COUNT = 5;
export const DEFAULT_SKILL_PAGE_SIZE = 12;

/**
 * Filter a skill catalogue to only include skills backed by at least `minQuestions` items.
 * Guards against presenting 1-question skills as full practice sets.
 */
export function filterPracticableSkills(
  skills: readonly SkillSummary[],
  minQuestions = MIN_DRILL_QUESTION_COUNT,
): SkillSummary[] {
  return skills.filter((entry) => entry.questionCount >= minQuestions);
}

export interface SkillFilterOptions {
  subject: SubjectFilter | "all";
  search?: string;
  minQuestions?: number;
}

/**
 * Filter skills by subject, search query, and minimum question count.
 */
export function filterSkills(
  skills: readonly SkillSummary[],
  options: SkillFilterOptions,
): SkillSummary[] {
  const minCount = options.minQuestions ?? MIN_DRILL_QUESTION_COUNT;
  const query = options.search?.trim().toLowerCase();

  return skills.filter((entry) => {
    if (entry.questionCount < minCount) return false;
    if (options.subject !== "all" && entry.subject !== options.subject) return false;
    if (query && !entry.skill.toLowerCase().includes(query)) return false;
    return true;
  });
}

/**
 * Pure pagination helper for the skill cards grid.
 */
export function sliceSkillsForDisplay(
  skills: readonly SkillSummary[],
  limit: number,
): {
  visible: SkillSummary[];
  totalCount: number;
  hasMore: boolean;
  remainingCount: number;
} {
  const totalCount = skills.length;
  const visible = skills.slice(0, limit);
  const remainingCount = Math.max(0, totalCount - visible.length);

  return {
    visible,
    totalCount,
    hasMore: remainingCount > 0,
    remainingCount,
  };
}
