import { describe, expect, it } from "vitest";

import { isSemanticCategory, isUnsupportedInteractionCategory } from "@/features/question-factory/correctness/verify-candidate-correctness";
import { classifySemanticCategory } from "@/features/question-factory/workflow";
import type { SemanticClassification } from "@/features/question-factory/workflow";
import type { AnswerKey, QuestionType } from "@/schemas/question.schema";
import type { Question } from "@/schemas/question.schema";

type Minimal = Pick<Question, "type" | "answerKey" | "metadata">;

function q(
  type: QuestionType,
  answerKeyKind: AnswerKey["kind"],
  subject: "numeracy" | "reading" | "writing" | "language_conventions" = "numeracy",
): Minimal {
  return {
    type,
    answerKey: { kind: answerKeyKind } as AnswerKey,
    metadata: { subject } as Question["metadata"],
  };
}

describe("classifySemanticCategory (PD-2)", () => {
  const cases: readonly [Minimal, SemanticClassification][] = [
    [q("multiple_choice", "single_option"), "deterministically_computable"],
    [q("multiple_select", "multiple_options"), "deterministically_computable"],
    [q("number_entry", "number"), "deterministically_computable"],
    [q("true_false", "boolean"), "deterministically_computable"],
    [q("matching", "matching"), "deterministically_computable"],
    [q("ordering", "ordering"), "deterministically_computable"],
    [q("fill_blank", "fill_blank", "numeracy"), "deterministically_computable"],
    [q("dropdown", "dropdown", "numeracy"), "deterministically_computable"],
    [q("fill_blank", "fill_blank", "reading"), "semantic_objective"],
    [q("dropdown", "dropdown", "writing"), "semantic_objective"],
    [q("dropdown", "dropdown", "language_conventions"), "semantic_objective"],
    [q("short_answer", "text"), "semantic_objective"],
    [q("short_answer", "manual"), "manual_review_writing"],
    [q("essay", "manual"), "manual_review_writing"],
    [q("reading_comprehension", "single_option"), "manual_review_writing"],
    [q("reading_comprehension", "multiple_options"), "manual_review_writing"],
    [q("reading_comprehension", "text"), "manual_review_writing"],
    [q("reading_comprehension", "boolean"), "manual_review_writing"],
    [q("label_diagram", "matching"), "manual_review_writing"],
    [q("hotspot", "hotspot"), "manual_review_writing"],
    [q("drag_drop", "drag_drop"), "manual_review_writing"],
  ];

  it.each(cases)("classifies %o as %s", (input, expected) => {
    expect(classifySemanticCategory(input)).toBe(expected);
  });

  it("fails closed to manual_review_writing for the unsupported-interaction fail-closed default, never to deterministically_computable", () => {
    for (const type of ["drag_drop", "hotspot", "label_diagram"] as const) {
      expect(classifySemanticCategory(q(type, "manual"))).toBe("manual_review_writing");
    }
  });

  it("stays consistent with correctness/'s isSemanticCategory for every representative input (no silent drift between the two-way and three-way splits)", () => {
    for (const [input] of cases) {
      const question = input as unknown as Question;
      const expectedIsSemantic = classifySemanticCategory(input) !== "deterministically_computable";
      expect(isSemanticCategory(question) || isUnsupportedInteractionCategory(question)).toBe(expectedIsSemantic);
    }
  });

  it("stays consistent with correctness/'s isUnsupportedInteractionCategory", () => {
    for (const [input, expected] of cases) {
      const question = input as unknown as Question;
      if (isUnsupportedInteractionCategory(question)) {
        expect(expected).toBe("manual_review_writing");
      }
    }
  });
});
