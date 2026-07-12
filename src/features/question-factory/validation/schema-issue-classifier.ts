import type { StructuralValidationIssueCode } from "./types";

/**
 * Maps a `candidateProvenanceSchema` Zod issue path to a specific
 * structural-validation code. `candidateProvenanceSchema` is reused
 * unmodified (see `../provenance`), so this classifier is the only place
 * that turns its generic Zod issues into the closed issue-code catalogue.
 */
export function classifyProvenanceIssue(path: readonly PropertyKey[]): StructuralValidationIssueCode {
  const [first, second] = path.map(String);
  switch (first) {
    case "candidateId":
      return "invalid_candidate_id";
    case "blueprintId":
      return "missing_blueprint_id";
    case "batchId":
      return "missing_batch_id";
    case "pipelineRunId":
      return "missing_pipeline_run_id";
    case "revision":
      return "invalid_revision";
    case "generatorAdapter":
      return second === "class" ? "invalid_generator_class" : "invalid_generator_identity";
    case "schemaVersion":
      return "unsupported_schema_version";
    case "taxonomyVersion":
      return "unsupported_taxonomy_version";
    case "contentHash":
      return "invalid_content_hash";
    default:
      return "malformed_candidate_record";
  }
}

/**
 * Maps a question-shape Zod issue path (from either the reused
 * `candidateQuestionSchema` adapter-preflight schema or the reused
 * production `questionSchema`) to a specific structural-validation code.
 * Both schemas share the same field names/paths for everything this
 * classifier inspects, so one classifier serves both reuse points —
 * see `candidate-checks.ts` and `production-schema-check.ts`.
 */
export function classifyQuestionStructureIssue(
  path: readonly PropertyKey[],
): StructuralValidationIssueCode {
  const [first, second] = path.map(String);
  switch (first) {
    case "options":
      return "invalid_options";
    case "visuals":
      return "invalid_visuals";
    case "answerKey":
      return "invalid_answer_key";
    case "interaction":
      return "invalid_interaction";
    case "stimulus":
      return "missing_required_stimulus";
    case "prompt":
      return "invalid_prompt";
    case "explanation":
      return "invalid_explanation";
    case "type":
      return "unsupported_question_type";
    case "yearLevel":
      return "invalid_year_level";
    case "examStyle":
      return "invalid_exam_style";
    case "metadata":
      if (second === "marks") return "invalid_marks";
      if (second === "estimatedTimeSeconds") return "invalid_expected_time";
      return "structural_schema_violation";
    default:
      return "structural_schema_violation";
  }
}
