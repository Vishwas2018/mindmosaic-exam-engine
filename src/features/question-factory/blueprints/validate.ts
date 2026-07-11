import { questionRendererRegistry } from "@/features/exam-engine/question-renderers/question-renderer-registry";
import { visualRendererRegistry } from "@/features/exam-engine/visual-renderers/visual-renderer-registry";

import { skillTaxonomyRegistry } from "../taxonomy";
import type { Blueprint } from "./schema";
import { toNumericYearLevel } from "./types";

export type BlueprintValidationIssueCode =
  | "unknown_skill"
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

  if (entry) {
    const numericYearLevel = toNumericYearLevel(blueprint.yearLevel);
    if (!entry.yearLevels.includes(numericYearLevel)) {
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
