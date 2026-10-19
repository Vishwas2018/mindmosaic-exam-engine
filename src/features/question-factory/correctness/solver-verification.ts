import { z } from "zod";
import { solveNumberSeries } from "../../scholarship/solvers/number-series";
import { solveNumberMatrix } from "../../scholarship/solvers/number-matrices";
import { solveLetterSeries } from "../../scholarship/solvers/letter-series";
import { solveCode } from "../../scholarship/solvers/coded-words";
import { solveSyllogism } from "../../scholarship/solvers/syllogism";
import { solveArithmeticalReasoning } from "../../scholarship/solvers/arithmetical-reasoning";
import type { Question } from "../../../schemas/question.schema";

const sidecar = z.object({
  solver: z.string(), solverParams: z.record(z.string(), z.unknown()),
  ruleOrientation: z.enum(["row", "column", "diagonal"]).optional(),
  correctValue: z.union([z.string(), z.number().finite()]).optional(),
});
const arithmetic = z.object({
  variables: z.array(z.object({
    name: z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/),
    min: z.number().finite().int(), max: z.number().finite().int(),
    step: z.number().finite().int().positive().optional(),
  }).strict()).min(1).max(8),
  constraints: z.array(z.object({
    op: z.literal("eq"), variable: z.string(), value: z.number().finite(),
  }).strict()).min(1).max(32),
  targetVariable: z.string(),
}).strict();

type Computation = { ok: true; value: string | number } | { ok: false; error: string };

/** Closed constraint language: only {op:"eq", variable, value}; source strings are unsupported.
 * correctValue is an untrusted assertion, checked after independent computation, never an operand.
 */
export function computeSolver(raw: unknown): Computation {
  try {
    const sp = sidecar.parse(raw);
    const params = sp.solverParams;
    let result;
    switch (sp.solver) {
      case "number_series": result = solveNumberSeries(params as unknown as Parameters<typeof solveNumberSeries>[0]); break;
      case "number_matrix":
        if (!sp.ruleOrientation) throw new Error("Number matrix solverParams must explicitly declare ruleOrientation");
        result = solveNumberMatrix({ ...params, ruleOrientation: sp.ruleOrientation } as unknown as Parameters<typeof solveNumberMatrix>[0]); break;
      case "letter_series": result = solveLetterSeries(params as unknown as Parameters<typeof solveLetterSeries>[0]); break;
      case "coded_words": result = solveCode(params as unknown as Parameters<typeof solveCode>[0]); break;
      case "syllogism": result = solveSyllogism(params as unknown as Parameters<typeof solveSyllogism>[0]); break;
      case "arithmetical_reasoning": {
        const data = arithmetic.parse(params);
        const names = new Set(data.variables.map(v => v.name));
        if (names.size !== data.variables.length || data.variables.some(v => v.max < v.min) ||
            data.constraints.some(c => !names.has(c.variable))) throw new Error("Invalid constraint variables");
        result = solveArithmeticalReasoning({ ...data,
          constraints: data.constraints.map(c => (env: Record<string, number>) => env[c.variable] === c.value),
        });
        break;
      }
      default: throw new Error(`Unsupported solver type '${sp.solver}'`);
    }
    if (!result.unique) throw new Error(result.error);
    if (result.value === undefined) throw new Error("Solver produced no unique value");
    const value = result.value;
    if ((typeof value !== "string" && typeof value !== "number") ||
        (typeof value === "number" && !Number.isFinite(value))) throw new Error("Invalid solver result");
    if (sp.correctValue !== undefined && !solverValueMatches(value, sp.correctValue)) {
      throw new Error(`Untrusted solverParams.correctValue does not match solver computed value '${value}'`);
    }
    return { ok: true, value };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/** Numeric rule: finite base-10 decimal, optional sign, correctly grouped commas;
 * exact numeric equality. Strings compare case-sensitively after trimming only.
 * Units/currency/mixed quantities have no supported comparator and fail closed.
 */
export function solverValueMatches(computed: string | number, declared: unknown): boolean {
  if (typeof computed === "string") return typeof declared === "string" && computed.trim() === declared.trim();
  if (!Number.isFinite(computed)) return false;
  if (typeof declared === "number") return Number.isFinite(declared) && computed === declared;
  if (typeof declared !== "string" || !/^[+-]?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(declared.trim())) return false;
  return Number(declared.trim().replace(/,/g, "")) === computed;
}

export function solverAnswerError(question: Pick<Question, "answerKey" | "options">, value: string | number): string | undefined {
  const key = question.answerKey;
  if (key.kind === "single_option") {
    const option = question.options?.find(o => o.id === key.optionId);
    if (!option || !solverValueMatches(value, option.text)) return `Answer option text '${option?.text}' does not match solver computed value '${value}'`;
  } else if (key.kind === "number") {
    const tolerance = key.tolerance ?? 0;
    if (typeof value !== "number" || !Number.isFinite(key.value) || !Number.isFinite(tolerance) || tolerance < 0 || Math.abs(key.value - value) > tolerance) {
      return `Number answer key value ${key.value} does not match solver computed value ${value}`;
    }
  } else return `Solver verification is not supported for answer key kind '${key.kind}'`;
  return undefined;
}
