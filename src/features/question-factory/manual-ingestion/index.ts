/**
 * Mission 3A manual/external ingestion domain — a sibling of `ingestion/`
 * (Mission 2A's legacy-donor adapter), not an extension of it (PD-3).
 * Deliberately narrow exports: the run request/result contract and the
 * top-level orchestrator are public; per-candidate/per-file internals
 * remain implementation detail, matching `ingestion/index.ts`'s own
 * convention. Internal modules may still be imported directly by file path.
 */
export { parseInboxFileContent } from "./candidate-envelope";
export type { ParsedInboxFileOutcome } from "./candidate-envelope";
export { mintManualCandidateId, resolveDeclaredIdentity } from "./identity";
export { runManualIngestion } from "./inbox-transaction";
export type { RunManualIngestionOptions } from "./inbox-transaction";
export { ingestOneCandidate } from "./ingest";
export {
  MANUAL_INGESTION_ADAPTER_VERSION,
  MANUAL_INGESTION_PLACEHOLDER_BLUEPRINT_ID,
} from "./mappings";
export type {
  InboxFileIngestionResult,
  ManualCandidateIngestionResult,
  ManualIngestedCandidateRecord,
  ManualIngestionProvenance,
  ManualIngestionRunOutcome,
  ManualIngestionRunRequest,
  ManualIngestionRunResult,
} from "./types";
