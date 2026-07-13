import { createHash } from "node:crypto";

import { FACTORY_THRESHOLDS } from "../config";
import { hashJson } from "../provenance";
import type { FactoryRepository, FactoryCompartment } from "../storage";
import { compartmentForState } from "../storage";
import {
  buildStructuralValidationReportId,
  parseCandidateProvenance,
  type StoredStructuralValidationReport,
} from "../validation";
import { applyTransition, decideGateFailureOutcome, type CandidateState } from "../workflow";
import type { CorrectnessVerificationEvidence, CorrectnessVerificationIssue, CorrectnessVerificationResult, QuestionFactoryCandidate } from "./types";
import { verifyCandidateCorrectness } from "./verify-candidate-correctness";

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
  const target = decideTransitionTarget(result, 0);
  if (target === "quarantined") {
    return { outcome: "quarantined", candidateId, issues: result.issues, evidence: result.evidence, replayed };
  }
  return { outcome: "rejected", candidateId, issues: result.issues, evidence: result.evidence, replayed };
}

/**
 * Maps a correctness-verification result onto the shared lifecycle
 * policy (`decideGateFailureOutcome`) rather than hard-coding a
 * destination: a `review_required` outcome, or a `failed` outcome whose
 * capability is `unsupported`, is a "the gate cannot independently
 * decide" case — `severity: "uncertain"`, which the shared policy always
 * routes to `quarantined`, never silently passed and never hard-rejected
 * as though it were proven wrong. A `failed` outcome for any other
 * capability (i.e. `deterministically_verifiable`, meaning the declared
 * answer was demonstrably wrong or incompatible with the scoring engine)
 * is unambiguous — `severity: "hard_fail"`, which always routes to
 * `rejected`. `revisionCount` is accepted for parity with the shared
 * policy signature but never changes this gate's outcome: neither
 * severity this gate uses is revision-count-sensitive (only `soft_fail`
 * is, and this gate never produces one — see the class doc on
 * `orchestrateCorrectnessVerification`).
 */
function decideTransitionTarget(
  result: Extract<CorrectnessVerificationResult, { status: "failed" | "review_required" }>,
  revisionCount: number,
): CandidateState {
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
 * - **Pass** → `correctness_check_passed`, which also maps to
 *   `review-queue` — no physical move occurs (`FactoryRepository.move()`
 *   requires `from !== to`); only the evidence report is written.
 * - **Deterministic failure** (a `deterministically_verifiable` candidate
 *   whose declared answer is demonstrably wrong or scoring-incompatible)
 *   → `rejected` (compartment `rejected/correctness`), a real move.
 * - **Review-required** (`structurally_scoreable_only` /
 *   `requires_independent_semantic_review`) or **unsupported** →
 *   `quarantined`, a real move — the shared "gate cannot decide" policy
 *   destination (`decideGateFailureOutcome({ severity: "uncertain" })`),
 *   never a fabricated pass and never a hard rejection of something this
 *   gate never proved was wrong.
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

  if (candidate.state === "correctness_check_passed") {
    // This gate's own terminal state for this compartment: physical
    // presence in `review-queue` cannot distinguish it from
    // `structural_validation_passed` (see the class doc above), but the
    // stored `state` field now can. Trust the existing report directly
    // rather than re-deriving an answer for a candidate already marked
    // passed — never silently reprocess it.
    const existingReport = (await repository.read("reports", correctnessReportId)) as
      | StoredCorrectnessVerificationReport
      | undefined;
    if (existingReport !== undefined) {
      return outcomeFromResult(existingReport.result, candidateId, true);
    }
    return {
      outcome: "repository_error",
      candidateId,
      message: `Candidate '${candidateId}' is stored as 'correctness_check_passed' but no correctness-verification report exists for it.`,
    };
  }

  if (candidate.state !== "structural_validation_passed") {
    // Any other stored state (e.g. `generated`, `quarantined`,
    // `rejected/*`) is invalid for a candidate physically located in
    // `review-queue` under this gate's precondition. Deterministic,
    // side-effect-free refusal — no derivation, no report, no move.
    return {
      outcome: "invalid_lifecycle_state",
      candidateId,
      actualState: candidate.state.length > 0 ? candidate.state : "unknown",
    };
  }

  const structuralReportId = buildStructuralValidationReportId(candidateId);
  const structuralReport = (await repository.read("reports", structuralReportId)) as
    | StoredStructuralValidationReport
    | undefined;
  const structuralEvidence = structuralReport?.result.evidence;

  const rawProvenance =
    typeof candidate.provenance === "object" && candidate.provenance !== null
      ? (candidate.provenance as Record<string, unknown>)
      : undefined;
  const blueprintId = rawProvenance ? readStringField(rawProvenance, "blueprintId") : undefined;

  let blueprintHash: string | undefined;
  if (blueprintId !== undefined) {
    const blueprintRecord = await repository.read("blueprints", blueprintId);
    if (blueprintRecord !== undefined) {
      blueprintHash = hashJson(blueprintRecord);
    }
  }

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
