import {
  compiledQuestionArrayShape,
  csvRowShape,
  legacyQuestionJsonShape,
  reviewQueueWrapperShape,
  type CsvRow,
  type LegacyQuestionJson,
} from "./legacy-shapes";
import { INGESTION_LIMITS } from "./limits";
import { LEGACY_SOURCE_FORMATS, type IngestionIssue, type IngestionRejectionCode, type IngestionRequest } from "./types";

export interface ParsedDonorItem {
  readonly indexInSource: number;
  readonly donorReviewMetadataFields: readonly string[];
  readonly item:
    | { readonly kind: "question"; readonly question: LegacyQuestionJson }
    | { readonly kind: "csv_row"; readonly row: CsvRow };
}

export type ParseOutcome =
  | { readonly ok: true; readonly items: readonly ParsedDonorItem[] }
  | { readonly ok: false; readonly reasonCode: IngestionRejectionCode; readonly issues: IngestionIssue[] };

function rejected(reasonCode: IngestionRejectionCode, message: string): ParseOutcome {
  return { ok: false, reasonCode, issues: [{ code: reasonCode, message }] };
}

const WRAPPER_REVIEW_FIELDS = [
  "validationStatus",
  "validationErrors",
  "reviewerStatus",
  "reviewerComments",
  "riskFlags",
  "approvalStatus",
  "sourcePromptId",
] as const;

/**
 * Dispatches on `sourceFormat` before attempting any field-level parsing,
 * per `03-legacy-ingestion-requirements.md` §1 ("a single flat parser will
 * silently misread the wrapper/compiled shapes"). Every expected-bad-input
 * case (malformed JSON, an unrecognised shape, an unsupported format
 * string) returns a structured rejection rather than throwing.
 */
export function parseDonorSource(request: IngestionRequest): ParseOutcome {
  if (!(LEGACY_SOURCE_FORMATS as readonly string[]).includes(request.sourceFormat)) {
    return rejected("unsupported_source_format", `Source format '${request.sourceFormat}' is not supported.`);
  }

  if (request.sourceFormat === "csv_row") {
    if (typeof request.rawInput !== "object" || request.rawInput === null) {
      return rejected("unrecognised_donor_shape", "csv_row ingestion requires an already-parsed row object.");
    }
    const parsed = csvRowShape.safeParse(request.rawInput);
    if (!parsed.success) {
      return rejected("unrecognised_donor_shape", `CSV row does not match the expected donor shape: ${parsed.error.issues[0]?.message ?? "unknown error"}.`);
    }
    return { ok: true, items: [{ indexInSource: 0, donorReviewMetadataFields: [], item: { kind: "csv_row", row: parsed.data } }] };
  }

  if (typeof request.rawInput !== "string") {
    return rejected("unrecognised_donor_shape", `${request.sourceFormat} ingestion requires a raw JSON string.`);
  }

  if (request.rawInput.length > INGESTION_LIMITS.MAX_RAW_INPUT_LENGTH) {
    return rejected(
      "source_payload_too_large",
      `Source payload is ${request.rawInput.length} characters, exceeding the ${INGESTION_LIMITS.MAX_RAW_INPUT_LENGTH}-character limit.`,
    );
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(request.rawInput);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return rejected("malformed_json", `Source content is not valid JSON: ${message}`);
  }

  if (request.sourceFormat === "legacy_question_json") {
    const parsed = legacyQuestionJsonShape.safeParse(parsedJson);
    if (!parsed.success) {
      return rejected("unrecognised_donor_shape", `JSON does not match the legacy question shape: ${parsed.error.issues[0]?.message ?? "unknown error"}.`);
    }
    return { ok: true, items: [{ indexInSource: 0, donorReviewMetadataFields: [], item: { kind: "question", question: parsed.data } }] };
  }

  if (request.sourceFormat === "review_queue_wrapper") {
    const parsed = reviewQueueWrapperShape.safeParse(parsedJson);
    if (!parsed.success) {
      return rejected("unrecognised_donor_shape", `JSON does not match the review-queue wrapper shape: ${parsed.error.issues[0]?.message ?? "unknown error"}.`);
    }
    const presentFields = WRAPPER_REVIEW_FIELDS.filter((field) => parsed.data[field] !== undefined);
    return {
      ok: true,
      items: [{ indexInSource: 0, donorReviewMetadataFields: presentFields, item: { kind: "question", question: parsed.data.question } }],
    };
  }

  // compiled_question_array
  if (Array.isArray(parsedJson) && parsedJson.length > INGESTION_LIMITS.MAX_COMPILED_ARRAY_RECORDS) {
    return rejected(
      "source_payload_too_large",
      `Compiled array has ${parsedJson.length} elements, exceeding the ${INGESTION_LIMITS.MAX_COMPILED_ARRAY_RECORDS}-element limit.`,
    );
  }
  const parsed = compiledQuestionArrayShape.safeParse(parsedJson);
  if (!parsed.success) {
    return rejected("unrecognised_donor_shape", `JSON does not match the compiled question-array shape: ${parsed.error.issues[0]?.message ?? "unknown error"}.`);
  }
  return {
    ok: true,
    items: parsed.data.map((question, indexInSource) => ({
      indexInSource,
      donorReviewMetadataFields: [],
      item: { kind: "question" as const, question },
    })),
  };
}
