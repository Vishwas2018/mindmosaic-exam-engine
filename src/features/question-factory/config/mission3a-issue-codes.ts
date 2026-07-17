/**
 * Closed Mission 3A issue-code catalogue (generation, prompt-pack,
 * ingestion). Every code is a fixed enum member — no candidate-derived
 * value is ever embedded into the code string itself, matching the
 * discipline `STRUCTURAL_VALIDATION_ISSUE_CODES` /
 * `CORRECTNESS_VERIFICATION_ISSUE_CODES` already follow; candidate-specific
 * detail belongs in the associated `message`, never the code.
 */
export const GENERATION_ISSUE_CODES = [
  "unsupported_blueprint",
  "generation_failed",
  "generation_resource_limit_exceeded",
  "generated_candidate_invalid",
] as const;
export type GenerationIssueCode = (typeof GENERATION_ISSUE_CODES)[number];

export const PROMPT_ISSUE_CODES = [
  "prompt_blueprint_invalid",
  "prompt_pack_limit_exceeded",
  "prompt_output_exists",
  "prompt_write_failed",
] as const;
export type PromptIssueCode = (typeof PROMPT_ISSUE_CODES)[number];

export const INGESTION_ISSUE_CODES = [
  "inbox_file_invalid",
  "inbox_file_too_large",
  "malformed_candidate_json",
  "unsupported_candidate_shape",
  "source_identity_invalid",
  "prompt_metadata_missing",
  "prompt_pack_reference_mismatch",
  "candidate_conflict",
  "ingestion_replay_mismatch",
  "inbox_cleanup_failed",
  "quarantine_write_failed",
  "ingestion_lock_timeout",
  "path_outside_allowed_root",
  "ingestion_batch_limit_exceeded",
  "inbox_file_limit_exceeded",
  // Binding-manifest ingestion (PB2 blueprint-binding workflow): the
  // supplied per-candidate binding manifest failed its zero-write
  // preflight (schema, pack membership/integrity, one-to-one coverage,
  // tuple equality, deterministic-id agreement, blueprint resolution/hash/
  // validation), or was combined with a run-level --blueprint-id. Always
  // rejected before any claim, rename or repository write.
  "binding_manifest_invalid",
] as const;
export type IngestionIssueCode = (typeof INGESTION_ISSUE_CODES)[number];

export const MISSION_3A_ISSUE_CODES = [
  ...GENERATION_ISSUE_CODES,
  ...PROMPT_ISSUE_CODES,
  ...INGESTION_ISSUE_CODES,
] as const;
export type Mission3AIssueCode = (typeof MISSION_3A_ISSUE_CODES)[number];
