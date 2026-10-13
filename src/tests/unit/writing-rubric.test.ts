import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { rubricIsComplete, rubricLevels, rubricMaxMarks, rubricTotal, writingRubricSchema } from "@/features/writing/rubric";
import { scholarshipWrittenExpressionRubric as rubric } from "@/features/writing/rubrics/scholarship-written-expression";

describe("scholarship-style written expression rubric", () => {
  it("has the six agreed criteria on a 1-5 scale", () => {
    expect(rubric.criteria.map((criterion) => criterion.id)).toEqual([
      "punctuation",
      "creativity",
      "construction",
      "grammar",
      "spelling",
      "relevance",
    ]);
    expect([rubric.scaleMin, rubric.scaleMax]).toEqual([1, 5]);
    expect(rubricMaxMarks(rubric)).toBe(30);
    expect(rubricLevels(rubric)).toEqual([1, 2, 3, 4, 5]);
  });

  it("describes what a 1, a 3 and a 5 look like for every criterion, in Australian English", () => {
    for (const criterion of rubric.criteria) {
      for (const level of ["1", "3", "5"]) {
        expect(criterion.anchors[level], `${criterion.id} level ${level}`).toBeTruthy();
      }
      expect(criterion.anchors["1"]).not.toEqual(criterion.anchors["5"]);
    }
    const prose = JSON.stringify(rubric);
    // American spellings that would be wrong here.
    expect(prose).not.toMatch(/\b(color|behavior|organize|recognize|center|favorite|analyze)\w*\b/i);
  });

  it("does not describe the child, only the writing", () => {
    const prose = JSON.stringify(rubric.criteria.map((criterion) => criterion.anchors)).toLowerCase();
    expect(prose).not.toMatch(/\b(lazy|weak|gifted|behind|struggling|talented|smart|clever)\b/);
  });

  it("rejects a rubric missing an anchor or repeating a criterion", () => {
    const missing = structuredClone(rubric);
    delete (missing.criteria[0].anchors as Record<string, string>)["3"];
    expect(writingRubricSchema.safeParse(missing).success).toBe(false);

    const duplicate = structuredClone(rubric);
    duplicate.criteria[1] = { ...duplicate.criteria[0] };
    expect(writingRubricSchema.safeParse(duplicate).success).toBe(false);
  });

  it("totals only what has been scored and knows when it is complete", () => {
    expect(rubricTotal(rubric, {})).toBe(0);
    expect(rubricTotal(rubric, { punctuation: 3, creativity: 4 })).toBe(7);
    const all = { punctuation: 3, creativity: 4, construction: 3, grammar: 5, spelling: 2, relevance: 4 };
    expect(rubricTotal(rubric, all)).toBe(21);
    expect(rubricIsComplete(rubric, all)).toBe(true);
    expect(rubricIsComplete(rubric, { ...all, spelling: undefined })).toBe(false);
    expect(rubricIsComplete(rubric, { ...all, spelling: 6 })).toBe(false);
    expect(rubricIsComplete(rubric, { ...all, spelling: 2.5 })).toBe(false);
  });

  it("matches the criteria and scale the database holds (writing_rubrics seed)", () => {
    const sql = fs.readFileSync(
      path.join(process.cwd(), "supabase", "migrations", "20261013090000_timed_writing_parent_marking.sql"),
      "utf8",
    );
    const seed = sql.match(/values \(\s*'scholarship-written-expression', (\d+), '[^']+', (\d+), (\d+),\s*'(\[[\s\S]*?\])'::jsonb/);
    expect(seed, "seed row not found in migration").not.toBeNull();
    const [, version, scaleMin, scaleMax, criteriaJson] = seed!;
    const dbCriteria = JSON.parse(criteriaJson) as { id: string; label: string }[];

    expect(Number(version)).toBe(rubric.version);
    expect(Number(scaleMin)).toBe(rubric.scaleMin);
    expect(Number(scaleMax)).toBe(rubric.scaleMax);
    expect(dbCriteria.map((criterion) => criterion.id)).toEqual(rubric.criteria.map((criterion) => criterion.id));
  });
});
