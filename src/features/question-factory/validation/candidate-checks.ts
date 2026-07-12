import { FACTORY_VERSIONS } from "../config";
import { candidateQuestionSchema, type CandidateQuestion } from "../ingestion/candidate-question";
import { isAbsoluteOrUnsafeSourcePath } from "../ingestion/source-path";
import { candidateProvenanceSchema, hashJson, type CandidateProvenance } from "../provenance";
import { classifyProvenanceIssue, classifyQuestionStructureIssue } from "./schema-issue-classifier";
import type { StructuralValidationContext, StructuralValidationIssue } from "./types";

function issue(
  code: StructuralValidationIssue["code"],
  path: string,
  message: string,
): StructuralValidationIssue {
  return { code, path, message, severity: "error" };
}

export type ParsedProvenanceOutcome =
  | { readonly ok: true; readonly data: CandidateProvenance }
  | { readonly ok: false; readonly issues: readonly StructuralValidationIssue[] };

/**
 * Re-parses the raw, untrusted `provenance` blob a repository read
 * returned against the shared, unmodified `candidateProvenanceSchema` —
 * the same schema `ingestLegacyQuestions` writes with, reused here rather
 * than re-declared. A `FactoryRepository.read()` result is `unknown`; the
 * structural gate must never assume it is already a valid
 * `CandidateProvenance` just because it lives in the `generated`
 * compartment.
 */
export function parseCandidateProvenance(raw: unknown): ParsedProvenanceOutcome {
  const result = candidateProvenanceSchema.safeParse(raw);
  if (result.success) return { ok: true, data: result.data };
  const issues = result.error.issues.map((zodIssue) =>
    issue(
      classifyProvenanceIssue(zodIssue.path),
      ["provenance", ...zodIssue.path.map(String)].join("."),
      zodIssue.message,
    ),
  );
  return { ok: false, issues };
}

export type ParsedQuestionOutcome =
  | { readonly ok: true; readonly data: CandidateQuestion }
  | { readonly ok: false; readonly issues: readonly StructuralValidationIssue[] };

/**
 * Re-parses the raw, untrusted `question` blob against the shared
 * `candidateQuestionSchema` (Mission 2A's adapter-preflight schema, reused
 * here as a defence-in-depth re-check — never re-declared). This mirrors
 * `parseCandidateProvenance`'s trust boundary.
 */
export function parseCandidateQuestion(raw: unknown): ParsedQuestionOutcome {
  const result = candidateQuestionSchema.safeParse(raw);
  if (result.success) return { ok: true, data: result.data };
  const issues = result.error.issues.map((zodIssue) =>
    issue(
      classifyQuestionStructureIssue(zodIssue.path),
      ["question", ...zodIssue.path.map(String)].join("."),
      zodIssue.message,
    ),
  );
  return { ok: false, issues };
}

/**
 * Detects donor trust/status fields smuggled directly onto the stored
 * question object — checked against the *raw* pre-parse value, since
 * `candidateQuestionSchema.safeParse` silently strips unrecognised keys
 * (it is not `.strict()`) rather than rejecting them. Mission 2A's
 * ingestion adapter never writes these fields (see
 * `docs/reports/mission2-production/01-legacy-ingestion-adapter.md`'s
 * "Trust boundary" section), so a hit here means the stored record was
 * corrupted or tampered with after ingestion, not a normal donor artefact.
 */
export function findDonorTrustFields(rawQuestion: unknown): readonly string[] {
  if (typeof rawQuestion !== "object" || rawQuestion === null) return [];
  const record = rawQuestion as Record<string, unknown>;
  const found: string[] = [];
  if ("status" in record) found.push("status");
  if ("origin" in record) found.push("origin");
  const stimulus = record.stimulus;
  if (
    typeof stimulus === "object" &&
    stimulus !== null &&
    "attribution" in (stimulus as Record<string, unknown>)
  ) {
    found.push("stimulus.attribution");
  }
  return found;
}

export function checkDonorTrustFields(rawQuestion: unknown): readonly StructuralValidationIssue[] {
  const fields = findDonorTrustFields(rawQuestion);
  return fields.map((field) =>
    issue(
      "donor_trust_field_present",
      `question.${field}`,
      `Stored candidate question carries a donor trust/status field ('${field}') that ingestion never writes; the record may be corrupted or tampered with.`,
    ),
  );
}

/**
 * The repository record's own `candidateId` (the key it is stored under)
 * must agree with the `candidateId` its provenance declares — a mismatch
 * means the record was moved, copied, or hand-edited into place under the
 * wrong key, which is exactly the "valid candidate ID" binding this check
 * closes (the id's *shape* is already covered by `factoryIdentifierSchema`
 * inside `parseCandidateProvenance`).
 */
export function checkCandidateIdBinding(
  candidateId: string,
  provenance: CandidateProvenance,
): readonly StructuralValidationIssue[] {
  if (candidateId === provenance.candidateId) return [];
  return [
    issue(
      "invalid_candidate_id",
      "candidateId",
      `Record is stored under candidateId '${candidateId}' but its provenance declares '${provenance.candidateId}'.`,
    ),
  ];
}

/** Structural validation only ever runs against a candidate that is exactly at `generated` — every other state is either upstream or downstream of this gate. */
export function checkLifecycleState(state: string): readonly StructuralValidationIssue[] {
  if (state === "generated") return [];
  return [
    issue(
      "invalid_lifecycle_state",
      "state",
      `Structural validation requires lifecycle state 'generated'; candidate is at '${state}'.`,
    ),
  ];
}

/**
 * `sourcePath` is ingestion-specific (`LegacyIngestionProvenance`), not
 * every generator class will have one, so this check is skipped
 * ("not applicable") rather than failed when it is absent. Reuses the
 * exact same absolute/UNC/traversal check ingestion itself enforces at
 * write time, so a corrupted or hand-edited record cannot smuggle an
 * unsafe path past this second check.
 */
export function checkSourcePath(sourcePath: string | undefined): readonly StructuralValidationIssue[] {
  if (sourcePath === undefined) return [];
  if (!isAbsoluteOrUnsafeSourcePath(sourcePath)) return [];
  return [
    issue(
      "unsanitised_source_path",
      "ingestion.sourcePath",
      `sourcePath '${sourcePath}' must be repository-relative; absolute paths and path traversal are not permitted in provenance.`,
    ),
  ];
}

/** Both version tags must match the versions this validator was built against — an older/newer schema or taxonomy generation is never silently accepted. */
export function checkVersions(provenance: CandidateProvenance): readonly StructuralValidationIssue[] {
  const issues: StructuralValidationIssue[] = [];
  if (provenance.schemaVersion !== FACTORY_VERSIONS.SCHEMA_VERSION) {
    issues.push(
      issue(
        "unsupported_schema_version",
        "provenance.schemaVersion",
        `Candidate schemaVersion '${provenance.schemaVersion}' does not match the supported version '${FACTORY_VERSIONS.SCHEMA_VERSION}'.`,
      ),
    );
  }
  if (provenance.taxonomyVersion !== FACTORY_VERSIONS.TAXONOMY_VERSION) {
    issues.push(
      issue(
        "unsupported_taxonomy_version",
        "provenance.taxonomyVersion",
        `Candidate taxonomyVersion '${provenance.taxonomyVersion}' does not match the supported version '${FACTORY_VERSIONS.TAXONOMY_VERSION}'.`,
      ),
    );
  }
  return issues;
}

/**
 * Recomputes the candidate question's content hash the exact same way
 * ingestion did (`hashJson`, stable-key-order + LF-normalised) and
 * compares it against the recorded `provenance.contentHash`. A mismatch
 * means the stored question content and its recorded hash have diverged —
 * the record was edited after being written, without recomputing
 * provenance — which is always a hard failure, never a "stale" (caller
 * expectation) issue; see `checkStaleness` for that distinct case.
 */
export function checkContentHashBinding(
  question: CandidateQuestion,
  provenance: CandidateProvenance,
): readonly StructuralValidationIssue[] {
  const actualHash = hashJson(question);
  if (actualHash === provenance.contentHash) return [];
  return [
    issue(
      "content_hash_mismatch",
      "provenance.contentHash",
      `Recorded contentHash does not match the stored question content (recomputed '${actualHash}', recorded '${provenance.contentHash}'). The record may have been edited without recomputing provenance.`,
    ),
  ];
}

/**
 * Checks the stored record against whatever the caller already knew about
 * this candidate from an earlier read (e.g. a listing pass before this
 * validation run was scheduled). Every field is optional in
 * `StructuralValidationContext` — an omitted expectation is simply never
 * checked. This is the same evidence-binding shape already used for
 * review records (`provenance/evidence.ts`'s `isReviewStillValid`),
 * reused here as a policy pattern: a caller's stale view of a candidate
 * must never be validated as if it were still current.
 */
export function checkStaleness(
  provenance: CandidateProvenance,
  context: StructuralValidationContext,
): readonly StructuralValidationIssue[] {
  const issues: StructuralValidationIssue[] = [];
  if (
    context.expectedContentHash !== undefined &&
    context.expectedContentHash !== provenance.contentHash
  ) {
    issues.push(
      issue(
        "stale_content_hash",
        "provenance.contentHash",
        `Caller expected contentHash '${context.expectedContentHash}' but the stored record now has '${provenance.contentHash}'.`,
      ),
    );
  }
  if (context.expectedRevision !== undefined && context.expectedRevision !== provenance.revision) {
    issues.push(
      issue(
        "stale_revision",
        "provenance.revision",
        `Caller expected revision ${context.expectedRevision} but the stored record now has ${provenance.revision}.`,
      ),
    );
  }
  if (
    context.expectedBlueprintId !== undefined &&
    context.expectedBlueprintId !== provenance.blueprintId
  ) {
    issues.push(
      issue(
        "stale_blueprint_binding",
        "provenance.blueprintId",
        `Caller expected blueprintId '${context.expectedBlueprintId}' but the stored record now has '${provenance.blueprintId}'.`,
      ),
    );
  }
  return issues;
}
