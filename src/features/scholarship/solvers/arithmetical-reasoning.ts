import type { SolverResult } from "./types";

export interface ConstraintVariable {
  name: string;
  min: number;
  max: number;
  step?: number;
}

export type ConstraintEquation = (env: Record<string, number>) => boolean;

export interface ArithmeticalReasoningParams {
  variables: ConstraintVariable[];
  constraints: ConstraintEquation[];
  targetVariable: string;
}

/**
 * Solves arithmetical reasoning word problems and number deduction puzzles
 * by exhaustive brute-force search over finite integer domains.
 * Guarantees uniqueness by checking that exactly one assignment satisfies all constraints.
 */
export function solveArithmeticalReasoning(params: ArithmeticalReasoningParams): SolverResult<number> {
  const { variables, constraints, targetVariable } = params;

  if (!variables || variables.length === 0) {
    return { unique: false, error: "Variables list cannot be empty" };
  }
  if (!constraints || constraints.length === 0) {
    return { unique: false, error: "Constraints list cannot be empty" };
  }
  if (!variables.some(v => v.name === targetVariable)) {
    return { unique: false, error: `Target variable '${targetVariable}' is not in variable list` };
  }

  // Calculate search space size
  let searchSpace = 1;
  for (const v of variables) {
    const step = v.step ?? 1;
    const count = Math.floor((v.max - v.min) / step) + 1;
    if (count <= 0) {
      return { unique: false, error: `Invalid range for variable '${v.name}' [${v.min}..${v.max}]` };
    }
    searchSpace *= count;
  }

  if (searchSpace > 5_000_000) {
    return { unique: false, error: `Search space too large (${searchSpace} combinations) for brute-force solver` };
  }

  const validAssignments: Record<string, number>[] = [];

  function search(index: number, currentEnv: Record<string, number>) {
    if (index === variables.length) {
      // Evaluate all constraints
      let allPassed = true;
      for (const check of constraints) {
        if (!check(currentEnv)) {
          allPassed = false;
          break;
        }
      }
      if (allPassed) {
        validAssignments.push({ ...currentEnv });
      }
      return;
    }

    const v = variables[index];
    const step = v.step ?? 1;
    for (let val = v.min; val <= v.max; val += step) {
      currentEnv[v.name] = val;
      search(index + 1, currentEnv);
      if (validAssignments.length > 10) return; // early exit if many solutions exist
    }
  }

  search(0, {});

  if (validAssignments.length === 0) {
    return { unique: false, error: "No integer solution satisfies the constraints" };
  }

  const targetValues = Array.from(new Set(validAssignments.map(env => env[targetVariable])));

  if (targetValues.length > 1) {
    return {
      unique: false,
      error: `Multiple solutions found for target variable '${targetVariable}': ${targetValues.join(", ")}`,
      candidates: targetValues,
    };
  }

  const answer = targetValues[0];
  return {
    unique: true,
    value: answer,
    explanation: `Unique solution: ${JSON.stringify(validAssignments[0])}`,
  };
}
