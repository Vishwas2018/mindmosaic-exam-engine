import * as fs from "node:fs";
import * as path from "node:path";

import { describe, expect, it } from "vitest";

import { blueprintSchema, validateBlueprint } from "@/features/question-factory/blueprints";
import { getWorkspaceRoot } from "@/features/question-factory/config";
import { SKILL_TAXONOMY_ENTRIES } from "@/features/question-factory/taxonomy";

/**
 * Draft-authoring batch: 25 ICAS-style Grade 5 Mathematics challenge
 * questions (night-g5-bank overnight content task). Every candidate
 * question for this batch is bound to one of these blueprint seed files
 * (`content/question-factory/blueprints/icas-g5-numeracy-*-seed-001.json`);
 * the questions themselves live only in the untracked factory workspace
 * (`generated/`, `review-queue/`, ...) at draft status, so this suite
 * exercises the one artefact from this batch that is actually committed.
 */
function blueprintsDir(): string {
  return path.join(getWorkspaceRoot(), "blueprints");
}

function icasG5MathematicsBlueprintFiles(): readonly string[] {
  return fs
    .readdirSync(blueprintsDir())
    .filter((fileName) => fileName.startsWith("icas-g5-numeracy-") && fileName.endsWith(".json"))
    .sort();
}

function readBlueprintFixture(fileName: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(blueprintsDir(), fileName), "utf-8"));
}

describe("ICAS-style Grade 5 Mathematics blueprint seeds (icas-g5-numeracy-*)", () => {
  it("finds exactly 25 blueprint seed files for this batch", () => {
    expect(icasG5MathematicsBlueprintFiles()).toHaveLength(25);
  });

  it.each(icasG5MathematicsBlueprintFiles())("%s parses against blueprintSchema", (fileName) => {
    const raw = readBlueprintFixture(fileName);
    const result = blueprintSchema.safeParse(raw);
    expect(result.success).toBe(true);
  });

  it.each(icasG5MathematicsBlueprintFiles())("%s validates cleanly against its taxonomy entry", (fileName) => {
    const blueprint = blueprintSchema.parse(readBlueprintFixture(fileName));
    expect(blueprint.subject).toBe("numeracy");
    expect(blueprint.examStyle).toBe("icas_style");
    expect(blueprint.yearLevel).toBe("year-5");
    expect(blueprint.batchId).toBe("icas-g5-mathematics-seed-batch-01");

    const result = validateBlueprint(blueprint);
    expect(result.issues).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("every blueprint's skill resolves to a numeracy taxonomy entry supporting icas_style Grade 5", () => {
    for (const fileName of icasG5MathematicsBlueprintFiles()) {
      const blueprint = blueprintSchema.parse(readBlueprintFixture(fileName));
      const entry = SKILL_TAXONOMY_ENTRIES.find((candidate) => candidate.id === blueprint.skill);
      expect(entry, `blueprint '${blueprint.id}' skill '${blueprint.skill}'`).toBeDefined();
      expect(entry?.subject).toBe("numeracy");
      expect(entry?.examStyles).toContain("icas_style");
      expect(entry?.yearLevels).toContain(5);
      expect(entry?.supportedDifficulties).toContain(blueprint.difficulty);
    }
  });

  it("declares a real, non-trivial learning objective and at least one misconception target per blueprint", () => {
    for (const fileName of icasG5MathematicsBlueprintFiles()) {
      const blueprint = blueprintSchema.parse(readBlueprintFixture(fileName));
      expect(blueprint.learningObjective.length).toBeGreaterThan(10);
      expect(blueprint.misconceptionTargets.length).toBeGreaterThanOrEqual(1);
    }
  });
});
