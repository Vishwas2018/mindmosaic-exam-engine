/**
 * Current version tags recorded into every candidate's provenance. Bump
 * these deliberately when the corresponding artefact changes shape:
 * schemaVersion when the question/blueprint schema changes, taxonomyVersion
 * when `taxonomy/entries.ts` is regenerated, promptVersion when a
 * generator/reviewer prompt template changes.
 */
export const FACTORY_VERSIONS = Object.freeze({
  SCHEMA_VERSION: "1",
  TAXONOMY_VERSION: "1",
  // No generator/reviewer prompt templates exist until Mission 3; these
  // are the starting version tags for when they do.
  PROMPT_VERSION: "v1",
  REVIEW_PROMPT_VERSION: "v1",
});
