/**
 * Mission 3D audit remediation (P1-1), hardened by the Mission 3D second
 * and third remediations. Validates that a stored correctness-verification
 * report — and, since the third remediation, the governed correctness-pass
 * attestation and semantic-completion evidence it depends on — are
 * genuine, current, and legitimately justify a candidate's
 * `semantic_review_passed` state. Lifecycle state alone is never
 * sufficient proof that the structural, correctness, and semantic-review
 * gates actually ran. A candidate whose `state` field was forged or
 * corrupted directly (bypassing `orchestrateStructuralValidation`,
 * `orchestrateCorrectnessVerification`, and `attemptSemanticReviewTransition`
 * entirely) must be refused here, before the pure originality verifier
 * ever runs.
 *
 * Mirrors `correctness/validate-cached-replay.ts`'s own binding-validation
 * shape exactly (a lifecycle state alone never authorises trust; every
 * fact is independently re-proved, every issue collected rather than
 * short-circuiting after the first) — reusing its exported
 * fingerprint/version primitives (`computeCorrectnessVerificationFingerprint`,
 * `CORRECTNESS_VERIFIER_VERSION`, `CORRECTNESS_SCORER_VERSION`) rather
 * than re-declaring them.
 *
 * Second remediation (audit findings #1/#2): the correctness gate's own
 * `validateCachedCorrectnessReplay` already treats a resolved current
 * blueprint hash as unconditionally required and already authenticates
 * the *referenced* structural-validation report rather than trusting its
 * copied-in fingerprint — this validator previously did neither. It now
 * shares `validation/validate-structural-evidence-binding.ts` with that
 * gate (the same authentication, not a second implementation) and applies
 * the same unconditional blueprint-hash binding rule: `candidateProvenanceSchema`
 * makes `blueprintId` a mandatory field, so every candidate that still
 * parses has a bound blueprint — there is no supported "legitimately
 * unblueprinted" lifecycle case for a candidate that has already reached
 * `semantic_review_passed`, and none is carved out here.
 *
 * Third remediation: a `cv-*` correctness report's own recomputed
 * `verificationFingerprint` proves only that the report is internally
 * self-consistent — any caller who can read `correctness/evidence.ts` can
 * hand-fabricate a report with a matching fingerprint. This validator now
 * additionally requires a genuine, exactly-bound `cva-*` correctness-pass
 * attestation (`validateCorrectnessAttestationBinding`, shared verbatim
 * with `correctness/orchestrate-correctness-verification.ts`'s own cached-
 * replay re-check) before trusting the report at all, and a genuine `sr-*`
 * semantic-completion evidence record (`validateSemanticCompletionEvidence`,
 * shared verbatim with... — the sole producer, `attemptSemanticReviewTransition`)
 * before trusting that semantic review itself legitimately completed,
 * covering the previously entirely-unevidenced deterministic-skip path as
 * well as the independent-review path. This subsumes the second
 * remediation's inline `hasIndependentReviewerRecordAtThreshold` scan
 * (kept as one shared validator rather than two near-identical
 * implementations — see `validateSemanticCompletionEvidence`'s own doc
 * comment).
 *
 * Pure and side-effect-free: no I/O, no wall-clock read, never throws on
 * a malformed/corrupted stored report — every failure mode becomes a
 * structured `OriginalityIssue` instead. All I/O (loading the attestation
 * and semantic-completion evidence records) is the caller's
 * (`orchestrate-originality-review.ts`'s) responsibility, exactly like the
 * correctness/structural reports already are.
 */
import {
  computeCorrectnessVerificationFingerprint,
  CORRECTNESS_SCORER_VERSION,
  CORRECTNESS_VERIFIER_VERSION,
  validateCorrectnessAttestationBinding,
  type CorrectnessPassAttestation,
  type StoredCorrectnessVerificationReport,
} from "../correctness";
import { FACTORY_VERSIONS } from "../config";
import {
  validateSemanticCompletionEvidence,
  type SemanticCompletionEvidence,
} from "../review";
import {
  checkAgainstProductionSchema,
  parseCandidateProvenance,
  parseCandidateQuestion,
  validateStructuralEvidenceBinding,
  type StoredStructuralValidationReport,
} from "../validation";
import { classifySemanticCategory } from "../workflow";
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
  structuralReport: StoredStructuralValidationReport | undefined,
  attestation: CorrectnessPassAttestation | undefined,
  semanticCompletionEvidence: SemanticCompletionEvidence | undefined,
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

  // Second remediation (audit finding #2): never trust the
  // `structuralEvidenceFingerprint` string copied into the correctness
  // report on its own say-so — load and independently authenticate the
  // structural-validation report it claims to rest on (existence,
  // ownership, a genuinely passing outcome, current revision/content-hash/
  // blueprint-hash binding, current schema/taxonomy/validator versions,
  // and a recomputed fingerprint), via the same shared helper
  // `correctness/validate-cached-replay.ts` uses for its own cached-replay
  // path. Only once the structural report itself is authenticated is the
  // correctness report's *reference* to it cross-checked below.
  const structuralBinding = validateStructuralEvidenceBinding(
    { candidateId: candidate.candidateId, candidateRevision, candidateContentHash, blueprintHash: currentBlueprintHash },
    structuralReport,
  );
  if (!structuralBinding.ok) {
    for (const problem of structuralBinding.problems) {
      issues.push(issue(problem.path, problem.message));
    }
  }
  // Read whenever the structural report was at least well-shaped (present
  // even alongside a binding failure — see the shared helper's `evidence`
  // doc comment), so a reference mismatch is still reported in its own
  // right rather than only ever surfacing as an upstream binding problem.
  const authenticatedStructuralFingerprint = structuralBinding.evidence?.validationFingerprint;
  if (evidence.structuralEvidenceFingerprint === undefined || evidence.structuralEvidenceFingerprint !== authenticatedStructuralFingerprint) {
    issues.push(
      issue(
        "correctnessReport.evidence.structuralEvidenceFingerprint",
        "Correctness evidence's referenced structural fingerprint is missing or does not match the authenticated structural report's fingerprint.",
      ),
    );
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
  // Second remediation (audit finding #1): `candidateProvenanceSchema`
  // makes `blueprintId` a mandatory field, so every candidate that reaches
  // this point (its provenance has already parsed above) has a bound
  // blueprint — there is no supported "legitimately unblueprinted"
  // lifecycle case here. The blueprint-hash binding is therefore
  // unconditionally required, exactly mirroring
  // `correctness/validate-cached-replay.ts`'s own rule: an absent/empty
  // current hash is never "verified", an absent/empty evidence hash is
  // never treated as vacuously matching, and a present-but-different hash
  // is always a mismatch. Fabricated evidence that simply omits
  // `blueprintHash` can no longer bypass this check by leaving it
  // `undefined`.
  if (!blueprintHashVerified || evidence.blueprintHash === undefined || evidence.blueprintHash.trim().length === 0 || evidence.blueprintHash !== currentBlueprintHash) {
    issues.push(
      issue(
        "correctnessReport.evidence.blueprintHash",
        "Correctness evidence blueprint hash is missing, empty, or does not strictly match the candidate's current verified blueprint hash (absent/empty hashes never match).",
      ),
    );
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

  // Third remediation: the checks above only ever prove the cv-* report is
  // internally self-consistent and superficially bound to the candidate —
  // never that the governed correctness workflow itself produced it. Only
  // a genuine, exactly-bound `cva-*` attestation proves that. Checked for
  // both attestable outcomes (deterministic pass and passed-pending-
  // semantic-review) whenever the report's own outcome is one of them;
  // for any other stored outcome the report is already refused above, so
  // there is nothing legitimate left to attest to.
  if (isDeterministicPass || isPendingSemanticReview) {
    const attestationBinding = validateCorrectnessAttestationBinding(
      {
        candidateId: candidate.candidateId,
        candidateRevision,
        candidateContentHash,
        blueprintHash: currentBlueprintHash,
        structuralEvidenceFingerprint: authenticatedStructuralFingerprint,
        correctnessOutcome: evidence.outcome as "passed" | "review_required",
        correctnessCapability: correctnessReport.result.capability,
        correctnessReportFingerprint: evidence.verificationFingerprint,
      },
      attestation,
    );
    if (!attestationBinding.ok) {
      for (const problem of attestationBinding.problems) {
        issues.push(issue(problem.path, problem.message));
      }
    }
  }

  // Third remediation: authentic semantic-completion evidence is required
  // before originality accepts `semantic_review_passed` at all — including
  // the deterministic-skip path, which previously had no evidence
  // requirement of any kind. The classification is freshly recomputed from
  // the candidate's *current* question content, never read from the
  // evidence record or trusted from the correctness report's capability
  // alone, so a candidate whose content was edited after semantic review
  // completed (invalidating the classification it was completed under)
  // cannot be laundered through a stale evidence record.
  const questionOutcome = parseCandidateQuestion(candidate.question);
  if (!questionOutcome.ok) {
    issues.push(issue("candidate.question", "Candidate question no longer parses against its trust-boundary schema; semantic-completion evidence cannot be validated."));
  } else {
    const productionSchemaOutcome = checkAgainstProductionSchema(questionOutcome.data);
    if (!productionSchemaOutcome.ok) {
      issues.push(issue("candidate.question", "Candidate question no longer satisfies the production schema; semantic-completion evidence cannot be validated."));
    } else {
      const currentSemanticClassification = classifySemanticCategory(productionSchemaOutcome.question);
      const semanticBinding = validateSemanticCompletionEvidence(
        {
          candidateId: candidate.candidateId,
          candidateRevision,
          candidateContentHash,
          blueprintHash: currentBlueprintHash,
          semanticClassification: currentSemanticClassification,
          generatorIdentity: provenanceOutcome.data.generatorAdapter.identity,
          reviewRecords: provenanceOutcome.data.reviewRecords,
        },
        semanticCompletionEvidence,
      );
      if (!semanticBinding.ok) {
        for (const problem of semanticBinding.problems) {
          issues.push(issue(problem.path, problem.message));
        }
      }
    }
  }

  return issues.length === 0 ? { ok: true } : { ok: false, issues };
}
