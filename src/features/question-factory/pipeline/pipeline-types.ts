import type { PipelineIssueCode } from "../config";
import type { CandidateState } from "../workflow";

import type { PilotConfig } from "./pilot-gate";

/**
 * `runPipeline`'s input contract (Mission 3C plan §7b). `candidateIds` is
 * REQUIRED and non-empty, processed in exactly the order given — the
 * runner performs no sort, no discovery, no compartment scan.
 * Determinism is the caller's obligation; the runner's obligation is to
 * introduce none of its own. Automatic compartment/batch discovery is
 * explicitly deferred, not built in Mission 3C.
 */
export interface PipelineRunRequest {
  readonly pipelineRunId: string;
  readonly batchId: string;
  readonly candidateIds: readonly string[];
  readonly dryRun?: boolean;
  /** When set, this run is evaluated as a pilot for the given domain. Fails closed if thresholds not met. */
  readonly pilot?: PilotConfig;
}

export interface GateResult {
  readonly gate: "structural" | "correctness" | "semantic" | "originality" | "difficulty";
  /**
   * `"correctness_deferred_to_independent_review"` is produced only by the
   * `correctness` gate, only for `semantic_objective`/`manual_review_writing`
   * content (`orchestrateCorrectnessVerification`'s
   * `"passed_pending_semantic_review"` outcome — see its own doc comment).
   * No correctness check actually ran for that content: only structural/
   * schema validity and (for a non-manual answer key) that the *declared*
   * answer key is internally self-consistent with the question's own
   * options were confirmed. It is deliberately never folded into plain
   * `"passed"`, which every other gate/outcome here reserves for cases
   * where a check genuinely ran and found no contradiction — collapsing
   * the two made every report and CLI printout that showed this field
   * claim a correctness check had passed when none had run.
   */
  readonly outcome: "passed" | "correctness_deferred_to_independent_review" | "failed" | "quarantined";
  readonly evidenceFingerprint?: string;
}

export type PerCandidateResultKind = "advanced" | "replayed" | "not_found" | "ineligible_state" | "error";

export interface PerCandidateResult {
  readonly candidateId: string;
  readonly resultKind: PerCandidateResultKind;
  readonly startState: CandidateState | "not_found";
  readonly endState: CandidateState | "not_found";
  readonly gateResults: readonly GateResult[];
  readonly durationMs: number;
}

export interface PipelineRunReport {
  readonly pipelineRunId: string;
  readonly batchId: string;
  readonly startedAt: string;
  readonly completedAt: string;
  /** True for a dry run: every entry in `candidateResults` reflects a simulated, non-mutating preview. */
  readonly simulated: boolean;
  readonly candidateResults: readonly PerCandidateResult[];
  /**
   * Keyed by literal `endState` (or `"not_found"`) — deliberately
   * open-ended rather than a fixed `{staged, rejected, quarantined,
   * needsRevision}` shape, since Mission 3C's runner never reaches
   * `staged`. Mission 3D's two additional reachable end-states
   * (`originality_review_passed`, `difficulty_review_passed`) appear
   * automatically once reachable, with no `PipelineRunReport` schema
   * version bump required.
   */
  readonly summary: Readonly<Record<string, number>>;
  /** `hashJson({pipelineRunId, batchId, candidateIds})` — order-sensitive by design (see the plan's §7b/§15), excludes `startedAt`/`completedAt`. */
  readonly runFingerprint: string;
}

/**
 * `runPipeline`'s top-level result — a typed discriminated union, matching
 * every other orchestrator's convention in this codebase (`ReviseOutcome`,
 * `ReviewIngestionOutcome`, `ManualIngestionRunOutcome`). `"refused"` is
 * reserved for the *pre-flight, whole-batch* refusals (§7b): an invalid
 * candidate list, or a batch lock that could not be acquired — the only
 * two ways one problem aborts the entire run rather than being isolated
 * to a single candidate's own `PerCandidateResult`. No candidate is ever
 * touched before a `"refused"` outcome is returned.
 */
export type PipelineRunOutcome =
  | { readonly status: "completed"; readonly report: PipelineRunReport }
  | { readonly status: "refused"; readonly issueCode: PipelineIssueCode; readonly message: string };
