import { describe, expect, it } from "vitest";

import { deriveIndependentAnswer } from "@/features/question-factory/correctness/derive-answer";
import { attemptMultistep } from "@/features/question-factory/correctness/derive-multistep-answer";
import { fractionToDisplayString } from "@/features/question-factory/correctness/numeric";
import { CORRECTNESS_LIMITS } from "@/features/question-factory/config";
import {
  candidateQuestionSchema,
  operandRefSchema,
  type CandidateQuestion,
  type DeclaredWorkingSolution,
} from "@/features/question-factory/ingestion/candidate-question";
import { checkAgainstProductionSchema } from "@/features/question-factory/validation";
import type { Question } from "@/schemas/question.schema";

import { additionQuestion } from "./correctness-fixtures";

function toQuestion(raw: Record<string, unknown>): Question {
  const outcome = checkAgainstProductionSchema(raw as unknown as CandidateQuestion);
  if (!outcome.ok) {
    throw new Error(`fixture does not satisfy the production schema: ${outcome.issues.map((i) => i.message).join("; ")}`);
  }
  return outcome.question;
}

const baseMetadata = (overrides: Record<string, unknown> = {}) => ({
  subject: "numeracy",
  strand: "Money",
  skill: "num.money.change",
  difficulty: "easy",
  marks: 1,
  estimatedTimeSeconds: 60,
  tags: [],
  ...overrides,
});

/* ------------------------------------------------------------------------ */
/* §2.6 example 1: two-step money (buy-then-change)                         */
/* ------------------------------------------------------------------------ */

function buyThenChangeQuestion(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "corr-multistep-money-001",
    type: "number_entry",
    yearLevel: 3,
    examStyle: "naplan_style",
    prompt: "Apples cost $2 each. Mia buys 3 apples and pays with a $10 note. How much change does she get?",
    options: [],
    visuals: [],
    answerKey: { kind: "number", value: 4, tolerance: 0, unit: "dollars" },
    explanation: "3 apples at $2 each is $6. $10 minus $6 leaves $4 change.",
    metadata: baseMetadata(),
    ...overrides,
  };
}

const buyThenChangeWorkingSteps: DeclaredWorkingSolution = {
  promptQuantities: [
    { id: "price", value: "$2" },
    { id: "qty", value: "3" },
    { id: "tendered", value: "$10" },
  ],
  steps: [
    {
      index: 0,
      operation: "multiply",
      operands: [
        { source: "prompt_quantity", quantityId: "price" },
        { source: "prompt_quantity", quantityId: "qty" },
      ],
    },
    {
      index: 1,
      operation: "subtract",
      operands: [
        { source: "prompt_quantity", quantityId: "tendered" },
        { source: "step_output", stepIndex: 0 },
      ],
    },
  ],
};

/* ------------------------------------------------------------------------ */
/* §2.6 example 3: two-shape area comparison (visual operands)              */
/* ------------------------------------------------------------------------ */

function areaComparisonQuestion(): Record<string, unknown> {
  return {
    id: "corr-multistep-area-001",
    type: "number_entry",
    yearLevel: 5,
    examStyle: "icas_style",
    prompt: "A rectangular garden is 8 m by 5 m. A square garden has side length 6 m. How many more square metres of space does the rectangular garden have?",
    options: [],
    answerKey: { kind: "number", value: 4, tolerance: 0, unit: "m2" },
    visuals: [
      {
        id: "rect-garden",
        type: "geometry_shape",
        altText: "A rectangular garden labelled 8 metres by 5 metres.",
        data: {
          shape: "rectangle",
          measurements: [
            { label: "length", value: 8, unit: "m" },
            { label: "width", value: 5, unit: "m" },
          ],
        },
      },
      {
        id: "square-garden",
        type: "geometry_shape",
        altText: "A square garden with each side labelled 6 metres.",
        data: { shape: "square", measurements: [{ label: "side", value: 6, unit: "m" }] },
      },
    ],
    explanation: "The rectangle's area is 8 x 5 = 40 m2, the square's area is 6 x 6 = 36 m2, and 40 - 36 = 4.",
    metadata: baseMetadata({ strand: "Measurement", skill: "num.measurement.area" }),
  };
}

describe("attemptMultistep / deriveIndependentAnswer — correct multi-step resolution", () => {
  it("resolves a two-step money buy-then-change working via the dispatcher", () => {
    const outcome = deriveIndependentAnswer(toQuestion(buyThenChangeQuestion()), buyThenChangeWorkingSteps);
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.category).toBe("multistep_declared_solution");
      if (outcome.value.kind === "number") expect(fractionToDisplayString(outcome.value.value)).toBe("4");
    }
  });

  it("resolves via geometry_shape visual operands chained through step_output (area comparison)", () => {
    const question = toQuestion(areaComparisonQuestion());
    const workingSteps: DeclaredWorkingSolution = {
      promptQuantities: [],
      steps: [
        { index: 0, operation: "add", operands: [{ source: "visual", visualId: "rect-garden", field: "area" }, { source: "visual", visualId: "rect-garden", field: "area" }] },
      ],
    };
    // Sanity-check the visual reader itself in isolation before the real two-shape subtraction below.
    const single = attemptMultistep(question, workingSteps);
    expect(single.ok).toBe(true);
    if (single.ok && single.value.kind === "number") expect(fractionToDisplayString(single.value.value)).toBe("80");

    const twoShape: DeclaredWorkingSolution = {
      promptQuantities: [],
      steps: [
        { index: 0, operation: "subtract", operands: [{ source: "visual", visualId: "rect-garden", field: "area" }, { source: "visual", visualId: "square-garden", field: "area" }] },
      ],
    };
    const outcome = deriveIndependentAnswer(question, twoShape);
    expect(outcome.ok).toBe(true);
    if (outcome.ok) expect(outcome.category).toBe("multistep_declared_solution");
    if (outcome.ok && outcome.value.kind === "number") expect(fractionToDisplayString(outcome.value.value)).toBe("4");
  });

  it("resolves via a table visual operand ('row|column') combined with a grounded prompt quantity", () => {
    const question = toQuestion({
      id: "corr-multistep-table-001",
      type: "number_entry",
      yearLevel: 3,
      examStyle: "naplan_style",
      prompt: "10 more students than attended on Monday joined a special assembly, according to the table. How many students were at the assembly?",
      options: [],
      answerKey: { kind: "number", value: 130, tolerance: 0 },
      visuals: [
        {
          id: "attendance-table",
          type: "table",
          altText: "A table of student attendance by day.",
          data: { headers: ["Day", "Attendance"], rows: [["Monday", 120], ["Tuesday", 95]] },
        },
      ],
      explanation: "120 attended Monday, plus 10 more is 130.",
      metadata: baseMetadata({ strand: "Statistics", skill: "num.data.read-table" }),
    });
    const workingSteps: DeclaredWorkingSolution = {
      promptQuantities: [{ id: "extra", value: "10" }],
      steps: [
        {
          index: 0,
          operation: "add",
          operands: [
            { source: "visual", visualId: "attendance-table", field: "Monday|Attendance" },
            { source: "prompt_quantity", quantityId: "extra" },
          ],
        },
      ],
    };
    // Called directly (not through the full dispatcher): this prompt also
    // happens to match the simpler, earlier-registered `attemptTableLookup`
    // (it references the table's own "Monday" row label directly), which
    // legitimately wins under "simpler proven methods win first" — that is
    // exactly the dispatch-order behaviour under test elsewhere in this
    // file. This test isolates the multi-step table-operand code path
    // itself, independent of whichever method the full dispatcher would
    // pick for this particular prompt.
    const outcome = attemptMultistep(question, workingSteps);
    expect(outcome.ok).toBe(true);
    if (outcome.ok && outcome.value.kind === "number") expect(fractionToDisplayString(outcome.value.value)).toBe("130");
  });
});

describe("attemptMultistep — no workingSteps is not_applicable; dispatch order is unchanged (additivity)", () => {
  it("attemptMultistep alone returns not_applicable when workingSteps is absent", () => {
    const outcome = attemptMultistep(toQuestion(additionQuestion()), undefined);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.reason).toBe("not_applicable");
  });

  it("the full dispatcher still resolves an ordinary single-step candidate via its existing method, not multistep", () => {
    const outcome = deriveIndependentAnswer(toQuestion(additionQuestion()));
    expect(outcome.ok).toBe(true);
    if (outcome.ok) expect(outcome.category).toBe("arithmetic_expression");
  });
});

describe("attemptMultistep — ungrounded operand fails closed (never not_applicable, never a success)", () => {
  it("a declared prompt quantity that traces to nothing in the prompt/visuals is a terminal cannot_derive", () => {
    const question = toQuestion({
      ...buyThenChangeQuestion(),
      id: "corr-multistep-ungrounded-001",
      prompt: "What is the total?",
      visuals: [],
    });
    const workingSteps: DeclaredWorkingSolution = {
      promptQuantities: [{ id: "fake", value: "999" }],
      steps: [{ index: 0, operation: "add", operands: [{ source: "prompt_quantity", quantityId: "fake" }, { source: "prompt_quantity", quantityId: "fake" }] }],
    };
    const outcome = attemptMultistep(question, workingSteps);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toBe("cannot_derive");
      expect(outcome.issueCode).toBe("multistep_operand_ungrounded");
    }
  });

  it("a visual operand referencing a non-existent visual id is a terminal cannot_derive, never a guess", () => {
    const question = toQuestion(buyThenChangeQuestion());
    const workingSteps: DeclaredWorkingSolution = {
      promptQuantities: [],
      steps: [{ index: 0, operation: "add", operands: [{ source: "visual", visualId: "no-such-visual", field: "area" }, { source: "prompt_quantity", quantityId: "price" }] }],
    };
    const outcome = attemptMultistep(question, workingSteps);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.reason).toBe("cannot_derive");
      expect(outcome.issueCode).toBe("multistep_operand_ungrounded");
    }
  });
});

describe("declaredWorkingSolutionSchema — a bare/literal operand is unrepresentable, not merely rejected (amendment 1)", () => {
  it("operandRefSchema has no 'literal' source variant at all", () => {
    const result = operandRefSchema.safeParse({ source: "literal", value: "5" });
    expect(result.success).toBe(false);
  });

  it("a full candidate declaring a bare literal operand fails schema validation at parse time", () => {
    const raw = {
      ...buyThenChangeQuestion(),
      id: "corr-multistep-literal-001",
      workingSteps: {
        promptQuantities: [],
        steps: [{ index: 0, operation: "add", operands: [{ source: "literal", value: "2" }, { source: "literal", value: "3" }] }],
      },
    };
    const parsed = candidateQuestionSchema.safeParse(raw);
    expect(parsed.success).toBe(false);
  });
});

describe("attemptMultistep — invalid step_output references fail closed", () => {
  it("a self-reference (stepIndex === currentIndex) is rejected", () => {
    const question = toQuestion(buyThenChangeQuestion());
    const workingSteps: DeclaredWorkingSolution = {
      promptQuantities: [{ id: "price", value: "$2" }],
      steps: [{ index: 0, operation: "add", operands: [{ source: "prompt_quantity", quantityId: "price" }, { source: "step_output", stepIndex: 0 }] }],
    };
    const outcome = attemptMultistep(question, workingSteps);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.issueCode).toBe("multistep_step_reference_invalid");
  });

  it("a forward reference (an earlier step pointing at a later one) is rejected", () => {
    const question = toQuestion(buyThenChangeQuestion());
    const workingSteps: DeclaredWorkingSolution = {
      promptQuantities: [{ id: "price", value: "$2" }, { id: "qty", value: "3" }],
      steps: [
        { index: 0, operation: "add", operands: [{ source: "prompt_quantity", quantityId: "price" }, { source: "step_output", stepIndex: 1 }] },
        { index: 1, operation: "add", operands: [{ source: "prompt_quantity", quantityId: "price" }, { source: "prompt_quantity", quantityId: "qty" }] },
      ],
    };
    const outcome = attemptMultistep(question, workingSteps);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.issueCode).toBe("multistep_step_reference_invalid");
  });

  it("an out-of-range reference (no step at that index at all) is rejected", () => {
    const question = toQuestion(buyThenChangeQuestion());
    const workingSteps: DeclaredWorkingSolution = {
      promptQuantities: [{ id: "price", value: "$2" }, { id: "qty", value: "3" }],
      steps: [
        { index: 0, operation: "multiply", operands: [{ source: "prompt_quantity", quantityId: "price" }, { source: "prompt_quantity", quantityId: "qty" }] },
        { index: 1, operation: "add", operands: [{ source: "step_output", stepIndex: 5 }, { source: "prompt_quantity", quantityId: "price" }] },
      ],
    };
    const outcome = attemptMultistep(question, workingSteps);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.issueCode).toBe("multistep_step_reference_invalid");
  });
});

describe("attemptMultistep — malformed declared-solution shape fails closed", () => {
  it("a gap in the declared step indices is rejected", () => {
    const question = toQuestion(buyThenChangeQuestion());
    const workingSteps: DeclaredWorkingSolution = {
      promptQuantities: [{ id: "price", value: "$2" }, { id: "qty", value: "3" }],
      steps: [
        { index: 0, operation: "multiply", operands: [{ source: "prompt_quantity", quantityId: "price" }, { source: "prompt_quantity", quantityId: "qty" }] },
        { index: 2, operation: "add", operands: [{ source: "prompt_quantity", quantityId: "price" }, { source: "prompt_quantity", quantityId: "qty" }] },
      ],
    };
    const outcome = attemptMultistep(question, workingSteps);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.issueCode).toBe("multistep_step_reference_invalid");
  });

  it("a duplicate declared prompt-quantity id is rejected", () => {
    const question = toQuestion(buyThenChangeQuestion());
    const workingSteps: DeclaredWorkingSolution = {
      promptQuantities: [{ id: "price", value: "$2" }, { id: "price", value: "3" }],
      steps: [{ index: 0, operation: "add", operands: [{ source: "prompt_quantity", quantityId: "price" }, { source: "prompt_quantity", quantityId: "price" }] }],
    };
    const outcome = attemptMultistep(question, workingSteps);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.issueCode).toBe("multistep_step_reference_invalid");
  });

  it("wrong operand arity for a two-operand operation is rejected", () => {
    const question = toQuestion(buyThenChangeQuestion());
    const workingSteps: DeclaredWorkingSolution = {
      promptQuantities: [{ id: "price", value: "$2" }],
      steps: [{ index: 0, operation: "add", operands: [{ source: "prompt_quantity", quantityId: "price" }] }],
    };
    const outcome = attemptMultistep(question, workingSteps);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.issueCode).toBe("multistep_step_reference_invalid");
  });
});

describe("attemptMultistep — unsupported unit conversion fails closed", () => {
  it("a unit pair outside the closed table (different categories) is rejected", () => {
    const question = toQuestion({ ...buyThenChangeQuestion(), id: "corr-multistep-unit-001", prompt: "Convert 5 kg to litres." });
    const workingSteps: DeclaredWorkingSolution = {
      promptQuantities: [{ id: "mass", value: "5", unit: "kg" }],
      steps: [{ index: 0, operation: "convert_unit", operands: [{ source: "prompt_quantity", quantityId: "mass" }], targetUnit: "L" }],
    };
    const outcome = attemptMultistep(question, workingSteps);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.issueCode).toBe("multistep_unit_conversion_unsupported");
  });

  it("converting a step_output (no known source unit) is rejected", () => {
    const question = toQuestion({ ...buyThenChangeQuestion(), id: "corr-multistep-unit-002", prompt: "Add 2 and 3, then convert the result to grams." });
    const workingSteps: DeclaredWorkingSolution = {
      promptQuantities: [{ id: "a", value: "2" }, { id: "b", value: "3" }],
      steps: [
        { index: 0, operation: "add", operands: [{ source: "prompt_quantity", quantityId: "a" }, { source: "prompt_quantity", quantityId: "b" }] },
        { index: 1, operation: "convert_unit", operands: [{ source: "step_output", stepIndex: 0 }], targetUnit: "g" },
      ],
    };
    const outcome = attemptMultistep(question, workingSteps);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.issueCode).toBe("multistep_unit_conversion_unsupported");
  });
});

describe("attemptMultistep — resource limits fail closed", () => {
  it("more steps than MULTISTEP_MAX_STEPS is rejected", () => {
    const question = toQuestion({ ...buyThenChangeQuestion(), id: "corr-multistep-limit-steps-001", prompt: "The value is 1." });
    const stepCount = CORRECTNESS_LIMITS.MULTISTEP_MAX_STEPS + 1;
    const steps: DeclaredWorkingSolution["steps"] = [
      { index: 0, operation: "add", operands: [{ source: "prompt_quantity", quantityId: "one" }, { source: "prompt_quantity", quantityId: "one" }] },
      ...Array.from({ length: stepCount - 1 }, (_, i) => ({
        index: i + 1,
        operation: "add" as const,
        operands: [{ source: "step_output" as const, stepIndex: i }, { source: "prompt_quantity" as const, quantityId: "one" }],
      })),
    ];
    const workingSteps: DeclaredWorkingSolution = { promptQuantities: [{ id: "one", value: "1" }], steps };
    expect(steps.length).toBeGreaterThan(CORRECTNESS_LIMITS.MULTISTEP_MAX_STEPS);
    const outcome = attemptMultistep(question, workingSteps);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.issueCode).toBe("multistep_resource_limit_exceeded");
  });

  it("more prompt quantities than MULTISTEP_MAX_PROMPT_QUANTITIES is rejected", () => {
    const question = toQuestion({ ...buyThenChangeQuestion(), id: "corr-multistep-limit-qty-001", prompt: "The value is 1." });
    const quantityCount = CORRECTNESS_LIMITS.MULTISTEP_MAX_PROMPT_QUANTITIES + 1;
    const promptQuantities = Array.from({ length: quantityCount }, (_, i) => ({ id: `q${i}`, value: "1" }));
    const workingSteps: DeclaredWorkingSolution = {
      promptQuantities,
      steps: [{ index: 0, operation: "add", operands: [{ source: "prompt_quantity", quantityId: "q0" }, { source: "prompt_quantity", quantityId: "q1" }] }],
    };
    expect(promptQuantities.length).toBeGreaterThan(CORRECTNESS_LIMITS.MULTISTEP_MAX_PROMPT_QUANTITIES);
    const outcome = attemptMultistep(question, workingSteps);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.issueCode).toBe("multistep_resource_limit_exceeded");
  });
});
