/**
 * Every calibrated threshold in the factory domain. Most are consumed
 * starting in Mission 2 (originality/difficulty gates) and Mission 3
 * (external review ingestion); they're defined centrally now so no gate
 * implementation ever has to invent its own number.
 */
export const FACTORY_THRESHOLDS = Object.freeze({
  /** Bounded revision loop: Shared Governance fixes this at 2. */
  MAX_REVISIONS: 2,

  /**
   * Minimum confidence an independent reviewer record must meet to count
   * as production-grade evidence for `semantic_review_passed`.
   */
  PRODUCTION_REVIEW_CONFIDENCE: 0.8,

  /** Above this, two candidates are treated as exact/near duplicates. */
  NEAR_DUPLICATE_SIMILARITY: 0.85,

  /** Above this, two candidates are flagged for manual/automated review as suspiciously similar. */
  STRUCTURALLY_SIMILAR_SIMILARITY: 0.6,

  /**
   * Estimated-vs-declared difficulty deviation (0-1 scale) still treated
   * as a match.
   */
  DIFFICULTY_MATCH_TOLERANCE: 0.15,

  /** Below this confidence, a difficulty estimate cannot pass on its own. */
  MIN_DIFFICULTY_ESTIMATE_CONFIDENCE: 0.5,
});
