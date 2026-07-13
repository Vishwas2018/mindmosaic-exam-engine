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
  canonicalisationCollisionChartQuestion,
  chartDuplicateCanonicalOptionsQuestion,
  chartExactUniqueMinimumQuestion,
  chartLabelCaseEquivalentOptionQuestion,
  chartLabelContainsOptionQuestion,
  chartLabelPrefixOfOptionQuestion,
  chartLabelSubstringOfLongerOptionQuestion,
  chartLabelWhitespaceEquivalentOptionQuestion,
  chartNoMatchingOptionQuestion,
  decimalArithmeticQuestion,
  decimalThresholdPredicateQuestion,
  divisionQuestion,
  duplicateBarChartLabelQuestion,
  duplicateLineGraphLabelQuestion,
  duplicatePieChartLabelQuestion,
  duplicateTableHeaderQuestion,
  duplicateTableRowLabelQuestion,
  fractionEquivalenceMatchingQuestion,
  fractionModelDropdownQuestion,
  fractionModelFillBlankQuestion,
  fractionOrderingQuestion,
  inconsistentNumberLineQuestion,
  lineGraphLookupQuestion,
  moneyRepeatingDecimalQuestion,
  moneySmallDecimalQuestion,
  moneyTotalQuestion,
  multipleChoiceArithmeticQuestion,
  multiplesOfDecimalDivisorQuestion,
  multiplesOfHugeDivisorQuestion,
  multiplesOfNegativeDivisorQuestion,
  multiplesOfZeroQuestion,
  multiplicationQuestion,
  multipleSelectPredicateQuestion,
  negativeThresholdPredicateQuestion,
  nonIntegralEvenPredicateQuestion,
  numberLineExtrapolationQuestion,
  oversizedArithmeticExpressionQuestion,
  perimeterQuestion,
  rectangularAreaQuestion,
  subtractionQuestion,
  tableDifferenceQuestion,
  tableLookupQuestion,
  trueFalseArithmeticQuestion,
  underspecifiedPromptQuestion,
  unicodeComposedDecomposedChartLabelsQuestion,
  unicodeDuplicateChartLabelsQuestion,
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

  it("money: 0.10 x 3 = 0.30 exactly", () => {
    const outcome = deriveIndependentAnswer(toQuestion(moneySmallDecimalQuestion()));
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.value.kind === "number") expect(fractionToDisplayString(outcome.value.value)).toBe("3/10");
  });

  it("money: 1.05 x 7 = 7.35 exactly, where naive floating point would drift", () => {
    const outcome = deriveIndependentAnswer(toQuestion(moneyRepeatingDecimalQuestion()));
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.value.kind === "number") expect(fractionToDisplayString(outcome.value.value)).toBe("147/20");
  });
});

describe("deriveIndependentAnswer — numeric predicates with decimal/negative thresholds", () => {
  it("includes 2 for 'less than 2.5', excluding the boundary value 2.5 itself", () => {
    const outcome = deriveIndependentAnswer(toQuestion(decimalThresholdPredicateQuestion()));
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.value.kind === "multiple_options") {
      expect(outcome.value.optionIds).toEqual(["opt-a", "opt-b"]);
    }
  });

  it("evaluates a negative decimal threshold ('greater than -1.5') exactly", () => {
    const outcome = deriveIndependentAnswer(toQuestion(negativeThresholdPredicateQuestion()));
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.value.kind === "multiple_options") {
      expect(outcome.value.optionIds).toEqual(["opt-b", "opt-c"]);
    }
  });

  it("rejects an even/odd predicate over a non-integral option rather than silently skipping it", () => {
    const outcome = deriveIndependentAnswer(toQuestion(nonIntegralEvenPredicateQuestion()));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.reason).toBe("cannot_derive");
  });

  it("preserves declared option order in the independently derived response", () => {
    const question = toQuestion({
      id: "corr-pred-order-001",
      type: "multiple_select",
      yearLevel: 5,
      examStyle: "icas_style",
      prompt: "Which of these numbers are multiples of 3?",
      options: [
        { id: "opt-z", text: "9" },
        { id: "opt-a", text: "6" },
        { id: "opt-m", text: "10" },
        { id: "opt-b", text: "3" },
      ],
      answerKey: { kind: "multiple_options", optionIds: ["opt-z", "opt-a", "opt-b"] },
      explanation: "9, 6, and 3 are multiples of 3.",
      metadata: { subject: "numeracy", strand: "Number", skill: "num.number.multiples", difficulty: "easy", marks: 1, estimatedTimeSeconds: 60, tags: [] },
    });
    const outcome = deriveIndependentAnswer(question);
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.value.kind === "multiple_options") {
      // Declared order was opt-z, opt-a, opt-m, opt-b; matches (opt-z, opt-a, opt-b) must come back in that order.
      expect(outcome.value.optionIds).toEqual(["opt-z", "opt-a", "opt-b"]);
    }
  });
});

describe("deriveIndependentAnswer — ambiguous visual structures fail closed", () => {
  it("rejects a bar chart with a duplicate category label", () => {
    const outcome = deriveIndependentAnswer(toQuestion(duplicateBarChartLabelQuestion()));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toBe("ambiguous");
      expect(outcome.issueCode).toBe("ambiguous_visual_label");
    }
  });

  it("rejects a line graph with a duplicate point label", () => {
    const outcome = deriveIndependentAnswer(toQuestion(duplicateLineGraphLabelQuestion()));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.issueCode).toBe("ambiguous_visual_label");
  });

  it("rejects a pie chart with a duplicate segment label", () => {
    const outcome = deriveIndependentAnswer(toQuestion(duplicatePieChartLabelQuestion()));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.issueCode).toBe("ambiguous_visual_label");
  });

  it("rejects a whitespace/case canonicalisation collision between chart labels", () => {
    const outcome = deriveIndependentAnswer(toQuestion(canonicalisationCollisionChartQuestion()));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.issueCode).toBe("ambiguous_visual_label");
  });

  it("rejects a table with a duplicate header", () => {
    const outcome = deriveIndependentAnswer(toQuestion(duplicateTableHeaderQuestion()));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.issueCode).toBe("ambiguous_table_header");
  });

  it("rejects a table with a duplicate row label", () => {
    const outcome = deriveIndependentAnswer(toQuestion(duplicateTableRowLabelQuestion()));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.issueCode).toBe("ambiguous_table_row");
  });

  it("still rejects a genuine tied extremum as ambiguous_visual_data (distinct from duplicate-label ambiguity)", () => {
    const outcome = deriveIndependentAnswer(toQuestion(ambiguousChartTieQuestion()));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.issueCode).toBe("ambiguous_visual_data");
  });
});

describe("deriveIndependentAnswer — arithmetic resource limits", () => {
  it("rejects an oversized arithmetic expression with a resource-limit issue code, never a stack overflow or hang", () => {
    const outcome = deriveIndependentAnswer(toQuestion(oversizedArithmeticExpressionQuestion()));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.issueCode).toBe("arithmetic_resource_limit_exceeded");
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

describe("deriveIndependentAnswer — chart-to-option exact matching (never substring)", () => {
  it("chart label 'A', option 'AA': resolves to the exact match, never the prefix-containing option", () => {
    const outcome = deriveIndependentAnswer(toQuestion(chartLabelPrefixOfOptionQuestion()));
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.value.kind === "single_option") expect(outcome.value.optionId).toBe("opt-a");
  });

  it("chart label 'AA', option 'A': resolves to the exact match, never the substring-contained option", () => {
    const outcome = deriveIndependentAnswer(toQuestion(chartLabelContainsOptionQuestion()));
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.value.kind === "single_option") expect(outcome.value.optionId).toBe("opt-aa");
  });

  it("chart label 'Cat', option 'Category': never falsely resolves via substring containment", () => {
    const outcome = deriveIndependentAnswer(toQuestion(chartLabelSubstringOfLongerOptionQuestion()));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.issueCode).toBe("unable_to_derive_answer");
  });

  it("case-only equivalent exact match resolves correctly", () => {
    const outcome = deriveIndependentAnswer(toQuestion(chartLabelCaseEquivalentOptionQuestion()));
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.value.kind === "single_option") expect(outcome.value.optionId).toBe("opt-apples");
  });

  it("whitespace-normalised exact match resolves correctly", () => {
    const outcome = deriveIndependentAnswer(toQuestion(chartLabelWhitespaceEquivalentOptionQuestion()));
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.value.kind === "single_option") expect(outcome.value.optionId).toBe("opt-apples");
  });

  it("duplicate canonical options matching the winning label fail closed as ambiguous, never picking the first", () => {
    const outcome = deriveIndependentAnswer(toQuestion(chartDuplicateCanonicalOptionsQuestion()));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toBe("ambiguous");
      expect(outcome.issueCode).toBe("ambiguous_prompt");
    }
  });

  it("zero matching options fails closed", () => {
    const outcome = deriveIndependentAnswer(toQuestion(chartNoMatchingOptionQuestion()));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.issueCode).toBe("unable_to_derive_answer");
  });

  it("resolves a valid exact-unique maximum", () => {
    const outcome = deriveIndependentAnswer(toQuestion(chartLabelCaseEquivalentOptionQuestion()));
    expect(outcome.ok).toBe(true);
  });

  it("resolves a valid exact-unique minimum", () => {
    const outcome = deriveIndependentAnswer(toQuestion(chartExactUniqueMinimumQuestion()));
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.value.kind === "single_option") expect(outcome.value.optionId).toBe("opt-bananas");
  });

  it("tied extrema still fail closed (unaffected by the exact-matching change)", () => {
    const outcome = deriveIndependentAnswer(toQuestion(ambiguousChartTieQuestion()));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.issueCode).toBe("ambiguous_visual_data");
  });
});

describe("deriveIndependentAnswer — multiples-predicate bounded parsing", () => {
  it("rejects an oversized digit-string divisor with a bounded, stable resource-limit issue, never an unbounded BigInt construction", () => {
    const outcome = deriveIndependentAnswer(toQuestion(multiplesOfHugeDivisorQuestion()));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issueCode).toBe("fraction_resource_limit_exceeded");
      expect(outcome.message?.length ?? 0).toBeLessThan(300);
      // Never echoes the raw 200-digit divisor back into the message.
      expect(outcome.message).not.toMatch(/9{50,}/);
    }
  });

  it("rejects a decimal multiples-of divisor rather than silently truncating it to an integer", () => {
    const outcome = deriveIndependentAnswer(toQuestion(multiplesOfDecimalDivisorQuestion()));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.issueCode).toBe("unable_to_derive_answer");
  });

  it("rejects 'multiples of 0' as not mathematically well-defined", () => {
    const outcome = deriveIndependentAnswer(toQuestion(multiplesOfZeroQuestion()));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.issueCode).toBe("unable_to_derive_answer");
  });

  it("handles a negative divisor deliberately and consistently (multiples of -3 matches the same set as multiples of 3)", () => {
    const outcome = deriveIndependentAnswer(toQuestion(multiplesOfNegativeDivisorQuestion()));
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.value.kind === "multiple_options") {
      expect(outcome.value.optionIds).toEqual(["opt-a", "opt-c"]);
    }
  });

  it("produces a deterministic fingerprint-relevant issue set for the same oversized-divisor failure across repeated calls", () => {
    const first = deriveIndependentAnswer(toQuestion(multiplesOfHugeDivisorQuestion()));
    const second = deriveIndependentAnswer(toQuestion(multiplesOfHugeDivisorQuestion()));
    expect(first.ok).toBe(false);
    expect(second.ok).toBe(false);
    if (!first.ok && !second.ok) {
      expect(first.issueCode).toBe(second.issueCode);
      expect(first.message).toBe(second.message);
    }
  });
});

describe("deriveIndependentAnswer — Unicode canonicalisation", () => {
  it("resolves a composed-vs-decomposed accented chart label to the same exact lookup", () => {
    const outcome = deriveIndependentAnswer(toQuestion(unicodeComposedDecomposedChartLabelsQuestion()));
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.value.kind === "number") expect(fractionToDisplayString(outcome.value.value)).toBe("20");
  });

  it("rejects a chart whose composed and decomposed labels canonicalise to a Unicode-equivalent duplicate", () => {
    const outcome = deriveIndependentAnswer(toQuestion(unicodeDuplicateChartLabelsQuestion()));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.issueCode).toBe("ambiguous_visual_label");
  });
});
