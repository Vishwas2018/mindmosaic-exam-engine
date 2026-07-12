import { hashContent, hashJson, normalisePathSeparators } from "../provenance";
import { INGESTION_ADAPTER_VERSION } from "./mappings";

/**
 * Deterministic content hash of the raw donor payload, before any
 * normalisation. JSON-format sources hash their raw text (newline-
 * normalised, per the Windows-determinism rule); an already-parsed CSV row
 * object hashes via stable-key-order JSON, since it never had raw text of
 * its own to begin with.
 */
export function hashRawInput(rawInput: string | Readonly<Record<string, unknown>>): string {
  return typeof rawInput === "string" ? hashContent(rawInput) : hashJson(rawInput);
}

/**
 * Mints a fresh, deterministic candidate id. Never derived from (or equal
 * to) any donor-supplied id — per the requirements doc §10, a donor id must
 * never be reused as the factory identifier. Identical
 * (sourcePath, batchId, pipelineRunId, adapterVersion, indexInSource,
 * sourceContentHash) always mints the same id, satisfying the replay-safety
 * contract; the repository's own duplicate-detection then decides whether a
 * repeat ingestion is a no-op replay or a genuine collision.
 */
export function mintCandidateId(params: {
  readonly sourcePath: string;
  readonly batchId: string;
  readonly pipelineRunId: string;
  readonly indexInSource: number;
  readonly sourceContentHash: string;
}): string {
  const seed = hashJson({
    sourcePath: normalisePathSeparators(params.sourcePath),
    batchId: params.batchId,
    pipelineRunId: params.pipelineRunId,
    adapterVersion: INGESTION_ADAPTER_VERSION,
    indexInSource: params.indexInSource,
    sourceContentHash: params.sourceContentHash,
  });
  return `ing-${seed.slice(0, 24)}`;
}
