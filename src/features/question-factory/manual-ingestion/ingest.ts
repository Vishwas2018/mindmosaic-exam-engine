import { FACTORY_VERSIONS, type NormalisedIdentity } from "../config";
import { candidateQuestionSchema } from "../ingestion/candidate-question";
import {
  candidateProvenanceSchema,
  hashJson,
  normalisePathSeparators,
  type CandidateProvenanceInput,
} from "../provenance";
import type { FactoryRepository } from "../storage";
import { mintManualCandidateId } from "./identity";
import { MANUAL_INGESTION_ADAPTER_VERSION, MANUAL_INGESTION_PLACEHOLDER_BLUEPRINT_ID } from "./mappings";
import type {
  ManualCandidateIngestionResult,
  ManualIngestedCandidateRecord,
  ManualIngestionRunRequest,
} from "./types";

/**
 * Ingests one already-parsed candidate content object. Never touches the
 * filesystem — the inbox scan/claim/quarantine transaction lives one
 * layer up, in `inbox-transaction.ts`. Replay-safe: an identical
 * `(sourceFileName, indexInFile, sourceContentHash)` re-ingestion resolves
 * to the same `candidateId`, and a byte-identical content hash at that id
 * is a safe no-op (`replay: true`); a *changed* content hash at the same
 * id is refused (`candidate_conflict`), never silently overwritten.
 */
export async function ingestOneCandidate(
  request: ManualIngestionRunRequest,
  declaredIdentity: NormalisedIdentity,
  candidateContent: Record<string, unknown>,
  indexInFile: number,
  sourceFileName: string,
  sourceContentHash: string,
  repository: FactoryRepository,
): Promise<ManualCandidateIngestionResult> {
  const candidateId = mintManualCandidateId({
    sourceFileName,
    batchId: request.batchId,
    pipelineRunId: request.pipelineRunId,
    indexInFile,
    sourceContentHash,
  });
  // Mirrors `ingestion/ingest.ts` (Mission 2A): the candidate's internal
  // `id` field is infrastructure this adapter mints, never a claim an
  // external generator gets to make — any `id` the source content
  // declares is discarded, never trusted.
  const withMintedId: Record<string, unknown> = { ...candidateContent, id: candidateId };
  // Best-effort normalisation only: when the content already satisfies
  // `candidateQuestionSchema` (Mission 2A's shared preflight shape), the
  // *parsed* value (with its schema defaults, e.g. `metadata.tags: []`,
  // filled in) is what gets stored — matching Mission 2A's own pattern —
  // so a later structural-validation re-parse of the stored record
  // recomputes the identical hash `checkContentHashBinding` expects.
  // When it does *not* satisfy the schema (a genuinely incomplete or
  // malformed external candidate), the raw object is stored as-is and
  // left for the structural-validation gate to reject with a precise
  // issue code (contract §6) — this adapter never performs that check
  // itself, only reuses its output opportunistically when available.
  const preflightParse = candidateQuestionSchema.safeParse(withMintedId);
  const question: Record<string, unknown> = preflightParse.success
    ? (preflightParse.data as unknown as Record<string, unknown>)
    : withMintedId;
  const contentHash = hashJson(question);
  const ingestedAt = new Date().toISOString();

  const provenanceInput: CandidateProvenanceInput = {
    candidateId,
    blueprintId: request.blueprintId ?? MANUAL_INGESTION_PLACEHOLDER_BLUEPRINT_ID,
    batchId: request.batchId,
    pipelineRunId: request.pipelineRunId,
    revision: 0,
    generatedAt: ingestedAt,
    generatorAdapter: { class: "manual_external", identity: declaredIdentity },
    generatorVersion: MANUAL_INGESTION_ADAPTER_VERSION,
    promptVersion: request.promptVersion,
    ...(request.promptHash !== undefined ? { promptHash: request.promptHash } : {}),
    schemaVersion: FACTORY_VERSIONS.SCHEMA_VERSION,
    taxonomyVersion: FACTORY_VERSIONS.TAXONOMY_VERSION,
    contentHash,
    reviewRecords: [],
  };
  const provenanceParse = candidateProvenanceSchema.safeParse(provenanceInput);
  if (!provenanceParse.success) {
    // Unreachable in practice: `batchId`/`pipelineRunId`/`blueprintId` are
    // already validated as factory identifiers before a run starts (see
    // `inbox-transaction.ts`), and `candidateId`/`contentHash` are both
    // minted by this module itself. Handled defensively rather than
    // assumed, per the "no report-only silent success" discipline.
    return {
      status: "rejected",
      indexInFile,
      issueCode: "inbox_file_invalid",
      message: `Candidate provenance failed schema validation: ${provenanceParse.error.issues.map((issue) => issue.message).join("; ")}`,
    };
  }

  const record: ManualIngestedCandidateRecord = {
    candidateId,
    state: "generated",
    question,
    provenance: provenanceParse.data,
    ingestion: {
      source: request.source,
      declaredIdentity,
      sourceFileName,
      sourcePath: normalisePathSeparators(`inbox/${sourceFileName}`),
      sourceContentHash,
      indexInFile,
      adapterVersion: MANUAL_INGESTION_ADAPTER_VERSION,
      ingestedAt,
    },
  };

  if (request.dryRun) {
    return { status: "accepted", indexInFile, candidate: record, written: false, replay: false };
  }

  const existing = (await repository.read("generated", candidateId)) as
    | ManualIngestedCandidateRecord
    | undefined;
  if (existing !== undefined) {
    if (existing.provenance?.contentHash === contentHash) {
      return { status: "accepted", indexInFile, candidate: record, written: false, replay: true };
    }
    return {
      status: "rejected",
      indexInFile,
      issueCode: "candidate_conflict",
      message: `Candidate '${candidateId}' already exists with different content — refusing to overwrite an unrelated record.`,
    };
  }

  const createResult = await repository.create("generated", candidateId, record);
  if (!createResult.ok) {
    return {
      status: "rejected",
      indexInFile,
      issueCode: "candidate_conflict",
      message: createResult.message,
    };
  }

  return { status: "accepted", indexInFile, candidate: record, written: true, replay: false };
}
