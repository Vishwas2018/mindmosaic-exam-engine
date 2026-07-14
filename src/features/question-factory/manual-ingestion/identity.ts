import { normaliseIdentity, type NormalisedIdentity } from "../config";
import { hashJson, normalisePathSeparators } from "../provenance";
import { MANUAL_INGESTION_ADAPTER_VERSION } from "./mappings";
import type { ManualIngestionRunRequest } from "./types";

/**
 * Resolves the run's declared generator identity through the shared
 * `normaliseIdentity` alias table — never a raw display string. `--model`
 * overrides the source's own canonical alias when supplied (required for
 * `source: "other"`, optional for the three named sources). Returns
 * `undefined` for an unresolvable identity — the caller fails the whole
 * run closed (`source_identity_invalid`), never falls back to a guessed
 * or default identity.
 */
export function resolveDeclaredIdentity(
  request: Pick<ManualIngestionRunRequest, "source" | "model">,
): NormalisedIdentity | undefined {
  if (request.source === "other") {
    if (!request.model || request.model.trim().length === 0) return undefined;
    return normaliseIdentity(request.model);
  }
  return normaliseIdentity(request.model ?? request.source);
}

/**
 * Mints a fresh, deterministic candidate id, distinct from both
 * generation's `gen-` prefix and Mission 2A's `ing-` prefix (PD-3: a
 * sibling identity scheme, never derived from or colliding with either).
 * Identical `(sourceFileName, batchId, pipelineRunId, indexInFile,
 * sourceContentHash)` always mints the same id — a reused file name with
 * different bytes changes `sourceContentHash` and therefore mints a
 * different id, and a byte-identical re-drop of the same file mints the
 * same id, satisfying the replay-safety contract (§6).
 */
export function mintManualCandidateId(params: {
  readonly sourceFileName: string;
  readonly batchId: string;
  readonly pipelineRunId: string;
  readonly indexInFile: number;
  readonly sourceContentHash: string;
}): string {
  const seed = hashJson({
    sourceFileName: normalisePathSeparators(params.sourceFileName),
    batchId: params.batchId,
    pipelineRunId: params.pipelineRunId,
    adapterVersion: MANUAL_INGESTION_ADAPTER_VERSION,
    indexInFile: params.indexInFile,
    sourceContentHash: params.sourceContentHash,
  });
  return `man-${seed.slice(0, 24)}`;
}
