import { questionRendererRegistry } from "@/features/exam-engine/question-renderers/question-renderer-registry";
import { visualRendererRegistry } from "@/features/exam-engine/visual-renderers/visual-renderer-registry";

import type { CandidateQuestion } from "../ingestion/candidate-question";
import type { StructuralValidationIssue } from "./types";

function issue(
  code: StructuralValidationIssue["code"],
  path: string,
  message: string,
): StructuralValidationIssue {
  return { code, path, message, severity: "error" };
}

/**
 * Confirms `type`/each visual's `type` is a member of the renderer
 * registries directly — the same authoritative source
 * `config/allowed-types.ts` draws `ALLOWED_QUESTION_TYPES`/
 * `ALLOWED_VISUAL_TYPES` from. In normal operation this can never fail for
 * a `candidateQuestionSchema`-valid candidate (the schema's own enums are
 * a subset of the registries' supported types), so this check exists as
 * explicit, testable defence against the schema enum and the renderer
 * registries drifting apart in the future — never a redundant no-op to be
 * removed.
 */
export function checkRegistryMembership(question: CandidateQuestion): readonly StructuralValidationIssue[] {
  const issues: StructuralValidationIssue[] = [];

  if (!questionRendererRegistry.supports(question.type)) {
    issues.push(
      issue(
        "question_type_not_in_renderer_registry",
        "question.type",
        `Question type '${question.type}' is not registered in the question renderer registry.`,
      ),
    );
  }

  question.visuals.forEach((visual, index) => {
    if (!visualRendererRegistry.supports(visual.type)) {
      issues.push(
        issue(
          "visual_type_not_in_visual_registry",
          `question.visuals.${index}.type`,
          `Visual type '${visual.type}' is not registered in the visual renderer registry.`,
        ),
      );
    }
  });

  return issues;
}
