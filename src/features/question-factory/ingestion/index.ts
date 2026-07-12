/**
 * Legacy question ingestion adapter (Mission 2A). Deliberately narrow
 * exports: only the request/result contract and the top-level entry point
 * are public. Parsing, per-format normalisation, mapping tables and safety
 * checks are internal implementation and are not re-exported here.
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
export { candidateQuestionSchema } from "./candidate-question";
export type { CandidateQuestion, CandidateQuestionInput } from "./candidate-question";
