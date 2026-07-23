import * as fs from "node:fs";
import * as path from "node:path";

import { describe, expect, it } from "vitest";

import { blueprintSchema, validateBlueprint } from "@/features/question-factory/blueprints";
import { getWorkspaceRoot } from "@/features/question-factory/config";
import { SKILL_TAXONOMY_ENTRIES } from "@/features/question-factory/taxonomy";

/**
 * Draft-authoring batch: 25 ICAS-style Grade 5 English challenge questions
 * (night-g5-bank overnight content task), spanning `reading` (original
 * narrative/information passages with reading_comprehension questions) and
 * `language_conventions` (fill_blank/short_answer). Every candidate is bound
 * to one of these blueprint seed files; the questions themselves live only
 * in the untracked factory workspace at draft status.
 */
function blueprintsDir(): string {
  return path.join(getWorkspaceRoot(), "blueprints");
}

function icasG5EnglishBlueprintFiles(): readonly string[] {
  return fs
    .readdirSync(blueprintsDir())
    .filter(
      (fileName) =>
        (fileName.startsWith("icas-g5-reading-") || fileName.startsWith("icas-g5-language_conventions-")) &&
        fileName.endsWith(".json"),
    )
    .sort();
}

function readBlueprintFixture(fileName: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(blueprintsDir(), fileName), "utf-8"));
}

describe("ICAS-style Grade 5 English blueprint seeds (icas-g5-reading-*, icas-g5-language_conventions-*)", () => {
  it("finds exactly 25 blueprint seed files for this batch", () => {
    expect(icasG5EnglishBlueprintFiles()).toHaveLength(25);
  });

  it.each(icasG5EnglishBlueprintFiles())("%s parses against blueprintSchema", (fileName) => {
    const raw = readBlueprintFixture(fileName);
    const result = blueprintSchema.safeParse(raw);
    expect(result.success).toBe(true);
  });

  it.each(icasG5EnglishBlueprintFiles())("%s validates cleanly against its taxonomy entry", (fileName) => {
    const blueprint = blueprintSchema.parse(readBlueprintFixture(fileName));
    expect(["reading", "language_conventions"]).toContain(blueprint.subject);
    expect(blueprint.examStyle).toBe("icas_style");
    expect(blueprint.yearLevel).toBe("year-5");
    expect(blueprint.batchId).toBe("icas-g5-english-seed-batch-01");

    const result = validateBlueprint(blueprint);
    expect(result.issues).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("every blueprint's skill resolves to a taxonomy entry supporting icas_style Grade 5", () => {
    for (const fileName of icasG5EnglishBlueprintFiles()) {
      const blueprint = blueprintSchema.parse(readBlueprintFixture(fileName));
      const entry = SKILL_TAXONOMY_ENTRIES.find((candidate) => candidate.id === blueprint.skill);
      expect(entry, `blueprint '${blueprint.id}' skill '${blueprint.skill}'`).toBeDefined();
      expect(entry?.subject).toBe(blueprint.subject);
      expect(entry?.examStyles).toContain("icas_style");
      expect(entry?.yearLevels).toContain(5);
      expect(entry?.supportedDifficulties).toContain(blueprint.difficulty);
      expect(entry?.recommendedQuestionTypes).toContain(blueprint.questionType);
    }
  });

  it("declares a real, non-trivial learning objective and at least one misconception target per blueprint", () => {
    for (const fileName of icasG5EnglishBlueprintFiles()) {
      const blueprint = blueprintSchema.parse(readBlueprintFixture(fileName));
      expect(blueprint.learningObjective.length).toBeGreaterThan(10);
      expect(blueprint.misconceptionTargets.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("uses only reading_comprehension, fill_blank or short_answer question types (the types whose correctness gate reliably routes to independent semantic review rather than mechanical re-derivation)", () => {
    for (const fileName of icasG5EnglishBlueprintFiles()) {
      const blueprint = blueprintSchema.parse(readBlueprintFixture(fileName));
      expect(["reading_comprehension", "fill_blank", "short_answer"]).toContain(blueprint.questionType);
    }
  });
});
