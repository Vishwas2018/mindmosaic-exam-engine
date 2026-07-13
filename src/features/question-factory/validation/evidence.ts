import { FACTORY_VERSIONS } from "../config";
import { hashJson } from "../provenance";
import {
  STRUCTURAL_VALIDATION_CHECK_GROUPS,
  type StructuralValidationCheckGroup,
  type StructuralValidationEvidence,
  type StructuralValidationIssue,
  type StructuralValidationIssueCode,
} from "./types";

/** Bump when the check catalogue or evidence shape changes, per the determinism contract every other factory version tag already follows. */
export const STRUCTURAL_VALIDATOR_VERSION = "1" as const;

export interface EvidenceInput {
  readonly candidateId: string;
  readonly candidateRevision: number;
  readonly candidateContentHash: string;
  readonly blueprintHash?: string;
  readonly validatedAt: string;
  readonly issues: readonly StructuralValidationIssue[];
}

function summariseIssues(issues: readonly StructuralValidationIssue[]): {
  readonly errorCount: number;
  readonly codes: readonly StructuralValidationIssueCode[];
} {
  const codes = Array.from(new Set(issues.map((i) => i.code))).sort();
  return { errorCount: issues.length, codes };
}

/**
 * Every stable fact `validationFingerprint` is hashed over — exactly the
 * subset of `StructuralValidationEvidence`'s own fields that are
 * deterministic validation identity, as opposed to observational metadata
 * (`validatedAt`) or the fingerprint itself. Deliberately shaped so it can
 * be built two ways from the same authoritative field list: fresh, from a
 * validation run's own inputs (`buildEvidence`), or recomputed from an
 * already-stored `StructuralValidationEvidence` record's own visible
 * fields (any caller needing to prove a stored fingerprint has not been
 * tampered with or left stale after an edit — see Mission 2C's cached
 * correctness-replay binding).
 */
export interface StructuralFingerprintFacts {
  readonly candidateId: string;
  readonly candidateRevision: number;
  readonly candidateContentHash: string;
  readonly blueprintHash?: string;
  readonly validatorVersion: string;
  readonly schemaVersion: string;
  readonly taxonomyVersion: string;
  readonly checksPerformed: readonly StructuralValidationCheckGroup[];
  readonly issueSummary: { readonly errorCount: number; readonly codes: readonly StructuralValidationIssueCode[] };
  readonly outcome: "passed" | "failed";
}

/**
 * The single authoritative structural-fingerprint algorithm — every caller
 * that needs to build or recompute `validationFingerprint` must go through
 * this function rather than re-declaring the hash shape, so the two can
 * never silently drift apart.
 */
export function computeStructuralValidationFingerprint(facts: StructuralFingerprintFacts): string {
  const fingerprintInput = {
    candidateId: facts.candidateId,
    candidateRevision: facts.candidateRevision,
    candidateContentHash: facts.candidateContentHash,
    ...(facts.blueprintHash !== undefined ? { blueprintHash: facts.blueprintHash } : {}),
    validatorVersion: facts.validatorVersion,
    schemaVersion: facts.schemaVersion,
    taxonomyVersion: facts.taxonomyVersion,
    checkCatalogue: facts.checksPerformed,
    issueSummary: facts.issueSummary,
    outcome: facts.outcome,
  };
  return hashJson(fingerprintInput);
}

/**
 * Builds the evidence record for one validation run, plus a deterministic
 * `validationFingerprint` hashed only over stable validation facts —
 * candidate id, revision, content hash, blueprint hash, validator/schema/
 * taxonomy version, the fixed check catalogue, the deterministic issue
 * summary, and the pass/fail outcome. `validatedAt` (an observational
 * wall-clock timestamp, supplied by the caller — see
 * `StructuralValidationContext`) is carried on the evidence as metadata but
 * deliberately excluded from the fingerprint: two validation runs against
 * unchanged candidate content must fingerprint identically regardless of
 * *when* each run happened, so a retry after a transient repository
 * failure (a new `validatedAt`, same everything else) is recognised as
 * equivalent rather than mistaken for a genuine candidate mutation — see
 * `writeReportIfAbsent` in `orchestrate-structural-validation.ts`, which
 * relies on exactly this property for replay safety. A genuinely changed
 * candidate, revision, blueprint, issue set, or validator/schema/taxonomy
 * version still changes the fingerprint, so real drift is still caught.
 */
export function buildEvidence(input: EvidenceInput): StructuralValidationEvidence {
  const checksPerformed: readonly StructuralValidationCheckGroup[] = STRUCTURAL_VALIDATION_CHECK_GROUPS;
  const issueSummary = summariseIssues(input.issues);
  const outcome: "passed" | "failed" = input.issues.length === 0 ? "passed" : "failed";

  const validationFingerprint = computeStructuralValidationFingerprint({
    candidateId: input.candidateId,
    candidateRevision: input.candidateRevision,
    candidateContentHash: input.candidateContentHash,
    blueprintHash: input.blueprintHash,
    validatorVersion: STRUCTURAL_VALIDATOR_VERSION,
    schemaVersion: FACTORY_VERSIONS.SCHEMA_VERSION,
    taxonomyVersion: FACTORY_VERSIONS.TAXONOMY_VERSION,
    checksPerformed,
    issueSummary,
    outcome,
  });

  return {
    candidateId: input.candidateId,
    candidateRevision: input.candidateRevision,
    candidateContentHash: input.candidateContentHash,
    ...(input.blueprintHash !== undefined ? { blueprintHash: input.blueprintHash } : {}),
    validatorVersion: STRUCTURAL_VALIDATOR_VERSION,
    schemaVersion: FACTORY_VERSIONS.SCHEMA_VERSION,
    taxonomyVersion: FACTORY_VERSIONS.TAXONOMY_VERSION,
    validatedAt: input.validatedAt,
    checksPerformed,
    issueSummary,
    outcome,
    validationFingerprint,
  };
}
