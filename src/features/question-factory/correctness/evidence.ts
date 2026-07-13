import { CORRECTNESS_LIMITS, FACTORY_VERSIONS } from "../config";
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

/**
 * Bump independently of `CORRECTNESS_VERIFIER_VERSION` whenever the real
 * scoring-engine *integration* this gate relies on (`safeScoreQuestion`'s
 * contract with `@/features/exam-engine/scoring/score-question`) changes in
 * a way that could invalidate a previously stored verification — e.g. a
 * scoring-rule change for an existing question type — even though this
 * gate's own check catalogue did not change.
 */
export const CORRECTNESS_SCORER_VERSION = "1" as const;

const TRUNCATION_MARKER = "…";

/**
 * Deterministically truncates a message to the shared persisted-evidence
 * bound (`CORRECTNESS_LIMITS.MAX_ISSUE_MESSAGE_LENGTH`) — the single
 * choke point every `CorrectnessVerificationIssue.message` passes through
 * before it can be persisted, so a prompt-derived, expression-derived, or
 * exception-derived string (unbounded donor content, a pathological
 * expression, a stack-trace-shaped error message) can never reach stored
 * evidence unbounded. Truncation is a pure function of the input length —
 * never timestamp- or environment-dependent — so it never destabilises
 * `verificationFingerprint`.
 */
export function boundMessage(text: string): { readonly message: string; readonly truncated: boolean } {
  if (text.length <= CORRECTNESS_LIMITS.MAX_ISSUE_MESSAGE_LENGTH) {
    return { message: text, truncated: false };
  }
  const cutLength = CORRECTNESS_LIMITS.MAX_ISSUE_MESSAGE_LENGTH - TRUNCATION_MARKER.length;
  return { message: `${text.slice(0, cutLength)}${TRUNCATION_MARKER}`, truncated: true };
}

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
 * Every stable fact `verificationFingerprint` is hashed over. Shaped so it
 * can be built two ways from the same authoritative field list: fresh, from
 * a verification run's own inputs (`buildCorrectnessEvidence`), or
 * recomputed from an already-stored `CorrectnessVerificationEvidence`
 * record's own visible fields (`validate-cached-replay.ts`'s cached-replay
 * binding, which must prove a stored report's fingerprint has not been
 * tampered with or left stale after an edit).
 */
export interface CorrectnessFingerprintFacts {
  readonly candidateId: string;
  readonly candidateRevision: number;
  readonly candidateContentHash: string;
  readonly blueprintHash?: string;
  readonly structuralEvidenceFingerprint?: string;
  readonly verifierVersion: string;
  readonly scorerVersion: string;
  readonly schemaVersion: string;
  readonly taxonomyVersion: string;
  readonly capability: CorrectnessCapability;
  readonly deterministicCategory?: string;
  readonly declaredAnswer?: AnswerRepresentation;
  readonly derivedAnswer?: AnswerRepresentation;
  readonly declaredScoring?: ScoringOutcomeSummary;
  readonly derivedScoring?: ScoringOutcomeSummary;
  readonly checksPerformed: readonly CorrectnessCheckGroup[];
  readonly issueSummary: {
    readonly errorCount: number;
    readonly reviewRequiredCount: number;
    readonly codes: readonly CorrectnessVerificationIssueCode[];
  };
  readonly outcome: "passed" | "failed" | "review_required";
}

/**
 * The single authoritative correctness-fingerprint algorithm — every
 * caller that needs to build or recompute `verificationFingerprint` must
 * go through this function rather than re-declaring the hash shape, so the
 * two can never silently drift apart.
 */
export function computeCorrectnessVerificationFingerprint(facts: CorrectnessFingerprintFacts): string {
  const fingerprintInput = {
    candidateId: facts.candidateId,
    candidateRevision: facts.candidateRevision,
    candidateContentHash: facts.candidateContentHash,
    ...(facts.blueprintHash !== undefined ? { blueprintHash: facts.blueprintHash } : {}),
    ...(facts.structuralEvidenceFingerprint !== undefined
      ? { structuralEvidenceFingerprint: facts.structuralEvidenceFingerprint }
      : {}),
    verifierVersion: facts.verifierVersion,
    scorerVersion: facts.scorerVersion,
    schemaVersion: facts.schemaVersion,
    taxonomyVersion: facts.taxonomyVersion,
    capability: facts.capability,
    ...(facts.deterministicCategory !== undefined ? { deterministicCategory: facts.deterministicCategory } : {}),
    ...(facts.declaredAnswer !== undefined ? { declaredAnswer: facts.declaredAnswer } : {}),
    ...(facts.derivedAnswer !== undefined ? { derivedAnswer: facts.derivedAnswer } : {}),
    ...(facts.declaredScoring !== undefined ? { declaredScoring: facts.declaredScoring } : {}),
    ...(facts.derivedScoring !== undefined ? { derivedScoring: facts.derivedScoring } : {}),
    checkCatalogue: facts.checksPerformed,
    issueSummary: facts.issueSummary,
    outcome: facts.outcome,
  };
  return hashJson(fingerprintInput);
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

  const verificationFingerprint = computeCorrectnessVerificationFingerprint({
    candidateId: input.candidateId,
    candidateRevision: input.candidateRevision,
    candidateContentHash: input.candidateContentHash,
    blueprintHash: input.blueprintHash,
    structuralEvidenceFingerprint: input.structuralEvidenceFingerprint,
    verifierVersion: CORRECTNESS_VERIFIER_VERSION,
    scorerVersion: CORRECTNESS_SCORER_VERSION,
    schemaVersion: FACTORY_VERSIONS.SCHEMA_VERSION,
    taxonomyVersion: FACTORY_VERSIONS.TAXONOMY_VERSION,
    capability: input.capability,
    deterministicCategory: input.deterministicCategory,
    declaredAnswer: input.declaredAnswer,
    derivedAnswer: input.derivedAnswer,
    declaredScoring: input.declaredScoring,
    derivedScoring: input.derivedScoring,
    checksPerformed,
    issueSummary,
    outcome: input.outcome,
  });

  return {
    candidateId: input.candidateId,
    candidateRevision: input.candidateRevision,
    candidateContentHash: input.candidateContentHash,
    ...(input.blueprintHash !== undefined ? { blueprintHash: input.blueprintHash } : {}),
    ...(input.structuralEvidenceFingerprint !== undefined
      ? { structuralEvidenceFingerprint: input.structuralEvidenceFingerprint }
      : {}),
    verifierVersion: CORRECTNESS_VERIFIER_VERSION,
    scorerVersion: CORRECTNESS_SCORER_VERSION,
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
    verificationFingerprint,
  };
}
