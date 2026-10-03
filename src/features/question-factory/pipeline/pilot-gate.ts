/**
 * Pilot Gate Evaluation for Question Factory batch/domain runs.
 *
 * Enforces strict quality gates on pilot batches before full generation or
 * pipeline runs can proceed for a curriculum domain/subject:
 *  1. Batch size constraint: 5 to 10 candidates per pilot domain.
 *  2. Minimum structural/schema pass rate: >= 80% (0.80).
 *  3. Machine correctness pass rate: 100% agreement on deterministically
 *     computable items.
 *
 * If ANY criterion fails, the pilot domain FAILS CLOSED and the domain run is
 * HALTED immediately. A failing pilot (such as the September run where Numeracy
 * scored 0% on visual schema) NEVER reports "pilot passed" and never allows
 * downstream generation or staging to continue for that domain.
 */

export interface PilotConfig {
  /** Domain or subject being piloted (e.g. 'numeracy', 'language_conventions'). */
  readonly domain: string;
  /** Minimum required structural/schema pass rate (0.0 to 1.0). Default: 0.80 (80%). */
  readonly minPassRate?: number;
  /** Minimum candidates in a pilot batch. Default: 5. */
  readonly minBatchSize?: number;
  /** Maximum candidates in a pilot batch. Default: 10. */
  readonly maxBatchSize?: number;
}

export const DEFAULT_PILOT_CONFIG = Object.freeze({
  MIN_PASS_RATE: 0.8,
  MIN_BATCH_SIZE: 5,
  MAX_BATCH_SIZE: 10,
});

export interface PilotCandidateEvaluation {
  readonly candidateId: string;
  readonly passedStructural: boolean;
  readonly passedCorrectness?: boolean;
  readonly failureReason?: string;
}

export interface PilotDomainEvaluationInput {
  readonly domain: string;
  readonly candidates: readonly PilotCandidateEvaluation[];
  readonly config?: Partial<PilotConfig>;
}

export type PilotGateOutcome =
  | {
      readonly passed: true;
      readonly domain: string;
      readonly totalCount: number;
      readonly passedCount: number;
      readonly passRate: number;
      readonly message: string;
    }
  | {
      readonly passed: false;
      readonly status: "halted";
      readonly issueCode:
        | "pilot_batch_size_invalid"
        | "pilot_pass_rate_below_threshold"
        | "pilot_correctness_failed";
      readonly domain: string;
      readonly totalCount: number;
      readonly passedCount: number;
      readonly passRate: number;
      readonly message: string;
    };

/**
 * Evaluates whether a pilot domain run passes the quality gate or must halt.
 * Returns a discriminated union indicating success or a halted failure.
 */
export function evaluatePilotDomain(input: PilotDomainEvaluationInput): PilotGateOutcome {
  const { domain, candidates, config } = input;
  const minBatchSize = config?.minBatchSize ?? DEFAULT_PILOT_CONFIG.MIN_BATCH_SIZE;
  const maxBatchSize = config?.maxBatchSize ?? DEFAULT_PILOT_CONFIG.MAX_BATCH_SIZE;
  const minPassRate = config?.minPassRate ?? DEFAULT_PILOT_CONFIG.MIN_PASS_RATE;

  const totalCount = candidates.length;

  if (totalCount < minBatchSize || totalCount > maxBatchSize) {
    return {
      passed: false,
      status: "halted",
      issueCode: "pilot_batch_size_invalid",
      domain,
      totalCount,
      passedCount: 0,
      passRate: 0,
      message: `Pilot domain '${domain}' has ${totalCount} candidates; requires between ${minBatchSize} and ${maxBatchSize} candidates. Run halted.`,
    };
  }

  const passedStructuralCandidates = candidates.filter((c) => c.passedStructural);
  const passedCount = passedStructuralCandidates.length;
  const passRate = totalCount > 0 ? passedCount / totalCount : 0;

  if (passRate < minPassRate) {
    return {
      passed: false,
      status: "halted",
      issueCode: "pilot_pass_rate_below_threshold",
      domain,
      totalCount,
      passedCount,
      passRate,
      message: `Pilot domain '${domain}' failed structural schema gate: ${passedCount}/${totalCount} passed (${(
        passRate * 100
      ).toFixed(1)}% < ${(minPassRate * 100).toFixed(1)}% required). Run halted for domain '${domain}'.`,
    };
  }

  // Check correctness if present
  const correctnessChecked = candidates.filter((c) => c.passedCorrectness !== undefined);
  const correctnessFailed = correctnessChecked.filter((c) => c.passedCorrectness === false);
  if (correctnessFailed.length > 0) {
    return {
      passed: false,
      status: "halted",
      issueCode: "pilot_correctness_failed",
      domain,
      totalCount,
      passedCount,
      passRate,
      message: `Pilot domain '${domain}' failed correctness check on ${correctnessFailed.length} candidate(s). Run halted for domain '${domain}'.`,
    };
  }

  return {
    passed: true,
    domain,
    totalCount,
    passedCount,
    passRate,
    message: `Pilot domain '${domain}' passed gate: ${passedCount}/${totalCount} (${(passRate * 100).toFixed(
      1,
    )}%) met threshold ${(minPassRate * 100).toFixed(1)}%.`,
  };
}

/**
 * Asserts that a pilot domain passed. Throws a Descriptive Error if the pilot failed,
 * halting execution immediately.
 */
export function assertPilotDomainPassed(input: PilotDomainEvaluationInput): void {
  const result = evaluatePilotDomain(input);
  if (!result.passed) {
    throw new Error(`[PILOT GATE HALTED] ${result.message}`);
  }
}
