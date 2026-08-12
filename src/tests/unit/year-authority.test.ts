import { readdir, readFile } from "node:fs/promises";
import * as path from "node:path";

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { publishedExamBank } from "@/content/questions/practice-bank";
import {
  GATED_COVERAGE_THRESHOLD,
  getCoverageCell,
  getCoverageCells,
  yearLevelsWithGatedCoverage,
} from "@/features/taxonomy/coverage";
import {
  EXAM_STYLE_YEAR_LEVELS,
  isKnownYearLevel,
  isValidStyleYear,
  YEAR_LEVELS,
} from "@/features/taxonomy/year-registry";
import { validateBlueprint } from "@/features/question-factory/blueprints/validate";
import { blueprintSchema } from "@/features/question-factory/blueprints/schema";
import { SUPPORTED_CONTENT_YEAR_LEVELS } from "@/schemas/question.schema";

/**
 * Spec Phase 0 exit gate (`docs/spec/scalable-assessment-platform-spec-v1.md`
 * §21) and ADR-001: one documented canonical source for years, with the
 * valid-vs-ready split preserved and regression-tested rather than
 * reimplemented.
 *
 * `year-registry.test.ts` already pins the registry's own contents and the
 * "NAPLAN-style Year 4 is a validation error" gate. This file asserts the three
 * things Phase 0 is specifically accountable for:
 *
 *   (a) exactly one product-range `YEAR_LEVELS` authority exists in the tree;
 *   (b) the Year 4 rejection still runs through `EXAM_STYLE_YEAR_LEVELS`;
 *   (c) the server-only coverage readiness model is unchanged by the rename.
 *
 * (a) is a source scan rather than an import check, for the same reason
 * `question-factory/governed-import-boundary.test.ts` scans source: a
 * duplicate constant is only a hazard if it exists at all, and no import graph
 * can prove the absence of one.
 */

const SRC_ROOT = path.join(process.cwd(), "src");

async function listTypeScriptFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listTypeScriptFiles(fullPath)));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) &&
      !entry.name.endsWith(".d.ts")
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

function repoRelative(file: string): string {
  return path.relative(process.cwd(), file).split(path.sep).join("/");
}

describe("(a) one product-range year authority", () => {
  it("declares YEAR_LEVELS in exactly one module", async () => {
    const files = await listTypeScriptFiles(SRC_ROOT);
    const declaring: string[] = [];
    for (const file of files) {
      const source = await readFile(file, "utf8");
      /* The declaration, not a use: `export const YEAR_LEVELS =`. Test files
         import and re-assert it, which is the point of having one. */
      if (/^\s*export\s+const\s+YEAR_LEVELS\s*[:=]/m.test(source)) {
        declaring.push(repoRelative(file));
      }
    }
    expect(declaring).toEqual(["src/features/taxonomy/year-registry.ts"]);
  });

  it("re-exports YEAR_LEVELS from no barrel", async () => {
    /* `src/features/exam-engine/types/question.ts` used to re-export the
       schema's `[3, 5]` constant under the registry's name, which is how the
       collision was reachable from exam-engine code. A bare `YEAR_LEVELS,`
       line inside an `export { ... } from` block would restore it. */
    const files = await listTypeScriptFiles(SRC_ROOT);
    const offenders: string[] = [];
    for (const file of files) {
      if (repoRelative(file).startsWith("src/tests/")) continue;
      if (repoRelative(file) === "src/features/taxonomy/year-registry.ts") continue;
      const source = await readFile(file, "utf8");
      for (const block of source.matchAll(/export\s*\{([^}]*)\}\s*from/g)) {
        const names = block[1].split(",").map((name) => name.trim().split(/\s+as\s+/)[0]);
        if (names.includes("YEAR_LEVELS")) offenders.push(repoRelative(file));
      }
    }
    expect(offenders).toEqual([]);
  });

  it("keeps the content gate distinctly named and a strict subset of the range", () => {
    /* The renamed constant (ADR-001 §4). It is a statement about the shipped
       bank, never about the product's supported years, so it must be narrower
       than the registry — if it ever equals it, the name has stopped meaning
       anything. */
    expect([...SUPPORTED_CONTENT_YEAR_LEVELS]).toEqual([3, 5]);
    for (const year of SUPPORTED_CONTENT_YEAR_LEVELS) {
      expect(isKnownYearLevel(year)).toBe(true);
      expect(YEAR_LEVELS).toContain(year);
    }
    expect(SUPPORTED_CONTENT_YEAR_LEVELS.length).toBeLessThan(YEAR_LEVELS.length);
  });

  it("matches the year levels the published bank actually holds", () => {
    /* The derivation the module cycle forbids at runtime (ADR-001 §4), done
       here instead. Publishing Year 7 content fails this until someone updates
       the constant deliberately — which is exactly what a content-availability
       gate is for. */
    const inBank = [...new Set(publishedExamBank.map((question) => question.yearLevel))].sort(
      (a, b) => a - b,
    );
    expect(inBank).toEqual([...SUPPORTED_CONTENT_YEAR_LEVELS]);
  });

  it("has no other narrow year list masquerading as the range", async () => {
    /* Any exported constant whose name ends in YEAR_LEVELS must be either the
       registry itself or a gate named for what it gates. The two known gates
       are listed by name; a third has to be classified (ADR-001 §3) before it
       can pass. */
    const allowed = new Set([
      "YEAR_LEVELS", // the registry
      "SUPPORTED_CONTENT_YEAR_LEVELS", // content-availability gate
      "PERSISTABLE_YEAR_LEVELS", // DB-persistence gate
      "EXAM_STYLE_YEAR_LEVELS", // style/year matrix, part of the registry
      "BLUEPRINT_YEAR_LEVELS", // slugs, derived from the registry
    ]);
    const files = await listTypeScriptFiles(SRC_ROOT);
    const found = new Set<string>();
    for (const file of files) {
      if (repoRelative(file).startsWith("src/tests/")) continue;
      const source = await readFile(file, "utf8");
      for (const match of source.matchAll(/^\s*(?:export\s+)?const\s+(\w*YEAR_LEVELS)\s*[:=]/gm)) {
        found.add(match[1]);
      }
    }
    expect([...found].filter((name) => !allowed.has(name))).toEqual([]);
  });
});

describe("(b) valid sittings still gate through EXAM_STYLE_YEAR_LEVELS", () => {
  it("rejects NAPLAN-style Year 4 at the registry", () => {
    expect(isValidStyleYear("naplan_style", 4)).toBe(false);
    expect(EXAM_STYLE_YEAR_LEVELS.naplan_style).not.toContain(4);
    /* Year 4 is a real year — it is the SITTING that does not exist. */
    expect(YEAR_LEVELS).toContain(4);
    expect(isValidStyleYear("icas_style", 4)).toBe(true);
  });

  it("still rejects a NAPLAN-style Year 4 blueprint end to end", () => {
    const blueprint = blueprintSchema.parse({
      id: "bp-phase0-year-authority",
      batchId: "batch-phase0-year-authority",
      yearLevel: "year-4",
      examStyle: "naplan_style",
      subject: "numeracy",
      strand: "Number",
      skill: "not-a-real-skill-id",
      difficulty: "medium",
      questionType: "multiple_choice",
      targetCount: 1,
      marks: 1,
      estimatedTimeSeconds: 60,
      learningObjective: "Phase 0 regression citation for the style/year gate.",
      misconceptionTargets: ["Confusing the year level with the style."],
      reasoningSteps: 1,
      accessibilityConstraints: ["Plain language."],
      originalityConstraints: ["Original wording."],
      generationConstraints: ["Single correct answer."],
    });
    const codes = validateBlueprint(blueprint).issues.map((issue) => issue.code);
    expect(codes).toContain("exam_style_not_sat_at_year_level");
  });
});

describe("(c) coverage readiness is unchanged", () => {
  it("keeps the gated threshold at the largest offered sitting length", () => {
    expect(GATED_COVERAGE_THRESHOLD).toBe(30);
  });

  it("materialises cells only for real sittings", () => {
    for (const cell of getCoverageCells()) {
      expect(isValidStyleYear(cell.examStyle, cell.yearLevel)).toBe(true);
      expect(YEAR_LEVELS).toContain(cell.yearLevel);
      expect(cell.ready).toBe(cell.gatedCount >= GATED_COVERAGE_THRESHOLD);
    }
    /* Absent, not present-and-zero: an impossible sitting must not be
       renderable as "no content yet". */
    expect(getCoverageCell(4, "naplan_style", "numeracy")).toBeUndefined();
    expect(getCoverageCell(1, "icas_style", "numeracy")).toBeUndefined();
  });

  it("keeps readiness a subset of, and separate from, validity", () => {
    const ready = yearLevelsWithGatedCoverage();
    for (const year of ready) {
      expect(YEAR_LEVELS).toContain(year);
    }
    /* The split spec §6.3 requires: content decides READY, never VALID. Years
       exist in the registry that no content reaches, and that is correct — an
       empty pool must not remove a real sitting from planning. */
    expect(ready.length).toBeLessThan(YEAR_LEVELS.length);
    /* ...and a ready year is necessarily one we hold content for. */
    for (const year of ready) {
      expect(SUPPORTED_CONTENT_YEAR_LEVELS).toContain(year);
    }
  });
});
