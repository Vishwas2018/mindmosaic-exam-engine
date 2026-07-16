/**
 * Closed Mission 3B issue-code catalogue (semantic review, external
 * review-ingestion). Every code is a fixed enum member — no
 * candidate-derived value is ever embedded into the code string itself,
 * matching the discipline `STRUCTURAL_VALIDATION_ISSUE_CODES` /
 * `CORRECTNESS_VERIFICATION_ISSUE_CODES` / `MISSION_3A_ISSUE_CODES`
 * already follow; candidate-specific detail belongs in the associated
 * `message`, never the code.
 */
export const REVIEW_PROMPT_ISSUE_CODES = [
  "review_prompt_candidate_invalid",
  "review_prompt_pack_limit_exceeded",
  "review_prompt_output_exists",
  "review_prompt_write_failed",
] as const;
export type ReviewPromptIssueCode = (typeof REVIEW_PROMPT_ISSUE_CODES)[number];

export const REVIEW_INGESTION_ISSUE_CODES = [
  "malformed_review_response",
  "review_response_too_large",
  "unknown_candidate",
  "invalid_lifecycle_state_for_review",
  "stale_review_revision",
  "content_hash_mismatch",
  "blueprint_hash_mismatch",
  // Mission 3B blueprint remediation: the candidate's bound blueprint could
  // not be resolved and verified (missing/unreadable/malformed/taxonomy-
  // unresolved/renderer-unsupported), or the candidate is unblueprinted
  // (manual-ingestion placeholder) and therefore has no blueprint an
  // external review's declared hash could ever be verified against. Always
  // rejected before any chain append — never a skipped comparison.
  "blueprint_binding_unresolved",
  "insufficient_evidence",
  "unsupported_reviewer_identity",
  "unsupported_generator_identity",
  "self_review_rejected",
  "review_id_conflict",
  "review_prompt_reference_mismatch",
  "review_chain_limit_exceeded",
  "review_chain_corrupt",
  "repository_error",
] as const;
export type ReviewIngestionIssueCode = (typeof REVIEW_INGESTION_ISSUE_CODES)[number];

export const DETERMINISTIC_REVIEW_ISSUE_CODES = [
  "deterministic_review_candidate_invalid",
  "deterministic_review_requires_independent_evidence",
] as const;
export type DeterministicReviewIssueCode = (typeof DETERMINISTIC_REVIEW_ISSUE_CODES)[number];

export const MISSION_3B_ISSUE_CODES = [
  ...REVIEW_PROMPT_ISSUE_CODES,
  ...REVIEW_INGESTION_ISSUE_CODES,
  ...DETERMINISTIC_REVIEW_ISSUE_CODES,
] as const;
export type Mission3BIssueCode = (typeof MISSION_3B_ISSUE_CODES)[number];
