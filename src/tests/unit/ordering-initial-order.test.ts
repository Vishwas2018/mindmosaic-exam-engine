import { describe, expect, it } from "vitest";

import { questionBank } from "@/content/questions/question-bank";
import { showcaseQuestions } from "@/content/questions/showcase-fixtures";
import { deriveInitialOrder } from "@/features/exam-engine/question-renderers/ordering-utils";
import type { Question } from "@/schemas/question.schema";

describe("deriveInitialOrder", () => {
  it("rotates a fixed vector deterministically", () => {
    expect(deriveInitialOrder(["a", "b", "c", "d"])).toEqual(["b", "c", "d", "a"]);
  });

  it("is a pure function of its input — same input, same output", () => {
    const input = ["x", "y", "z"];
    expect(deriveInitialOrder(input)).toEqual(deriveInitialOrder([...input]));
  });

  it("always differs from the authored input order for two or more items", () => {
    expect(deriveInitialOrder(["a", "b"])).toEqual(["b", "a"]);
    expect(deriveInitialOrder(["a", "b", "c"])).not.toEqual(["a", "b", "c"]);
  });

  it("does not mutate its input", () => {
    const input = ["a", "b", "c"];
    deriveInitialOrder(input);
    expect(input).toEqual(["a", "b", "c"]);
  });

  it("returns a single item unchanged (defensive; schema requires at least two)", () => {
    expect(deriveInitialOrder(["solo"])).toEqual(["solo"]);
  });
});

/**
 * Content-validation gate: no ordering question's deterministic initial
 * display order may accidentally equal its own correct answer sequence.
 * Authoring an ordering item list in already-correct order — the exact
 * defect this hardening pass fixes — would otherwise slip back in
 * silently as new content is added.
 */
function orderingQuestions(bank: readonly Question[]): Question[] {
  return bank.filter((question) => question.type === "ordering");
}

describe.each([
  ["production bank", orderingQuestions(questionBank)],
  ["showcase fixtures", orderingQuestions(showcaseQuestions)],
])("%s: ordering initial order never matches the answer key", (_label, questions) => {
  it.each(questions.map((question) => [question.id, question] as const))(
    "%s",
    (_id, question) => {
      if (question.interaction?.type !== "ordering" || question.answerKey.kind !== "ordering") {
        throw new Error(`Question '${question.id}' is missing ordering configuration.`);
      }
      const itemIds = question.interaction.items.map((item) => item.id);
      const initialOrder = deriveInitialOrder(itemIds);
      expect(initialOrder).not.toEqual(question.answerKey.optionIds);
    },
  );
});
