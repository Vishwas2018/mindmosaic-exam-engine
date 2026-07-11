import { describe, expect, it } from "vitest";

import { planBlueprintBatch, validateBlueprint } from "@/features/question-factory/blueprints";
import { skillTaxonomyRegistry } from "@/features/question-factory/taxonomy";

describe("planBlueprintBatch", () => {
  it("produces validator-clean blueprints for every planned entry", () => {
    const plan = planBlueprintBatch({
      batchId: "batch-plan-001",
      yearLevels: ["year-3", "year-5"],
      examStyles: ["naplan_style", "icas_style"],
      targetCountPerBlueprint: 15,
    });

    expect(plan.length).toBeGreaterThan(0);
    for (const blueprint of plan) {
      const result = validateBlueprint(blueprint);
      expect({ id: blueprint.id, issues: result.issues }).toEqual({
        id: blueprint.id,
        issues: [],
      });
      expect(result.valid).toBe(true);
    }
  });

  it("is deterministic across repeated runs with the same request", () => {
    const request = {
      batchId: "batch-plan-002",
      yearLevels: ["year-5"] as const,
      examStyles: ["naplan_style"] as const,
      subjects: ["numeracy"] as const,
      targetCountPerBlueprint: 8,
    };

    const first = planBlueprintBatch(request);
    const second = planBlueprintBatch(request);
    const third = planBlueprintBatch(request);

    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
    expect(JSON.stringify(third)).toBe(JSON.stringify(first));
  });

  it("produces unique blueprint ids within a single batch", () => {
    const plan = planBlueprintBatch({
      batchId: "batch-plan-003",
      yearLevels: ["year-3", "year-5"],
      examStyles: ["naplan_style", "icas_style"],
      targetCountPerBlueprint: 5,
    });

    const ids = plan.map((blueprint) => blueprint.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("restricts output to the requested skill ids", () => {
    const plan = planBlueprintBatch({
      batchId: "batch-plan-004",
      yearLevels: ["year-5"],
      examStyles: ["naplan_style"],
      skillIds: ["num.data.read-bar-chart"],
      targetCountPerBlueprint: 10,
    });

    expect(plan.length).toBeGreaterThan(0);
    for (const blueprint of plan) {
      expect(blueprint.skill).toBe("num.data.read-bar-chart");
    }
  });

  it("restricts output to the requested subjects", () => {
    const plan = planBlueprintBatch({
      batchId: "batch-plan-005",
      yearLevels: ["year-3", "year-5"],
      examStyles: ["naplan_style", "icas_style"],
      subjects: ["writing"],
      targetCountPerBlueprint: 10,
    });

    for (const blueprint of plan) {
      expect(blueprint.subject).toBe("writing");
    }
  });

  it("restricts output to the requested difficulty bands", () => {
    const plan = planBlueprintBatch({
      batchId: "batch-plan-006",
      yearLevels: ["year-5"],
      examStyles: ["naplan_style"],
      skillIds: ["num.data.read-bar-chart"],
      difficulties: ["medium"],
      targetCountPerBlueprint: 10,
    });

    expect(plan.length).toBe(1);
    expect(plan[0]!.difficulty).toBe("medium");
  });

  it("applies the same targetCount to every blueprint in the batch (balanced)", () => {
    const plan = planBlueprintBatch({
      batchId: "batch-plan-007",
      yearLevels: ["year-3", "year-5"],
      examStyles: ["naplan_style", "icas_style"],
      targetCountPerBlueprint: 42,
    });

    for (const blueprint of plan) {
      expect(blueprint.targetCount).toBe(42);
    }
  });

  it("returns nothing for a request that matches no taxonomy entry", () => {
    const plan = planBlueprintBatch({
      batchId: "batch-plan-008",
      yearLevels: ["year-3"],
      examStyles: ["naplan_style"],
      skillIds: ["num.number.prime"], // year 5 / icas only
      targetCountPerBlueprint: 10,
    });

    expect(plan).toEqual([]);
  });

  it("plans across the whole taxonomy without any single entry's blueprint being invalid", () => {
    const plan = planBlueprintBatch({
      batchId: "batch-plan-009",
      yearLevels: ["year-3", "year-5"],
      examStyles: ["naplan_style", "icas_style"],
      targetCountPerBlueprint: 20,
    });

    // Every taxonomy entry with at least one recommended question type
    // should contribute at least one blueprint somewhere in a full-coverage plan.
    const coveredSkills = new Set(plan.map((blueprint) => blueprint.skill));
    const expectedSkills = skillTaxonomyRegistry
      .list()
      .filter((entry) => entry.recommendedQuestionTypes.length > 0);

    for (const entry of expectedSkills) {
      expect(coveredSkills.has(entry.id)).toBe(true);
    }
  });
});
