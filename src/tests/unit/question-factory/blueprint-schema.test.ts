import { describe, expect, it } from "vitest";

import { BLUEPRINT_LIMITS, blueprintSchema, type BlueprintInput } from "@/features/question-factory/blueprints";

function baseBlueprint(overrides: Partial<BlueprintInput> = {}): BlueprintInput {
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
    misconceptionTargets: ["Misreading the scale"],
    reasoningSteps: 2,
    accessibilityConstraints: [],
    originalityConstraints: [],
    generationConstraints: [],
    ...overrides,
  };
}

describe("blueprintSchema", () => {
  it("parses a well-formed blueprint", () => {
    const result = blueprintSchema.safeParse(baseBlueprint());
    expect(result.success).toBe(true);
  });

  it("defaults optional constraint lists to an empty array", () => {
    const input = baseBlueprint();
    // vocabularyConstraints is optional and omitted here.
    const parsed = blueprintSchema.parse(input);
    expect(parsed.vocabularyConstraints).toBeUndefined();
    expect(parsed.misconceptionTargets).toEqual(["Misreading the scale"]);
  });

  it("rejects an unknown yearLevel", () => {
    const result = blueprintSchema.safeParse(baseBlueprint({ yearLevel: "year-7" as never }));
    expect(result.success).toBe(false);
  });

  it("rejects a skill id shaped with invalid characters", () => {
    const result = blueprintSchema.safeParse(baseBlueprint({ skill: "Not A Valid Skill!" }));
    expect(result.success).toBe(false);
  });

  it("accepts a skill id containing dots", () => {
    const result = blueprintSchema.safeParse(baseBlueprint({ skill: "num.prod.measurement.perimeter" }));
    expect(result.success).toBe(true);
  });

  it.each([
    ["targetCount", BLUEPRINT_LIMITS.MIN_TARGET_COUNT - 1],
    ["targetCount", BLUEPRINT_LIMITS.MAX_TARGET_COUNT + 1],
    ["marks", BLUEPRINT_LIMITS.MIN_MARKS - 1],
    ["marks", BLUEPRINT_LIMITS.MAX_MARKS + 1],
    ["estimatedTimeSeconds", BLUEPRINT_LIMITS.MIN_ESTIMATED_TIME_SECONDS - 1],
    ["estimatedTimeSeconds", BLUEPRINT_LIMITS.MAX_ESTIMATED_TIME_SECONDS + 1],
    ["reasoningSteps", BLUEPRINT_LIMITS.MIN_REASONING_STEPS - 1],
    ["reasoningSteps", BLUEPRINT_LIMITS.MAX_REASONING_STEPS + 1],
  ] as const)("rejects out-of-bounds %s = %d", (field, value) => {
    const result = blueprintSchema.safeParse(baseBlueprint({ [field]: value } as Partial<BlueprintInput>));
    expect(result.success).toBe(false);
  });

  it("rejects an empty learning objective", () => {
    const result = blueprintSchema.safeParse(baseBlueprint({ learningObjective: "" }));
    expect(result.success).toBe(false);
  });

  it("rejects too many misconception targets", () => {
    const tooMany = Array.from(
      { length: BLUEPRINT_LIMITS.MAX_MISCONCEPTION_TARGETS + 1 },
      (_, i) => `Misconception ${i}`,
    );
    const result = blueprintSchema.safeParse(baseBlueprint({ misconceptionTargets: tooMany }));
    expect(result.success).toBe(false);
  });

  it("rejects a malformed identifier for id/batchId", () => {
    expect(blueprintSchema.safeParse(baseBlueprint({ id: "Not Valid!" })).success).toBe(false);
    expect(blueprintSchema.safeParse(baseBlueprint({ batchId: "Not Valid!" })).success).toBe(false);
  });
});
