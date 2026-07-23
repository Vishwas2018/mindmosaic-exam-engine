import * as fs from "node:fs";
import * as path from "node:path";

import { describe, expect, it } from "vitest";

import { blueprintSchema, validateBlueprint } from "@/features/question-factory/blueprints";
import { getWorkspaceRoot } from "@/features/question-factory/config";
import { SKILL_TAXONOMY_ENTRIES } from "@/features/question-factory/taxonomy";

/**
 * Draft-authoring batch: 75 NAPLAN-style Grade 5 Numeracy questions
 * (night-g5-bank overnight content task, batch g5-numeracy-seed-batch-01).
 * Every candidate question for this batch is bound to one of these
 * blueprint seed files; the questions themselves live only in the
 * untracked factory workspace at draft status.
 */
function blueprintsDir(): string {
  return path.join(getWorkspaceRoot(), "blueprints");
}

function g5NumeracyBlueprintFiles(): readonly string[] {
  return fs
    .readdirSync(blueprintsDir())
    .filter((fileName) => fileName.startsWith("g5-numeracy-") && fileName.endsWith(".json"))
    .sort();
}

function readBlueprintFixture(fileName: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(blueprintsDir(), fileName), "utf-8"));
}

describe("NAPLAN-style Grade 5 Numeracy blueprint seeds (g5-numeracy-*)", () => {
  it("finds exactly 75 blueprint seed files for this batch", () => {
    expect(g5NumeracyBlueprintFiles()).toHaveLength(75);
  });

  it.each(g5NumeracyBlueprintFiles())("%s parses against blueprintSchema", (fileName) => {
    const raw = readBlueprintFixture(fileName);
    const result = blueprintSchema.safeParse(raw);
    expect(result.success).toBe(true);
  });

  it.each(g5NumeracyBlueprintFiles())("%s validates cleanly against its taxonomy entry", (fileName) => {
    const blueprint = blueprintSchema.parse(readBlueprintFixture(fileName));
    expect(blueprint.subject).toBe("numeracy");
    expect(blueprint.examStyle).toBe("naplan_style");
    expect(blueprint.yearLevel).toBe("year-5");
    expect(blueprint.batchId).toBe("g5-numeracy-seed-batch-01");

    const result = validateBlueprint(blueprint);
    expect(result.issues).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("every blueprint's skill resolves to a numeracy taxonomy entry supporting naplan_style Grade 5", () => {
    for (const fileName of g5NumeracyBlueprintFiles()) {
      const blueprint = blueprintSchema.parse(readBlueprintFixture(fileName));
      const entry = SKILL_TAXONOMY_ENTRIES.find((candidate) => candidate.id === blueprint.skill);
      expect(entry, `blueprint '${blueprint.id}' skill '${blueprint.skill}'`).toBeDefined();
      expect(entry?.subject).toBe("numeracy");
      expect(entry?.examStyles).toContain("naplan_style");
      expect(entry?.yearLevels).toContain(5);
      expect(entry?.supportedDifficulties).toContain(blueprint.difficulty);
      expect(entry?.recommendedQuestionTypes).toContain(blueprint.questionType);
    }
  });

  it("declares a real, non-trivial learning objective and at least one misconception target per blueprint", () => {
    for (const fileName of g5NumeracyBlueprintFiles()) {
      const blueprint = blueprintSchema.parse(readBlueprintFixture(fileName));
      expect(blueprint.learningObjective.length).toBeGreaterThan(10);
      expect(blueprint.misconceptionTargets.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("declares at least 30 blueprints (>=40% of 75) with a visual type, matching the batch's visual-coverage requirement", () => {
    const withVisual = g5NumeracyBlueprintFiles().filter((fileName) => {
      const blueprint = blueprintSchema.parse(readBlueprintFixture(fileName));
      return blueprint.visualType !== undefined;
    });
    expect(withVisual.length).toBeGreaterThanOrEqual(30);
  });
});
