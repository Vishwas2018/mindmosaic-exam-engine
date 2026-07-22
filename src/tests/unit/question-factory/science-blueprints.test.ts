import * as fs from "node:fs";
import * as path from "node:path";

import { describe, expect, it } from "vitest";

import { blueprintSchema, validateBlueprint } from "@/features/question-factory/blueprints";
import { getWorkspaceRoot } from "@/features/question-factory/config";
import { SKILL_TAXONOMY_ENTRIES } from "@/features/question-factory/taxonomy";

const SCIENCE_BLUEPRINT_FILES = [
  "science-biological-sciences-year3-icas-seed-001.json",
  "science-physical-sciences-year5-icas-seed-001.json",
];

function readBlueprintFixture(fileName: string): unknown {
  const filePath = path.join(getWorkspaceRoot(), "blueprints", fileName);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

describe("Science blueprint seeds", () => {
  it("checked-in fixture files are exactly the seeded Science blueprints", () => {
    const blueprintsDir = path.join(getWorkspaceRoot(), "blueprints");
    const jsonFiles = fs
      .readdirSync(blueprintsDir)
      .filter((fileName) => fileName.endsWith(".json"));
    expect(jsonFiles.sort()).toEqual([...SCIENCE_BLUEPRINT_FILES].sort());
  });

  it.each(SCIENCE_BLUEPRINT_FILES)("%s parses against blueprintSchema", (fileName) => {
    const raw = readBlueprintFixture(fileName);
    const result = blueprintSchema.safeParse(raw);
    expect(result.success).toBe(true);
  });

  it.each(SCIENCE_BLUEPRINT_FILES)(
    "%s validates cleanly against its taxonomy entry",
    (fileName) => {
      const blueprint = blueprintSchema.parse(readBlueprintFixture(fileName));
      expect(blueprint.subject).toBe("science");

      const result = validateBlueprint(blueprint);
      expect(result.issues).toEqual([]);
      expect(result.valid).toBe(true);
    },
  );

  it("every Science blueprint's skill resolves to a Science taxonomy entry", () => {
    for (const fileName of SCIENCE_BLUEPRINT_FILES) {
      const blueprint = blueprintSchema.parse(readBlueprintFixture(fileName));
      const entry = SKILL_TAXONOMY_ENTRIES.find((candidate) => candidate.id === blueprint.skill);
      expect(entry).toBeDefined();
      expect(entry?.subject).toBe("science");
    }
  });
});
