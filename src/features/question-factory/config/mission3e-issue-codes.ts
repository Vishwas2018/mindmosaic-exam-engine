/**
 * Closed Mission 3E issue-code catalogue (staging and publication — the
 * two lifecycle hops the factory pipeline previously dead-ended before:
 * `difficulty_review_passed -> staged -> published`). Every code is a
 * fixed enum member — no candidate-derived value is ever embedded into
 * the code string itself, matching the discipline
 * `MISSION_3A_ISSUE_CODES`/`MISSION_3B_ISSUE_CODES`/`MISSION_3C_ISSUE_CODES`/
 * `MISSION_3D_ISSUE_CODES` already follow; candidate-specific detail
 * belongs in the associated `message`, never the code.
 */
export const STAGING_ISSUE_CODES = [
  "staging_invalid_lifecycle_state",
  "staging_evidence_missing",
  "staging_evidence_stale",
  "staging_upstream_evidence_invalid",
  "staging_repository_error",
] as const;
export type StagingIssueCode = (typeof STAGING_ISSUE_CODES)[number];

export const PUBLICATION_ISSUE_CODES = [
  "publication_not_staged",
  "publication_refused_fixture_generator",
  "publication_upstream_evidence_invalid",
  "publication_content_hash_mismatch",
  "publication_production_id_collision",
  "publication_id_reused_with_different_content",
  "publication_repository_error",
] as const;
export type PublicationIssueCode = (typeof PUBLICATION_ISSUE_CODES)[number];

export const MISSION_3E_ISSUE_CODES = [...STAGING_ISSUE_CODES, ...PUBLICATION_ISSUE_CODES] as const;
export type Mission3EIssueCode = (typeof MISSION_3E_ISSUE_CODES)[number];
