/**
 * Mission 3D audit remediation (P1-1). Validates that a stored
 * correctness-verification report is genuine, current, and legitimately
 * justifies a candidate's `semantic_review_passed` state — lifecycle
 * state alone is never sufficient proof that the correctness and
 * semantic-review gates actually ran. A candidate whose `state` field was
 * forged or corrupted directly (bypassing `orchestrateCorrectnessVerification`
 * and `attemptSemanticReviewTransition` entirely) must be refused here,
 * before the pure originality verifier ever runs.
 *
 * Mirrors `correctness/validate-cached-replay.ts`'s own binding-validation
 * shape exactly (a lifecycle state alone never authorises trust; every
 * fact is independently re-proved, every issue collected rather than
 * short-circuiting after the first) — reusing its exported
 * fingerprint/version primitives (`computeCorrectnessVerificationFingerprint`,
 * `CORRECTNESS_VERIFIER_VERSION`, `CORRECTNESS_SCORER_VERSION`) rather
 * than re-declaring them, and reusing `hasIndependentReviewerRecordAtThreshold`
 * (`review/`) verbatim for the one case correctness's own evidence cannot
 * settle alone: a `requires_independent_semantic_review` candidate's
 * independent-review evidence, which is `review/`'s own concern, not
 * correctness's.
 *
 * Pure and side-effect-free: no I/O, no wall-clock read, never throws on
 * a malformed/corrupted stored report — every failure mode becomes a
 * structured `OriginalityIssue` instead.
 */
import {
  computeCorrectnessVerificationFingerprint,
  CORRECTNESS_SCORER_VERSION,
  CORRECTNESS_VERIFIER_VERSION,
  type StoredCorrectnessVerificationReport,
} from "../correctness";
import { FACTORY_VERSIONS } from "../config";
import { hasIndependentReviewerRecordAtThreshold } from "../review";
import { parseCandidateProvenance } from "../validation";
import type { OriginalityIssue, QuestionFactoryCandidate } from "./types";

export interface UpstreamCorrectnessEvidenceContext {
  readonly blueprintHash?: string;
}

export type UpstreamCorrectnessEvidenceOutcome =
  | { readonly ok: true }
  | { readonly ok: false; readonly issues: readonly OriginalityIssue[] };

function issue(path: string, message: string): OriginalityIssue {
  return { code: "originality_upstream_evidence_invalid", path, message, severity: "error" };
}

/**
 * Defensive runtime shape guard: a corrupted/malformed stored report
 * (e.g. `result` or `result.evidence` missing, `null`, or the wrong
 * type) must never throw when its fields are read below. `correctnessReport`
 * is declared as the trusted `StoredCorrectnessVerificationReport` type,
 * but the value actually read from the repository is `unknown` at
 * runtime — this check verifies the runtime shape before any nested
 * field access is attempted.
 */
function isWellShapedCorrectnessReport(report: StoredCorrectnessVerificationReport): boolean {
  const result = (report as { readonly result?: unknown }).result;
  if (typeof result !== "object" || result === null) return false;
  const evidence = (result as { readonly evidence?: unknown }).evidence;
  return typeof evidence === "object" && evidence !== null;
}

export function validateUpstreamCorrectnessEvidence(
  candidate: QuestionFactoryCandidate,
  correctnessReport: StoredCorrectnessVerificationReport | undefined,
  context: UpstreamCorrectnessEvidenceContext,
): UpstreamCorrectnessEvidenceOutcome {
  const issues: OriginalityIssue[] = [];

  const currentBlueprintHash = context.blueprintHash;
  const blueprintHashVerified = typeof currentBlueprintHash === "string" && currentBlueprintHash.trim().length > 0;

  const provenanceOutcome = parseCandidateProvenance(candidate.provenance);
  if (!provenanceOutcome.ok) {
    issues.push(issue("candidate.provenance", "Candidate provenance no longer parses against its trust-boundary schema; upstream correctness evidence cannot be validated."));
    return { ok: false, issues };
  }
  const { revision: candidateRevision, contentHash: candidateContentHash, candidateId } = provenanceOutcome.data;
  if (candidateId !== candidate.candidateId) {
    issues.push(issue("candidate.provenance.candidateId", `Record is stored under candidateId '${candidate.candidateId}' but its provenance declares '${candidateId}'.`));
  }

  if (correctnessReport === undefined) {
    issues.push(issue("correctnessReport", "No correctness-verification report exists for this candidate; 'semantic_review_passed' cannot be trusted without it."));
    return { ok: false, issues };
  }

  if (!isWellShapedCorrectnessReport(correctnessReport)) {
    issues.push(issue("correctnessReport.result.evidence", "Stored correctness report is malformed (missing or non-object result/evidence); it cannot be trusted as proof this candidate legitimately passed correctness verification."));
    return { ok: false, issues };
  }

  if (correctnessReport.candidateId !== candidate.candidateId) {
    issues.push(issue("correctnessReport.candidateId", `Stored correctness report belongs to candidate '${correctnessReport.candidateId}', not '${candidate.candidateId}'.`));
  }

  const evidence = correctnessReport.result.evidence;
  if (evidence.candidateId !== candidate.candidateId) {
    issues.push(issue("correctnessReport.evidence.candidateId", `Correctness evidence belongs to candidate '${evidence.candidateId}', not '${candidate.candidateId}'.`));
  }

  // Exactly the two outcomes `correctness/orchestrate-correctness-verification.ts`
  // itself recognises as legitimately consistent with a candidate having
  // advanced past correctness — see that module's
  // `"passed_pending_semantic_review"` doc comment for the full rationale.
  const isDeterministicPass = correctnessReport.result.status === "passed" && evidence.outcome === "passed" && correctnessReport.result.capability === "deterministically_verifiable";
  const isPendingSemanticReview = correctnessReport.result.status === "review_required" && evidence.outcome === "review_required" && correctnessReport.result.capability === "requires_independent_semantic_review";
  if (!isDeterministicPass && !isPendingSemanticReview) {
    issues.push(
      issue(
        "correctnessReport.result.status",
        `Stored correctness report outcome is '${correctnessReport.result.status}' (capability '${correctnessReport.result.capability}'), which does not legitimately justify 'semantic_review_passed'.`,
      ),
    );
  }

  if (evidence.candidateRevision !== candidateRevision) {
    issues.push(issue("correctnessReport.evidence.candidateRevision", `Correctness evidence recorded revision ${evidence.candidateRevision}, but the candidate is now at revision ${candidateRevision}.`));
  }
  if (evidence.candidateContentHash !== candidateContentHash) {
    issues.push(issue("correctnessReport.evidence.candidateContentHash", "Correctness evidence content hash no longer matches the candidate's current content hash."));
  }
  // Blueprint binding is optional on correctness evidence itself (an
  // unblueprinted candidate can legitimately reach `deterministically_verifiable`
  // — see Mission 3C follow-up #4); only cross-checked when the evidence
  // actually declares one, so a candidate that legitimately never had a
  // blueprint at any point in its lineage is never vacuously rejected.
  if (evidence.blueprintHash !== undefined && (!blueprintHashVerified || evidence.blueprintHash !== currentBlueprintHash)) {
    issues.push(issue("correctnessReport.evidence.blueprintHash", "Correctness evidence blueprint hash does not strictly match the candidate's current verified blueprint hash."));
  }
  if (evidence.schemaVersion !== FACTORY_VERSIONS.SCHEMA_VERSION) {
    issues.push(issue("correctnessReport.evidence.schemaVersion", "Correctness evidence was produced under a schema version that is no longer current."));
  }
  if (evidence.taxonomyVersion !== FACTORY_VERSIONS.TAXONOMY_VERSION) {
    issues.push(issue("correctnessReport.evidence.taxonomyVersion", "Correctness evidence was produced under a taxonomy version that is no longer current."));
  }
  if (evidence.verifierVersion !== CORRECTNESS_VERIFIER_VERSION) {
    issues.push(issue("correctnessReport.evidence.verifierVersion", "Correctness evidence was produced under a verifier version that is no longer current."));
  }
  if (evidence.scorerVersion !== CORRECTNESS_SCORER_VERSION) {
    issues.push(issue("correctnessReport.evidence.scorerVersion", "Correctness evidence was produced under a scoring-engine integration version that is no longer current."));
  }

  const recomputedFingerprint = computeCorrectnessVerificationFingerprint({
    candidateId: evidence.candidateId,
    candidateRevision: evidence.candidateRevision,
    candidateContentHash: evidence.candidateContentHash,
    blueprintHash: evidence.blueprintHash,
    structuralEvidenceFingerprint: evidence.structuralEvidenceFingerprint,
    verifierVersion: evidence.verifierVersion,
    scorerVersion: evidence.scorerVersion,
    schemaVersion: evidence.schemaVersion,
    taxonomyVersion: evidence.taxonomyVersion,
    capability: evidence.capability,
    deterministicCategory: evidence.deterministicCategory,
    declaredAnswer: evidence.declaredAnswer,
    derivedAnswer: evidence.derivedAnswer,
    declaredScoring: evidence.declaredScoring,
    derivedScoring: evidence.derivedScoring,
    checksPerformed: evidence.checksPerformed,
    issueSummary: evidence.issueSummary,
    outcome: evidence.outcome,
  });
  if (recomputedFingerprint !== evidence.verificationFingerprint) {
    issues.push(
      issue(
        "correctnessReport.evidence.verificationFingerprint",
        "Recomputed correctness-verification fingerprint does not match the stored value — the report's visible fields were edited without a corresponding fingerprint update, or the fingerprint itself was tampered with.",
      ),
    );
  }

  if (isPendingSemanticReview) {
    const reviewEvidenceAvailable = hasIndependentReviewerRecordAtThreshold(provenanceOutcome.data.generatorAdapter.identity, provenanceOutcome.data.reviewRecords, {
      candidateId: candidate.candidateId,
      contentHash: candidateContentHash,
      blueprintHash: currentBlueprintHash ?? "",
      revision: candidateRevision,
    });
    if (!reviewEvidenceAvailable) {
      issues.push(
        issue(
          "candidate.provenance.reviewRecords",
          "Candidate's content requires independent semantic-review evidence, but no durable, sufficient, independent reviewer record exists at the production-confidence threshold.",
        ),
      );
    }
  }

  return issues.length === 0 ? { ok: true } : { ok: false, issues };
}
