import { describe, expect, it } from "vitest";

import { checkAgainstProductionSchema } from "@/features/question-factory/validation";
import type { CandidateQuestion } from "@/features/question-factory/ingestion/candidate-question";
import type { Question } from "@/schemas/question.schema";

import { deriveIndependentAnswer } from "@/features/question-factory/correctness/derive-answer";
import { fractionToDisplayString } from "@/features/question-factory/correctness/numeric";

import {
  additionQuestion,
  ambiguousChartTieQuestion,
  barChartLookupQuestion,
  decimalArithmeticQuestion,
  divisionQuestion,
  fractionEquivalenceMatchingQuestion,
  fractionModelDropdownQuestion,
  fractionModelFillBlankQuestion,
  fractionOrderingQuestion,
  inconsistentNumberLineQuestion,
  lineGraphLookupQuestion,
  moneyTotalQuestion,
  multipleChoiceArithmeticQuestion,
  multiplicationQuestion,
  multipleSelectPredicateQuestion,
  numberLineExtrapolationQuestion,
  perimeterQuestion,
  rectangularAreaQuestion,
  subtractionQuestion,
  tableDifferenceQuestion,
  tableLookupQuestion,
  trueFalseArithmeticQuestion,
  underspecifiedPromptQuestion,
} from "./correctness-fixtures";

function toQuestion(raw: Record<string, unknown>): Question {
  const outcome = checkAgainstProductionSchema(raw as unknown as CandidateQuestion);
  if (!outcome.ok) {
    throw new Error(`fixture does not satisfy the production schema: ${outcome.issues.map((i) => i.message).join("; ")}`);
  }
  return outcome.question;
}

describe("deriveIndependentAnswer — deterministic passing categories", () => {
  it("addition", () => {
    const outcome = deriveIndependentAnswer(toQuestion(additionQuestion()));
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.value.kind === "number") expect(fractionToDisplayString(outcome.value.value)).toBe("71");
  });

  it("subtraction", () => {
    const outcome = deriveIndependentAnswer(toQuestion(subtractionQuestion()));
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.value.kind === "number") expect(fractionToDisplayString(outcome.value.value)).toBe("53");
  });

  it("multiplication", () => {
    const outcome = deriveIndependentAnswer(toQuestion(multiplicationQuestion()));
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.value.kind === "number") expect(fractionToDisplayString(outcome.value.value)).toBe("42");
  });

  it("division", () => {
    const outcome = deriveIndependentAnswer(toQuestion(divisionQuestion()));
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.value.kind === "number") expect(fractionToDisplayString(outcome.value.value)).toBe("21");
  });

  it("decimal arithmetic", () => {
    const outcome = deriveIndependentAnswer(toQuestion(decimalArithmeticQuestion()));
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.value.kind === "number") expect(fractionToDisplayString(outcome.value.value)).toBe("63/4");
  });

  it("multiple-choice arithmetic (resolves to the matching option)", () => {
    const outcome = deriveIndependentAnswer(toQuestion(multipleChoiceArithmeticQuestion()));
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.value.kind === "single_option") expect(outcome.value.optionId).toBe("opt-a");
  });

  it("true/false arithmetic claim", () => {
    const outcome = deriveIndependentAnswer(toQuestion(trueFalseArithmeticQuestion()));
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.value.kind === "boolean") expect(outcome.value.value).toBe(true);
  });

  it("multiple-select numeric predicate", () => {
    const outcome = deriveIndependentAnswer(toQuestion(multipleSelectPredicateQuestion()));
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.value.kind === "multiple_options") {
      expect([...outcome.value.optionIds].sort()).toEqual(["opt-a", "opt-c"]);
    }
  });

  it("money total from a price-list table", () => {
    const outcome = deriveIndependentAnswer(toQuestion(moneyTotalQuestion()));
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.value.kind === "number") expect(fractionToDisplayString(outcome.value.value)).toBe("11/2");
  });

  it("perimeter of a square", () => {
    const outcome = deriveIndependentAnswer(toQuestion(perimeterQuestion()));
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.value.kind === "number") expect(fractionToDisplayString(outcome.value.value)).toBe("16");
  });

  it("area of a rectangle", () => {
    const outcome = deriveIndependentAnswer(toQuestion(rectangularAreaQuestion()));
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.value.kind === "number") expect(fractionToDisplayString(outcome.value.value)).toBe("18");
  });

  it("table cell lookup", () => {
    const outcome = deriveIndependentAnswer(toQuestion(tableLookupQuestion()));
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.value.kind === "number") expect(fractionToDisplayString(outcome.value.value)).toBe("120");
  });

  it("table row-to-row difference", () => {
    const outcome = deriveIndependentAnswer(toQuestion(tableDifferenceQuestion()));
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.value.kind === "number") expect(fractionToDisplayString(outcome.value.value)).toBe("25");
  });

  it("bar-chart category lookup", () => {
    const outcome = deriveIndependentAnswer(toQuestion(barChartLookupQuestion()));
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.value.kind === "number") expect(fractionToDisplayString(outcome.value.value)).toBe("20");
  });

  it("line-graph category lookup", () => {
    const outcome = deriveIndependentAnswer(toQuestion(lineGraphLookupQuestion()));
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.value.kind === "number") expect(fractionToDisplayString(outcome.value.value)).toBe("8");
  });

  it("number-line arithmetic-sequence extrapolation", () => {
    const outcome = deriveIndependentAnswer(toQuestion(numberLineExtrapolationQuestion()));
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.value.kind === "number") expect(fractionToDisplayString(outcome.value.value)).toBe("20");
  });

  it("fraction equivalence matching", () => {
    const outcome = deriveIndependentAnswer(toQuestion(fractionEquivalenceMatchingQuestion()));
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.value.kind === "matching") {
      expect(outcome.value.pairs).toEqual(
        expect.arrayContaining([
          { sourceId: "src-1", targetId: "tgt-1" },
          { sourceId: "src-2", targetId: "tgt-2" },
        ]),
      );
    }
  });

  it("independent decimal ordering", () => {
    const outcome = deriveIndependentAnswer(toQuestion(fractionOrderingQuestion()));
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.value.kind === "ordering") {
      expect(outcome.value.optionIds).toEqual(["item-2", "item-3", "item-1"]);
    }
  });

  it("fraction-model fill-blank (single blank)", () => {
    const outcome = deriveIndependentAnswer(toQuestion(fractionModelFillBlankQuestion()));
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.value.kind === "fill_blank") {
      expect(outcome.value.values["blank-1"]).toBe("3");
    }
  });

  it("fraction-model dropdown (single field)", () => {
    const outcome = deriveIndependentAnswer(toQuestion(fractionModelDropdownQuestion()));
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.value.kind === "dropdown") {
      expect(outcome.value.values["field-1"]).toBe("opt-4");
    }
  });
});

describe("deriveIndependentAnswer — cannot-derive / ambiguous outcomes", () => {
  it("reports ambiguous_visual_data on a tie at the chart extreme", () => {
    const outcome = deriveIndependentAnswer(toQuestion(ambiguousChartTieQuestion()));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toBe("ambiguous");
      expect(outcome.issueCode).toBe("ambiguous_visual_data");
    }
  });

  it("reports number_line_inconsistent for unevenly spaced highlighted values", () => {
    const outcome = deriveIndependentAnswer(toQuestion(inconsistentNumberLineQuestion()));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.issueCode).toBe("number_line_inconsistent");
  });

  it("reports not-derivable for an under-specified word problem with no literal expression", () => {
    const outcome = deriveIndependentAnswer(toQuestion(underspecifiedPromptQuestion()));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.reason).toBe("cannot_derive");
  });
});
