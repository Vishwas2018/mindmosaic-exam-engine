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
 * Builds the evidence record for one validation run, plus a deterministic
 * hash over its own contents (stable-key-order, LF-normalised, same
 * `hashJson` every other factory content hash uses). Same inputs always
 * produce the same `evidenceHash` — a replayed validation run against
 * unchanged content and the same `validatedAt` produces byte-identical
 * evidence, never a new/duplicate artefact.
 */
export function buildEvidence(input: EvidenceInput): StructuralValidationEvidence {
  const checksPerformed: readonly StructuralValidationCheckGroup[] = STRUCTURAL_VALIDATION_CHECK_GROUPS;
  const issueSummary = summariseIssues(input.issues);

  const evidenceWithoutHash: Omit<StructuralValidationEvidence, "evidenceHash"> = {
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
  };

  return { ...evidenceWithoutHash, evidenceHash: hashJson(evidenceWithoutHash) };
}
