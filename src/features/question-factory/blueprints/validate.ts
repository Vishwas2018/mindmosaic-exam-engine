import { questionRendererRegistry } from "@/features/exam-engine/question-renderers/question-renderer-registry";
import { visualRendererRegistry } from "@/features/exam-engine/visual-renderers/visual-renderer-registry";

import { isValidStyleYear, yearLevelsForStyle } from "@/features/taxonomy/year-registry";

import { skillTaxonomyRegistry } from "../taxonomy";
import type { Blueprint } from "./schema";
import { toNumericYearLevel } from "./types";

export type BlueprintValidationIssueCode =
  | "unknown_skill"
  /**
   * The style is not sat at that year at all — "NAPLAN-style Year 4".
   * Distinct from `year_level_not_in_taxonomy`, which is about whether a
   * SKILL covers a year: this one is about whether the SITTING exists, and
   * is checked even when the skill is unknown, because it is a fact about
   * the assessment rather than about our content.
   */
  | "exam_style_not_sat_at_year_level"
  | "year_level_not_in_taxonomy"
  | "exam_style_not_in_taxonomy"
  | "difficulty_not_supported_by_skill"
  | "question_type_not_renderer_supported"
  | "question_type_not_recommended_for_skill"
  | "visual_type_not_renderer_supported"
  | "visual_type_not_recommended_for_skill"
  | "visual_type_without_recommendation"
  | "hotspot_requires_hotspot_visual"
  | "non_hotspot_uses_hotspot_visual";

export interface BlueprintValidationIssue {
  readonly code: BlueprintValidationIssueCode;
  readonly message: string;
}

export interface BlueprintValidationResult {
  readonly valid: boolean;
  readonly issues: readonly BlueprintValidationIssue[];
}

/**
 * Semantic validation beyond the Zod schema's shape/bounds checks:
 * taxonomy-id alignment (skill exists, and year level / exam style /
 * difficulty / question type / visual type are all consistent with what
 * that skill declares), renderer-registry-backed type support, and
 * internally contradictory constraints (e.g. a hotspot question without a
 * hotspot visual). Assumes `blueprint` already passed `blueprintSchema`.
 */
export function validateBlueprint(blueprint: Blueprint): BlueprintValidationResult {
  const issues: BlueprintValidationIssue[] = [];

  const entry = skillTaxonomyRegistry.get(blueprint.skill);
  if (!entry) {
    issues.push({
      code: "unknown_skill",
      message: `Skill '${blueprint.skill}' is not a known taxonomy id.`,
    });
  }

  if (!questionRendererRegistry.supports(blueprint.questionType)) {
    issues.push({
      code: "question_type_not_renderer_supported",
      message: `Question type '${blueprint.questionType}' has no registered renderer.`,
    });
  }

  if (blueprint.visualType && !visualRendererRegistry.supports(blueprint.visualType)) {
    issues.push({
      code: "visual_type_not_renderer_supported",
      message: `Visual type '${blueprint.visualType}' has no registered renderer.`,
    });
  }

  /*
   * Style/year validity, from the year registry (expansion-plan T0a).
   *
   * Checked outside the `if (entry)` block on purpose: whether NAPLAN is
   * sat in Year 4 is a fact about the assessment, not about whether we
   * happen to have a taxonomy entry for the skill. A blueprint that is
   * wrong on both counts should say so on both counts, and an unknown
   * skill must not be able to mask an impossible sitting.
   *
   * Without this, generating against an unchecked matrix would quietly
   * produce "NAPLAN-style Year 4" content for a sitting that does not
   * exist — and nothing downstream would notice, because every other
   * check would pass.
   */
  const blueprintYearLevel = toNumericYearLevel(blueprint.yearLevel);
  if (!isValidStyleYear(blueprint.examStyle, blueprintYearLevel)) {
    issues.push({
      code: "exam_style_not_sat_at_year_level",
      message:
        `Exam style '${blueprint.examStyle}' is not sat at year level ` +
        `'${blueprint.yearLevel}'. Valid years: ` +
        `${yearLevelsForStyle(blueprint.examStyle).join(", ")}.`,
    });
  }

  if (entry) {
    if (!entry.yearLevels.includes(blueprintYearLevel)) {
      issues.push({
        code: "year_level_not_in_taxonomy",
        message: `Skill '${blueprint.skill}' does not cover year level '${blueprint.yearLevel}'.`,
      });
    }

    if (!entry.examStyles.includes(blueprint.examStyle)) {
      issues.push({
        code: "exam_style_not_in_taxonomy",
        message: `Skill '${blueprint.skill}' does not cover exam style '${blueprint.examStyle}'.`,
      });
    }

    if (!entry.supportedDifficulties.includes(blueprint.difficulty)) {
      issues.push({
        code: "difficulty_not_supported_by_skill",
        message: `Skill '${blueprint.skill}' does not support difficulty '${blueprint.difficulty}'.`,
      });
    }

    if (
      questionRendererRegistry.supports(blueprint.questionType) &&
      !entry.recommendedQuestionTypes.includes(blueprint.questionType)
    ) {
      issues.push({
        code: "question_type_not_recommended_for_skill",
        message: `Skill '${blueprint.skill}' does not recommend question type '${blueprint.questionType}'.`,
      });
    }

    if (blueprint.visualType) {
      if (entry.recommendedVisualTypes.length === 0) {
        issues.push({
          code: "visual_type_without_recommendation",
          message: `Skill '${blueprint.skill}' recommends no visual type, but '${blueprint.visualType}' was set.`,
        });
      } else if (
        visualRendererRegistry.supports(blueprint.visualType) &&
        !entry.recommendedVisualTypes.includes(blueprint.visualType)
      ) {
        issues.push({
          code: "visual_type_not_recommended_for_skill",
          message: `Skill '${blueprint.skill}' does not recommend visual type '${blueprint.visualType}'.`,
        });
      }
    }
  }

  if (blueprint.questionType === "hotspot" && blueprint.visualType !== "hotspot_svg") {
    issues.push({
      code: "hotspot_requires_hotspot_visual",
      message: "Hotspot questions require visualType 'hotspot_svg'.",
    });
  }

  if (blueprint.questionType !== "hotspot" && blueprint.visualType === "hotspot_svg") {
    issues.push({
      code: "non_hotspot_uses_hotspot_visual",
      message: "Only hotspot questions may use visualType 'hotspot_svg'.",
    });
  }

  return { valid: issues.length === 0, issues };
}
