/**
 * Every bounded size in the factory domain, in one place. Consuming
 * modules (blueprints, provenance, storage, shared identifiers) import
 * from here rather than declaring their own magic numbers.
 */
export const FACTORY_LIMITS = Object.freeze({
  // Shared identifier shape (blueprintId, batchId, candidateId,
  // pipelineRunId, publicationId, reviewId, ...).
  IDENTIFIER_MAX_LENGTH: 120,

  // Blueprint fields.
  BLUEPRINT_MIN_TARGET_COUNT: 1,
  BLUEPRINT_MAX_TARGET_COUNT: 200,
  BLUEPRINT_MIN_MARKS: 1,
  BLUEPRINT_MAX_MARKS: 20,
  BLUEPRINT_MIN_ESTIMATED_TIME_SECONDS: 10,
  BLUEPRINT_MAX_ESTIMATED_TIME_SECONDS: 3600,
  BLUEPRINT_MIN_REASONING_STEPS: 1,
  BLUEPRINT_MAX_REASONING_STEPS: 10,
  BLUEPRINT_MAX_MISCONCEPTION_TARGETS: 10,
  BLUEPRINT_MAX_VOCABULARY_CONSTRAINTS: 20,
  BLUEPRINT_MAX_ACCESSIBILITY_CONSTRAINTS: 20,
  BLUEPRINT_MAX_ORIGINALITY_CONSTRAINTS: 20,
  BLUEPRINT_MAX_GENERATION_CONSTRAINTS: 20,
  BLUEPRINT_MAX_LEARNING_OBJECTIVE_LENGTH: 500,
  BLUEPRINT_MAX_CONSTRAINT_TEXT_LENGTH: 300,
  // A blueprint's `skill` field is a taxonomy id (dot-namespaced curriculum
  // path), so it gets its own bound rather than reusing
  // IDENTIFIER_MAX_LENGTH (factory identifiers are deliberately narrower:
  // no dots).
  TAXONOMY_SKILL_ID_MAX_LENGTH: 150,
  BLUEPRINT_STRAND_MAX_LENGTH: 80,
  // Shared by `questionType` and `visualType`: both are renderer-registry
  // type-identifier strings (e.g. "multiple_choice", "bar_chart").
  BLUEPRINT_TYPE_IDENTIFIER_MAX_LENGTH: 60,

  // Normalised generator/reviewer identity (identity-normalisation.ts).
  IDENTITY_MODEL_ID_MAX_LENGTH: 80,
  IDENTITY_MODEL_FAMILY_MAX_LENGTH: 60,

  // Provenance / review records. Findings and evidence references are
  // deliberately tight: concise evidence only, never chain-of-thought.
  PROVENANCE_MAX_VERSION_LENGTH: 40,
  PROVENANCE_MAX_HASH_LENGTH: 128,
  PROVENANCE_MAX_REVIEW_RECORDS: 20,
  REVIEW_MAX_FINDINGS: 15,
  REVIEW_MAX_FINDING_LENGTH: 400,
  REVIEW_MAX_EVIDENCE_REFERENCES: 15,
  REVIEW_MAX_EVIDENCE_REFERENCE_LENGTH: 300,

  // Generation batch / pipeline bounds (consumed from Mission 3 onward).
  MAX_BATCH_SIZE: 200,
  MAX_CANDIDATES_PER_PIPELINE_RUN: 500,

  // Content-field bounds (consumed from Mission 2/3 onward).
  MAX_PROMPT_LENGTH: 2000,
  MAX_STIMULUS_LENGTH: 8000,
  MAX_OPTIONS_PER_QUESTION: 30,
  MAX_VISUALS_PER_QUESTION: 6,

  // Report bounds (consumed from Mission 3 onward).
  MAX_REPORT_ENTRIES: 1000,

  // Mission 3A: generation prompt packs (`generation/prompt-builder.ts`).
  MAX_PROMPT_PACK_BYTES: 50_000,
  MAX_PROMPT_PACK_EXAMPLE_LENGTH: 4000,

  // Mission 3A: manual/external inbox ingestion.
  MAX_INBOX_FILES_PER_SCAN: 500,
  MAX_CANDIDATES_PER_INBOX_FILE: 50,
  MAX_CANDIDATES_PER_INGESTION_RUN: 200,
  MAX_INBOX_FILE_BYTES: 2_000_000,
  MAX_QUARANTINE_REPORT_BYTES: 20_000,

  // Mission 3A: `DeterministicFixtureGenerator`'s deliberately narrow
  // capability envelope — a real, documented bound, not an arbitrary one:
  // the fixture generator only ever produces single-step arithmetic, so a
  // blueprint asking for more marks than this is refused as a resource
  // limit rather than silently producing a mismatched-effort candidate.
  DETERMINISTIC_FIXTURE_MAX_MARKS: 5,
});
