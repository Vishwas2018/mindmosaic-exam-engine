import { FACTORY_VERSIONS } from "../config";
import { candidateProvenanceSchema, hashJson, normalisePathSeparators, type CandidateProvenanceInput } from "../provenance";
import type { FactoryRepository } from "../storage";
import { candidateQuestionSchema, type CandidateQuestionInput } from "./candidate-question";
import { normaliseCsvRow } from "./csv-normalise";
import { hashRawInput, mintCandidateId } from "./identity";
import {
  INGESTION_ADAPTER_VERSION,
  LEGACY_INGESTION_PLACEHOLDER_BLUEPRINT_ID,
  LEGACY_INGESTION_PROMPT_VERSION,
} from "./mappings";
import { normaliseLegacyQuestion } from "./normalise";
import { parseDonorSource, type ParsedDonorItem } from "./parse";
import { isAbsoluteOrUnsafeSourcePath } from "./source-path";
import type {
  IngestedCandidateRecord,
  IngestionRejectionCode,
  IngestionRequest,
  IngestionResult,
  IngestionWarning,
  LegacyIngestionProvenance,
} from "./types";

function rejectedResult(reasonCode: IngestionRejectionCode, message: string): IngestionResult {
  return { status: "rejected", reasonCode, issues: [{ code: reasonCode, message }] };
}

async function ingestOneItem(
  request: IngestionRequest,
  parsedItem: ParsedDonorItem,
  sourceContentHash: string,
  repository: FactoryRepository,
): Promise<IngestionResult> {
  const normaliseOutcome =
    parsedItem.item.kind === "question"
      ? normaliseLegacyQuestion(parsedItem.item.question)
      : normaliseCsvRow(parsedItem.item.row);

  if (!normaliseOutcome.ok) {
    return { status: "rejected", reasonCode: normaliseOutcome.reasonCode, issues: normaliseOutcome.issues };
  }

  const warnings: IngestionWarning[] = [...normaliseOutcome.warnings];
  if (parsedItem.donorReviewMetadataFields.length > 0) {
    warnings.push({
      code: "donor_review_metadata_ignored",
      message: `Review-queue wrapper metadata ignored (no trust weight, no verifiable evidence chain): ${parsedItem.donorReviewMetadataFields.join(", ")}.`,
    });
  }

  const candidateId = mintCandidateId({
    sourcePath: request.sourcePath,
    batchId: request.batchId,
    pipelineRunId: request.pipelineRunId,
    indexInSource: parsedItem.indexInSource,
    sourceContentHash,
  });

  const questionInput: CandidateQuestionInput = { id: candidateId, ...normaliseOutcome.draft };
  const questionParse = candidateQuestionSchema.safeParse(questionInput);
  if (!questionParse.success) {
    return {
      status: "rejected",
      reasonCode: "candidate_schema_validation_failed",
      issues: questionParse.error.issues.map((issue) => ({
        code: "candidate_schema_validation_failed",
        message: issue.message,
        field: issue.path.join("."),
      })),
    };
  }
  const question = questionParse.data;
  const contentHash = hashJson(question);
  const ingestedAt = new Date().toISOString();

  const donorSourceId: string | undefined =
    parsedItem.item.kind === "question"
      ? (normaliseOutcome as { donorSourceId?: string }).donorSourceId
      : undefined;

  const provenanceInput: CandidateProvenanceInput = {
    candidateId,
    blueprintId: request.blueprintId ?? LEGACY_INGESTION_PLACEHOLDER_BLUEPRINT_ID,
    batchId: request.batchId,
    pipelineRunId: request.pipelineRunId,
    revision: 0,
    generatedAt: ingestedAt,
    generatorAdapter: { class: "manual_external", identity: request.generatorIdentity },
    generatorVersion: INGESTION_ADAPTER_VERSION,
    promptVersion: LEGACY_INGESTION_PROMPT_VERSION,
    schemaVersion: FACTORY_VERSIONS.SCHEMA_VERSION,
    taxonomyVersion: FACTORY_VERSIONS.TAXONOMY_VERSION,
    contentHash,
    reviewRecords: [],
  };
  const provenanceParse = candidateProvenanceSchema.safeParse(provenanceInput);
  if (!provenanceParse.success) {
    return {
      status: "rejected",
      reasonCode: "candidate_schema_validation_failed",
      issues: provenanceParse.error.issues.map((issue) => ({
        code: "candidate_schema_validation_failed",
        message: issue.message,
        field: issue.path.join("."),
      })),
    };
  }

  const ingestionProvenance: LegacyIngestionProvenance = {
    sourceFormat: request.sourceFormat,
    sourcePath: normalisePathSeparators(request.sourcePath),
    sourceContentHash,
    adapterVersion: INGESTION_ADAPTER_VERSION,
    ...(donorSourceId ? { donorSourceId } : {}),
    ingestedAt,
    warnings,
  };

  const candidate: IngestedCandidateRecord = {
    candidateId,
    state: "generated",
    question,
    provenance: provenanceParse.data,
    ingestion: ingestionProvenance,
  };

  if (request.dryRun) {
    return { status: "accepted", candidate, warnings, written: false, replay: false };
  }

  try {
    const existing = (await repository.read("generated", candidateId)) as IngestedCandidateRecord | undefined;
    if (existing !== undefined) {
      if (existing.provenance?.contentHash === contentHash) {
        return { status: "accepted", candidate, warnings, written: false, replay: true };
      }
      return rejectedResult(
        "candidate_already_exists",
        `Candidate '${candidateId}' already exists with different content — refusing to overwrite an unrelated record.`,
      );
    }

    const createResult = await repository.create("generated", candidateId, candidate);
    if (!createResult.ok) {
      return rejectedResult("repository_write_failed", createResult.message);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return rejectedResult("repository_write_failed", `Repository write failed: ${message}`);
  }

  return { status: "accepted", candidate, warnings, written: true, replay: false };
}

/**
 * The single entry point for legacy question ingestion. Returns one
 * `IngestionResult` per question found in the source: exactly one for
 * `legacy_question_json` / `review_queue_wrapper` / `csv_row`, and one per
 * array element for `compiled_question_array`. Never publishes, stages,
 * approves, or mutates production content — every accepted candidate is
 * written only to the `generated` compartment (or, under `dryRun`, not
 * written at all).
 */
export async function ingestLegacyQuestions(
  request: IngestionRequest,
  repository: FactoryRepository,
): Promise<readonly IngestionResult[]> {
  if (isAbsoluteOrUnsafeSourcePath(request.sourcePath)) {
    return [
      rejectedResult(
        "absolute_path_not_allowed",
        `sourcePath '${request.sourcePath}' must be repository-relative; absolute paths and path traversal are not permitted in provenance.`,
      ),
    ];
  }

  const parseOutcome = parseDonorSource(request);
  if (!parseOutcome.ok) {
    return [{ status: "rejected", reasonCode: parseOutcome.reasonCode, issues: parseOutcome.issues }];
  }

  const sourceContentHash = hashRawInput(request.rawInput);
  const results: IngestionResult[] = [];
  for (const parsedItem of parseOutcome.items) {
    results.push(await ingestOneItem(request, parsedItem, sourceContentHash, repository));
  }
  return results;
}
