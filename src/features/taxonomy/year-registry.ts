/**
 * Year levels, and which assessment styles are real at each one.
 *
 * Expansion-plan T0a. Before this, "year level" meant 3 or 5 in about a
 * dozen places, each hard-coding the pair independently: the question
 * schema, the blueprint types, provisioning, the parent forms, the CSV
 * ingester, the practice filters. Widening to Years 1-12 by editing twelve
 * literals would have produced twelve new sources of truth, so the ranges
 * live here and everything else derives from them.
 *
 * Deliberately dependency-light: it imports one type from the question
 * schema and nothing else. `subject-registry.ts` is imported BY the schema,
 * so anything in this folder that reaches for a question bank would close a
 * cycle — coverage therefore lives in ./coverage.ts, which is server-side
 * and imports both.
 */
import type { ExamStyle, YearLevel } from "@/schemas/question.schema";

/** Years 1-12. The full span the product addresses. */
export const YEAR_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export type YearLevelValue = (typeof YEAR_LEVELS)[number];

/**
 * Which years each assessment style is actually sat at.
 *
 * This is the rule the expansion plan calls out by name: a blueprint for
 * "NAPLAN-style Year 4" must be a validation error, not a silent
 * acceptance. NAPLAN is administered in Years 3, 5, 7 and 9 only; ICAS runs
 * across Years 2-12. Generating 2,000 questions against an unchecked
 * style/year matrix would produce content for sittings that do not exist,
 * and nothing downstream would notice.
 *
 * Style-year validity is about the ASSESSMENT, not about whether we have
 * content yet. "Do we have questions for this cell" is coverage, and lives
 * in ./coverage.ts.
 */
export const EXAM_STYLE_YEAR_LEVELS: Readonly<Record<ExamStyle, readonly YearLevel[]>> = {
  /* ACARA administers NAPLAN in Years 3, 5, 7 and 9. */
  naplan_style: [3, 5, 7, 9],
  /* ICAS papers run from Year 2 to Year 12. */
  icas_style: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
};

export function isKnownYearLevel(value: unknown): value is YearLevel {
  return (
    typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 12
  );
}

/** Whether this style is sat at this year at all. */
export function isValidStyleYear(examStyle: ExamStyle, yearLevel: YearLevel): boolean {
  return EXAM_STYLE_YEAR_LEVELS[examStyle].includes(yearLevel);
}

/** The years a given style is sat at. */
export function yearLevelsForStyle(examStyle: ExamStyle): readonly YearLevel[] {
  return EXAM_STYLE_YEAR_LEVELS[examStyle];
}

/** The styles sat at a given year. Empty for a year no style covers (Year 1). */
export function stylesForYearLevel(yearLevel: YearLevel): readonly ExamStyle[] {
  return (Object.keys(EXAM_STYLE_YEAR_LEVELS) as ExamStyle[]).filter((style) =>
    isValidStyleYear(style, yearLevel),
  );
}

/** Every (style, year) pair that is a real sitting — the generation matrix. */
export function validStyleYearPairs(): readonly {
  readonly examStyle: ExamStyle;
  readonly yearLevel: YearLevel;
}[] {
  return (Object.keys(EXAM_STYLE_YEAR_LEVELS) as ExamStyle[]).flatMap((examStyle) =>
    EXAM_STYLE_YEAR_LEVELS[examStyle].map((yearLevel) => ({ examStyle, yearLevel })),
  );
}

/**
 * Blueprint year-level slugs ("year-3"), derived from YEAR_LEVELS so the
 * factory cannot know a different set of years from the rest of the app.
 */
export const BLUEPRINT_YEAR_LEVEL_SLUGS = YEAR_LEVELS.map(
  (year) => `year-${year}` as const,
);

export type BlueprintYearLevelSlug = (typeof BLUEPRINT_YEAR_LEVEL_SLUGS)[number];

export function yearLevelToSlug(yearLevel: YearLevel): BlueprintYearLevelSlug {
  return `year-${yearLevel}` as BlueprintYearLevelSlug;
}

export function slugToYearLevel(slug: BlueprintYearLevelSlug): YearLevel {
  return Number(slug.slice("year-".length)) as YearLevel;
}
