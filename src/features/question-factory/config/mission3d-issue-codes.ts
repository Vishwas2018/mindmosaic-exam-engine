/**
 * Closed Mission 3D issue-code catalogue (originality and difficulty
 * gates). Every code is a fixed enum member — no candidate-derived value
 * is ever embedded into the code string itself, matching the discipline
 * `MISSION_3A_ISSUE_CODES`/`MISSION_3B_ISSUE_CODES`/`MISSION_3C_ISSUE_CODES`
 * already follow; candidate-specific detail belongs in the associated
 * `message`, never the code.
 *
 * `blueprint_binding_unresolved` is reused verbatim in both catalogues —
 * same string, same meaning as `mission3b-issue-codes.ts`'s
 * `REVIEW_INGESTION_ISSUE_CODES` entry (Mission 3D plan §6).
 */
export const ORIGINALITY_ISSUE_CODES = [
  "originality_corpus_unreadable",
  "originality_comparison_failed",
  "originality_structurally_similar",
  "originality_near_duplicate",
  "originality_exact_duplicate",
  "originality_corpus_drift_detected",
  "blueprint_binding_unresolved",
] as const;
export type OriginalityIssueCode = (typeof ORIGINALITY_ISSUE_CODES)[number];

export const DIFFICULTY_ISSUE_CODES = [
  "difficulty_estimation_failed",
  "difficulty_deviation_exceeded",
  "difficulty_estimate_low_confidence",
  "difficulty_replay_drift_detected",
  "blueprint_binding_unresolved",
] as const;
export type DifficultyIssueCode = (typeof DIFFICULTY_ISSUE_CODES)[number];

export const MISSION_3D_ISSUE_CODES = [...ORIGINALITY_ISSUE_CODES, ...DIFFICULTY_ISSUE_CODES] as const;
export type Mission3DIssueCode = (typeof MISSION_3D_ISSUE_CODES)[number];
