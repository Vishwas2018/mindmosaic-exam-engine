/**
 * Governed staging gate (Mission 3E, first hop): moves a candidate whose
 * difficulty-review evidence still validates against its current content
 * from `difficulty_review_passed` into the single-purpose `staged`
 * compartment. Deliberately narrow exports, mirroring every other gate
 * module's convention in this codebase (`originality/index.ts`,
 * `difficulty/index.ts`): the orchestration function and its contract are
 * public.
 */
export { orchestrateStaging } from "./orchestrate-staging";
export type { StagingIssue, StagingOutcome } from "./orchestrate-staging";
