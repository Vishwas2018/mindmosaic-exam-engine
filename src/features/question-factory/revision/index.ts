/**
 * Mission 3C candidate-revision domain. Deliberately narrow exports: the
 * request/outcome contract and the orchestrator are public; the
 * id-minting helper is exported for direct testing in isolation, matching
 * `manual-ingestion/index.ts`'s equivalent convention for
 * `mintManualCandidateId`.
 */
export { mintRevisionCandidateId } from "./identity";
export { ingestRevision } from "./revise";
export { reviseIngestionInputSchema } from "./types";
export type { ReviseIngestionInput, ReviseOutcome } from "./types";
