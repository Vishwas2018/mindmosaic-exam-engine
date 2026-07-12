/**
 * Legacy question ingestion adapter (Mission 2A). Deliberately narrow
 * exports: only the request/result contract and the top-level entry point
 * are public. Parsing, per-format normalisation, mapping tables, the
 * internal adapter-preflight `candidateQuestionSchema`, and safety checks
 * are internal implementation and are not re-exported here — no current
 * production caller needs them, and importing the internal preflight
 * schema directly would invite confusing it with the (not-yet-built)
 * structural-validation gate. Internal modules and tests may still import
 * them directly by file path (e.g. `./candidate-question`).
 */
export { INGESTION_ADAPTER_VERSION } from "./mappings";
export { ingestLegacyQuestions } from "./ingest";
export { LEGACY_SOURCE_FORMATS } from "./types";
export type {
  IngestedCandidateRecord,
  IngestionIssue,
  IngestionRejectionCode,
  IngestionRequest,
  IngestionResult,
  IngestionWarning,
  IngestionWarningCode,
  LegacyIngestionProvenance,
  LegacySourceFormat,
} from "./types";
