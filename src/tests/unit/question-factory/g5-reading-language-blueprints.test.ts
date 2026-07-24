import * as fs from "node:fs";
import * as path from "node:path";

import { describe, expect, it } from "vitest";

import { blueprintSchema, validateBlueprint } from "@/features/question-factory/blueprints";
import { getWorkspaceRoot } from "@/features/question-factory/config";
import { SKILL_TAXONOMY_ENTRIES } from "@/features/question-factory/taxonomy";

/**
 * Draft-authoring batch: 75 NAPLAN-style Grade 5 Reading + Language
 * Conventions questions (night-g5-bank overnight content task, batch
 * g5-reading-language-seed-batch-01). Every candidate question for this
 * batch is bound to one of these blueprint seed files; the questions
 * themselves live only in the untracked factory workspace at draft status.
 */
function blueprintsDir(): string {
  return path.join(getWorkspaceRoot(), "blueprints");
}

function g5ReadingLanguageBlueprintFiles(): readonly string[] {
  return fs
    .readdirSync(blueprintsDir())
    .filter(
      (fileName) =>
        (fileName.startsWith("g5-reading-") || fileName.startsWith("g5-language_conventions-")) &&
        fileName.endsWith(".json"),
    )
    .sort();
}

function readBlueprintFixture(fileName: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(blueprintsDir(), fileName), "utf-8"));
}

describe("NAPLAN-style Grade 5 Reading + Language Conventions blueprint seeds (g5-reading-*, g5-language_conventions-*)", () => {
  it("finds exactly 75 blueprint seed files for this batch", () => {
    expect(g5ReadingLanguageBlueprintFiles()).toHaveLength(75);
  });

  it.each(g5ReadingLanguageBlueprintFiles())("%s parses against blueprintSchema", (fileName) => {
    const raw = readBlueprintFixture(fileName);
    const result = blueprintSchema.safeParse(raw);
    expect(result.success).toBe(true);
  });

  it.each(g5ReadingLanguageBlueprintFiles())("%s validates cleanly against its taxonomy entry", (fileName) => {
    const blueprint = blueprintSchema.parse(readBlueprintFixture(fileName));
    expect(["reading", "language_conventions"]).toContain(blueprint.subject);
    expect(blueprint.examStyle).toBe("naplan_style");
    expect(blueprint.yearLevel).toBe("year-5");
    expect(blueprint.batchId).toBe("g5-reading-language-seed-batch-01");

    const result = validateBlueprint(blueprint);
    expect(result.issues).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it("every blueprint's skill resolves to a taxonomy entry supporting naplan_style Grade 5", () => {
    for (const fileName of g5ReadingLanguageBlueprintFiles()) {
      const blueprint = blueprintSchema.parse(readBlueprintFixture(fileName));
      const entry = SKILL_TAXONOMY_ENTRIES.find((candidate) => candidate.id === blueprint.skill);
      expect(entry, `blueprint '${blueprint.id}' skill '${blueprint.skill}'`).toBeDefined();
      expect(entry?.subject).toBe(blueprint.subject);
      expect(entry?.examStyles).toContain("naplan_style");
      expect(entry?.yearLevels).toContain(5);
      expect(entry?.supportedDifficulties).toContain(blueprint.difficulty);
      expect(entry?.recommendedQuestionTypes).toContain(blueprint.questionType);
    }
  });

  it("declares a real, non-trivial learning objective and at least one misconception target per blueprint", () => {
    for (const fileName of g5ReadingLanguageBlueprintFiles()) {
      const blueprint = blueprintSchema.parse(readBlueprintFixture(fileName));
      expect(blueprint.learningObjective.length).toBeGreaterThan(10);
      expect(blueprint.misconceptionTargets.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("uses only reading_comprehension, fill_blank, dropdown or short_answer question types (the types whose correctness gate reliably routes to independent semantic review)", () => {
    for (const fileName of g5ReadingLanguageBlueprintFiles()) {
      const blueprint = blueprintSchema.parse(readBlueprintFixture(fileName));
      expect(["reading_comprehension", "fill_blank", "dropdown", "short_answer"]).toContain(blueprint.questionType);
    }
  });

  it("splits reasonably between reading and language_conventions subjects", () => {
    const bySubject: Record<string, number> = { reading: 0, language_conventions: 0 };
    for (const fileName of g5ReadingLanguageBlueprintFiles()) {
      const blueprint = blueprintSchema.parse(readBlueprintFixture(fileName));
      bySubject[blueprint.subject] = (bySubject[blueprint.subject] ?? 0) + 1;
    }
    expect(bySubject.reading).toBeGreaterThan(0);
    expect(bySubject.language_conventions).toBeGreaterThan(0);
    expect(bySubject.reading + bySubject.language_conventions).toBe(75);
  });
});
