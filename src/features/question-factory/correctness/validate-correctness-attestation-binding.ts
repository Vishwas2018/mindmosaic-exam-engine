/**
 * Mission 3D third audit remediation. The single, shared authenticator for
 * a stored `cva-*` correctness-pass attestation's binding to a candidate's
 * *current* identity and to the exact `cv-*` correctness report it claims
 * to attest. Shared by `correctness/orchestrate-correctness-verification.ts`'s
 * own cached-replay path and `originality/validate-upstream-correctness-evidence.ts`'s
 * upstream check, mirroring `validation/validate-structural-evidence-binding.ts`'s
 * "one implementation, not a second near-identical copy" convention.
 *
 * A `cv-*` report's own recomputed `verificationFingerprint` proves only
 * that the report is *internally self-consistent* — any caller who can
 * read `correctness/evidence.ts` can construct a hand-fabricated report
 * whose fingerprint recomputes correctly. This function instead proves
 * that the *governed correctness workflow itself* minted a passing
 * verification for this exact candidate, at this exact revision/content/
 * blueprint/structural binding, bound to this exact report's fingerprint
 * — the attestation's `correctnessReportFingerprint` field is compared
 * against the report's live `verificationFingerprint` by the caller (this
 * function only proves the attestation record itself is genuine and
 * current; the caller supplies which report fingerprint it must match).
 *
 * Pure and side-effect-free: no I/O, no wall-clock read, never throws on a
 * malformed/corrupted stored record — every failure mode becomes a
 * structured `CorrectnessAttestationProblem` instead, collected rather
 * than short-circuited after the first.
 */
import { FACTORY_VERSIONS } from "../config";
import { computeCorrectnessAttestationFingerprint } from "./attestation";
import type { CorrectnessPassAttestation } from "./attestation";
import { CORRECTNESS_SCORER_VERSION, CORRECTNESS_VERIFIER_VERSION } from "./evidence";
import type { CorrectnessCapability } from "./types";

export type CorrectnessAttestationProblemKind =
  | "missing"
  | "malformed"
  | "wrong_candidate"
  | "stale_binding"
  | "outcome_mismatch"
  | "report_binding_mismatch"
  | "stale_version"
  | "tampered_fingerprint";

export interface CorrectnessAttestationProblem {
  readonly kind: CorrectnessAttestationProblemKind;
  readonly path: string;
  readonly message: string;
}

export interface CorrectnessAttestationBindingFacts {
  readonly candidateId: string;
  readonly candidateRevision: number;
  readonly candidateContentHash: string;
  /** The candidate's *current*, already-verified (non-empty) bound-blueprint hash — `undefined`/empty is never vacuously matched. */
  readonly blueprintHash?: string;
  /** The *authenticated* upstream structural report's own recomputed fingerprint — never a copied-in, untrusted value. */
  readonly structuralEvidenceFingerprint?: string;
  /** The exact outcome/capability the `cv-*` report being cross-checked currently declares — the attestation must have been minted for this same pass, never a different one. */
  readonly correctnessOutcome: "passed" | "review_required";
  readonly correctnessCapability: CorrectnessCapability;
  /** The `cv-*` report's own live `evidence.verificationFingerprint` — the attestation's `correctnessReportFingerprint` must equal this exactly. */
  readonly correctnessReportFingerprint: string;
}

export type CorrectnessAttestationBindingOutcome =
  | { readonly ok: true; readonly attestation: CorrectnessPassAttestation }
  | { readonly ok: false; readonly problems: readonly CorrectnessAttestationProblem[] };

/**
 * Defensive runtime shape guard: a corrupted/malformed stored attestation
 * must never throw when its fields are read below. `attestation` is
 * declared as the trusted `CorrectnessPassAttestation` type, but the value
 * actually read from the repository is `unknown` at runtime.
 */
function isWellShapedAttestation(attestation: CorrectnessPassAttestation): boolean {
  const record = attestation as unknown as Record<string, unknown>;
  return (
    typeof record.candidateId === "string" &&
    typeof record.candidateRevision === "number" &&
    typeof record.candidateContentHash === "string" &&
    typeof record.blueprintHash === "string" &&
    typeof record.structuralEvidenceFingerprint === "string" &&
    typeof record.correctnessOutcome === "string" &&
    typeof record.correctnessCapability === "string" &&
    typeof record.correctnessReportFingerprint === "string" &&
    typeof record.verifierVersion === "string" &&
    typeof record.scorerVersion === "string" &&
    typeof record.schemaVersion === "string" &&
    typeof record.taxonomyVersion === "string" &&
    typeof record.attestationFingerprint === "string"
  );
}

export function validateCorrectnessAttestationBinding(
  facts: CorrectnessAttestationBindingFacts,
  attestation: CorrectnessPassAttestation | undefined,
): CorrectnessAttestationBindingOutcome {
  if (attestation === undefined) {
    return {
      ok: false,
      problems: [
        {
          kind: "missing",
          path: "attestation",
          message: "No correctness-pass attestation exists for this candidate — a cv-* report's own self-consistency is never sufficient proof that the governed correctness workflow actually produced it.",
        },
      ],
    };
  }

  if (!isWellShapedAttestation(attestation)) {
    return {
      ok: false,
      problems: [
        {
          kind: "malformed",
          path: "attestation",
          message: "Stored correctness-pass attestation is malformed (missing or wrongly-typed fields); it cannot be trusted as proof of a genuine governed correctness pass.",
        },
      ],
    };
  }

  const problems: CorrectnessAttestationProblem[] = [];
  const blueprintHashVerified = typeof facts.blueprintHash === "string" && facts.blueprintHash.trim().length > 0;
  const structuralFingerprintVerified =
    typeof facts.structuralEvidenceFingerprint === "string" && facts.structuralEvidenceFingerprint.trim().length > 0;

  if (attestation.candidateId !== facts.candidateId) {
    problems.push({
      kind: "wrong_candidate",
      path: "attestation.candidateId",
      message: `Stored attestation belongs to candidate '${attestation.candidateId}', not '${facts.candidateId}'.`,
    });
  }
  if (attestation.candidateRevision !== facts.candidateRevision) {
    problems.push({
      kind: "stale_binding",
      path: "attestation.candidateRevision",
      message: `Attestation recorded revision ${attestation.candidateRevision}, but the candidate is now at revision ${facts.candidateRevision}.`,
    });
  }
  if (attestation.candidateContentHash !== facts.candidateContentHash) {
    problems.push({
      kind: "stale_binding",
      path: "attestation.candidateContentHash",
      message: "Attestation content hash no longer matches the candidate's current content hash.",
    });
  }
  if (!blueprintHashVerified || attestation.blueprintHash !== facts.blueprintHash) {
    problems.push({
      kind: "stale_binding",
      path: "attestation.blueprintHash",
      message: "Attestation blueprint hash does not strictly match the candidate's current verified blueprint hash (absent/empty hashes never match).",
    });
  }
  if (!structuralFingerprintVerified || attestation.structuralEvidenceFingerprint !== facts.structuralEvidenceFingerprint) {
    problems.push({
      kind: "stale_binding",
      path: "attestation.structuralEvidenceFingerprint",
      message: "Attestation structural-evidence fingerprint does not match the candidate's authenticated current structural report.",
    });
  }
  if (attestation.correctnessOutcome !== facts.correctnessOutcome || attestation.correctnessCapability !== facts.correctnessCapability) {
    problems.push({
      kind: "outcome_mismatch",
      path: "attestation.correctnessOutcome",
      message: `Attestation was minted for outcome '${attestation.correctnessOutcome}'/capability '${attestation.correctnessCapability}', which does not match the correctness report's current outcome '${facts.correctnessOutcome}'/capability '${facts.correctnessCapability}'.`,
    });
  }
  if (attestation.correctnessReportFingerprint !== facts.correctnessReportFingerprint) {
    problems.push({
      kind: "report_binding_mismatch",
      path: "attestation.correctnessReportFingerprint",
      message: "Attestation's bound correctness-report fingerprint does not match the stored cv-* report's own verification fingerprint — the report was not the one this attestation was minted for (fabricated, swapped, or tampered after minting).",
    });
  }
  if (
    attestation.verifierVersion !== CORRECTNESS_VERIFIER_VERSION ||
    attestation.scorerVersion !== CORRECTNESS_SCORER_VERSION ||
    attestation.schemaVersion !== FACTORY_VERSIONS.SCHEMA_VERSION ||
    attestation.taxonomyVersion !== FACTORY_VERSIONS.TAXONOMY_VERSION
  ) {
    problems.push({
      kind: "stale_version",
      path: "attestation",
      message: "Attestation was minted under a verifier/scorer/schema/taxonomy version combination that is no longer current.",
    });
  }

  const recomputedFingerprint = computeCorrectnessAttestationFingerprint({
    candidateId: attestation.candidateId,
    candidateRevision: attestation.candidateRevision,
    candidateContentHash: attestation.candidateContentHash,
    blueprintHash: attestation.blueprintHash,
    structuralEvidenceFingerprint: attestation.structuralEvidenceFingerprint,
    correctnessOutcome: attestation.correctnessOutcome,
    correctnessCapability: attestation.correctnessCapability,
    correctnessReportFingerprint: attestation.correctnessReportFingerprint,
    verifierVersion: attestation.verifierVersion,
    scorerVersion: attestation.scorerVersion,
    schemaVersion: attestation.schemaVersion,
    taxonomyVersion: attestation.taxonomyVersion,
  });
  if (recomputedFingerprint !== attestation.attestationFingerprint) {
    problems.push({
      kind: "tampered_fingerprint",
      path: "attestation.attestationFingerprint",
      message: "Recomputed attestation fingerprint does not match the stored value — the attestation's visible fields were edited after minting, or the fingerprint itself was tampered with.",
    });
  }

  return problems.length === 0 ? { ok: true, attestation } : { ok: false, problems };
}
