import { FACTORY_VERSIONS } from "../config";
import { hashJson } from "../provenance";
import {
  CORRECTNESS_CHECK_CATALOGUE,
  type AnswerRepresentation,
  type CorrectnessCapability,
  type CorrectnessCheckGroup,
  type CorrectnessVerificationEvidence,
  type CorrectnessVerificationIssue,
  type CorrectnessVerificationIssueCode,
  type ScoringOutcomeSummary,
} from "./types";

/** Bump when the check catalogue, capability model, or evidence shape changes. */
export const CORRECTNESS_VERIFIER_VERSION = "1" as const;

export interface CorrectnessEvidenceInput {
  readonly candidateId: string;
  readonly candidateRevision: number;
  readonly candidateContentHash: string;
  readonly blueprintHash?: string;
  readonly structuralEvidenceFingerprint?: string;
  readonly capability: CorrectnessCapability;
  readonly deterministicCategory?: string;
  readonly declaredAnswer?: AnswerRepresentation;
  readonly derivedAnswer?: AnswerRepresentation;
  readonly declaredScoring?: ScoringOutcomeSummary;
  readonly derivedScoring?: ScoringOutcomeSummary;
  readonly verifiedAt: string;
  readonly issues: readonly CorrectnessVerificationIssue[];
  readonly outcome: "passed" | "failed" | "review_required";
}

function summariseIssues(issues: readonly CorrectnessVerificationIssue[]): {
  readonly errorCount: number;
  readonly reviewRequiredCount: number;
  readonly codes: readonly CorrectnessVerificationIssueCode[];
} {
  const codes = Array.from(new Set(issues.map((issue) => issue.code))).sort();
  return {
    errorCount: issues.filter((issue) => issue.severity === "error").length,
    reviewRequiredCount: issues.filter((issue) => issue.severity === "review_required").length,
    codes,
  };
}

/**
 * Builds the evidence record for one correctness-verification run, plus a
 * deterministic `verificationFingerprint` hashed only over stable
 * verification facts — never `verifiedAt`. Mirrors
 * `validation/evidence.ts`'s `buildEvidence` fingerprint contract exactly,
 * for the same reason: a retry after a transient repository failure (a
 * fresh `verifiedAt`, everything else unchanged) must fingerprint
 * identically to the original run so `writeReportIfAbsent`-style replay
 * logic in `orchestrate-correctness-verification.ts` recognises it as an
 * equivalent re-run rather than a genuine conflict.
 */
export function buildCorrectnessEvidence(input: CorrectnessEvidenceInput): CorrectnessVerificationEvidence {
  const checksPerformed: readonly CorrectnessCheckGroup[] = CORRECTNESS_CHECK_CATALOGUE;
  const issueSummary = summariseIssues(input.issues);

  const fingerprintInput = {
    candidateId: input.candidateId,
    candidateRevision: input.candidateRevision,
    candidateContentHash: input.candidateContentHash,
    ...(input.blueprintHash !== undefined ? { blueprintHash: input.blueprintHash } : {}),
    ...(input.structuralEvidenceFingerprint !== undefined
      ? { structuralEvidenceFingerprint: input.structuralEvidenceFingerprint }
      : {}),
    verifierVersion: CORRECTNESS_VERIFIER_VERSION,
    schemaVersion: FACTORY_VERSIONS.SCHEMA_VERSION,
    taxonomyVersion: FACTORY_VERSIONS.TAXONOMY_VERSION,
    capability: input.capability,
    ...(input.deterministicCategory !== undefined ? { deterministicCategory: input.deterministicCategory } : {}),
    ...(input.declaredAnswer !== undefined ? { declaredAnswer: input.declaredAnswer } : {}),
    ...(input.derivedAnswer !== undefined ? { derivedAnswer: input.derivedAnswer } : {}),
    ...(input.declaredScoring !== undefined ? { declaredScoring: input.declaredScoring } : {}),
    ...(input.derivedScoring !== undefined ? { derivedScoring: input.derivedScoring } : {}),
    checkCatalogue: checksPerformed,
    issueSummary,
    outcome: input.outcome,
  };

  return {
    candidateId: input.candidateId,
    candidateRevision: input.candidateRevision,
    candidateContentHash: input.candidateContentHash,
    ...(input.blueprintHash !== undefined ? { blueprintHash: input.blueprintHash } : {}),
    ...(input.structuralEvidenceFingerprint !== undefined
      ? { structuralEvidenceFingerprint: input.structuralEvidenceFingerprint }
      : {}),
    verifierVersion: CORRECTNESS_VERIFIER_VERSION,
    schemaVersion: FACTORY_VERSIONS.SCHEMA_VERSION,
    taxonomyVersion: FACTORY_VERSIONS.TAXONOMY_VERSION,
    capability: input.capability,
    ...(input.deterministicCategory !== undefined ? { deterministicCategory: input.deterministicCategory } : {}),
    ...(input.declaredAnswer !== undefined ? { declaredAnswer: input.declaredAnswer } : {}),
    ...(input.derivedAnswer !== undefined ? { derivedAnswer: input.derivedAnswer } : {}),
    ...(input.declaredScoring !== undefined ? { declaredScoring: input.declaredScoring } : {}),
    ...(input.derivedScoring !== undefined ? { derivedScoring: input.derivedScoring } : {}),
    checksPerformed,
    issueSummary,
    outcome: input.outcome,
    verifiedAt: input.verifiedAt,
    verificationFingerprint: hashJson(fingerprintInput),
  };
}
