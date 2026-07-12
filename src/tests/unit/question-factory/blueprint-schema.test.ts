import { describe, expect, it } from "vitest";

import { blueprintSchema, type BlueprintInput } from "@/features/question-factory/blueprints";
import { FACTORY_LIMITS } from "@/features/question-factory/config";

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

  it("rejects a skill id longer than the centrally configured maximum", () => {
    const tooLong = `num.${"a".repeat(FACTORY_LIMITS.TAXONOMY_SKILL_ID_MAX_LENGTH)}`;
    expect(tooLong.length).toBeGreaterThan(FACTORY_LIMITS.TAXONOMY_SKILL_ID_MAX_LENGTH);
    expect(blueprintSchema.safeParse(baseBlueprint({ skill: tooLong })).success).toBe(false);
  });

  it("accepts a skill id exactly at the centrally configured maximum", () => {
    const exact = "n".repeat(FACTORY_LIMITS.TAXONOMY_SKILL_ID_MAX_LENGTH);
    expect(blueprintSchema.safeParse(baseBlueprint({ skill: exact })).success).toBe(true);
  });

  it("rejects a strand longer than the centrally configured maximum", () => {
    const tooLong = "S".repeat(FACTORY_LIMITS.BLUEPRINT_STRAND_MAX_LENGTH + 1);
    expect(blueprintSchema.safeParse(baseBlueprint({ strand: tooLong })).success).toBe(false);
  });

  it("accepts a strand exactly at the centrally configured maximum", () => {
    const exact = "S".repeat(FACTORY_LIMITS.BLUEPRINT_STRAND_MAX_LENGTH);
    expect(blueprintSchema.safeParse(baseBlueprint({ strand: exact })).success).toBe(true);
  });

  it("rejects a questionType or visualType longer than the centrally configured maximum", () => {
    const tooLong = "t".repeat(FACTORY_LIMITS.BLUEPRINT_TYPE_IDENTIFIER_MAX_LENGTH + 1);
    expect(blueprintSchema.safeParse(baseBlueprint({ questionType: tooLong })).success).toBe(false);
    expect(blueprintSchema.safeParse(baseBlueprint({ visualType: tooLong })).success).toBe(false);
  });

  it.each([
    ["targetCount", FACTORY_LIMITS.BLUEPRINT_MIN_TARGET_COUNT - 1],
    ["targetCount", FACTORY_LIMITS.BLUEPRINT_MAX_TARGET_COUNT + 1],
    ["marks", FACTORY_LIMITS.BLUEPRINT_MIN_MARKS - 1],
    ["marks", FACTORY_LIMITS.BLUEPRINT_MAX_MARKS + 1],
    ["estimatedTimeSeconds", FACTORY_LIMITS.BLUEPRINT_MIN_ESTIMATED_TIME_SECONDS - 1],
    ["estimatedTimeSeconds", FACTORY_LIMITS.BLUEPRINT_MAX_ESTIMATED_TIME_SECONDS + 1],
    ["reasoningSteps", FACTORY_LIMITS.BLUEPRINT_MIN_REASONING_STEPS - 1],
    ["reasoningSteps", FACTORY_LIMITS.BLUEPRINT_MAX_REASONING_STEPS + 1],
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
      { length: FACTORY_LIMITS.BLUEPRINT_MAX_MISCONCEPTION_TARGETS + 1 },
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
