import type { NormalisedIdentity } from "../config";
import type { CandidateProvenance } from "../provenance";
import type { CandidateState } from "../workflow";
import type { CandidateQuestion } from "./candidate-question";

export const LEGACY_SOURCE_FORMATS = [
  "legacy_question_json",
  "compiled_question_array",
  "review_queue_wrapper",
  "csv_row",
] as const;
export type LegacySourceFormat = (typeof LEGACY_SOURCE_FORMATS)[number];

/**
 * Everything the ingestion adapter needs to process one source file/row.
 * `rawInput` carries the actual donor payload: a JSON string for the three
 * JSON-shaped formats (parsed internally, so malformed JSON is a structured
 * rejection rather than a thrown exception reaching the caller), or an
 * already-parsed CSV row record for `csv_row` (outer CSV parsing is not this
 * adapter's job — see the Mission 2 requirements doc §2).
 */
export interface IngestionRequest {
  readonly sourcePath: string;
  readonly sourceFormat: LegacySourceFormat;
  readonly rawInput: string | Readonly<Record<string, unknown>>;
  readonly generatorIdentity: NormalisedIdentity;
  readonly batchId: string;
  readonly pipelineRunId: string;
  readonly blueprintId?: string;
  readonly dryRun?: boolean;
}

export const INGESTION_WARNING_CODES = [
  "origin_field_ignored",
  "donor_status_ignored",
  "donor_review_metadata_ignored",
  "donor_id_not_authoritative",
  "timestamp_field_dropped",
  "machine_tag_filtered",
  "marks_defaulted",
  "skill_not_in_taxonomy",
  "csv_row_metadata_ignored",
  "table_row_headers_defaulted",
  "number_line_step_derived_from_points",
  "csv_exam_style_defaulted",
  "csv_subject_inferred",
  "csv_strand_defaulted",
] as const;
export type IngestionWarningCode = (typeof INGESTION_WARNING_CODES)[number];

export interface IngestionWarning {
  readonly code: IngestionWarningCode;
  readonly message: string;
  readonly field?: string;
}

export const INGESTION_REJECTION_CODES = [
  "malformed_json",
  "unsupported_source_format",
  "unrecognised_donor_shape",
  "candidate_schema_validation_failed",
  "absolute_path_not_allowed",
  "missing_source_identifier",
  "source_payload_too_large",
  "ambiguous_boolean_value",
  "empty_identifier_after_normalisation",
  "unsupported_exam_type",
  "unsupported_subject",
  "ambiguous_difficulty",
  "unsupported_question_type",
  "unsupported_answer_key_type",
  "unsupported_stimulus_kind",
  "unsupported_visual_type",
  "forbidden_raw_visual_content",
  "unsafe_raw_markup_detected",
  "answer_leakage_in_alt_text",
  "duplicate_ids_after_normalisation",
  "unknown_answer_key_reference",
  "composite_reading_group_unsupported",
  "malformed_inner_json",
  "malformed_year_level",
  "unsupported_year_level",
  "candidate_already_exists",
  "repository_write_failed",
] as const;
export type IngestionRejectionCode = (typeof INGESTION_REJECTION_CODES)[number];

export interface IngestionIssue {
  readonly code: IngestionRejectionCode;
  readonly message: string;
  readonly field?: string;
}

/**
 * Everything the ingestion adapter never asserted about a candidate: full
 * structural validation, correctness verification, semantic/originality/
 * difficulty review. Only the fields the shared `candidateProvenanceSchema`
 * does not carry — this composes with it rather than replacing it.
 */
export interface LegacyIngestionProvenance {
  readonly sourceFormat: LegacySourceFormat;
  readonly sourcePath: string;
  readonly sourceContentHash: string;
  readonly adapterVersion: string;
  readonly donorSourceId?: string;
  readonly ingestedAt: string;
  readonly warnings: readonly IngestionWarning[];
}

export interface IngestedCandidateRecord {
  readonly candidateId: string;
  readonly state: CandidateState;
  readonly question: CandidateQuestion;
  readonly provenance: CandidateProvenance;
  readonly ingestion: LegacyIngestionProvenance;
}

export type IngestionResult =
  | {
      readonly status: "accepted";
      readonly candidate: IngestedCandidateRecord;
      readonly warnings: readonly IngestionWarning[];
      /** True only when this call actually wrote a new record (never true for `dryRun`). */
      readonly written: boolean;
      /** True when an identical candidate already existed and this call was a no-op replay. */
      readonly replay: boolean;
    }
  | {
      readonly status: "rejected";
      readonly reasonCode: IngestionRejectionCode;
      readonly issues: readonly IngestionIssue[];
    };
