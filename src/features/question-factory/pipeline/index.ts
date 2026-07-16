/**
 * Mission 3C pipeline-runner domain. Placed as a sibling of `workflow/`,
 * `correctness/`, `review/`, `validation/` — not nested inside
 * `workflow/` as the plan's original file-path sketch proposed — because
 * the runner must call `orchestrateStructuralValidation`,
 * `orchestrateCorrectnessVerification`, and `attemptSemanticReviewTransition`,
 * each of which already imports the `workflow/` barrel; nesting the
 * runner inside `workflow/` would make `workflow/index.ts` transitively
 * import back into itself through this module — a real circular import,
 * exactly the class of defect Mission 3B's `workflow/semantic-classification.ts`
 * took deliberate care to avoid. Every contract, type shape, and stage
 * registry design is otherwise unchanged from the plan.
 *
 * Deliberately narrow exports: `runPipeline` and its request/outcome
 * contract are public; `PIPELINE_STAGES`, `acquireBatchLock`, and
 * `releaseBatchLock` are exported for direct testing in isolation, not
 * for general call sites (the runner itself is the sanctioned caller of
 * all three).
 */
export { acquireBatchLock, releaseBatchLock } from "./pipeline-batch-lock";
export type {
  AcquireBatchLockOptions,
  AcquireBatchLockResult,
  PipelineBatchLockAmbiguousDiagnostic,
  PipelineBatchLockHandle,
  PipelineBatchLockRecord,
} from "./pipeline-batch-lock";
export { runPipeline } from "./pipeline-runner";
export type { PipelineRunOptions } from "./pipeline-runner";
export { PIPELINE_STAGES } from "./pipeline-stages";
export type { PipelineStage } from "./pipeline-stages";
export type {
  GateResult,
  PerCandidateResult,
  PerCandidateResultKind,
  PipelineRunOutcome,
  PipelineRunReport,
  PipelineRunRequest,
} from "./pipeline-types";
