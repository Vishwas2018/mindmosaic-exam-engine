import { barModelVisualSchema, type BarModelVisual } from "@/schemas/visual.schema";

import {
  layerOfCode,
  solveBarModel,
  type BarModelIssue,
  type BarModelLayer,
  type BarModelSolution,
} from "./validate";

export interface BarModelSchemaIssue {
  /** The attached rule (e.g. "blank_with_value") or the native Zod code. */
  code: string;
  path: PropertyKey[];
  message: string;
}

export interface BarModelPipelineResult {
  /** The first layer that rejected the input, or "ok" if none did. */
  layer: BarModelLayer | "ok";
  ok: boolean;
  /** Every error code from the rejecting layer. */
  errorCodes: string[];
  /** Warning codes (only produced once the model parses and is solvable). */
  warningCodes: string[];
  schemaIssues: BarModelSchemaIssue[];
  issues: BarModelIssue[];
  visual: BarModelVisual | null;
  solution: BarModelSolution | null;
}

/**
 * Run all three layers in order against untrusted JSON: Zod shape, then
 * structure, then maths. Later layers never run on a model an earlier layer
 * rejected, so each fixture fails at exactly one, intended layer.
 */
export function validateBarModelVisual(raw: unknown): BarModelPipelineResult {
  const parsed = barModelVisualSchema.safeParse(raw);
  if (!parsed.success) {
    const schemaIssues = parsed.error.issues.map((entry) => ({
      code: String((entry as { params?: { rule?: string } }).params?.rule ?? entry.code),
      path: entry.path,
      message: entry.message,
    }));
    return {
      layer: "schema",
      ok: false,
      errorCodes: [...new Set(schemaIssues.map((entry) => entry.code))],
      warningCodes: [],
      schemaIssues,
      issues: [],
      visual: null,
      solution: null,
    };
  }

  const visual = parsed.data;
  const solution = solveBarModel(visual.data, {
    visualId: visual.id,
    title: visual.title,
    caption: visual.caption,
    altText: visual.altText,
  });
  const errors = solution.issues.filter((entry) => entry.severity === "error");
  const layer = errors.length === 0 ? "ok" : layerOfCode(errors[0].code);
  return {
    layer,
    ok: errors.length === 0,
    errorCodes: [...new Set(errors.map((entry) => entry.code))],
    warningCodes: [
      ...new Set(solution.issues.filter((entry) => entry.severity === "warning").map((entry) => entry.code)),
    ],
    schemaIssues: [],
    issues: solution.issues,
    visual,
    solution,
  };
}
