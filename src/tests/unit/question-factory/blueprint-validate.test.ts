import { describe, expect, it } from "vitest";

import {
  type Blueprint,
  type BlueprintInput,
  blueprintSchema,
  validateBlueprint,
} from "@/features/question-factory/blueprints";

function baseInput(overrides: Partial<BlueprintInput> = {}): BlueprintInput {
  return {
    id: "batch-001-bp-001",
    batchId: "batch-001",
    yearLevel: "year-5",
    examStyle: "naplan_style",
    subject: "numeracy",
    strand: "Statistics",
    skill: "num.data.read-bar-chart",
    difficulty: "medium",
    questionType: "multiple_choice",
    visualType: "bar_chart",
    targetCount: 10,
    marks: 1,
    estimatedTimeSeconds: 60,
    learningObjective: "Read values from a bar chart.",
    misconceptionTargets: [],
    reasoningSteps: 2,
    accessibilityConstraints: [],
    originalityConstraints: [],
    generationConstraints: [],
    ...overrides,
  };
}

function build(overrides: Partial<BlueprintInput> = {}): Blueprint {
  return blueprintSchema.parse(baseInput(overrides));
}

describe("validateBlueprint", () => {
  it("accepts a blueprint fully aligned with its taxonomy entry", () => {
    const result = validateBlueprint(build());
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("rejects an unknown skill id", () => {
    const result = validateBlueprint(build({ skill: "not.a.real.skill" }));
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.code === "unknown_skill")).toBe(true);
  });

  it("rejects a year level the skill does not cover", () => {
    // num.data.read-bar-chart only covers year 5.
    const result = validateBlueprint(build({ yearLevel: "year-3" }));
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.code === "year_level_not_in_taxonomy")).toBe(true);
  });

  it("rejects an exam style the skill does not cover", () => {
    const result = validateBlueprint(build({ examStyle: "icas_style" }));
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.code === "exam_style_not_in_taxonomy")).toBe(true);
  });

  it("rejects a difficulty the skill does not support", () => {
    // num.data.read-bar-chart supports medium/challenging, not easy.
    const result = validateBlueprint(build({ difficulty: "easy" }));
    expect(result.valid).toBe(false);
    expect(
      result.issues.some((issue) => issue.code === "difficulty_not_supported_by_skill"),
    ).toBe(true);
  });

  it("rejects a question type with no registered renderer", () => {
    const result = validateBlueprint(build({ questionType: "not_a_real_type" }));
    expect(result.valid).toBe(false);
    expect(
      result.issues.some((issue) => issue.code === "question_type_not_renderer_supported"),
    ).toBe(true);
  });

  it("rejects a renderer-supported question type the skill does not recommend", () => {
    // num.data.read-bar-chart recommends multiple_choice/number_entry, not essay.
    const result = validateBlueprint(build({ questionType: "essay", visualType: undefined }));
    expect(result.valid).toBe(false);
    expect(
      result.issues.some((issue) => issue.code === "question_type_not_recommended_for_skill"),
    ).toBe(true);
  });

  it("rejects a visual type with no registered renderer", () => {
    const result = validateBlueprint(build({ visualType: "not_a_real_visual" }));
    expect(result.valid).toBe(false);
    expect(
      result.issues.some((issue) => issue.code === "visual_type_not_renderer_supported"),
    ).toBe(true);
  });

  it("rejects a renderer-supported visual type the skill does not recommend", () => {
    // num.data.read-bar-chart recommends bar_chart, not table.
    const result = validateBlueprint(build({ visualType: "table" }));
    expect(result.valid).toBe(false);
    expect(
      result.issues.some((issue) => issue.code === "visual_type_not_recommended_for_skill"),
    ).toBe(true);
  });

  it("rejects a visual type when the skill recommends none", () => {
    // num.number.prime (ICAS, year 5, true_false/multiple_choice) has no
    // recommended visual type in the taxonomy.
    const result = validateBlueprint(
      build({
        skill: "num.number.prime",
        examStyle: "icas_style",
        difficulty: "challenging",
        questionType: "true_false",
        visualType: "number_line",
      }),
    );
    expect(result.valid).toBe(false);
    expect(
      result.issues.some((issue) => issue.code === "visual_type_without_recommendation"),
    ).toBe(true);
  });

  it("rejects a hotspot question without a hotspot_svg visual", () => {
    const result = validateBlueprint(
      build({ questionType: "hotspot", visualType: "bar_chart" }),
    );
    expect(result.valid).toBe(false);
    expect(
      result.issues.some((issue) => issue.code === "hotspot_requires_hotspot_visual"),
    ).toBe(true);
  });

  it("rejects a non-hotspot question using the hotspot_svg visual", () => {
    const result = validateBlueprint(
      build({ questionType: "multiple_choice", visualType: "hotspot_svg" }),
    );
    expect(result.valid).toBe(false);
    expect(
      result.issues.some((issue) => issue.code === "non_hotspot_uses_hotspot_visual"),
    ).toBe(true);
  });

  it("accumulates multiple independent issues rather than stopping at the first", () => {
    const result = validateBlueprint(build({ skill: "not.a.real.skill", questionType: "nope" }));
    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThanOrEqual(2);
  });
});
