import { CORRECTNESS_LIMITS } from "../config";
import { hashJson } from "../provenance";
import { DIFFICULTY_ESTIMATOR_VERSION } from "./estimate-difficulty";
import type { DifficultyBand, DifficultyEvidence, DifficultyIssue, DifficultyIssueCode, DifficultySignals } from "./types";

const TRUNCATION_MARKER = "…";

/** Mirrors `correctness/evidence.ts`'s `boundMessage` exactly — same shared length bound, reused rather than redeclared. */
export function boundMessage(text: string): { readonly message: string; readonly truncated: boolean } {
  if (text.length <= CORRECTNESS_LIMITS.MAX_ISSUE_MESSAGE_LENGTH) {
    return { message: text, truncated: false };
  }
  const cutLength = CORRECTNESS_LIMITS.MAX_ISSUE_MESSAGE_LENGTH - TRUNCATION_MARKER.length;
  return { message: `${text.slice(0, cutLength)}${TRUNCATION_MARKER}`, truncated: true };
}

export interface DifficultyEvidenceInput {
  readonly candidateId: string;
  readonly candidateRevision: number;
  readonly candidateContentHash: string;
  readonly blueprintHash: string;
  readonly declaredDifficulty: DifficultyBand;
  readonly estimatedDifficulty: DifficultyBand;
  readonly estimateConfidence: number;
  readonly deviation: number;
  readonly signals: DifficultySignals;
  readonly validatedAt: string;
  readonly issues: readonly DifficultyIssue[];
  readonly outcome: "passed" | "failed" | "quarantined";
}

function summariseIssues(issues: readonly DifficultyIssue[]): {
  readonly errorCount: number;
  readonly codes: readonly DifficultyIssueCode[];
} {
  const codes = Array.from(new Set(issues.map((issue) => issue.code))).sort();
  return { errorCount: issues.filter((issue) => issue.severity === "error").length, codes };
}

export interface DifficultyFingerprintFacts {
  readonly candidateId: string;
  readonly candidateRevision: number;
  readonly candidateContentHash: string;
  readonly blueprintHash: string;
  readonly checkerVersion: string;
  readonly declaredDifficulty: DifficultyBand;
  readonly estimatedDifficulty: DifficultyBand;
  readonly estimateConfidence: number;
  readonly deviation: number;
  readonly signals: DifficultySignals;
  readonly issueSummary: { readonly errorCount: number; readonly codes: readonly DifficultyIssueCode[] };
  readonly outcome: "passed" | "failed" | "quarantined";
}

/**
 * The single authoritative difficulty-fingerprint algorithm — deliberately
 * excludes `validatedAt`, mirroring `computeCorrectnessVerificationFingerprint`
 * exactly, so a wall-clock-only retry always replays cleanly.
 */
export function computeDifficultyFingerprint(facts: DifficultyFingerprintFacts): string {
  return hashJson({
    candidateId: facts.candidateId,
    candidateRevision: facts.candidateRevision,
    candidateContentHash: facts.candidateContentHash,
    blueprintHash: facts.blueprintHash,
    checkerVersion: facts.checkerVersion,
    declaredDifficulty: facts.declaredDifficulty,
    estimatedDifficulty: facts.estimatedDifficulty,
    estimateConfidence: facts.estimateConfidence,
    deviation: facts.deviation,
    signals: facts.signals,
    issueSummary: facts.issueSummary,
    outcome: facts.outcome,
  });
}

export function buildDifficultyEvidence(input: DifficultyEvidenceInput): DifficultyEvidence {
  const issueSummary = summariseIssues(input.issues);

  const difficultyFingerprint = computeDifficultyFingerprint({
    candidateId: input.candidateId,
    candidateRevision: input.candidateRevision,
    candidateContentHash: input.candidateContentHash,
    blueprintHash: input.blueprintHash,
    checkerVersion: DIFFICULTY_ESTIMATOR_VERSION,
    declaredDifficulty: input.declaredDifficulty,
    estimatedDifficulty: input.estimatedDifficulty,
    estimateConfidence: input.estimateConfidence,
    deviation: input.deviation,
    signals: input.signals,
    issueSummary,
    outcome: input.outcome,
  });

  return {
    candidateId: input.candidateId,
    candidateRevision: input.candidateRevision,
    candidateContentHash: input.candidateContentHash,
    blueprintHash: input.blueprintHash,
    checkerVersion: DIFFICULTY_ESTIMATOR_VERSION,
    declaredDifficulty: input.declaredDifficulty,
    estimatedDifficulty: input.estimatedDifficulty,
    estimateConfidence: input.estimateConfidence,
    deviation: input.deviation,
    signals: input.signals,
    outcome: input.outcome,
    issues: input.issues,
    issueSummary,
    validatedAt: input.validatedAt,
    difficultyFingerprint,
  };
}
