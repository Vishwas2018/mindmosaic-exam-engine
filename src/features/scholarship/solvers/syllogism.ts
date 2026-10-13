import type { SolverResult } from "./types";

/**
 * An expression in propositional logic:
 * - variable: string (e.g. "P", "Q", "R")
 * - not: expression
 * - and: expressions
 * - or: expressions
 * - implies: [antecedent, consequent]
 * - iff: [left, right]
 */
export type PropExpr =
  | { kind: "var"; name: string }
  | { kind: "not"; expr: PropExpr }
  | { kind: "and"; left: PropExpr; right: PropExpr }
  | { kind: "or"; left: PropExpr; right: PropExpr }
  | { kind: "implies"; antecedent: PropExpr; consequent: PropExpr }
  | { kind: "iff"; left: PropExpr; right: PropExpr };

export interface SyllogismParams {
  variables: string[]; // List of boolean variables
  premises: PropExpr[];
  conclusions: { id: string; expr: PropExpr }[];
}

/**
 * Evaluates propositional logic truth tables to verify syllogisms and deductions.
 * A conclusion is necessarily true if it is TRUE in EVERY truth assignment where ALL premises are TRUE.
 * Checks for contradiction (no models satisfy premises) and multiple/zero valid conclusions.
 */
export function solveSyllogism(params: SyllogismParams): SolverResult<string> {
  const { variables, premises, conclusions } = params;

  if (!variables || variables.length === 0) {
    return { unique: false, error: "Variables list cannot be empty" };
  }
  if (!premises || premises.length === 0) {
    return { unique: false, error: "Premises list cannot be empty" };
  }
  if (!conclusions || conclusions.length === 0) {
    return { unique: false, error: "Conclusions list cannot be empty" };
  }

  const numVars = variables.length;
  if (numVars > 12) {
    return { unique: false, error: "Too many variables for propositional truth table check" };
  }

  const totalAssignments = 1 << numVars;
  const satisfyingModels: Record<string, boolean>[] = [];

  for (let mask = 0; mask < totalAssignments; mask++) {
    const env: Record<string, boolean> = {};
    for (let v = 0; v < numVars; v++) {
      env[variables[v]] = ((mask >> v) & 1) === 1;
    }

    // Evaluate all premises
    let premisesHold = true;
    for (const premise of premises) {
      if (!evalExpr(premise, env)) {
        premisesHold = false;
        break;
      }
    }

    if (premisesHold) {
      satisfyingModels.push(env);
    }
  }

  if (satisfyingModels.length === 0) {
    return { unique: false, error: "Premises are contradictory (no truth assignment satisfies all premises)" };
  }

  // Check each conclusion against all satisfying models
  const validConclusions: string[] = [];
  for (const c of conclusions) {
    let necessarilyTrue = true;
    for (const model of satisfyingModels) {
      if (!evalExpr(c.expr, model)) {
        necessarilyTrue = false;
        break;
      }
    }
    if (necessarilyTrue) {
      validConclusions.push(c.id);
    }
  }

  if (validConclusions.length === 0) {
    return {
      unique: false,
      error: "None of the candidate conclusions necessarily follow from the premises",
    };
  }

  if (validConclusions.length > 1) {
    return {
      unique: false,
      error: `Multiple candidate conclusions necessarily follow: ${validConclusions.join(", ")}`,
      candidates: validConclusions,
    };
  }

  return {
    unique: true,
    value: validConclusions[0],
    explanation: `Conclusion '${validConclusions[0]}' is true in all ${satisfyingModels.length} models satisfying the premises`,
  };
}

function evalExpr(expr: PropExpr, env: Record<string, boolean>): boolean {
  switch (expr.kind) {
    case "var":
      return env[expr.name] ?? false;
    case "not":
      return !evalExpr(expr.expr, env);
    case "and":
      return evalExpr(expr.left, env) && evalExpr(expr.right, env);
    case "or":
      return evalExpr(expr.left, env) || evalExpr(expr.right, env);
    case "implies":
      // A -> B is !A || B
      return !evalExpr(expr.antecedent, env) || evalExpr(expr.consequent, env);
    case "iff":
      return evalExpr(expr.left, env) === evalExpr(expr.right, env);
  }
}
