/**
 * Common result type returned by deterministic scholarship item solvers.
 * If unique is true, value contains the unique calculated answer.
 * If unique is false, error explains why (e.g. multiple solutions, contradictory constraints, or unrecognized pattern).
 */
export type SolverResult<T> =
  | { unique: true; value: T; explanation?: string }
  | { unique: false; error: string; candidates?: T[] };
