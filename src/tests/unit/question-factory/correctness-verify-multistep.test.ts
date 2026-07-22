import { describe, expect, it } from "vitest";

import { verifyCandidateCorrectness } from "@/features/question-factory/correctness/verify-candidate-correctness";
import type { DeclaredWorkingSolution } from "@/features/question-factory/ingestion/candidate-question";

import { buildCorrectnessFixture, VERIFIED_AT } from "./correctness-fixtures";

/**
 * Full-pipeline fixtures for the four §2.6 example prompts, at the
 * `verifyCandidateCorrectness` level rather than the raw derivation level:
 * each resolves to `passed` when `workingSteps` is supplied, and to
 * `review_required` (the gate's existing, safe "couldn't verify" outcome)
 * when it is omitted — proving the new method is opt-in and never a
 * mandatory gate for content that doesn't declare it (design §3.7/§6.10).
 */

const baseMetadata = (overrides: Record<string, unknown> = {}) => ({
  subject: "numeracy",
  strand: "Number",
  skill: "num.arithmetic.multistep",
  difficulty: "easy",
  marks: 1,
  estimatedTimeSeconds: 90,
  tags: [],
  ...overrides,
});

/* ------------------------------------------------------------------------ */
/* Example 1 — money, two-step (buy + change)                               */
/* ------------------------------------------------------------------------ */

function buyThenChangeQuestion(): Record<string, unknown> {
  return {
    id: "corr-ms26-money-001",
    type: "number_entry",
    yearLevel: 3,
    examStyle: "naplan_style",
    prompt: "Apples cost $2 each. Mia buys 3 apples and pays with a $10 note. How much change does she get?",
    options: [],
    visuals: [],
    answerKey: { kind: "number", value: 4, tolerance: 0, unit: "dollars" },
    explanation: "3 apples at $2 each is $6. $10 minus $6 leaves $4 change.",
    metadata: baseMetadata({ strand: "Money", skill: "num.money.change" }),
  };
}

const buyThenChangeWorkingSteps: DeclaredWorkingSolution = {
  promptQuantities: [
    { id: "price", value: "$2" },
    { id: "qty", value: "3" },
    { id: "tendered", value: "$10" },
  ],
  steps: [
    { index: 0, operation: "multiply", operands: [{ source: "prompt_quantity", quantityId: "price" }, { source: "prompt_quantity", quantityId: "qty" }] },
    { index: 1, operation: "subtract", operands: [{ source: "prompt_quantity", quantityId: "tendered" }, { source: "step_output", stepIndex: 0 }] },
  ],
};

/* ------------------------------------------------------------------------ */
/* Example 2 — prose word problem, no visual at all                         */
/* ------------------------------------------------------------------------ */

function marblesQuestion(): Record<string, unknown> {
  return {
    id: "corr-ms26-marbles-001",
    type: "number_entry",
    yearLevel: 3,
    examStyle: "naplan_style",
    prompt: "Liam has 15 marbles. He gives 4 to his sister and then buys 6 more. How many marbles does he have now?",
    options: [],
    visuals: [],
    answerKey: { kind: "number", value: 17, tolerance: 0 },
    explanation: "15 marbles, minus 4 given away, plus 6 bought, leaves 17.",
    metadata: baseMetadata(),
  };
}

const marblesWorkingSteps: DeclaredWorkingSolution = {
  promptQuantities: [
    { id: "start", value: "15" },
    { id: "given", value: "4" },
    { id: "bought", value: "6" },
  ],
  steps: [
    { index: 0, operation: "subtract", operands: [{ source: "prompt_quantity", quantityId: "start" }, { source: "prompt_quantity", quantityId: "given" }] },
    { index: 1, operation: "add", operands: [{ source: "step_output", stepIndex: 0 }, { source: "prompt_quantity", quantityId: "bought" }] },
  ],
};

/* ------------------------------------------------------------------------ */
/* Example 3 — area then comparison, two geometry_shape visuals             */
/* ------------------------------------------------------------------------ */

/**
 * Deliberately avoids the literal word "area" (uses "space" instead): the
 * existing `attemptPerimeterArea` method matches on that keyword plus any
 * `geometry_shape` visual and returns the *first* shape's area — it does
 * not itself detect or reject a genuine two-shape comparison. Wording the
 * prompt to route around that pre-existing, single-shape method (rather
 * than editing it, which is out of this mission's additive-only scope)
 * keeps this fixture's "review_required without workingSteps" behaviour
 * honest under the real, unmodified dispatch order.
 */
function gardenAreaComparisonQuestion(): Record<string, unknown> {
  return {
    id: "corr-ms26-garden-001",
    type: "number_entry",
    yearLevel: 5,
    examStyle: "icas_style",
    prompt:
      "A rectangular garden is 8 m by 5 m. A square garden has side length 6 m. How many more square metres of space does the larger garden have than the smaller one?",
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

const gardenAreaComparisonWorkingSteps: DeclaredWorkingSolution = {
  promptQuantities: [],
  steps: [
    { index: 0, operation: "subtract", operands: [{ source: "visual", visualId: "rect-garden", field: "area" }, { source: "visual", visualId: "square-garden", field: "area" }] },
  ],
};

/* ------------------------------------------------------------------------ */
/* Example 4 — unit conversion then arithmetic                              */
/* ------------------------------------------------------------------------ */

function flourUnitConversionQuestion(): Record<string, unknown> {
  return {
    id: "corr-ms26-flour-001",
    type: "number_entry",
    yearLevel: 5,
    examStyle: "icas_style",
    prompt: "A recipe needs 750 g of flour. Priya has 1.2 kg. After baking, how many grams of flour does she have left?",
    options: [],
    visuals: [],
    answerKey: { kind: "number", value: 450, tolerance: 0, unit: "g" },
    explanation: "1.2 kg is 1200 g. 1200 g minus the 750 g used leaves 450 g.",
    metadata: baseMetadata({ strand: "Measurement", skill: "num.measurement.units" }),
  };
}

const flourUnitConversionWorkingSteps: DeclaredWorkingSolution = {
  promptQuantities: [
    { id: "needed", value: "750", unit: "g" },
    { id: "has", value: "1.2", unit: "kg" },
  ],
  steps: [
    { index: 0, operation: "convert_unit", operands: [{ source: "prompt_quantity", quantityId: "has" }], targetUnit: "g" },
    { index: 1, operation: "subtract", operands: [{ source: "step_output", stepIndex: 0 }, { source: "prompt_quantity", quantityId: "needed" }] },
  ],
};

/* ------------------------------------------------------------------------ */
/* The four examples, each with and without workingSteps                    */
/* ------------------------------------------------------------------------ */

const EXAMPLES: readonly {
  readonly name: string;
  readonly question: () => Record<string, unknown>;
  readonly workingSteps: DeclaredWorkingSolution;
}[] = [
  { name: "§2.6 example 1 — money buy-then-change", question: buyThenChangeQuestion, workingSteps: buyThenChangeWorkingSteps },
  { name: "§2.6 example 2 — prose word problem (no visual)", question: marblesQuestion, workingSteps: marblesWorkingSteps },
  { name: "§2.6 example 3 — area then comparison", question: gardenAreaComparisonQuestion, workingSteps: gardenAreaComparisonWorkingSteps },
  { name: "§2.6 example 4 — unit conversion then arithmetic", question: flourUnitConversionQuestion, workingSteps: flourUnitConversionWorkingSteps },
];

describe("verifyCandidateCorrectness — §2.6 full-pipeline examples, opt-in", () => {
  for (const example of EXAMPLES) {
    it(`${example.name}: passes when workingSteps is declared`, () => {
      const question = { ...example.question(), workingSteps: example.workingSteps };
      const { candidate, structuralEvidence } = buildCorrectnessFixture(question);
      const result = verifyCandidateCorrectness(candidate, { verifiedAt: VERIFIED_AT, structuralEvidence });
      expect(result.status).toBe("passed");
      expect(result.evidence.capability).toBe("deterministically_verifiable");
      expect(result.evidence.deterministicCategory).toBe("multistep_declared_solution");
    });

    it(`${example.name}: is review_required when workingSteps is omitted (opt-in, never mandatory)`, () => {
      const { candidate, structuralEvidence } = buildCorrectnessFixture(example.question());
      const result = verifyCandidateCorrectness(candidate, { verifiedAt: VERIFIED_AT, structuralEvidence });
      expect(result.status).toBe("review_required");
    });
  }
});

describe("verifyCandidateCorrectness — a verified-but-wrong final answer is 'failed'/declared_answer_mismatch, not a false pass", () => {
  it("re-executes the declared working correctly, then rejects because the declared answer key disagrees", () => {
    const question = {
      ...buyThenChangeQuestion(),
      id: "corr-ms26-money-wrong-001",
      answerKey: { kind: "number", value: 5, tolerance: 0, unit: "dollars" }, // correct value is 4
      workingSteps: buyThenChangeWorkingSteps,
    };
    const { candidate, structuralEvidence } = buildCorrectnessFixture(question);
    const result = verifyCandidateCorrectness(candidate, { verifiedAt: VERIFIED_AT, structuralEvidence });
    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.evidence.capability).toBe("deterministically_verifiable");
      expect(result.issues.some((issue) => issue.code === "declared_answer_mismatch")).toBe(true);
      // Amendment 2: no distinct multistep_final_step_mismatch code exists —
      // a verified-but-wrong final answer reuses declared_answer_mismatch.
      expect(result.issues.some((issue) => (issue.code as string) === "multistep_final_step_mismatch")).toBe(false);
    }
  });
});
