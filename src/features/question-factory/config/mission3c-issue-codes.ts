/**
 * Closed Mission 3C issue-code catalogue (revision workflow, pipeline
 * runner). Every code is a fixed enum member — no candidate-derived value
 * is ever embedded into the code string itself, matching the discipline
 * `MISSION_3A_ISSUE_CODES`/`MISSION_3B_ISSUE_CODES` already follow;
 * candidate-specific detail belongs in the associated `message`, never the
 * code.
 */
export const REVISION_ISSUE_CODES = [
  "malformed_revision_request",
  "unknown_parent_candidate",
  "invalid_revision_source_state",
  "stale_revision_parent",
  "revision_blueprint_mismatch",
  "revision_limit_exhausted",
  "revision_no_material_change",
  "unsupported_author_identity",
  "revision_request_conflict",
  "revision_parent_conflict",
  "repository_error",
] as const;
export type RevisionIssueCode = (typeof REVISION_ISSUE_CODES)[number];

export const PIPELINE_ISSUE_CODES = [
  "invalid_arguments",
  "pipeline_duplicate_candidate_id",
  "pipeline_candidate_limit_exceeded",
  "pipeline_batch_lock_held",
  "pipeline_batch_lock_held_ambiguous",
  "pipeline_run_id_conflict",
  "pipeline_repository_error",
] as const;
export type PipelineIssueCode = (typeof PIPELINE_ISSUE_CODES)[number];

export const MISSION_3C_ISSUE_CODES = [
  ...REVISION_ISSUE_CODES,
  ...PIPELINE_ISSUE_CODES,
] as const;
export type Mission3CIssueCode = (typeof MISSION_3C_ISSUE_CODES)[number];
