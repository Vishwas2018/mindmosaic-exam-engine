import { z } from "zod";

/**
 * A marking rubric, stored as data. Generic by construction: any number of
 * criteria on any whole-number scale, each with descriptive anchors. The first
 * (and so far only) rubric lives in ./rubrics; the server holds the same
 * criterion ids and scale in `writing_rubrics` (see the migration) and
 * src/tests/unit/writing-rubric.test.ts keeps the two in step.
 *
 * Anchors describe what the writing looks like at a level, so a parent without
 * teaching training can place a response. They never describe the child.
 */
export const rubricCriterionSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9_]*$/),
  label: z.string().min(1),
  /** One line a parent can hold in their head while reading. */
  lookFor: z.string().min(1),
  /** What the level looks like. Keys are scale levels; 1, 3 and 5 are mandatory on a 1-5 scale. */
  anchors: z.record(z.string(), z.string().min(20)),
});

export const writingRubricSchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9-]*$/),
    version: z.number().int().min(1),
    title: z.string().min(1),
    scaleMin: z.number().int().min(0),
    scaleMax: z.number().int().min(1),
    criteria: z.array(rubricCriterionSchema).min(1).max(12),
  })
  .superRefine((rubric, context) => {
    if (rubric.scaleMax <= rubric.scaleMin) {
      context.addIssue({ code: "custom", message: "scaleMax must exceed scaleMin.", path: ["scaleMax"] });
    }
    const seen = new Set<string>();
    rubric.criteria.forEach((criterion, index) => {
      if (seen.has(criterion.id)) {
        context.addIssue({ code: "custom", message: `Duplicate criterion '${criterion.id}'.`, path: ["criteria", index, "id"] });
      }
      seen.add(criterion.id);
      for (const level of [rubric.scaleMin, Math.round((rubric.scaleMin + rubric.scaleMax) / 2), rubric.scaleMax]) {
        if (!criterion.anchors[String(level)]) {
          context.addIssue({
            code: "custom",
            message: `Criterion '${criterion.id}' needs an anchor for level ${level}.`,
            path: ["criteria", index, "anchors"],
          });
        }
      }
    });
  });

export type WritingRubric = z.infer<typeof writingRubricSchema>;
export type RubricCriterion = z.infer<typeof rubricCriterionSchema>;

/** Whole-number scores keyed by criterion id. */
export type RubricScores = Readonly<Record<string, number>>;

export function rubricMaxMarks(rubric: WritingRubric): number {
  return rubric.criteria.length * rubric.scaleMax;
}

export function rubricLevels(rubric: WritingRubric): number[] {
  return Array.from({ length: rubric.scaleMax - rubric.scaleMin + 1 }, (_, index) => rubric.scaleMin + index);
}

/** Sum of the scores that are set; criteria not yet scored count as nothing. */
export function rubricTotal(rubric: WritingRubric, scores: Partial<RubricScores>): number {
  return rubric.criteria.reduce((sum, criterion) => sum + (scores[criterion.id] ?? 0), 0);
}

export function rubricIsComplete(rubric: WritingRubric, scores: Partial<RubricScores>): boolean {
  return rubric.criteria.every((criterion) => {
    const score = scores[criterion.id];
    return Number.isInteger(score) && (score as number) >= rubric.scaleMin && (score as number) <= rubric.scaleMax;
  });
}
