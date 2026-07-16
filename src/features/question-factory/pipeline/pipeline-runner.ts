import { FACTORY_LIMITS } from "../config";
import type { PipelineIssueCode } from "../config";
import { hashJson } from "../provenance";
import type { FactoryCompartment, FactoryRepository } from "../storage";
import { isCandidateState, TERMINAL_STATES, type CandidateState } from "../workflow";
import { acquireBatchLock, releaseBatchLock } from "./pipeline-batch-lock";
import { PIPELINE_STAGES } from "./pipeline-stages";
import type { GateResult, PerCandidateResult, PipelineRunOutcome, PipelineRunReport, PipelineRunRequest } from "./pipeline-types";

export interface PipelineRunOptions {
  /** Workspace root the batch lock lives under (sibling to `.locks/`) — a caller-supplied path, never derived from `repository` (the lock is deliberately standalone, not part of `FactoryRepository`). */
  readonly lockRoot: string;
  /** Overrides `acquireBatchLock`'s own defaults — primarily for tests that need to observe lock contention without waiting out the production default wait/staleness windows. */
  readonly lockMaxWaitMs?: number;
  readonly lockRetryDelayMs?: number;
  readonly lockStaleAgeMs?: number;
}

const CANDIDATE_READ_COMPARTMENTS: readonly FactoryCompartment[] = ["generated", "review-queue"];

/** `hashJson({pipelineRunId, batchId, candidateIds})` — order-sensitive by design (Mission 3C plan §7b/§15): a differently-ordered candidate list under the same `pipelineRunId` is treated as a materially different request. */
function computeRunFingerprint(request: PipelineRunRequest): string {
  return hashJson({ pipelineRunId: request.pipelineRunId, batchId: request.batchId, candidateIds: request.candidateIds });
}

function buildReportId(pipelineRunId: string): string {
  return `pipeline-run-${pipelineRunId}`;
}

function refused(issueCode: PipelineIssueCode, message: string): PipelineRunOutcome {
  return { status: "refused", issueCode, message };
}

/**
 * Pre-flight, whole-batch refusals (Mission 3C plan §7b) — checked before
 * the batch lock is even attempted, before any candidate is touched. The
 * only way one problem aborts the entire run rather than being isolated
 * to a single candidate.
 */
function preflightCheck(request: PipelineRunRequest): PipelineRunOutcome | undefined {
  if (request.candidateIds.length === 0) {
    return refused("invalid_arguments", "candidateIds must be a non-empty list.");
  }
  if (new Set(request.candidateIds).size !== request.candidateIds.length) {
    return refused("pipeline_duplicate_candidate_id", "candidateIds must not contain duplicate entries.");
  }
  if (request.candidateIds.length > FACTORY_LIMITS.MAX_CANDIDATES_PER_PIPELINE_RUN) {
    return refused(
      "pipeline_candidate_limit_exceeded",
      `At most ${FACTORY_LIMITS.MAX_CANDIDATES_PER_PIPELINE_RUN} candidates are permitted per pipeline run.`,
    );
  }
  return undefined;
}

async function readCandidateState(
  candidateId: string,
  repository: FactoryRepository,
): Promise<{ readonly state: CandidateState } | undefined> {
  for (const compartment of CANDIDATE_READ_COMPARTMENTS) {
    const raw = await repository.read(compartment, candidateId);
    if (raw === undefined) continue;
    if (typeof raw !== "object" || raw === null) continue;
    const stateValue = (raw as Record<string, unknown>).state;
    if (typeof stateValue === "string" && isCandidateState(stateValue)) {
      return { state: stateValue };
    }
  }
  return undefined;
}

async function processCandidate(candidateId: string, repository: FactoryRepository, dryRun: boolean): Promise<PerCandidateResult> {
  const startedAt = Date.now();
  const initial = await readCandidateState(candidateId, repository);
  if (initial === undefined) {
    return { candidateId, resultKind: "not_found", startState: "not_found", endState: "not_found", gateResults: [], durationMs: Date.now() - startedAt };
  }

  const startState = initial.state;
  const firstStage = PIPELINE_STAGES.find((stage) => stage.acceptsState === startState);
  if (TERMINAL_STATES.has(startState) || firstStage === undefined) {
    return { candidateId, resultKind: "ineligible_state", startState, endState: startState, gateResults: [], durationMs: Date.now() - startedAt };
  }

  const gateResults: GateResult[] = [];
  let currentState: CandidateState = startState;
  let advanced = false;

  try {
    if (dryRun) {
      // Simulated: exactly one stage is previewed (the first the
      // candidate is currently eligible for) — a dry run never advances
      // real state, so it cannot legitimately continue past that first
      // simulated stage into a hypothetical second one.
      const preview = await firstStage.preview(candidateId, repository);
      gateResults.push({
        gate: preview.gate,
        outcome: preview.outcome,
        ...(preview.evidenceFingerprint !== undefined ? { evidenceFingerprint: preview.evidenceFingerprint } : {}),
      });
      return { candidateId, resultKind: "advanced", startState, endState: startState, gateResults, durationMs: Date.now() - startedAt };
    }

    while (!TERMINAL_STATES.has(currentState)) {
      const stage = PIPELINE_STAGES.find((candidate) => candidate.acceptsState === currentState);
      if (stage === undefined) break;

      // The runner never trusts a value it computed itself for the next
      // iteration's eligibility check — only the just-completed stage's
      // own returned `endState`, which is the state that stage itself
      // just durably wrote (or, for a replay, just freshly read). This is
      // how "candidate reread before each gate" is satisfied without a
      // separate, possibly-stale reread of our own.
      const result = await stage.run(candidateId, repository);
      gateResults.push({
        gate: result.gate,
        outcome: result.outcome,
        ...(result.evidenceFingerprint !== undefined ? { evidenceFingerprint: result.evidenceFingerprint } : {}),
      });
      if (result.endState !== currentState) advanced = true;
      currentState = result.endState;
      if (result.outcome !== "passed") break;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      candidateId,
      resultKind: "error",
      startState,
      endState: currentState,
      gateResults: [
        ...gateResults,
        { gate: gateResults.at(-1)?.gate ?? "structural", outcome: "failed", evidenceFingerprint: message.slice(0, 200) },
      ],
      durationMs: Date.now() - startedAt,
    };
  }

  return {
    candidateId,
    resultKind: advanced ? "advanced" : "replayed",
    startState,
    endState: currentState,
    gateResults,
    durationMs: Date.now() - startedAt,
  };
}

async function writeReportIfAbsent(repository: FactoryRepository, reportId: string, report: PipelineRunReport): Promise<PipelineRunReport> {
  const existing = (await repository.read("reports", reportId)) as PipelineRunReport | undefined;
  if (existing !== undefined && existing.runFingerprint === report.runFingerprint) {
    return existing;
  }
  const createResult = await repository.create("reports", reportId, report);
  if (createResult.ok) return report;
  // Lost a genuine create race against an identical concurrent run —
  // whichever landed first is authoritative; re-read and trust it rather
  // than treating this as a failure (mirrors every other gate's
  // fingerprint-based replay idiom).
  const raced = (await repository.read("reports", reportId)) as PipelineRunReport | undefined;
  return raced ?? report;
}

/**
 * Mission 3C's batch orchestrator, unmodified by Mission 3D: drives an
 * explicit, caller-supplied, deterministically ordered candidate list
 * through the registered `PIPELINE_STAGES` (structural → correctness →
 * semantic → originality → difficulty, since Mission 3D) in one call.
 * Stops successful execution at `difficulty_review_passed` — staging and
 * publication are unconditionally Mission 3E's; `PIPELINE_STAGES` simply
 * has no further entry to advance into, so the loop naturally halts
 * there. This loop's own control flow required zero changes to grow from
 * three stages to five (Mission 3D plan §5a/§5d) — it is entirely
 * data-driven off `PIPELINE_STAGES`'s contents.
 *
 * **Candidate-isolated processing.** One candidate's ordinary gate
 * failure (rejected/quarantined/needs_revision) or an unexpected
 * exception never prevents reporting results for the rest of the batch —
 * only a pre-flight integrity failure (duplicate/empty/over-limit
 * candidate list) or a failure to acquire the batch lock aborts the whole
 * run (`status: "refused"`), and both happen *before* any candidate is
 * touched.
 *
 * **Replay.** A matching `runFingerprint` on an already-completed report
 * short-circuits before the batch lock is even attempted — the common
 * "safe replay of an already-completed run" case never contends for the
 * lock. Per-candidate replay requires no separate mechanism: each
 * wrapped gate orchestrator is already independently replay-safe, so the
 * loop naturally no-ops past an already-advanced candidate (no stage
 * accepts its current, already-later state).
 */
export async function runPipeline(
  request: PipelineRunRequest,
  repository: FactoryRepository,
  options: PipelineRunOptions,
): Promise<PipelineRunOutcome> {
  const preflightFailure = preflightCheck(request);
  if (preflightFailure !== undefined) return preflightFailure;

  const startedAt = new Date().toISOString();
  const runFingerprint = computeRunFingerprint(request);
  const reportId = buildReportId(request.pipelineRunId);

  const existingReport = (await repository.read("reports", reportId)) as PipelineRunReport | undefined;
  if (existingReport !== undefined) {
    if (existingReport.runFingerprint === runFingerprint) {
      return { status: "completed", report: existingReport };
    }
    return refused(
      "pipeline_run_id_conflict",
      `pipelineRunId '${request.pipelineRunId}' was already used for a different batchId/candidateIds set.`,
    );
  }

  const lockResult = await acquireBatchLock(options.lockRoot, request.batchId, request.pipelineRunId, runFingerprint, request.candidateIds, {
    ...(options.lockMaxWaitMs !== undefined ? { lockMaxWaitMs: options.lockMaxWaitMs } : {}),
    ...(options.lockRetryDelayMs !== undefined ? { lockRetryDelayMs: options.lockRetryDelayMs } : {}),
    ...(options.lockStaleAgeMs !== undefined ? { staleAgeMs: options.lockStaleAgeMs } : {}),
  });
  if (!lockResult.ok) {
    return refused(lockResult.issueCode, lockResult.message);
  }

  const candidateResults: PerCandidateResult[] = [];
  try {
    for (const candidateId of request.candidateIds) {
      candidateResults.push(await processCandidate(candidateId, repository, request.dryRun === true));
    }
  } finally {
    // Always runs — normal completion, every per-candidate error (already
    // isolated inside `processCandidate`'s own try/catch), and any
    // exception that somehow escapes the loop above. The only way this
    // lock is not released is the process being killed outright before
    // this block runs (plan §8's stale-lock diagnostic exists for
    // exactly that scenario).
    await releaseBatchLock(options.lockRoot, request.batchId, lockResult.handle.ownerToken);
  }

  const summary: Record<string, number> = {};
  for (const result of candidateResults) {
    summary[result.endState] = (summary[result.endState] ?? 0) + 1;
  }

  const report: PipelineRunReport = {
    pipelineRunId: request.pipelineRunId,
    batchId: request.batchId,
    startedAt,
    completedAt: new Date().toISOString(),
    simulated: request.dryRun === true,
    candidateResults,
    summary,
    runFingerprint,
  };

  // A dry run's report is never persisted — it is, by definition, a
  // simulation, and persisting it under the same `pipeline-run-<id>`
  // report id would make a later *real* run under the same
  // `pipelineRunId` collide with a fingerprint-matching-but-simulated
  // report and incorrectly short-circuit as "already complete."
  if (report.simulated) return { status: "completed", report };

  return { status: "completed", report: await writeReportIfAbsent(repository, reportId, report) };
}
