import type { CandidateAnswer } from "@/features/exam-engine/types";
import type { Question } from "@/schemas/question.schema";

/**
 * Build the canonical correct response for a question straight from its
 * answer key, in the exact shape each renderer produces.
 */
export function canonicalResponse(question: Question): CandidateAnswer {
  const key = question.answerKey;
  switch (key.kind) {
    case "single_option":
      return key.optionId;
    case "multiple_options":
      return [...key.optionIds];
    case "number":
      return key.value;
    case "text":
      return key.acceptableAnswers[0];
    case "boolean":
      return key.value;
    case "fill_blank":
      return Object.fromEntries(
        key.blanks.map((blank) => [blank.id, blank.acceptedAnswers[0]]),
      );
    case "dropdown":
      return Object.fromEntries(
        key.fields.map((field) => [field.id, field.correctOptionId]),
      );
    case "matching":
      return Object.fromEntries(key.pairs.map((pair) => [pair.sourceId, pair.targetId]));
    case "ordering":
      return [...key.optionIds];
    case "hotspot":
      return [...key.regionIds];
    case "drag_drop":
      return { ...key.placements };
    case "manual":
      return "A sample written response for manual marking.";
  }
}
