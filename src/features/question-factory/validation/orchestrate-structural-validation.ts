import { createHash } from "node:crypto";

import { FACTORY_THRESHOLDS } from "../config";
import { hashJson } from "../provenance";
import type { FactoryRepository, MoveResult } from "../storage";
import { compartmentForState } from "../storage";
import { applyTransition, decideGateFailureOutcome, type CandidateState } from "../workflow";
import { validateCandidateStructure } from "./validate-candidate-structure";
import type {
  QuestionFactoryCandidate,
  StructuralValidationEvidence,
  StructuralValidationIssue,
  StructuralValidationResult,
} from "./types";

/**
 * Deterministic, id-only (no content-dependent) report key, distinct from
 * `candidateId` itself so it can never collide with a real candidate id in
 * the shared `reports` compartment namespace. Not content-addressed —
 * unlike `mintCandidateId`, this key must stay stable across repeated
 * validation attempts against the *same* candidate so a retry finds the
 * same report rather than minting a new one.
 */
export function buildStructuralValidationReportId(candidateId: string): string {
  const digest = createHash("sha256").update(candidateId, "utf8").digest("hex").slice(0, 40);
  return `sv-${digest}`;
}

export interface StoredStructuralValidationReport {
  readonly candidateId: string;
  readonly result: StructuralValidationResult;
}

export interface ExpectedCandidateBinding {
  readonly contentHash?: string;
  readonly revision?: number;
  readonly blueprintId?: string;
}

export interface OrchestrateStructuralValidationOptions {
  /** Caller-supplied, ISO 8601 — the orchestration layer owns the wall-clock read, never the pure validator. */
  readonly validatedAt: string;
  /** What the caller already knew about this candidate from an earlier read, if any — forwarded into staleness checks. */
  readonly expected?: ExpectedCandidateBinding;
}

export type StructuralValidationOrchestrationOutcome =
  | {
      readonly outcome: "passed";
      readonly candidateId: string;
      readonly evidence: StructuralValidationEvidence;
      readonly replayed: boolean;
    }
  | {
      readonly outcome: "rejected";
      readonly candidateId: string;
      readonly issues: readonly StructuralValidationIssue[];
      readonly evidence: StructuralValidationEvidence;
      readonly replayed: boolean;
    }
  | { readonly outcome: "not_found"; readonly candidateId: string }
  | { readonly outcome: "not_generated"; readonly candidateId: string; readonly actualState: string }
  | { readonly outcome: "repository_error"; readonly candidateId: string; readonly message: string };

/**
 * Structural validation is a set of deterministic, literal checks with no
 * "cannot decide" outcome, so a failure is always `hard_fail` — never
 * `soft_fail`/`uncertain` — which `decideGateFailureOutcome` always maps to
 * `"rejected"` regardless of revision count. Shared by the fresh-validation
 * path and the replay path so both agree on the same destination compartment.
 */
function resolveTransitionTarget(result: StructuralValidationResult): CandidateState {
  return result.status === "passed"
    ? "structural_validation_passed"
    : decideGateFailureOutcome({
        severity: "hard_fail",
        revisionCount: result.evidence.candidateRevision,
        maxRevisions: FACTORY_THRESHOLDS.MAX_REVISIONS,
      });
}

function replayOutcome(
  candidateId: string,
  report: StoredStructuralValidationReport,
): StructuralValidationOrchestrationOutcome {
  if (report.result.status === "passed") {
    return { outcome: "passed", candidateId, evidence: report.result.evidence, replayed: true };
  }
  return {
    outcome: "rejected",
    candidateId,
    issues: report.result.issues,
    evidence: report.result.evidence,
    replayed: true,
  };
}

/**
 * The exact stale value the relocated record's own `state` field can be
 * left holding when a prior attempt's `move()` succeeded but the
 * subsequent state-stamp `update()` crashed or failed transiently: `move()`
 * relocates bytes verbatim, so the only value the pre-move record could
 * ever have held here is `"generated"`. Any *other* mismatch against the
 * expected `transitionTarget` is not this crash window — it means the
 * physical record disagrees with the report for some other reason (e.g. a
 * later gate sharing the same compartment already advanced it past
 * `structural_validation_passed`) and must never be overwritten.
 */
const PRE_STAMP_STALE_STATE = "generated";

/**
 * A retry can land here after a prior attempt already moved the candidate
 * out of `generated` but crashed (or hit a transient repository error)
 * before the state-stamp `update()` call landed — the report is written,
 * the candidate physically lives in its destination compartment, but its
 * own `state` field still reads `"generated"`. Replaying the cached report
 * without checking this would report success forever while the record
 * stays permanently unreachable to any gate that requires
 * `state === transitionTarget`. So before replaying, reread the record from
 * the compartment the report says it should be in and repair the stamp —
 * but only when the mismatch is exactly that known stale value; any other
 * mismatch is treated as a conflict and refused rather than silently
 * overwritten, since it could mean a later gate already progressed this
 * candidate further within the same physical compartment.
 */
async function replayWithStateRepair(
  candidateId: string,
  report: StoredStructuralValidationReport,
  repository: FactoryRepository,
): Promise<StructuralValidationOrchestrationOutcome> {
  const transitionTarget = resolveTransitionTarget(report.result);
  const destinationCompartment = compartmentForState(
    transitionTarget,
    transitionTarget === "rejected" ? "structural" : undefined,
  );
  if (!destinationCompartment) {
    return {
      outcome: "repository_error",
      candidateId,
      message: `No storage compartment is defined for lifecycle state '${transitionTarget}'.`,
    };
  }

  const destinationRaw = await repository.read(destinationCompartment, candidateId);
  if (typeof destinationRaw !== "object" || destinationRaw === null) {
    return {
      outcome: "repository_error",
      candidateId,
      message: `Structural-validation report exists for '${candidateId}' but no record was found in the expected destination compartment '${destinationCompartment}'.`,
    };
  }
  const destinationRecord = destinationRaw as Record<string, unknown>;
  const destinationState = readStringField(destinationRecord, "state") ?? "";

  if (destinationState !== transitionTarget) {
    if (destinationState !== PRE_STAMP_STALE_STATE) {
      return {
        outcome: "repository_error",
        candidateId,
        message: `Structural-validation report for '${candidateId}' expects state '${transitionTarget}' in '${destinationCompartment}', but the stored record's own state is '${destinationState || "unknown"}' — not the known pre-stamp stale value ('${PRE_STAMP_STALE_STATE}'), so this is treated as a conflict rather than repaired.`,
      };
    }
    const stateStampedRecord: Record<string, unknown> = { ...destinationRecord, state: transitionTarget };
    const repairResult = await repository.update(destinationCompartment, candidateId, stateStampedRecord);
    if (!repairResult.ok) {
      return { outcome: "repository_error", candidateId, message: repairResult.message };
    }
  }

  return replayOutcome(candidateId, report);
}

function readStringField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

/**
 * Writes the evidence report if absent; if a report already exists for
 * this candidate, treats a matching `validationFingerprint` as a safe
 * no-op replay (reuses the existing report, writes nothing new) and a
 * differing one as a genuine conflict rather than silently overwriting —
 * mirroring the read-before-write replay discipline `ingestLegacyQuestions`
 * already uses for the `generated` compartment.
 *
 * Because `validationFingerprint` deliberately excludes `validatedAt` (see
 * `evidence.ts`), a retry that only differs by wall-clock time — e.g. a
 * fresh call after a prior repository-move failure left the report
 * written but the candidate un-moved — always matches the existing
 * report here and falls into the `alreadyPresent: true` branch, letting
 * the caller retry the move. Only a real change to a stable validation
 * fact (candidate content, revision, blueprint, issue set, or
 * validator/schema/taxonomy version) produces a differing fingerprint and
 * the conflict branch below.
 */
async function writeReportIfAbsent(
  repository: FactoryRepository,
  reportId: string,
  report: StoredStructuralValidationReport,
): Promise<{ readonly ok: true; readonly alreadyPresent: boolean } | { readonly ok: false; readonly message: string }> {
  const existing = (await repository.read("reports", reportId)) as StoredStructuralValidationReport | undefined;
  if (existing !== undefined) {
    if (existing.result.evidence.validationFingerprint === report.result.evidence.validationFingerprint) {
      return { ok: true, alreadyPresent: true };
    }
    return {
      ok: false,
      message: `A different structural-validation report already exists for candidate '${report.candidateId}' — its validation fingerprint (candidate content, revision, blueprint, issue set, or validator/schema/taxonomy version) no longer matches the stored report, indicating the candidate genuinely changed between validation attempts. This is not a timestamp difference: 'validatedAt' is excluded from the fingerprint precisely so a retry with a fresh timestamp alone never triggers this conflict.`,
    };
  }
  const createResult = await repository.create("reports", reportId, report);
  if (!createResult.ok) {
    return { ok: false, message: createResult.message };
  }
  return { ok: true, alreadyPresent: false };
}

/**
 * Lifecycle orchestration for the structural-validation gate: reads a
 * `generated` candidate, confirms it still matches whatever the caller
 * already knew about it, runs the pure `validateCandidateStructure`, and
 * transactionally moves the candidate through `FactoryRepository.move()` —
 * to `structural_validation_passed` (compartment `review-queue`) on pass,
 * or to `rejected` (compartment `rejected/structural`) on failure.
 * Evidence is stored as a separate report record (compartment `reports`,
 * keyed by a deterministic id derived from `candidateId`) rather than
 * mutated into the candidate record itself: `FactoryRepository.move()`
 * relocates a candidate's existing bytes unchanged (it is not an update
 * operation), so evidence storage and candidate relocation are
 * deliberately two records, not one.
 *
 * Idempotent and replay-safe: a second call against a candidate this
 * function already moved out of `generated` finds the stored report and
 * returns the same outcome without re-validating, re-moving, or writing a
 * duplicate report. Before trusting that replay, it rereads the candidate's
 * own record from the destination compartment the report implies and
 * repairs the `state` field if a prior attempt moved the candidate but
 * crashed before stamping it — see `replayWithStateRepair`. Never transitions a candidate past
 * `structural_validation_passed` — later gates (correctness, semantic,
 * originality, difficulty, staging, publication) are out of scope for this
 * function entirely, by construction: it only ever calls `applyTransition`
 * with `to` fixed to `structural_validation_passed` or `rejected`.
 *
 * Also recoverable from a *partial* failure: if the report write succeeds
 * but the subsequent `repository.move()` call fails (a transient
 * repository error), the candidate is left exactly where it started
 * (`generated`) with the report already durably written. A retry —
 * necessarily with a fresh `validatedAt`, since the caller owns the
 * wall-clock read — re-validates, recomputes an evidence record whose
 * `validationFingerprint` matches the stored report (fingerprints exclude
 * `validatedAt` by design; see `evidence.ts`), reuses that report via
 * `writeReportIfAbsent`'s `alreadyPresent` branch instead of writing a
 * duplicate, and retries the move. If the candidate genuinely changed in
 * the meantime, the fingerprints differ and the retry is rejected with
 * `repository_error` instead of silently proceeding.
 */
export async function orchestrateStructuralValidation(
  candidateId: string,
  repository: FactoryRepository,
  options: OrchestrateStructuralValidationOptions,
): Promise<StructuralValidationOrchestrationOutcome> {
  const reportId = buildStructuralValidationReportId(candidateId);

  const generatedRaw = await repository.read("generated", candidateId);
  if (generatedRaw === undefined) {
    const existingReport = (await repository.read("reports", reportId)) as
      | StoredStructuralValidationReport
      | undefined;
    if (existingReport !== undefined) {
      return replayWithStateRepair(candidateId, existingReport, repository);
    }
    return { outcome: "not_found", candidateId };
  }

  if (typeof generatedRaw !== "object" || generatedRaw === null) {
    return { outcome: "repository_error", candidateId, message: "Stored 'generated' record is not an object." };
  }
  const record = generatedRaw as Record<string, unknown>;
  const state = readStringField(record, "state") ?? "";
  if (state !== "generated") {
    return { outcome: "not_generated", candidateId, actualState: state.length > 0 ? state : "unknown" };
  }

  const rawIngestion = record.ingestion;
  const ingestion =
    typeof rawIngestion === "object" && rawIngestion !== null
      ? { sourcePath: readStringField(rawIngestion as Record<string, unknown>, "sourcePath") }
      : undefined;

  const candidate: QuestionFactoryCandidate = {
    candidateId,
    state,
    question: record.question,
    provenance: record.provenance,
    ...(ingestion ? { ingestion } : {}),
  };

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

  const result = validateCandidateStructure(candidate, {
    validatedAt: options.validatedAt,
    ...(options.expected?.contentHash !== undefined
      ? { expectedContentHash: options.expected.contentHash }
      : {}),
    ...(options.expected?.revision !== undefined ? { expectedRevision: options.expected.revision } : {}),
    ...(options.expected?.blueprintId !== undefined
      ? { expectedBlueprintId: options.expected.blueprintId }
      : {}),
    ...(blueprintHash !== undefined ? { blueprintHash } : {}),
  });

  const transitionTarget: CandidateState = resolveTransitionTarget(result);

  const transition = applyTransition("generated", transitionTarget, {
    revisionCount: result.evidence.candidateRevision,
    maxRevisions: FACTORY_THRESHOLDS.MAX_REVISIONS,
  });
  if (!transition.ok) {
    return { outcome: "repository_error", candidateId, message: transition.message };
  }

  const destinationCompartment = compartmentForState(
    transitionTarget,
    transitionTarget === "rejected" ? "structural" : undefined,
  );
  if (!destinationCompartment) {
    return {
      outcome: "repository_error",
      candidateId,
      message: `No storage compartment is defined for lifecycle state '${transitionTarget}'.`,
    };
  }

  const report: StoredStructuralValidationReport = { candidateId, result };
  const reportOutcome = await writeReportIfAbsent(repository, reportId, report);
  if (!reportOutcome.ok) {
    return { outcome: "repository_error", candidateId, message: reportOutcome.message };
  }

  let moveResult: MoveResult;
  try {
    moveResult = await repository.move(candidateId, "generated", destinationCompartment);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { outcome: "repository_error", candidateId, message: `Repository move failed: ${message}` };
  }
  if (!moveResult.ok) {
    return { outcome: "repository_error", candidateId, message: moveResult.message };
  }

  // Stamp the relocated record's own `state` field with the transition
  // target, in its new compartment. `move()` relocates existing bytes
  // verbatim and never rewrites their content, so without this the
  // relocated record would still read back `state: "generated"` —
  // indistinguishable, to a downstream gate sharing the same compartment
  // for two different states (e.g. correctness verification's
  // `review-queue`, which holds both `structural_validation_passed` and
  // `correctness_check_passed`), from a record that was never validated
  // at all. Done *after* the move (not before, in `generated`) so a retry
  // following a state-update failure still finds the candidate absent
  // from `generated` and correctly resolves via the report-replay path
  // above, rather than being misread as "never validated" by the
  // `state !== "generated"` precondition check at the top of this
  // function. Idempotent: `update()`'s content-hash check makes a retry
  // of this same stamp a safe no-op.
  const stateStampedRecord: Record<string, unknown> = { ...record, state: transitionTarget };
  const stateUpdateResult = await repository.update(destinationCompartment, candidateId, stateStampedRecord);
  if (!stateUpdateResult.ok) {
    return { outcome: "repository_error", candidateId, message: stateUpdateResult.message };
  }

  const replayed = reportOutcome.alreadyPresent || moveResult.replayed || stateUpdateResult.replayed;
  if (result.status === "passed") {
    return { outcome: "passed", candidateId, evidence: result.evidence, replayed };
  }
  return { outcome: "rejected", candidateId, issues: result.issues, evidence: result.evidence, replayed };
}
