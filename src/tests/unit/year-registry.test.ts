import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { blueprintSchema } from "@/features/question-factory/blueprints/schema";
import { validateBlueprint } from "@/features/question-factory/blueprints/validate";
import {
  BLUEPRINT_YEAR_LEVEL_SLUGS,
  EXAM_STYLE_YEAR_LEVELS,
  isKnownYearLevel,
  isValidStyleYear,
  slugToYearLevel,
  stylesForYearLevel,
  validStyleYearPairs,
  yearLevelToSlug,
  yearLevelsForStyle,
  YEAR_LEVELS,
} from "@/features/taxonomy/year-registry";
import { SUBJECT_REGISTRY } from "@/features/taxonomy/subject-registry";
import { yearLevelSchema } from "@/schemas/question.schema";

/**
 * Expansion-plan T0a. The registry is the single source of truth for which
 * years exist and which assessment styles are sat at them, and the rule
 * that matters most is the one that has to FAIL: a blueprint for
 * "NAPLAN-style Year 4" must be a validation error, because generating
 * 2,000 questions against an unchecked matrix would produce content for
 * sittings that do not exist and nothing downstream would notice.
 */

describe("year registry — the span", () => {
  it("covers Years 1 to 12 with no gaps", () => {
    expect([...YEAR_LEVELS]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it("is exactly what the question schema accepts", () => {
    for (const year of YEAR_LEVELS) {
      expect(yearLevelSchema.safeParse(year).success).toBe(true);
    }
    for (const notAYear of [0, 13, -1, 3.5, "3", null]) {
      expect(yearLevelSchema.safeParse(notAYear).success).toBe(false);
    }
  });

  it("guards the same range at runtime", () => {
    expect(YEAR_LEVELS.every(isKnownYearLevel)).toBe(true);
    for (const notAYear of [0, 13, 3.5, "5", null, undefined]) {
      expect(isKnownYearLevel(notAYear)).toBe(false);
    }
  });

  it("round-trips blueprint slugs", () => {
    for (const year of YEAR_LEVELS) {
      expect(slugToYearLevel(yearLevelToSlug(year))).toBe(year);
    }
    expect([...BLUEPRINT_YEAR_LEVEL_SLUGS]).toHaveLength(YEAR_LEVELS.length);
  });
});

describe("year registry — style/year validity", () => {
  /*
   * These two lists are the product decision, not an implementation
   * detail: NAPLAN is administered in Years 3, 5, 7 and 9; ICAS runs
   * Years 2-12. Pinned exactly so a change is deliberate.
   */
  it("restricts NAPLAN-style to Years 3, 5, 7 and 9", () => {
    expect([...EXAM_STYLE_YEAR_LEVELS.naplan_style]).toEqual([3, 5, 7, 9]);
  });

  it("allows ICAS-style across Years 2 to 12", () => {
    expect([...EXAM_STYLE_YEAR_LEVELS.icas_style]).toEqual([
      2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
  });

  it.each([
    ["naplan_style", 3, true],
    ["naplan_style", 5, true],
    ["naplan_style", 7, true],
    ["naplan_style", 9, true],
    /* The case the plan names by hand. */
    ["naplan_style", 4, false],
    ["naplan_style", 1, false],
    ["naplan_style", 2, false],
    ["naplan_style", 6, false],
    ["naplan_style", 12, false],
    ["icas_style", 2, true],
    ["icas_style", 7, true],
    ["icas_style", 12, true],
    ["icas_style", 1, false],
  ] as const)("%s at year %i -> %s", (examStyle, yearLevel, expected) => {
    expect(isValidStyleYear(examStyle, yearLevel)).toBe(expected);
  });

  it("reports no style at all for Year 1", () => {
    /* Neither assessment is sat in Year 1. The year exists — a Year 1
       student is a real profile — but no exam-style content belongs to it. */
    expect(stylesForYearLevel(1)).toEqual([]);
  });

  it("agrees with yearLevelsForStyle in both directions", () => {
    for (const year of YEAR_LEVELS) {
      for (const style of ["naplan_style", "icas_style"] as const) {
        expect(yearLevelsForStyle(style).includes(year)).toBe(
          stylesForYearLevel(year).includes(style),
        );
      }
    }
  });

  it("enumerates exactly the real sittings", () => {
    const pairs = validStyleYearPairs();
    expect(pairs).toHaveLength(4 + 11);
    for (const { examStyle, yearLevel } of pairs) {
      expect(isValidStyleYear(examStyle, yearLevel)).toBe(true);
    }
    expect(
      pairs.some((p) => p.examStyle === "naplan_style" && p.yearLevel === 4),
    ).toBe(false);
  });
});

describe("subject registry — year spans", () => {
  it("gives every subject a non-empty span inside the registry range", () => {
    for (const subject of SUBJECT_REGISTRY) {
      expect(subject.yearLevels.length).toBeGreaterThan(0);
      for (const year of subject.yearLevels) {
        expect(isKnownYearLevel(year)).toBe(true);
      }
    }
  });

  /*
   * A subject's span and a style's years are different facts. Intersecting
   * them is what gives the real sittings for that subject — a subject
   * spanning 1-12 that only supports NAPLAN-style is still only sat four
   * times.
   */
  it("intersects with style years to give a subject's real sittings", () => {
    const naplanOnly = SUBJECT_REGISTRY.filter(
      (subject) =>
        subject.supportedExamStyles.length === 1 &&
        subject.supportedExamStyles[0] === "naplan_style",
    );
    for (const subject of naplanOnly) {
      const sittings = subject.yearLevels.filter((year) =>
        isValidStyleYear("naplan_style", year),
      );
      expect(sittings.every((year) => [3, 5, 7, 9].includes(year))).toBe(true);
    }
  });
});

/* ---------- The gate that has to fail ---------- */

function blueprintFor(yearLevel: number, examStyle: "naplan_style" | "icas_style") {
  return blueprintSchema.parse({
    id: "bp-style-year-check",
    batchId: "batch-style-year-check",
    yearLevel: `year-${yearLevel}`,
    examStyle,
    subject: "numeracy",
    strand: "Number",
    /* Deliberately unknown: these cases assert that the style/year check
       fires independently of whether the skill resolves. */
    skill: "not-a-real-skill-id",
    difficulty: "medium",
    questionType: "multiple_choice",
    targetCount: 1,
    marks: 1,
    estimatedTimeSeconds: 60,
    learningObjective: "Check the style/year gate.",
    misconceptionTargets: ["Confusing the year level with the style."],
    reasoningSteps: 1,
    accessibilityConstraints: ["Plain language."],
    originalityConstraints: ["Original wording."],
    generationConstraints: ["Single correct answer."],
  });
}

describe("blueprint validation rejects impossible sittings", () => {
  it("rejects NAPLAN-style at Year 4", () => {
    const result = validateBlueprint(blueprintFor(4, "naplan_style"));
    expect(result.valid).toBe(false);
    const codes = result.issues.map((issue) => issue.code);
    expect(codes).toContain("exam_style_not_sat_at_year_level");
  });

  it("names the years that would have been valid", () => {
    const result = validateBlueprint(blueprintFor(4, "naplan_style"));
    const issue = result.issues.find(
      (candidate) => candidate.code === "exam_style_not_sat_at_year_level",
    );
    expect(issue?.message).toMatch(/3, 5, 7, 9/);
  });

  it("rejects ICAS-style at Year 1", () => {
    const codes = validateBlueprint(blueprintFor(1, "icas_style")).issues.map((i) => i.code);
    expect(codes).toContain("exam_style_not_sat_at_year_level");
  });

  /*
   * The check runs outside the taxonomy-entry branch on purpose: an
   * unknown skill must not be able to mask an impossible sitting. Both
   * blueprints below carry the same bogus skill; only the year differs.
   */
  it("reports the impossible sitting even when the skill is unknown", () => {
    const invalid = validateBlueprint(blueprintFor(4, "naplan_style")).issues.map((i) => i.code);
    expect(invalid).toContain("unknown_skill");
    expect(invalid).toContain("exam_style_not_sat_at_year_level");
  });

  it("does not raise the style/year issue for a real sitting", () => {
    for (const year of [3, 5, 7, 9]) {
      const codes = validateBlueprint(blueprintFor(year, "naplan_style")).issues.map(
        (i) => i.code,
      );
      expect(codes).not.toContain("exam_style_not_sat_at_year_level");
    }
    for (const year of [2, 6, 12]) {
      const codes = validateBlueprint(blueprintFor(year, "icas_style")).issues.map((i) => i.code);
      expect(codes).not.toContain("exam_style_not_sat_at_year_level");
    }
  });
});
