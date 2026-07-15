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

  describe("PB1 taxonomy remediation — new/expanded entries are blueprint-eligible", () => {
    const CASES: Array<{
      readonly skillId: string;
      readonly yearLevel: "year-3" | "year-5";
      readonly examStyle: "naplan_style" | "icas_style";
    }> = [
      { skillId: "num.prod.chance.most-likely-outcome", yearLevel: "year-5", examStyle: "naplan_style" },
      { skillId: "num.prod.number.place-value", yearLevel: "year-5", examStyle: "naplan_style" },
      { skillId: "num.prod.measurement.units-of-time", yearLevel: "year-3", examStyle: "icas_style" },
      { skillId: "num.prod.number.multiplication-equal-groups", yearLevel: "year-3", examStyle: "naplan_style" },
      { skillId: "read.prod.inference.inferring-from-a-narrative", yearLevel: "year-5", examStyle: "icas_style" },
      { skillId: "lang.prod.grammar.regular-plurals", yearLevel: "year-3", examStyle: "naplan_style" },
      { skillId: "num.fractions.equivalent", yearLevel: "year-5", examStyle: "naplan_style" },
      { skillId: "num.number.multiples", yearLevel: "year-5", examStyle: "naplan_style" },
      { skillId: "num.prod.number.fractions-of-a-set", yearLevel: "year-5", examStyle: "icas_style" },
    ];

    it.each(CASES.map((testCase, index) => ({ ...testCase, index })))(
      "'$skillId' plans at least one validator-clean blueprint for $yearLevel / $examStyle with no code changes needed",
      ({ skillId, yearLevel, examStyle, index }) => {
        const plan = planBlueprintBatch({
          batchId: `batch-pb1-remediation-${index}`,
          yearLevels: [yearLevel],
          examStyles: [examStyle],
          skillIds: [skillId],
          targetCountPerBlueprint: 5,
        });

        expect(plan.length).toBeGreaterThan(0);
        for (const blueprint of plan) {
          expect(blueprint.skill).toBe(skillId);
          const result = validateBlueprint(blueprint);
          expect(result.valid).toBe(true);
        }
      },
    );
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

  it("golden vector: rotates question type and visual type across an entry's own blueprints", () => {
    // num.prod.geometry.types-of-angles: recommendedQuestionTypes
    // ["hotspot", "label_diagram"], recommendedVisualTypes
    // ["hotspot_svg", "labelled_svg"], year 5 only, both exam styles,
    // medium only -> exactly 2 rows. Picking index 0 every time (the old
    // alphabetically-sorted-then-first bug) would emit "hotspot" (and
    // "hotspot_svg") for both rows; round-robin must alternate.
    const plan = planBlueprintBatch({
      batchId: "batch-plan-golden-001",
      yearLevels: ["year-5"],
      examStyles: ["naplan_style", "icas_style"],
      skillIds: ["num.prod.geometry.types-of-angles"],
      targetCountPerBlueprint: 10,
    });

    expect(plan.map((b) => ({ examStyle: b.examStyle, questionType: b.questionType, visualType: b.visualType }))).toEqual([
      { examStyle: "icas_style", questionType: "hotspot", visualType: "hotspot_svg" },
      { examStyle: "naplan_style", questionType: "label_diagram", visualType: "labelled_svg" },
    ]);

    for (const blueprint of plan) {
      expect(validateBlueprint(blueprint).valid).toBe(true);
    }
  });

  it("golden vector: rotates question type across year levels when no visual type is recommended", () => {
    // lang.prod.parts-of-speech.adverbs: recommendedQuestionTypes
    // ["multiple_choice", "true_false"], no visual types, both year
    // levels, naplan only, medium only -> exactly 2 rows.
    const plan = planBlueprintBatch({
      batchId: "batch-plan-golden-002",
      yearLevels: ["year-3", "year-5"],
      examStyles: ["naplan_style"],
      skillIds: ["lang.prod.parts-of-speech.adverbs"],
      targetCountPerBlueprint: 10,
    });

    expect(plan.map((b) => ({ yearLevel: b.yearLevel, questionType: b.questionType }))).toEqual([
      { yearLevel: "year-3", questionType: "multiple_choice" },
      { yearLevel: "year-5", questionType: "true_false" },
    ]);
  });

  it("never pairs a non-hotspot question type with the hotspot_svg visual, or vice versa, anywhere in a full-taxonomy plan", () => {
    const plan = planBlueprintBatch({
      batchId: "batch-plan-balance-hotspot",
      yearLevels: ["year-3", "year-5"],
      examStyles: ["naplan_style", "icas_style"],
      targetCountPerBlueprint: 10,
    });

    for (const blueprint of plan) {
      if (blueprint.questionType === "hotspot") {
        expect(blueprint.visualType).toBe("hotspot_svg");
      } else {
        expect(blueprint.visualType).not.toBe("hotspot_svg");
      }
    }
  });

  it("distributes repeated targets fairly: the first N blueprints already cover all N eligible entries (round-robin interleave, not one entry's full block before the next)", () => {
    const plan = planBlueprintBatch({
      batchId: "batch-plan-balance-002",
      yearLevels: ["year-3", "year-5"],
      examStyles: ["naplan_style", "icas_style"],
      targetCountPerBlueprint: 10,
    });

    const distinctSkillCount = new Set(plan.map((b) => b.skill)).size;
    expect(distinctSkillCount).toBeGreaterThan(1);

    const firstRound = plan.slice(0, distinctSkillCount);
    expect(new Set(firstRound.map((b) => b.skill)).size).toBe(distinctSkillCount);
  });

  it("is stable (byte-identical) across three consecutive runs of a full-taxonomy plan", () => {
    const request = {
      batchId: "batch-plan-balance-003",
      yearLevels: ["year-3", "year-5"] as const,
      examStyles: ["naplan_style", "icas_style"] as const,
      targetCountPerBlueprint: 12,
    };

    const first = planBlueprintBatch(request);
    const second = planBlueprintBatch(request);
    const third = planBlueprintBatch(request);

    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
    expect(JSON.stringify(third)).toBe(JSON.stringify(first));
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
