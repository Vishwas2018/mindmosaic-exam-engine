import { createHash } from "node:crypto";

import { FACTORY_VERSIONS } from "../config";
import { hashJson } from "../provenance";
import { CORRECTNESS_SCORER_VERSION, CORRECTNESS_VERIFIER_VERSION } from "./evidence";
import type { CorrectnessCapability } from "./types";

/**
 * Mission 3D third audit remediation. The governed correctness workflow's
 * own append-only attestation of a genuine correctness-pass run —
 * distinct from, and additional to, the `cv-*` correctness-verification
 * report itself. The report records *what the verifier found*; the
 * attestation records *that the governed workflow itself minted this
 * exact report*, canonically bound to the report's own recomputed
 * fingerprint. A `cv-*` report's `verificationFingerprint` is a pure,
 * publicly-documented function of the report's own visible fields — any
 * caller who can read `evidence.ts` can recompute a self-consistent
 * fingerprint for hand-fabricated content, which is exactly what let the
 * second Mission 3D audit's "directly fabricated correctness report" and
 * "copied authentic correctness fields without attestation" scenarios
 * through undetected. The attestation closes that gap by being minted
 * exactly once, only inside `orchestrateCorrectnessVerification`'s own
 * pass path (`orchestrate-correctness-verification.ts`), at the moment a
 * *fresh* verification run genuinely produces a passing result — never
 * re-derivable from a report's content alone, and never written by any
 * other caller in this codebase.
 *
 * Stored under a distinct id namespace (`cva-`) in the same `reports`
 * compartment every other gate's evidence already lives in, written only
 * via `create()` (never `update()`) — the same append-only discipline
 * `writeReportIfAbsent` already establishes: a matching
 * `attestationFingerprint` on an existing record is a safe replay no-op,
 * a differing one is a genuine conflict, and there is no code path in this
 * module (or anywhere else) that overwrites an existing attestation.
 */
export interface CorrectnessPassAttestation {
  readonly candidateId: string;
  readonly candidateRevision: number;
  readonly candidateContentHash: string;
  /** Unconditionally required — `candidateProvenanceSchema` makes `blueprintId` mandatory, so every attested candidate has a bound blueprint. */
  readonly blueprintHash: string;
  /** The authenticated upstream structural report's own recomputed `validationFingerprint` — never a copied-in, untrusted value. */
  readonly structuralEvidenceFingerprint: string;
  /** Mirrors the exact two outcomes `orchestrate-correctness-verification.ts` treats as a legitimate pass — see its `"passed_pending_semantic_review"` doc comment. */
  readonly correctnessOutcome: "passed" | "review_required";
  readonly correctnessCapability: Extract<CorrectnessCapability, "deterministically_verifiable" | "requires_independent_semantic_review">;
  /** The exact `cv-*` report's `evidence.verificationFingerprint` this attestation is bound to — the canonical "report is exactly bound to attestation" link. */
  readonly correctnessReportFingerprint: string;
  readonly verifierVersion: string;
  readonly scorerVersion: string;
  readonly schemaVersion: string;
  readonly taxonomyVersion: string;
  /** Observational wall-clock read, owned by the orchestration layer — deliberately excluded from `attestationFingerprint`, mirroring every other evidence record's `verifiedAt`/`validatedAt` exclusion. */
  readonly attestedAt: string;
  readonly attestationFingerprint: string;
}

/** Every stable fact `attestationFingerprint` is hashed over — never `attestedAt`. */
export interface CorrectnessAttestationFingerprintFacts {
  readonly candidateId: string;
  readonly candidateRevision: number;
  readonly candidateContentHash: string;
  readonly blueprintHash: string;
  readonly structuralEvidenceFingerprint: string;
  readonly correctnessOutcome: "passed" | "review_required";
  readonly correctnessCapability: Extract<CorrectnessCapability, "deterministically_verifiable" | "requires_independent_semantic_review">;
  readonly correctnessReportFingerprint: string;
  readonly verifierVersion: string;
  readonly scorerVersion: string;
  readonly schemaVersion: string;
  readonly taxonomyVersion: string;
}

/** The single authoritative attestation-fingerprint algorithm — every caller that builds or recomputes `attestationFingerprint` must go through this function. */
export function computeCorrectnessAttestationFingerprint(facts: CorrectnessAttestationFingerprintFacts): string {
  return hashJson({
    candidateId: facts.candidateId,
    candidateRevision: facts.candidateRevision,
    candidateContentHash: facts.candidateContentHash,
    blueprintHash: facts.blueprintHash,
    structuralEvidenceFingerprint: facts.structuralEvidenceFingerprint,
    correctnessOutcome: facts.correctnessOutcome,
    correctnessCapability: facts.correctnessCapability,
    correctnessReportFingerprint: facts.correctnessReportFingerprint,
    verifierVersion: facts.verifierVersion,
    scorerVersion: facts.scorerVersion,
    schemaVersion: facts.schemaVersion,
    taxonomyVersion: facts.taxonomyVersion,
  });
}

export interface CorrectnessAttestationInput {
  readonly candidateId: string;
  readonly candidateRevision: number;
  readonly candidateContentHash: string;
  readonly blueprintHash: string;
  readonly structuralEvidenceFingerprint: string;
  readonly correctnessOutcome: "passed" | "review_required";
  readonly correctnessCapability: Extract<CorrectnessCapability, "deterministically_verifiable" | "requires_independent_semantic_review">;
  readonly correctnessReportFingerprint: string;
  readonly attestedAt: string;
}

/**
 * Builds a fresh attestation record. Callers must supply
 * `correctnessReportFingerprint` as the exact `verificationFingerprint`
 * the just-written `cv-*` report carries — never recomputed here, so the
 * two can never silently disagree at mint time.
 */
export function buildCorrectnessAttestation(input: CorrectnessAttestationInput): CorrectnessPassAttestation {
  const attestationFingerprint = computeCorrectnessAttestationFingerprint({
    candidateId: input.candidateId,
    candidateRevision: input.candidateRevision,
    candidateContentHash: input.candidateContentHash,
    blueprintHash: input.blueprintHash,
    structuralEvidenceFingerprint: input.structuralEvidenceFingerprint,
    correctnessOutcome: input.correctnessOutcome,
    correctnessCapability: input.correctnessCapability,
    correctnessReportFingerprint: input.correctnessReportFingerprint,
    verifierVersion: CORRECTNESS_VERIFIER_VERSION,
    scorerVersion: CORRECTNESS_SCORER_VERSION,
    schemaVersion: FACTORY_VERSIONS.SCHEMA_VERSION,
    taxonomyVersion: FACTORY_VERSIONS.TAXONOMY_VERSION,
  });
  return {
    candidateId: input.candidateId,
    candidateRevision: input.candidateRevision,
    candidateContentHash: input.candidateContentHash,
    blueprintHash: input.blueprintHash,
    structuralEvidenceFingerprint: input.structuralEvidenceFingerprint,
    correctnessOutcome: input.correctnessOutcome,
    correctnessCapability: input.correctnessCapability,
    correctnessReportFingerprint: input.correctnessReportFingerprint,
    verifierVersion: CORRECTNESS_VERIFIER_VERSION,
    scorerVersion: CORRECTNESS_SCORER_VERSION,
    schemaVersion: FACTORY_VERSIONS.SCHEMA_VERSION,
    taxonomyVersion: FACTORY_VERSIONS.TAXONOMY_VERSION,
    attestedAt: input.attestedAt,
    attestationFingerprint,
  };
}

/**
 * Distinct id namespace from every other gate's report key (`sv-`, `cv-`,
 * `og-`, `sr-`) so attestations can never collide in the shared `reports`
 * compartment.
 */
export function buildCorrectnessAttestationId(candidateId: string): string {
  const digest = createHash("sha256").update(candidateId, "utf8").digest("hex").slice(0, 40);
  return `cva-${digest}`;
}
