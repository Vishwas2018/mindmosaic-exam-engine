/**
 * Fixed constants for the Mission 3A manual/external ingestion adapter.
 * Mirrors `ingestion/mappings.ts`'s "one small, documented constants
 * module" convention (Mission 2A) without importing from it — this is a
 * sibling module with its own identity scheme (PD-3), not an extension of
 * the legacy adapter's.
 */

/** Bump when this adapter's parsing/provenance-construction logic changes shape. */
export const MANUAL_INGESTION_ADAPTER_VERSION = "1" as const;

/**
 * Every ingested candidate must declare a `blueprintId` (required by
 * `candidateProvenanceSchema`). Manual/external candidates are frequently
 * ingested ahead of, or independent from, a specific blueprint record;
 * when the caller supplies none, this fixed placeholder satisfies the
 * schema without fabricating a link to a blueprint that was never used.
 */
export const MANUAL_INGESTION_PLACEHOLDER_BLUEPRINT_ID = "manual-ingestion-unblueprinted" as const;
