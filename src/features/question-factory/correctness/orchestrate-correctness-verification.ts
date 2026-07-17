import { createHash } from "node:crypto";

import { FACTORY_THRESHOLDS, FACTORY_VERSIONS } from "../config";
import { hashJson } from "../provenance";
import { resolveBoundBlueprint } from "../shared/bound-blueprint";
import type { FactoryRepository, FactoryCompartment } from "../storage";
import { compartmentForState } from "../storage";
import {
  buildStructuralValidationReportId,
  parseCandidateProvenance,
  type StoredStructuralValidationReport,
} from "../validation";
import { applyTransition, decideGateFailureOutcome, type CandidateState } from "../workflow";
import { buildCorrectnessAttestation, buildCorrectnessAttestationId, type CorrectnessPassAttestation } from "./attestation";
import { computeCorrectnessVerificationFingerprint, CORRECTNESS_SCORER_VERSION, CORRECTNESS_VERIFIER_VERSION } from "./evidence";
import type { CorrectnessVerificationEvidence, CorrectnessVerificationIssue, CorrectnessVerificationResult, QuestionFactoryCandidate } from "./types";
import { validateCachedCorrectnessReplay } from "./validate-cached-replay";
import { validateCorrectnessAttestationBinding } from "./validate-correctness-attestation-binding";
import { verifyCandidateCorrectness } from "./verify-candidate-correctness";

/**
 * The exact two `(outcome, capability)` combinations this gate treats as a
 * legitimate correctness pass — see `CorrectnessOrchestrationOutcome`'s
 * `"passed_pending_semantic_review"` doc comment for the full rationale.
 * Only these two ever mint or replay-check a `cva-*` attestation; every
 * other result (`rejected`, `quarantined`) never had one to begin with.
 * Single source of truth for both the fresh-verification mint path and
 * the cached-replay re-check path below, so the two can never silently
 * diverge on which outcomes count as attestable.
 */
function attestablePassFrom(
  result: CorrectnessVerificationResult,
): { readonly outcome: "passed" | "review_required"; readonly capability: "deterministically_verifiable" | "requires_independent_semantic_review" } | undefined {
  if (result.status === "passed") {
    return { outcome: "passed", capability: "deterministically_verifiable" };
  }
  if (result.status === "review_required" && result.capability === "requires_independent_semantic_review") {
    return { outcome: "review_required", capability: "requires_independent_semantic_review" };
  }
  return undefined;
}

function terminalBindingIssue(path: string, message: string): CorrectnessVerificationIssue {
  return { code: "cached_replay_integrity_failure", path, message, severity: "error" };
}

/**
 * Binds a *terminal* (already moved out of `review-queue`) correctness
 * report to the **requested** candidate id before it is ever replayed. The
 * deterministic report key (`cv-<hash(candidateId)>`) is never itself
 * treated as proof of ownership — nothing stops a stored JSON blob at that
 * path from declaring a *different* candidateId internally (e.g. a copy of
 * another candidate's genuinely valid, internally-fingerprint-consistent
 * report placed under this candidate's key) — so every field this function
 * checks is read from the report/evidence content itself and compared
 * explicitly against `requestedCandidateId`, plus cross-checked against the
 * requested candidate's own structural report (read independently by
 * candidate id, never assumed from the correctness report's say-so) for
 * revision/content-hash/blueprint-hash/structural-fingerprint coherence —
 * there is no live candidate content to check against in this path (the
 * candidate has already left `review-queue`), so the structural report is
 * the closest independently-bound source of truth available. Collects
 * every issue found, never just the first, mirroring
 * `validateCachedCorrectnessReplay`.
 */
function validateTerminalReportBinding(
  requestedCandidateId: string,
  structuralReport: StoredStructuralValidationReport | undefined,
  report: StoredCorrectnessVerificationReport,
): { readonly ok: true } | { readonly ok: false; readonly issues: readonly CorrectnessVerificationIssue[] } {
  const issues: CorrectnessVerificationIssue[] = [];
  const evidence = report.result.evidence;

  if (report.candidateId !== requestedCandidateId) {
    issues.push(
      terminalBindingIssue(
        "correctnessReport.candidateId",
        `Stored terminal correctness report belongs to candidate '${report.candidateId}', not the requested '${requestedCandidateId}'.`,
      ),
    );
  }
  if (evidence.candidateId !== requestedCandidateId) {
    issues.push(
      terminalBindingIssue(
        "correctnessReport.evidence.candidateId",
        `Terminal correctness evidence belongs to candidate '${evidence.candidateId}', not the requested '${requestedCandidateId}'.`,
      ),
    );
  }
  if (report.candidateId !== evidence.candidateId) {
    issues.push(
      terminalBindingIssue(
        "correctnessReport.candidateId",
        `Stored report candidateId '${report.candidateId}' disagrees with its own evidence candidateId '${evidence.candidateId}'.`,
      ),
    );
  }

  if (report.result.status === "passed" || evidence.outcome === "passed" || report.result.status !== evidence.outcome) {
    issues.push(
      terminalBindingIssue(
        "correctnessReport.result.status",
        `Terminal correctness report outcome ('${report.result.status}'/'${evidence.outcome}') is not a valid, internally-consistent terminal outcome — a passed candidate never leaves review-queue, so this reuse path may never see 'passed'.`,
      ),
    );
  }

  if (evidence.verifierVersion !== CORRECTNESS_VERIFIER_VERSION) {
    issues.push(
      terminalBindingIssue(
        "correctnessReport.evidence.verifierVersion",
        "Terminal correctness evidence was produced under a verifier version that is no longer current.",
      ),
    );
  }
  if (evidence.scorerVersion !== CORRECTNESS_SCORER_VERSION) {
    issues.push(
      terminalBindingIssue(
        "correctnessReport.evidence.scorerVersion",
        "Terminal correctness evidence was produced under a scoring-engine integration version that is no longer current.",
      ),
    );
  }
  if (evidence.schemaVersion !== FACTORY_VERSIONS.SCHEMA_VERSION) {
    issues.push(
      terminalBindingIssue(
        "correctnessReport.evidence.schemaVersion",
        "Terminal correctness evidence was produced under a schema version that is no longer current.",
      ),
    );
  }
  if (evidence.taxonomyVersion !== FACTORY_VERSIONS.TAXONOMY_VERSION) {
    issues.push(
      terminalBindingIssue(
        "correctnessReport.evidence.taxonomyVersion",
        "Terminal correctness evidence was produced under a taxonomy version that is no longer current.",
      ),
    );
  }

  if (structuralReport === undefined) {
    issues.push(
      terminalBindingIssue(
        "structuralReport",
        "No structural-validation report exists for the requested candidate id to bind this terminal correctness report against.",
      ),
    );
  } else {
    const structuralEvidence = structuralReport.result.evidence;
    if (structuralReport.candidateId !== requestedCandidateId) {
      issues.push(
        terminalBindingIssue(
          "structuralReport.candidateId",
          `Structural report belongs to candidate '${structuralReport.candidateId}', not the requested '${requestedCandidateId}'.`,
        ),
      );
    }
    if (structuralEvidence.candidateId !== requestedCandidateId) {
      issues.push(
        terminalBindingIssue(
          "structuralReport.evidence.candidateId",
          `Structural evidence belongs to candidate '${structuralEvidence.candidateId}', not the requested '${requestedCandidateId}'.`,
        ),
      );
    }
    if (evidence.candidateRevision !== structuralEvidence.candidateRevision) {
      issues.push(
        terminalBindingIssue(
          "correctnessReport.evidence.candidateRevision",
          "Terminal correctness evidence's candidate revision is not coherent with the requested candidate's structural evidence.",
        ),
      );
    }
    if (evidence.candidateContentHash !== structuralEvidence.candidateContentHash) {
      issues.push(
        terminalBindingIssue(
          "correctnessReport.evidence.candidateContentHash",
          "Terminal correctness evidence's candidate content hash is not coherent with the requested candidate's structural evidence.",
        ),
      );
    }
    if (evidence.blueprintHash !== structuralEvidence.blueprintHash) {
      issues.push(
        terminalBindingIssue(
          "correctnessReport.evidence.blueprintHash",
          "Terminal correctness evidence's blueprint hash is not coherent with the requested candidate's structural evidence.",
        ),
      );
    }
    if (
      evidence.structuralEvidenceFingerprint === undefined ||
      evidence.structuralEvidenceFingerprint !== structuralEvidence.validationFingerprint
    ) {
      issues.push(
        terminalBindingIssue(
          "correctnessReport.evidence.structuralEvidenceFingerprint",
          "Terminal correctness evidence's referenced structural fingerprint is missing or not coherent with the requested candidate's current structural report.",
        ),
      );
    }
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
      terminalBindingIssue(
        "correctnessReport.evidence.verificationFingerprint",
        "Recomputed correctness-verification fingerprint does not match the stored value for a terminal report — the report's visible fields were edited without a corresponding fingerprint update, or the fingerprint itself was tampered with.",
      ),
    );
  }

  return issues.length === 0 ? { ok: true } : { ok: false, issues };
}

/**
 * Distinct id namespace from the structural report key (`sv-...`) so the
 * two gates' reports can never collide in the shared `reports` compartment,
 * and stable across repeated attempts against the same candidate so a
 * retry finds the same report rather than minting a new one.
 */
export function buildCorrectnessReportId(candidateId: string): string {
  const digest = createHash("sha256").update(candidateId, "utf8").digest("hex").slice(0, 40);
  return `cv-${digest}`;
}

export interface StoredCorrectnessVerificationReport {
  readonly candidateId: string;
  readonly result: CorrectnessVerificationResult;
}

export interface OrchestrateCorrectnessVerificationOptions {
  /** Caller-supplied, ISO 8601 — the orchestration layer owns the wall-clock read, never the pure verifier. */
  readonly verifiedAt: string;
}

export type CorrectnessOrchestrationOutcome =
  | {
      readonly outcome: "passed";
      readonly candidateId: string;
      readonly evidence: CorrectnessVerificationEvidence;
      readonly replayed: boolean;
    }
  | {
      /**
       * Correctness-gate remediation (post-Mission-3B-audit): the gate
       * completed with **no contradiction detected**, but this candidate's
       * content — `semantic_objective` or `manual_review_writing` per
       * `classifySemanticCategory` — has no deterministic derivation
       * method at all, so the gate cannot independently establish that
       * the declared answer is correct. This is categorically different
       * from `"passed"` (which does carry a machine-proven correctness
       * claim) and from `"quarantined"` (which means the gate could not
       * decide whether the candidate is even *usable*): it is a
       * legitimate, expected outcome for exactly the two classifications
       * the semantic-review gate (`review/`) exists to adjudicate.
       *
       * The candidate still advances to lifecycle state
       * `correctness_check_passed` (same physical compartment,
       * `review-queue`) — the semantic-review gate is the only gate
       * entitled to establish correctness for this content, and it
       * requires exactly this state as its entry precondition. No caller
       * may treat this outcome as equivalent to `"passed"`'s correctness
       * claim; `evidence.outcome` is stored as `"review_required"` (never
       * `"passed"`) precisely so a later reader can tell the two apart
       * from the evidence record alone, not just from this outcome label.
       */
      readonly outcome: "passed_pending_semantic_review";
      readonly candidateId: string;
      readonly issues: readonly CorrectnessVerificationIssue[];
      readonly evidence: CorrectnessVerificationEvidence;
      readonly replayed: boolean;
    }
  | {
      readonly outcome: "rejected";
      readonly candidateId: string;
      readonly issues: readonly CorrectnessVerificationIssue[];
      readonly evidence: CorrectnessVerificationEvidence;
      readonly replayed: boolean;
    }
  | {
      readonly outcome: "quarantined";
      readonly candidateId: string;
      readonly issues: readonly CorrectnessVerificationIssue[];
      readonly evidence: CorrectnessVerificationEvidence;
      readonly replayed: boolean;
    }
  | { readonly outcome: "not_found"; readonly candidateId: string }
  | {
      /**
       * The candidate is physically present in `review-queue` but its
       * stored `state` is neither `structural_validation_passed` (the only
       * state this gate may run fresh verification against) nor
       * `correctness_check_passed` (this gate's own terminal state, safe
       * to replay — see the class doc). Deterministic, side-effect-free:
       * no derivation runs, no report is written, and the candidate is
       * never moved.
       */
      readonly outcome: "invalid_lifecycle_state";
      readonly candidateId: string;
      readonly actualState: string;
    }
  | {
      /**
       * The candidate is stored as `correctness_check_passed`, but
       * `validateCachedCorrectnessReplay` proved the cached report it would
       * otherwise be replayed from can no longer be trusted (a binding
       * mismatch against the candidate's current identity/content/
       * blueprint, a stale or tampered structural report, or a tampered
       * correctness report). Never returns cached success in this case,
       * never silently re-derives over a passed candidate, and never
       * mutates the candidate — this is a deterministic refusal, not a
       * lifecycle transition.
       */
      readonly outcome: "replay_integrity_failure";
      readonly candidateId: string;
      readonly issues: readonly CorrectnessVerificationIssue[];
    }
  | { readonly outcome: "repository_error"; readonly candidateId: string; readonly message: string };

function readStringField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function outcomeFromResult(
  result: CorrectnessVerificationResult,
  candidateId: string,
  replayed: boolean,
): CorrectnessOrchestrationOutcome {
  if (result.status === "passed") {
    return { outcome: "passed", candidateId, evidence: result.evidence, replayed };
  }
  if (result.status === "review_required" && result.capability === "requires_independent_semantic_review") {
    return { outcome: "passed_pending_semantic_review", candidateId, issues: result.issues, evidence: result.evidence, replayed };
  }
  const target = decideTransitionTarget(result, 0);
  if (target === "quarantined") {
    return { outcome: "quarantined", candidateId, issues: result.issues, evidence: result.evidence, replayed };
  }
  return { outcome: "rejected", candidateId, issues: result.issues, evidence: result.evidence, replayed };
}

/**
 * Maps a correctness-verification result onto the shared lifecycle
 * policy (`decideGateFailureOutcome`) rather than hard-coding a
 * destination — **except** for the one case this gate does not treat as
 * a failure at all: `review_required` with capability
 * `requires_independent_semantic_review` (`semantic_objective`/
 * `manual_review_writing` content with no scoring contradiction found).
 * That case advances to `correctness_check_passed` and is handled
 * directly in `outcomeFromResult`/the main orchestrator body before this
 * function is ever reached for it — see `CorrectnessOrchestrationOutcome`'s
 * `"passed_pending_semantic_review"` doc comment for the full rationale.
 * This function therefore only ever sees the remaining, genuinely
 * non-advancing cases:
 *
 * A `review_required` outcome with capability `structurally_scoreable_only`
 * (a `deterministically_computable`-classified candidate the derivation
 * engine simply could not resolve), or a `failed` outcome whose capability
 * is `unsupported`, is a "the gate cannot independently decide" case —
 * `severity: "uncertain"`, which the shared policy always routes to
 * `quarantined`, never silently passed and never hard-rejected as though
 * it were proven wrong. A `failed` outcome for any other capability
 * (including `requires_independent_semantic_review` when the *declared*
 * answer itself failed scoring — a genuine contradiction, not a missing
 * derivation) is unambiguous — `severity: "hard_fail"`, which always
 * routes to `rejected`. `revisionCount` is accepted for parity with the
 * shared policy signature but never changes this gate's outcome: neither
 * severity this gate uses is revision-count-sensitive (only `soft_fail`
 * is, and this gate never produces one — see the class doc on
 * `orchestrateCorrectnessVerification`).
 */
function decideTransitionTarget(
  result: Extract<CorrectnessVerificationResult, { status: "failed" | "review_required" }>,
  revisionCount: number,
): CandidateState {
  if (result.status === "review_required" && result.capability === "requires_independent_semantic_review") {
    return "correctness_check_passed";
  }
  const isUncertain = result.status === "review_required" || result.capability === "unsupported";
  return decideGateFailureOutcome({
    severity: isUncertain ? "uncertain" : "hard_fail",
    revisionCount,
    maxRevisions: FACTORY_THRESHOLDS.MAX_REVISIONS,
  });
}

async function attemptMove(
  repository: FactoryRepository,
  candidateId: string,
  destination: FactoryCompartment,
): Promise<{ readonly ok: true; readonly replayed: boolean } | { readonly ok: false; readonly message: string }> {
  try {
    const moveResult = await repository.move(candidateId, "review-queue", destination);
    if (!moveResult.ok) return { ok: false, message: moveResult.message };
    return { ok: true, replayed: moveResult.replayed };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, message: `Repository move failed: ${message}` };
  }
}

/**
 * Persists a same-compartment lifecycle transition — the pass path, where
 * `structural_validation_passed` and `correctness_check_passed` both map
 * to `review-queue` (see `state-compartment-mapping.ts`), so
 * `FactoryRepository.move()` (which requires `from !== to`) cannot be used
 * to record it. Uses `repository.update()` instead: the same atomic-write
 * and content-hash-based replay discipline as `move()`, scoped to a single
 * compartment. `expectedContentHash` binds the write to the exact record
 * this function read earlier in the same call, so a genuine out-of-band
 * edit between read and write is refused as a conflict rather than
 * silently overwritten.
 */
async function attemptUpdate(
  repository: FactoryRepository,
  candidateId: string,
  compartment: FactoryCompartment,
  updatedRecord: Record<string, unknown>,
  expectedContentHash: string,
): Promise<{ readonly ok: true; readonly replayed: boolean } | { readonly ok: false; readonly message: string }> {
  try {
    const updateResult = await repository.update(compartment, candidateId, updatedRecord, { expectedContentHash });
    if (!updateResult.ok) return { ok: false, message: updateResult.message };
    return { ok: true, replayed: updateResult.replayed };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, message: `Repository update failed: ${message}` };
  }
}

/**
 * Writes the correctness-verification report if absent; a matching
 * `verificationFingerprint` on an existing report is treated as a safe
 * no-op replay, a differing one as a genuine conflict. Mirrors
 * `writeReportIfAbsent` in `orchestrate-structural-validation.ts` exactly,
 * for the same replay-safety reason: `verificationFingerprint` excludes
 * `verifiedAt`, so a retry that only differs by wall-clock time always
 * matches.
 */
async function writeReportIfAbsent(
  repository: FactoryRepository,
  reportId: string,
  report: StoredCorrectnessVerificationReport,
): Promise<{ readonly ok: true; readonly alreadyPresent: boolean } | { readonly ok: false; readonly message: string }> {
  const existing = (await repository.read("reports", reportId)) as StoredCorrectnessVerificationReport | undefined;
  if (existing !== undefined) {
    if (existing.result.evidence.verificationFingerprint === report.result.evidence.verificationFingerprint) {
      return { ok: true, alreadyPresent: true };
    }
    return {
      ok: false,
      message: `A different correctness-verification report already exists for candidate '${report.candidateId}' — its verification fingerprint no longer matches the stored report, indicating the candidate, its structural evidence, or the derived answer genuinely changed between verification attempts. This is not a timestamp difference: 'verifiedAt' is excluded from the fingerprint precisely so a retry with a fresh timestamp alone never triggers this conflict.`,
    };
  }
  const createResult = await repository.create("reports", reportId, report);
  if (!createResult.ok) return { ok: false, message: createResult.message };
  return { ok: true, alreadyPresent: false };
}

/**
 * Mission 3D third audit remediation. Writes the governed correctness-pass
 * attestation if absent — the same append-only, fingerprint-based replay
 * discipline as `writeReportIfAbsent`: a matching `attestationFingerprint`
 * on an existing record is a safe no-op replay, a differing one a genuine
 * conflict, and there is no code path anywhere in this codebase that
 * overwrites an existing attestation. Only ever called from this
 * function's own pass path — no other caller mints an attestation.
 */
async function writeAttestationIfAbsent(
  repository: FactoryRepository,
  attestationId: string,
  attestation: CorrectnessPassAttestation,
): Promise<{ readonly ok: true; readonly alreadyPresent: boolean } | { readonly ok: false; readonly message: string }> {
  const existing = (await repository.read("reports", attestationId)) as CorrectnessPassAttestation | undefined;
  if (existing !== undefined) {
    if (existing.attestationFingerprint === attestation.attestationFingerprint) {
      return { ok: true, alreadyPresent: true };
    }
    return {
      ok: false,
      message: `A different correctness-pass attestation already exists for candidate '${attestation.candidateId}' — its attestation fingerprint no longer matches, indicating a genuine conflict rather than a safe retry.`,
    };
  }
  const createResult = await repository.create("reports", attestationId, attestation);
  if (!createResult.ok) return { ok: false, message: createResult.message };
  return { ok: true, alreadyPresent: false };
}

/**
 * Lifecycle orchestration for the correctness-verification gate. Reads a
 * candidate physically stored in the `review-queue` compartment (the same
 * compartment `structural_validation_passed`, `correctness_check_passed`,
 * and every later gate's passed state all map to — see
 * `state-compartment-mapping.ts` — so physical location alone can never
 * distinguish "just passed structural validation" from "already passed
 * correctness too"), locates and binds against the stored structural-
 * validation evidence report, runs the pure `verifyCandidateCorrectness`,
 * and moves the candidate only when the destination compartment actually
 * differs from `review-queue`:
 *
 * - **Deterministic correctness pass** (`outcome: "passed"`) →
 *   `correctness_check_passed`, which also maps to `review-queue` — no
 *   physical move occurs (`FactoryRepository.move()` requires
 *   `from !== to`); only the evidence report is written.
 * - **`passed_pending_semantic_review`** — `review_required` with capability
 *   `requires_independent_semantic_review` and no contradiction detected
 *   (`semantic_objective`/`manual_review_writing` content the gate cannot
 *   independently derive) — also advances to `correctness_check_passed`,
 *   the same no-move path as a deterministic pass; it is **not** routed to
 *   `quarantined`. See `CorrectnessOrchestrationOutcome`'s doc comment on
 *   that variant and `decideTransitionTarget` above for the full rationale.
 * - **Unsupported/undecidable quarantine** (`structurally_scoreable_only`,
 *   or `unsupported` with no independent-review path) → `quarantined`, a
 *   real move — the shared "gate cannot decide" policy destination
 *   (`decideGateFailureOutcome({ severity: "uncertain" })`), never a
 *   fabricated pass and never a hard rejection of something this gate
 *   never proved was wrong.
 * - **Correctness contradiction failure** (a `deterministically_verifiable`
 *   candidate whose declared answer is demonstrably wrong or scoring-
 *   incompatible — `severity: "hard_fail"`) → `rejected` (compartment
 *   `rejected/correctness`), a real move.
 *
 * Because physical location cannot disambiguate lifecycle position for
 * this gate, replay detection only ever trusts a stored report directly
 * when the candidate has *already left* `review-queue` (there is no
 * current content left to re-check it against). Whenever the candidate is
 * still physically present, this function always re-runs the pure
 * `verifyCandidateCorrectness` against its *current* content and lets
 * `writeReportIfAbsent`'s fingerprint comparison — never physical
 * location, never a raw report-existence check — decide replay vs.
 * genuine conflict, exactly mirroring
 * `orchestrate-structural-validation.ts`. This is also what makes
 * partial-failure recovery correct: if the report write succeeds but a
 * subsequent quarantine/reject move fails, the candidate is still in
 * `review-queue` on retry, re-verification reproduces the same evidence
 * (same fingerprint), `writeReportIfAbsent` recognises it as the existing
 * report rather than a duplicate, and only the move is retried.
 */
export async function orchestrateCorrectnessVerification(
  candidateId: string,
  repository: FactoryRepository,
  options: OrchestrateCorrectnessVerificationOptions,
): Promise<CorrectnessOrchestrationOutcome> {
  const correctnessReportId = buildCorrectnessReportId(candidateId);

  const reviewQueueRaw = await repository.read("review-queue", candidateId);

  if (reviewQueueRaw === undefined) {
    // Candidate is no longer in `review-queue`: either it never existed, or
    // a quarantine/reject move already completed (a *passed* candidate
    // never leaves `review-queue` — see the class doc above — so this
    // branch is only ever reached for a terminal quarantine/reject
    // outcome). There is no current candidate content left to re-verify
    // against, so the stored report is trusted directly, exactly like
    // structural validation's not-found-but-report-exists replay path.
    const existingReport = (await repository.read("reports", correctnessReportId)) as
      | StoredCorrectnessVerificationReport
      | undefined;
    if (existingReport !== undefined) {
      const structuralReportForBinding = (await repository.read(
        "reports",
        buildStructuralValidationReportId(candidateId),
      )) as StoredStructuralValidationReport | undefined;
      const bindingOutcome = validateTerminalReportBinding(candidateId, structuralReportForBinding, existingReport);
      if (!bindingOutcome.ok) {
        return { outcome: "replay_integrity_failure", candidateId, issues: bindingOutcome.issues };
      }
      return outcomeFromResult(existingReport.result, candidateId, true);
    }
    return { outcome: "not_found", candidateId };
  }

  // Candidate IS physically in `review-queue`. This covers every other
  // scenario — a fresh candidate never verified for correctness yet, one
  // that already passed (pass never moves it), or one whose report was
  // written but a subsequent quarantine/reject move failed (a partial
  // failure) — and in every one of them the candidate's *current* content
  // must be re-verified fresh rather than trusting any existing report
  // blindly: only `writeReportIfAbsent`'s fingerprint comparison below is
  // allowed to decide replay vs. genuine conflict, exactly mirroring
  // `orchestrate-structural-validation.ts`. Trusting a stored report
  // without this re-check would silently move a *changed* candidate to the
  // destination computed for its *stale* report — the same class of defect
  // Mission 2B's timestamp-hashing fix closed for structural validation.
  if (typeof reviewQueueRaw !== "object" || reviewQueueRaw === null) {
    return { outcome: "repository_error", candidateId, message: "Stored 'review-queue' record is not an object." };
  }
  const record = reviewQueueRaw as Record<string, unknown>;
  const rawIngestion = record.ingestion;
  const ingestion =
    typeof rawIngestion === "object" && rawIngestion !== null
      ? { sourcePath: readStringField(rawIngestion as Record<string, unknown>, "sourcePath") }
      : undefined;

  const candidate: QuestionFactoryCandidate = {
    candidateId,
    state: readStringField(record, "state") ?? "",
    question: record.question,
    provenance: record.provenance,
    ...(ingestion ? { ingestion } : {}),
  };

  // Structural report and blueprint hash are needed by both branches below
  // (a fresh verification attempt, and a cached-replay binding check), so
  // both are read once, up front, rather than duplicated per branch.
  const structuralReportId = buildStructuralValidationReportId(candidateId);
  const structuralReport = (await repository.read("reports", structuralReportId)) as
    | StoredStructuralValidationReport
    | undefined;
  const structuralEvidence = structuralReport?.result.evidence;

  if (candidate.state !== "correctness_check_passed" && candidate.state !== "structural_validation_passed") {
    // Any other stored state (e.g. `generated`, `quarantined`,
    // `rejected/*`) is invalid for a candidate physically located in
    // `review-queue` under this gate's precondition. Deterministic,
    // side-effect-free refusal — no derivation, no report, no move, and
    // (cheaper still) no blueprint-resolution repository read either,
    // since neither eligible path below is ever going to run.
    return {
      outcome: "invalid_lifecycle_state",
      candidateId,
      actualState: candidate.state.length > 0 ? candidate.state : "unknown",
    };
  }

  const rawProvenance =
    typeof candidate.provenance === "object" && candidate.provenance !== null
      ? (candidate.provenance as Record<string, unknown>)
      : undefined;
  const blueprintId = rawProvenance ? readStringField(rawProvenance, "blueprintId") : undefined;

  // Fail closed on the bound blueprint before either the cached-replay
  // path or the fresh-verification path below ever runs: both depend on
  // `blueprintHash` to bind evidence to the candidate's actual blueprint
  // identity, and a missing/unreadable/invalid blueprint must never leave
  // it silently `undefined` — that previously let a vacuous
  // `undefined !== undefined` comparison treat an unverifiable binding as
  // a matching one. No report is written and no move/update is attempted
  // before this check.
  let blueprintHash: string | undefined;
  if (blueprintId !== undefined) {
    const blueprintResolution = await resolveBoundBlueprint(blueprintId, repository);
    if (!blueprintResolution.ok) {
      return {
        outcome: "repository_error",
        candidateId,
        message: `Candidate '${candidateId}' declares bound blueprint '${blueprintId}', which could not be resolved (${blueprintResolution.kind}): ${blueprintResolution.message}`,
      };
    }
    blueprintHash = blueprintResolution.blueprintHash;
  }

  if (candidate.state === "correctness_check_passed") {
    // This gate's own terminal state for this compartment: physical
    // presence in `review-queue` cannot distinguish it from
    // `structural_validation_passed` (see the class doc above), but the
    // stored `state` field now can. A lifecycle state alone is never
    // sufficient authorisation to replay a cached success, though —
    // `validateCachedCorrectnessReplay` independently re-proves the cached
    // report's binding to the candidate's *current* identity/content/
    // blueprint, the upstream structural report's validity, and both
    // reports' own recomputed fingerprints before trusting it. Only once
    // that check passes is the existing report replayed directly, never
    // re-derived — a candidate already marked passed is never silently
    // reprocessed.
    const existingReport = (await repository.read("reports", correctnessReportId)) as
      | StoredCorrectnessVerificationReport
      | undefined;

    const replayValidation = validateCachedCorrectnessReplay(candidate, structuralReport, existingReport, {
      blueprintHash,
    });
    if (!replayValidation.ok) {
      return { outcome: "replay_integrity_failure", candidateId, issues: replayValidation.issues };
    }
    if (existingReport !== undefined) {
      // Mission 3D third audit remediation: a passing cached-replay
      // validation proves the cv-* report is internally self-consistent
      // and bound to the candidate's current identity — it does not prove
      // the *governed workflow itself* minted it. A genuine, exactly-bound
      // `cva-*` attestation is independently required before the replay is
      // trusted; missing/stale/tampered/wrong-outcome attestations fail
      // closed exactly like every other cached-replay binding failure.
      const attestable = attestablePassFrom(existingReport.result);
      if (attestable === undefined) {
        return {
          outcome: "replay_integrity_failure",
          candidateId,
          issues: [
            {
              code: "cached_replay_integrity_failure",
              path: "correctnessReport.result.status",
              message: `Stored correctness report outcome is '${existingReport.result.status}', which is not an attestable pass outcome, yet the candidate is stored as 'correctness_check_passed'.`,
              severity: "error",
            },
          ],
        };
      }
      const evidence = existingReport.result.evidence;
      const existingAttestation = (await repository.read("reports", buildCorrectnessAttestationId(candidateId))) as
        | CorrectnessPassAttestation
        | undefined;
      const attestationBinding = validateCorrectnessAttestationBinding(
        {
          candidateId,
          candidateRevision: evidence.candidateRevision,
          candidateContentHash: evidence.candidateContentHash,
          blueprintHash,
          structuralEvidenceFingerprint: evidence.structuralEvidenceFingerprint,
          correctnessOutcome: attestable.outcome,
          correctnessCapability: attestable.capability,
          correctnessReportFingerprint: evidence.verificationFingerprint,
        },
        existingAttestation,
      );
      if (!attestationBinding.ok) {
        return {
          outcome: "replay_integrity_failure",
          candidateId,
          issues: attestationBinding.problems.map((problem) => ({
            code: "cached_replay_integrity_failure" as const,
            path: problem.path,
            message: problem.message,
            severity: "error" as const,
          })),
        };
      }
      return outcomeFromResult(existingReport.result, candidateId, true);
    }
    return {
      outcome: "repository_error",
      candidateId,
      message: `Candidate '${candidateId}' is stored as 'correctness_check_passed' but no correctness-verification report exists for it.`,
    };
  }

  // candidate.state === "structural_validation_passed" is the only
  // remaining possibility: the guard at the top of this function already
  // returned for every other stored state, and the branch above already
  // returned for "correctness_check_passed".
  const result = verifyCandidateCorrectness(candidate, {
    verifiedAt: options.verifiedAt,
    ...(structuralEvidence !== undefined ? { structuralEvidence } : {}),
    ...(blueprintHash !== undefined ? { blueprintHash } : {}),
  });

  const provenanceOutcome = parseCandidateProvenance(candidate.provenance);
  const revisionCount = provenanceOutcome.ok ? provenanceOutcome.data.revision : 0;

  const transitionTarget: CandidateState =
    result.status === "passed" ? "correctness_check_passed" : decideTransitionTarget(result, revisionCount);

  const transition = applyTransition("structural_validation_passed", transitionTarget, {
    revisionCount,
    maxRevisions: FACTORY_THRESHOLDS.MAX_REVISIONS,
  });
  if (!transition.ok) {
    return { outcome: "repository_error", candidateId, message: transition.message };
  }

  const destinationCompartment = compartmentForState(
    transitionTarget,
    transitionTarget === "rejected" ? "correctness" : undefined,
  );
  if (!destinationCompartment) {
    return {
      outcome: "repository_error",
      candidateId,
      message: `No storage compartment is defined for lifecycle state '${transitionTarget}'.`,
    };
  }

  const report: StoredCorrectnessVerificationReport = { candidateId, result };
  const writeOutcome = await writeReportIfAbsent(repository, correctnessReportId, report);
  if (!writeOutcome.ok) {
    return { outcome: "repository_error", candidateId, message: writeOutcome.message };
  }

  // Mission 3D third audit remediation: mint the governed correctness-pass
  // attestation for exactly the two legitimate pass outcomes, strictly
  // after the report is durably written (so the attestation always binds
  // to a report that genuinely exists) and strictly before the lifecycle
  // transition is persisted below. This ordering is what makes both crash
  // windows converge safely on retry: a crash between the report write and
  // this write leaves the candidate still at `structural_validation_passed`
  // (the transition below never ran), so a retry re-enters this function,
  // re-verifies (same fingerprint), finds the report already present
  // (no-op), and mints the attestation now; a crash between this write and
  // the transition below leaves the candidate in the same pre-transition
  // state, so a retry re-verifies, finds both the report and the
  // attestation already present (both no-ops via fingerprint match), and
  // only the transition is retried. Never attempted for a quarantined/
  // rejected outcome — `attestablePassFrom` returns `undefined` for both.
  const attestable = attestablePassFrom(result);
  if (attestable !== undefined) {
    const evidence = result.evidence;
    if (evidence.blueprintHash === undefined || evidence.structuralEvidenceFingerprint === undefined) {
      return {
        outcome: "repository_error",
        candidateId,
        message: `Candidate '${candidateId}' reached a correctness pass without a bound blueprint hash or structural evidence fingerprint on its evidence, which should be unreachable.`,
      };
    }
    const attestation = buildCorrectnessAttestation({
      candidateId,
      candidateRevision: evidence.candidateRevision,
      candidateContentHash: evidence.candidateContentHash,
      blueprintHash: evidence.blueprintHash,
      structuralEvidenceFingerprint: evidence.structuralEvidenceFingerprint,
      correctnessOutcome: attestable.outcome,
      correctnessCapability: attestable.capability,
      correctnessReportFingerprint: evidence.verificationFingerprint,
      attestedAt: options.verifiedAt,
    });
    const attestationOutcome = await writeAttestationIfAbsent(repository, buildCorrectnessAttestationId(candidateId), attestation);
    if (!attestationOutcome.ok) {
      return { outcome: "repository_error", candidateId, message: attestationOutcome.message };
    }
  }

  let persistenceReplayed = false;
  if (destinationCompartment === "review-queue") {
    // Same-compartment lifecycle transition (the pass path):
    // `structural_validation_passed` -> `correctness_check_passed` are both
    // `review-queue`, so `move()` cannot record it (it requires
    // `from !== to`). Persist the state change directly via `update()`.
    const updatedRecord: Record<string, unknown> = { ...record, state: transitionTarget };
    const updateOutcome = await attemptUpdate(
      repository,
      candidateId,
      "review-queue",
      updatedRecord,
      hashJson(record),
    );
    if (!updateOutcome.ok) return { outcome: "repository_error", candidateId, message: updateOutcome.message };
    persistenceReplayed = updateOutcome.replayed;
  } else {
    const moveOutcome = await attemptMove(repository, candidateId, destinationCompartment);
    if (!moveOutcome.ok) return { outcome: "repository_error", candidateId, message: moveOutcome.message };
    persistenceReplayed = moveOutcome.replayed;
  }

  return outcomeFromResult(result, candidateId, writeOutcome.alreadyPresent || persistenceReplayed);
}
