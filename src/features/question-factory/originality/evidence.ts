import { CORRECTNESS_LIMITS } from "../config";
import { hashJson } from "../provenance";
import { ORIGINALITY_CHECKER_VERSION, ORIGINALITY_NORMALISATION_VERSION } from "./similarity";
import type {
  OriginalityClassification,
  OriginalityCorpusScope,
  OriginalityEvidence,
  OriginalityIssue,
  OriginalityIssueCode,
  OriginalityMatch,
} from "./types";

const TRUNCATION_MARKER = "…";

/** Mirrors `correctness/evidence.ts`'s `boundMessage` exactly — same shared length bound, reused rather than redeclared. */
export function boundMessage(text: string): { readonly message: string; readonly truncated: boolean } {
  if (text.length <= CORRECTNESS_LIMITS.MAX_ISSUE_MESSAGE_LENGTH) {
    return { message: text, truncated: false };
  }
  const cutLength = CORRECTNESS_LIMITS.MAX_ISSUE_MESSAGE_LENGTH - TRUNCATION_MARKER.length;
  return { message: `${text.slice(0, cutLength)}${TRUNCATION_MARKER}`, truncated: true };
}

export interface OriginalityEvidenceInput {
  readonly candidateId: string;
  readonly candidateRevision: number;
  readonly candidateContentHash: string;
  readonly blueprintHash?: string;
  readonly corpusScope: OriginalityCorpusScope;
  readonly nearestMatches: readonly OriginalityMatch[];
  readonly classification: OriginalityClassification;
  readonly validatedAt: string;
  readonly issues: readonly OriginalityIssue[];
  readonly outcome: "passed" | "failed" | "quarantined";
}

function summariseIssues(issues: readonly OriginalityIssue[]): {
  readonly errorCount: number;
  readonly codes: readonly OriginalityIssueCode[];
} {
  const codes = Array.from(new Set(issues.map((issue) => issue.code))).sort();
  return { errorCount: issues.filter((issue) => issue.severity === "error").length, codes };
}

export interface OriginalityFingerprintFacts {
  readonly candidateId: string;
  readonly candidateRevision: number;
  readonly candidateContentHash: string;
  readonly blueprintHash?: string;
  readonly checkerVersion: string;
  readonly normalisationVersion: string;
  readonly corpusScope: OriginalityCorpusScope;
  readonly nearestMatches: readonly OriginalityMatch[];
  readonly classification: OriginalityClassification;
  readonly issueSummary: { readonly errorCount: number; readonly codes: readonly OriginalityIssueCode[] };
  readonly outcome: "passed" | "failed" | "quarantined";
}

/**
 * The single authoritative originality-fingerprint algorithm — deliberately
 * excludes `validatedAt`, mirroring `computeCorrectnessVerificationFingerprint`
 * exactly, so a wall-clock-only retry always replays cleanly.
 */
export function computeOriginalityFingerprint(facts: OriginalityFingerprintFacts): string {
  return hashJson({
    candidateId: facts.candidateId,
    candidateRevision: facts.candidateRevision,
    candidateContentHash: facts.candidateContentHash,
    ...(facts.blueprintHash !== undefined ? { blueprintHash: facts.blueprintHash } : {}),
    checkerVersion: facts.checkerVersion,
    normalisationVersion: facts.normalisationVersion,
    corpusScope: facts.corpusScope,
    nearestMatches: facts.nearestMatches,
    classification: facts.classification,
    issueSummary: facts.issueSummary,
    outcome: facts.outcome,
  });
}

export function buildOriginalityEvidence(input: OriginalityEvidenceInput): OriginalityEvidence {
  const issueSummary = summariseIssues(input.issues);

  const originalityFingerprint = computeOriginalityFingerprint({
    candidateId: input.candidateId,
    candidateRevision: input.candidateRevision,
    candidateContentHash: input.candidateContentHash,
    blueprintHash: input.blueprintHash,
    checkerVersion: ORIGINALITY_CHECKER_VERSION,
    normalisationVersion: ORIGINALITY_NORMALISATION_VERSION,
    corpusScope: input.corpusScope,
    nearestMatches: input.nearestMatches,
    classification: input.classification,
    issueSummary,
    outcome: input.outcome,
  });

  return {
    candidateId: input.candidateId,
    candidateRevision: input.candidateRevision,
    candidateContentHash: input.candidateContentHash,
    ...(input.blueprintHash !== undefined ? { blueprintHash: input.blueprintHash } : {}),
    checkerVersion: ORIGINALITY_CHECKER_VERSION,
    normalisationVersion: ORIGINALITY_NORMALISATION_VERSION,
    corpusScope: input.corpusScope,
    nearestMatches: input.nearestMatches,
    classification: input.classification,
    outcome: input.outcome,
    issues: input.issues,
    issueSummary,
    validatedAt: input.validatedAt,
    originalityFingerprint,
  };
}
