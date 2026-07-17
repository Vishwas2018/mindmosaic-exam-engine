/**
 * Mission 3D second audit remediation. The single, shared authenticator
 * for a stored structural-validation report's binding to a candidate's
 * *current* identity — extracted from `correctness/validate-cached-replay.ts`'s
 * own inline structural-report block so every gate that needs to
 * authenticate an upstream structural report (correctness's own
 * cached-replay path, originality's upstream-evidence check, and any
 * future caller) shares one implementation rather than growing a second or
 * third near-identical copy.
 *
 * A lifecycle state, or a bare fingerprint string copied into a downstream
 * evidence record, is never sufficient proof on its own that structural
 * validation actually ran and passed for the candidate's *current*
 * content — this function independently re-derives that proof: report
 * existence, candidate ownership (both the report wrapper and its nested
 * evidence), a genuinely passing outcome, current revision/content-hash/
 * blueprint-hash binding, current schema/taxonomy/validator versions, and
 * a recomputed (never merely trusted) `validationFingerprint`.
 *
 * Pure and side-effect-free: no I/O, no wall-clock read, never throws on a
 * malformed/corrupted stored report — every failure mode becomes a
 * structured `StructuralEvidenceProblem` instead, collected rather than
 * short-circuited after the first (except when the report cannot be
 * safely read at all, in which case no further field comparison is
 * possible).
 */
import { FACTORY_VERSIONS } from "../config";
import { computeStructuralValidationFingerprint, STRUCTURAL_VALIDATOR_VERSION } from "./evidence";
import type { StoredStructuralValidationReport } from "./orchestrate-structural-validation";
import type { StructuralValidationEvidence } from "./types";

export type StructuralEvidenceProblemKind =
  | "missing"
  | "malformed"
  | "wrong_candidate"
  | "not_passed"
  | "stale_binding"
  | "stale_version"
  | "tampered_fingerprint";

export interface StructuralEvidenceProblem {
  readonly kind: StructuralEvidenceProblemKind;
  readonly path: string;
  readonly message: string;
}

export interface StructuralEvidenceBindingFacts {
  readonly candidateId: string;
  readonly candidateRevision: number;
  readonly candidateContentHash: string;
  /**
   * The candidate's *current*, already-verified (non-empty) bound-blueprint
   * hash. `undefined`/empty means "not verified" — never vacuously matched
   * against an equally-absent stored value, mirroring every other
   * blueprint-binding check in this codebase.
   */
  readonly blueprintHash?: string;
}

export type StructuralEvidenceBindingOutcome =
  | { readonly ok: true; readonly evidence: StructuralValidationEvidence }
  | {
      readonly ok: false;
      readonly problems: readonly StructuralEvidenceProblem[];
      /**
       * The report's own raw evidence, present whenever the report was at
       * least well-shaped enough to read (i.e. every failure mode except
       * `missing`/`malformed`) — so a caller that needs to cross-check a
       * *reference* to this report's fingerprint (e.g. another report's
       * claimed `structuralEvidenceFingerprint`) can still do so even when
       * this report itself fails other binding checks, exactly as if it
       * had read the field directly. Never used to authorise trust on its
       * own — `ok: false` still means the binding as a whole is refused.
       */
      readonly evidence?: StructuralValidationEvidence;
    };

/**
 * Defensive runtime shape guard: a corrupted/malformed stored report (e.g.
 * `result` or `result.evidence` missing, `null`, or the wrong type) must
 * never throw when its fields are read below. `report` is declared as the
 * trusted `StoredStructuralValidationReport` type, but the value actually
 * read from the repository is `unknown` at runtime — this check verifies
 * the runtime shape before any nested field access is attempted.
 */
function isWellShapedStructuralReport(report: StoredStructuralValidationReport): boolean {
  const result = (report as { readonly result?: unknown }).result;
  if (typeof result !== "object" || result === null) return false;
  const evidence = (result as { readonly evidence?: unknown }).evidence;
  return typeof evidence === "object" && evidence !== null;
}

export function validateStructuralEvidenceBinding(
  facts: StructuralEvidenceBindingFacts,
  structuralReport: StoredStructuralValidationReport | undefined,
): StructuralEvidenceBindingOutcome {
  if (structuralReport === undefined) {
    return {
      ok: false,
      problems: [{ kind: "missing", path: "structuralReport", message: "No structural-validation report was supplied for this candidate." }],
    };
  }

  if (!isWellShapedStructuralReport(structuralReport)) {
    return {
      ok: false,
      problems: [
        {
          kind: "malformed",
          path: "structuralReport.result.evidence",
          message:
            "Stored structural report is malformed (missing or non-object result/evidence); it cannot be trusted as proof this candidate legitimately passed structural validation.",
        },
      ],
    };
  }

  const problems: StructuralEvidenceProblem[] = [];
  const evidence = structuralReport.result.evidence;
  const blueprintHashVerified = typeof facts.blueprintHash === "string" && facts.blueprintHash.trim().length > 0;

  if (structuralReport.candidateId !== facts.candidateId) {
    problems.push({
      kind: "wrong_candidate",
      path: "structuralReport.candidateId",
      message: `Stored structural report belongs to candidate '${structuralReport.candidateId}', not '${facts.candidateId}'.`,
    });
  }
  if (evidence.candidateId !== facts.candidateId) {
    problems.push({
      kind: "wrong_candidate",
      path: "structuralReport.evidence.candidateId",
      message: `Structural evidence belongs to candidate '${evidence.candidateId}', not '${facts.candidateId}'.`,
    });
  }
  if (structuralReport.result.status !== "passed" || evidence.outcome !== "passed") {
    problems.push({
      kind: "not_passed",
      path: "structuralReport.result.status",
      message: `Structural report outcome is '${structuralReport.result.status}', not 'passed' — a passed downstream candidate can never rest on a non-passing structural report.`,
    });
  }
  if (evidence.candidateRevision !== facts.candidateRevision) {
    problems.push({
      kind: "stale_binding",
      path: "structuralReport.evidence.candidateRevision",
      message: `Structural evidence recorded revision ${evidence.candidateRevision}, but the candidate is now at revision ${facts.candidateRevision}.`,
    });
  }
  if (evidence.candidateContentHash !== facts.candidateContentHash) {
    problems.push({
      kind: "stale_binding",
      path: "structuralReport.evidence.candidateContentHash",
      message: "Structural evidence content hash no longer matches the candidate's current content hash.",
    });
  }
  if (!blueprintHashVerified || evidence.blueprintHash !== facts.blueprintHash) {
    problems.push({
      kind: "stale_binding",
      path: "structuralReport.evidence.blueprintHash",
      message: "Structural evidence blueprint hash does not strictly match the candidate's current verified blueprint hash (absent/empty hashes never match).",
    });
  }
  if (evidence.schemaVersion !== FACTORY_VERSIONS.SCHEMA_VERSION) {
    problems.push({
      kind: "stale_version",
      path: "structuralReport.evidence.schemaVersion",
      message: "Structural evidence was produced under a schema version that is no longer current.",
    });
  }
  if (evidence.taxonomyVersion !== FACTORY_VERSIONS.TAXONOMY_VERSION) {
    problems.push({
      kind: "stale_version",
      path: "structuralReport.evidence.taxonomyVersion",
      message: "Structural evidence was produced under a taxonomy version that is no longer current.",
    });
  }
  if (evidence.validatorVersion !== STRUCTURAL_VALIDATOR_VERSION) {
    problems.push({
      kind: "stale_version",
      path: "structuralReport.evidence.validatorVersion",
      message: "Structural evidence was produced under a validator version that is no longer current.",
    });
  }

  const recomputedFingerprint = computeStructuralValidationFingerprint({
    candidateId: evidence.candidateId,
    candidateRevision: evidence.candidateRevision,
    candidateContentHash: evidence.candidateContentHash,
    blueprintHash: evidence.blueprintHash,
    validatorVersion: evidence.validatorVersion,
    schemaVersion: evidence.schemaVersion,
    taxonomyVersion: evidence.taxonomyVersion,
    checksPerformed: evidence.checksPerformed,
    issueSummary: evidence.issueSummary,
    outcome: evidence.outcome,
  });
  if (recomputedFingerprint !== evidence.validationFingerprint) {
    problems.push({
      kind: "tampered_fingerprint",
      path: "structuralReport.evidence.validationFingerprint",
      message:
        "Recomputed structural-validation fingerprint does not match the stored value — the report's visible fields were edited without a corresponding fingerprint update, or the fingerprint itself was tampered with.",
    });
  }

  return problems.length === 0 ? { ok: true, evidence } : { ok: false, problems, evidence };
}
