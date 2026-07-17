/**
 * Binds a cached `correctness_check_passed` replay to the evidence it
 * claims to rest on. A lifecycle state alone (`candidate.state ===
 * "correctness_check_passed"`) must never authorise returning a stored
 * correctness report as-is — this module independently re-proves every
 * fact that report's validity depends on: the candidate's own current
 * identity/content/blueprint binding, the upstream structural report's
 * validity (including a *recomputed*, not merely trusted, structural
 * fingerprint), the correctness report's own binding to that exact
 * candidate and structural report, its own recomputed fingerprint, and
 * that its stored outcome is actually consistent with a passed candidate.
 *
 * Pure and side-effect-free: no I/O, no wall-clock read, no repository
 * access — every report this function reasons about is supplied by the
 * caller, which already read them as part of the same orchestration call.
 * Never throws on malformed input; every failure mode becomes a
 * structured `CorrectnessVerificationIssue` instead.
 */
import { FACTORY_VERSIONS } from "../config";
import {
  parseCandidateProvenance,
  validateStructuralEvidenceBinding,
  type StoredStructuralValidationReport,
  type StructuralEvidenceProblem,
  type StructuralEvidenceProblemKind,
} from "../validation";
import { computeCorrectnessVerificationFingerprint, CORRECTNESS_SCORER_VERSION, CORRECTNESS_VERIFIER_VERSION } from "./evidence";
import type { StoredCorrectnessVerificationReport } from "./orchestrate-correctness-verification";
import type { CorrectnessVerificationIssue, QuestionFactoryCandidate } from "./types";

export interface CachedReplayContext {
  /**
   * The canonical hash of the candidate's *current* bound blueprint, as
   * resolved fail-closed by the orchestration layer (Mission 3B blueprint
   * remediation: `shared/bound-blueprint.ts`'s `resolveBoundBlueprint`)
   * immediately before this call. Always a non-empty string on every
   * legitimate path — the orchestrator refuses to reach this validator at
   * all when the bound blueprint cannot be resolved and verified. This
   * validator still independently rejects (`blueprint_binding_unresolved`)
   * if the value is `undefined`, `null`-ish, or empty, so a future caller
   * that skips the resolver can never re-open the
   * `undefined === undefined` fail-open hole this field's optionality
   * used to permit.
   */
  readonly blueprintHash?: string;
}

export type CachedReplayValidationOutcome =
  | { readonly ok: true }
  | { readonly ok: false; readonly issues: readonly CorrectnessVerificationIssue[] };

function issue(path: string, message: string): CorrectnessVerificationIssue {
  return { code: "cached_replay_integrity_failure", path, message, severity: "error" };
}

function structuralProblemCode(
  kind: StructuralEvidenceProblemKind,
): "missing_structural_evidence" | "stale_structural_evidence" | "structural_evidence_mismatch" {
  if (kind === "missing") return "missing_structural_evidence";
  if (kind === "not_passed" || kind === "stale_version") return "stale_structural_evidence";
  // "malformed", "wrong_candidate", "stale_binding", "tampered_fingerprint".
  return "structural_evidence_mismatch";
}

function mapStructuralProblems(problems: readonly StructuralEvidenceProblem[]): readonly CorrectnessVerificationIssue[] {
  return problems.map((problem) => ({ code: structuralProblemCode(problem.kind), path: problem.path, message: problem.message, severity: "error" as const }));
}

/**
 * Validates that a stored `correctness_check_passed` outcome for
 * `candidate` may still be trusted and replayed as-is, without
 * re-deriving anything. Returns every binding failure found (never just
 * the first), so a caller — or a test — can see the full picture rather
 * than one issue at a time across repeated calls.
 */
export function validateCachedCorrectnessReplay(
  candidate: QuestionFactoryCandidate,
  structuralReport: StoredStructuralValidationReport | undefined,
  correctnessReport: StoredCorrectnessVerificationReport | undefined,
  context: CachedReplayContext,
): CachedReplayValidationOutcome {
  const issues: CorrectnessVerificationIssue[] = [];

  if (candidate.state !== "correctness_check_passed") {
    issues.push(issue("candidate.state", `Candidate lifecycle state is '${candidate.state}', not 'correctness_check_passed'.`));
  }

  // Mission 3B blueprint remediation: the current bound-blueprint hash must
  // be a verified, non-empty value before any binding comparison below is
  // meaningful. `undefined`, `null`-ish and empty/whitespace values are
  // rejected outright — never compared — so two absent hashes can never
  // "match" each other (the original fail-open hole: a candidate whose
  // blueprint had been deleted recomputed `undefined`, its stale evidence
  // also carried no hash, and `undefined === undefined` silently
  // authorised the replay).
  const currentBlueprintHash = context.blueprintHash;
  const blueprintHashVerified = typeof currentBlueprintHash === "string" && currentBlueprintHash.trim().length > 0;
  if (!blueprintHashVerified) {
    issues.push({
      code: "blueprint_binding_unresolved",
      path: "context.blueprintHash",
      message:
        "No verified bound-blueprint hash was supplied for this cached-replay check — the candidate's current blueprint binding cannot be confirmed, so the cached report must not be replayed.",
      severity: "error",
    });
  }

  const provenanceOutcome = parseCandidateProvenance(candidate.provenance);
  if (!provenanceOutcome.ok) {
    issues.push(
      issue("candidate.provenance", "Candidate provenance no longer parses against the schema structural validation attested."),
    );
    // Nothing further can be safely cross-checked without a parsed
    // provenance (revision/contentHash are both sourced from it) — return
    // immediately rather than comparing against garbage.
    return { ok: false, issues };
  }
  const { revision: candidateRevision, contentHash: candidateContentHash, candidateId } = provenanceOutcome.data;
  if (candidateId !== candidate.candidateId) {
    issues.push(
      issue(
        "candidate.provenance.candidateId",
        `Record is stored under candidateId '${candidate.candidateId}' but its provenance declares '${candidateId}'.`,
      ),
    );
  }

  // --- Structural report -------------------------------------------------
  // Mission 3D second audit remediation: extracted into a shared helper
  // (`validation/validate-structural-evidence-binding.ts`) so this gate and
  // originality's own upstream-evidence check authenticate an upstream
  // structural report identically, rather than maintaining two
  // near-duplicate implementations.
  const structuralBinding = validateStructuralEvidenceBinding(
    { candidateId: candidate.candidateId, candidateRevision, candidateContentHash, blueprintHash: currentBlueprintHash },
    structuralReport,
  );
  if (!structuralBinding.ok) {
    issues.push(...mapStructuralProblems(structuralBinding.problems));
  }
  // Read whenever the report was at least well-shaped (present even on a
  // binding failure — see the shared helper's `evidence` doc comment),
  // mirroring this function's own pre-extraction behaviour of comparing
  // against the report's raw fingerprint regardless of whether its other
  // binding checks passed.
  const authenticatedStructuralFingerprint = structuralBinding.evidence?.validationFingerprint;

  // --- Correctness report --------------------------------------------------
  if (correctnessReport === undefined) {
    issues.push(issue("correctnessReport", "No correctness-verification report exists for a candidate stored as 'correctness_check_passed'."));
    return { ok: false, issues };
  }

  const evidence = correctnessReport.result.evidence;

  if (correctnessReport.candidateId !== candidate.candidateId) {
    issues.push(
      issue(
        "correctnessReport.candidateId",
        `Stored correctness report belongs to candidate '${correctnessReport.candidateId}', not '${candidate.candidateId}'.`,
      ),
    );
  }
  if (evidence.candidateId !== candidate.candidateId) {
    issues.push(
      issue(
        "correctnessReport.evidence.candidateId",
        `Correctness evidence belongs to candidate '${evidence.candidateId}', not '${candidate.candidateId}'.`,
      ),
    );
  }
  // Two, and only two, stored outcomes are legitimately consistent with a
  // candidate stamped `correctness_check_passed`: a machine-proven pass
  // (`status: "passed"`, capability `deterministically_verifiable`), or a
  // no-contradiction-found-pending-semantic-review outcome (`status:
  // "review_required"`, capability `requires_independent_semantic_review`
  // — see `CorrectnessOrchestrationOutcome`'s `"passed_pending_semantic_review"`
  // doc comment in `orchestrate-correctness-verification.ts` for why this
  // is a real, non-error lifecycle-advancing outcome, not a defect).
  // `evidence.outcome` must agree with `result.status` in both cases —
  // never `"passed"` when the result is only `"review_required"`.
  const isDeterministicPass =
    correctnessReport.result.status === "passed" &&
    evidence.outcome === "passed" &&
    correctnessReport.result.capability === "deterministically_verifiable";
  const isPendingSemanticReview =
    correctnessReport.result.status === "review_required" &&
    evidence.outcome === "review_required" &&
    correctnessReport.result.capability === "requires_independent_semantic_review";
  if (!isDeterministicPass && !isPendingSemanticReview) {
    issues.push(
      issue(
        "correctnessReport.result.status",
        `Stored correctness report outcome is '${correctnessReport.result.status}' (capability '${correctnessReport.result.capability}'), inconsistent with a candidate stored as 'correctness_check_passed'.`,
      ),
    );
  }
  if (evidence.candidateRevision !== candidateRevision) {
    issues.push(
      issue(
        "correctnessReport.evidence.candidateRevision",
        `Correctness evidence recorded revision ${evidence.candidateRevision}, but the candidate is now at revision ${candidateRevision}.`,
      ),
    );
  }
  if (evidence.candidateContentHash !== candidateContentHash) {
    issues.push(
      issue(
        "correctnessReport.evidence.candidateContentHash",
        "Correctness evidence content hash no longer matches the candidate's current content hash.",
      ),
    );
  }
  if (!blueprintHashVerified || evidence.blueprintHash !== currentBlueprintHash) {
    issues.push(
      issue(
        "correctnessReport.evidence.blueprintHash",
        "Correctness evidence blueprint hash does not strictly match the candidate's current verified blueprint hash (absent/empty hashes never match).",
      ),
    );
  }
  if (evidence.schemaVersion !== FACTORY_VERSIONS.SCHEMA_VERSION) {
    issues.push(issue("correctnessReport.evidence.schemaVersion", "Correctness evidence was produced under a schema version that is no longer current."));
  }
  if (evidence.taxonomyVersion !== FACTORY_VERSIONS.TAXONOMY_VERSION) {
    issues.push(
      issue("correctnessReport.evidence.taxonomyVersion", "Correctness evidence was produced under a taxonomy version that is no longer current."),
    );
  }
  if (evidence.verifierVersion !== CORRECTNESS_VERIFIER_VERSION) {
    issues.push(issue("correctnessReport.evidence.verifierVersion", "Correctness evidence was produced under a verifier version that is no longer current."));
  }
  if (evidence.scorerVersion !== CORRECTNESS_SCORER_VERSION) {
    issues.push(issue("correctnessReport.evidence.scorerVersion", "Correctness evidence was produced under a scoring-engine integration version that is no longer current."));
  }
  if (authenticatedStructuralFingerprint !== undefined && evidence.structuralEvidenceFingerprint !== authenticatedStructuralFingerprint) {
    issues.push(
      issue(
        "correctnessReport.evidence.structuralEvidenceFingerprint",
        "Correctness evidence's referenced structural fingerprint no longer matches the current structural report's fingerprint.",
      ),
    );
  }

  const recomputedCorrectnessFingerprint = computeCorrectnessVerificationFingerprint({
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
  if (recomputedCorrectnessFingerprint !== evidence.verificationFingerprint) {
    issues.push(
      issue(
        "correctnessReport.evidence.verificationFingerprint",
        "Recomputed correctness-verification fingerprint does not match the stored value — the report's visible fields were edited without a corresponding fingerprint update, or the fingerprint itself was tampered with.",
      ),
    );
  }

  return issues.length === 0 ? { ok: true } : { ok: false, issues };
}
