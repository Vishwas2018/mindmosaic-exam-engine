import { createHash } from "node:crypto";

import { FACTORY_THRESHOLDS } from "../config";
import { hashJson } from "../provenance";
import type { FactoryCompartment, FactoryRepository, MoveResult } from "../storage";
import { authoritativeCompartmentsForState, compartmentForState } from "../storage";
import {
  applyTransition,
  decideGateFailureOutcome,
  isCandidateState,
  isGateFailureOutcome,
  isReachableFrom,
  type CandidateState,
} from "../workflow";
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
 * ever have held here is `"generated"`.
 */
const PRE_STAMP_STALE_STATE = "generated";

/**
 * The common ancestor of every post-generation gate-outcome state
 * (`structural_validation_passed`, `correctness_check_passed`, ...,
 * `needs_revision`, `rejected`, `quarantined`, `staged`, `published`,
 * `archived`) in the authoritative transition graph. `blueprint_created` is
 * the only real `CandidateState` not reachable from it — used below to
 * distinguish "an earlier/unrelated state" (`unrelated_conflict`) from "a
 * real gate-outcome state that just isn't physically consistent with where
 * it was found" (`compartment_state_conflict`).
 */
const PIPELINE_ROOT_STATE: CandidateState = "generated";

type DestinationClassification =
  | { readonly kind: "matches_target" }
  | { readonly kind: "stale"; readonly record: Record<string, unknown>; readonly contentHash: string }
  | { readonly kind: "successfully_advanced" }
  | { readonly kind: "downstream_non_success"; readonly state: CandidateState }
  | { readonly kind: "compartment_state_conflict"; readonly message: string }
  | { readonly kind: "unrelated_conflict"; readonly message: string };

/**
 * Classifies a destination record reread against the state
 * `replayWithStateRepair` is trying to (re)stamp — shared by the initial
 * read and by the post-conflict recheck below, so both apply the exact
 * same rules. Every rule is derived from existing authoritative workflow
 * metadata (the transition graph, the state-to-compartment mapping, and
 * the closed set of non-success gate outcomes) — never a hand-maintained
 * parallel notion of lifecycle order:
 *
 * - `matches_target`: the record already carries `transitionTarget` — a
 *   prior attempt (this one or another) already completed the repair.
 * - `stale`: the record still carries the known pre-stamp stale value
 *   (`"generated"`) — the crash window this function exists to repair.
 * - `unrelated_conflict`: the state is not a real `CandidateState` at all
 *   (malformed/unknown), or is not reachable from `PIPELINE_ROOT_STATE` —
 *   an earlier or otherwise unrelated state (e.g. `blueprint_created`),
 *   never a legitimate later-gate outcome for this candidate's lineage.
 * - `compartment_state_conflict`: the state *is* a real, reachable
 *   gate-outcome state, but its own authoritative compartment
 *   (`authoritativeCompartmentsForState`) does not include the physical
 *   compartment the record was actually found in (e.g. `rejected` or
 *   `quarantined` found sitting in `review-queue`, or a later *success*
 *   state found sitting in a *rejection* compartment). The record's own
 *   claimed state and its physical location disagree — never treated as
 *   success, never repaired.
 * - `downstream_non_success`: the state is reachable, physically
 *   consistent with where it was found, but is itself one of the closed
 *   `GateFailureOutcome` values (`isGateFailureOutcome`) — `rejected`,
 *   `needs_revision`, or `quarantined` reached by a *later* gate. This can
 *   be physically valid (e.g. `needs_revision` legitimately shares
 *   `review-queue` with the passed states), but it is never equivalent to
 *   successful advancement and must never be replayed as a cached pass.
 * - `successfully_advanced`: reachable, physically consistent, and not a
 *   non-success outcome — a later gate has legitimately progressed this
 *   candidate further while sharing the same physical compartment (e.g.
 *   `correctness_check_passed`, which shares `review-queue` with
 *   `structural_validation_passed`). Safe to replay the cached structural
 *   result; never overwritten.
 */
function classifyDestinationRecord(
  destinationRaw: unknown,
  transitionTarget: CandidateState,
  candidateId: string,
  destinationCompartment: FactoryCompartment,
): DestinationClassification {
  if (typeof destinationRaw !== "object" || destinationRaw === null) {
    return {
      kind: "unrelated_conflict",
      message: `Structural-validation report exists for '${candidateId}' but no record was found in the expected destination compartment '${destinationCompartment}'.`,
    };
  }
  const record = destinationRaw as Record<string, unknown>;
  const state = readStringField(record, "state") ?? "";

  if (state === transitionTarget) {
    return { kind: "matches_target" };
  }
  if (state === PRE_STAMP_STALE_STATE) {
    return { kind: "stale", record, contentHash: hashJson(record) };
  }
  if (!isCandidateState(state) || !isReachableFrom(PIPELINE_ROOT_STATE, state)) {
    return {
      kind: "unrelated_conflict",
      message: `Structural-validation report for '${candidateId}' expects state '${transitionTarget}' in '${destinationCompartment}', but the stored record's own state is '${state || "unknown"}' — neither the known pre-stamp stale value ('${PRE_STAMP_STALE_STATE}') nor a real state reachable from '${PIPELINE_ROOT_STATE}', so this is treated as an unrelated conflict rather than repaired.`,
    };
  }

  const authoritativeCompartments = authoritativeCompartmentsForState(state);
  if (!authoritativeCompartments.includes(destinationCompartment)) {
    return {
      kind: "compartment_state_conflict",
      message: `Structural-validation report for '${candidateId}' expects state '${transitionTarget}' in '${destinationCompartment}', but the stored record's own state is '${state}', whose authoritative compartment(s) (${authoritativeCompartments.join(", ") || "none"}) do not include '${destinationCompartment}' — the claimed state and its physical location disagree, so this is treated as a compartment/state conflict rather than repaired or replayed as success.`,
    };
  }

  if (isGateFailureOutcome(state)) {
    return { kind: "downstream_non_success", state };
  }
  return { kind: "successfully_advanced" };
}

/**
 * A retry can land here after a prior attempt already moved the candidate
 * out of `generated` but crashed (or hit a transient repository error)
 * before the state-stamp `update()` call landed — the report is written,
 * the candidate physically lives in its destination compartment, but its
 * own `state` field still reads `"generated"`. Replaying the cached report
 * without checking this would report success forever while the record
 * stays permanently unreachable to any gate that requires
 * `state === transitionTarget`.
 *
 * The repair write itself is bound to the exact record this function
 * reread via `expectedContentHash` (the same optimistic-concurrency
 * pattern `orchestrate-correctness-verification.ts`'s `attemptUpdate` uses
 * for its own same-compartment pass transition): if the destination
 * changes between this reread and the guarded `update()` call — e.g.
 * another retry repairs it first, or correctness verification advances it
 * to `correctness_check_passed` in the same `review-queue` compartment —
 * the repository refuses the write as a content-hash mismatch instead of
 * serialising a stale overwrite through the lock. On that refusal, the
 * destination is reread and reclassified: an already-matching or
 * legitimately-advanced state is treated as a safe, no-rollback replay;
 * anything else fails safely as a repository error.
 */
/**
 * Converts every non-`"stale"` classification into a final orchestration
 * outcome. `"matches_target"` and `"successfully_advanced"` are both safe
 * to replay as the cached structural result — the candidate's structural
 * validation genuinely did produce that result, whether or not a later
 * gate has since progressed it further. `"downstream_non_success"`,
 * `"compartment_state_conflict"`, and `"unrelated_conflict"` all fail
 * safely as `repository_error`: the orchestration contract has no variant
 * that can represent "structural validation passed historically, but the
 * candidate now has a downstream non-success state" without risking a
 * caller reading it as present-tense success, so the existing
 * `repository_error` outcome — already understood by every caller as "do
 * not treat this as a pass" — is used instead of inventing one.
 */
function outcomeForClassification(
  candidateId: string,
  report: StoredStructuralValidationReport,
  classification: Exclude<DestinationClassification, { readonly kind: "stale" }>,
): StructuralValidationOrchestrationOutcome {
  switch (classification.kind) {
    case "matches_target":
    case "successfully_advanced":
      return replayOutcome(candidateId, report);
    case "downstream_non_success":
      return {
        outcome: "repository_error",
        candidateId,
        message: `Structural validation for '${candidateId}' passed historically, but the candidate has since reached the downstream non-success state '${classification.state}' in a later gate. Cached structural success cannot be safely replayed as the candidate's current status.`,
      };
    case "compartment_state_conflict":
    case "unrelated_conflict":
      return { outcome: "repository_error", candidateId, message: classification.message };
  }
}

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
  const classification = classifyDestinationRecord(destinationRaw, transitionTarget, candidateId, destinationCompartment);

  if (classification.kind !== "stale") {
    return outcomeForClassification(candidateId, report, classification);
  }

  // classification.kind === "stale": attempt the guarded repair, bound to
  // the exact bytes just reread so a genuine out-of-band change between
  // this read and the write is refused, never silently overwritten.
  const stateStampedRecord: Record<string, unknown> = { ...classification.record, state: transitionTarget };
  const repairResult = await repository.update(destinationCompartment, candidateId, stateStampedRecord, {
    expectedContentHash: classification.contentHash,
  });

  if (repairResult.ok) {
    return replayOutcome(candidateId, report);
  }
  if (repairResult.reason !== "state_mismatch") {
    // A transient failure (lock timeout) or the record vanished entirely
    // (source_missing) between the read above and this write — neither is
    // a race this function can safely resolve by reclassifying, so fail
    // through as before.
    return { outcome: "repository_error", candidateId, message: repairResult.message };
  }

  // The guard tripped: something changed the destination between the read
  // above and this write. Reread and reclassify rather than assuming the
  // worst — the most likely cause is exactly the race this fix defends
  // against: another retry completed the same repair, or a later gate
  // (e.g. correctness verification) legitimately advanced the candidate
  // further within the same compartment. Either way, this attempt must
  // never overwrite what actually happened.
  const recheckRaw = await repository.read(destinationCompartment, candidateId);
  const recheck = classifyDestinationRecord(recheckRaw, transitionTarget, candidateId, destinationCompartment);
  if (recheck.kind !== "stale") {
    return outcomeForClassification(candidateId, report, recheck);
  }
  // recheck.kind === "stale" again: the record still disagrees and is
  // still exactly the pre-stamp stale value — report the original
  // content-hash-guard refusal rather than looping; a subsequent orchestrator
  // call will retry this same repair from scratch.
  return { outcome: "repository_error", candidateId, message: repairResult.message };
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
