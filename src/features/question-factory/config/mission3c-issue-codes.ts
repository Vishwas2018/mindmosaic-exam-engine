/**
 * Closed Mission 3C issue-code catalogue (revision workflow, pipeline
 * runner). Every code is a fixed enum member — no candidate-derived value
 * is ever embedded into the code string itself, matching the discipline
 * `MISSION_3A_ISSUE_CODES`/`MISSION_3B_ISSUE_CODES` already follow;
 * candidate-specific detail belongs in the associated `message`, never the
 * code.
 *
 * **`revision_blueprint_missing` vs. `revision_blueprint_invalid` vs.
 * `revision_blueprint_mismatch` — three distinct failure classes, never
 * conflated:**
 * - `revision_blueprint_missing`: the parent's bound blueprint record does
 *   not exist in the `blueprints` compartment (or was unreadable/malformed
 *   at the storage layer, which `FactoryRepository.read()` already
 *   normalises to "absent") — a repository-integrity problem, not
 *   something the caller declared wrong.
 * - `revision_blueprint_invalid`: a blueprint record exists and was read,
 *   but does not conform to `blueprintSchema` (wrong top-level type,
 *   missing/wrongly-typed required field), declares a `skill` that does
 *   not resolve against the taxonomy registry, or declares a
 *   `questionType` with no registered renderer — also a repository-
 *   integrity problem, distinguished from "missing" only by whether a
 *   record was found at all. Deliberately narrower than the full
 *   blueprint-authoring validator (`validateBlueprint`): only the two
 *   sub-checks the revision-boundary comparator itself depends on are
 *   enforced here, not `validateBlueprint`'s broader curation-quality
 *   checks (recommended type for skill, difficulty support, etc.).
 * - `revision_blueprint_mismatch`: the bound blueprint resolves cleanly
 *   and validly, but either the caller's declared `parentBlueprintHash`
 *   does not match it (wrong identity) or the revised content itself is
 *   incompatible with it (a valid blueprint, an invalid pairing). This is
 *   the only one of the three describing a problem with the *caller's
 *   request*, not the *repository's stored state* — the other two must
 *   never be reported under this code, even though all three ultimately
 *   refuse the same request.
 */
export const REVISION_ISSUE_CODES = [
  "malformed_revision_request",
  "unknown_parent_candidate",
  "invalid_revision_source_state",
  "stale_revision_parent",
  "revision_blueprint_missing",
  "revision_blueprint_invalid",
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
