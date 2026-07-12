import type { CandidateState } from "../workflow";

/**
 * The generator-agnostic shape structural validation reads. `question` and
 * `provenance` are deliberately `unknown` — `FactoryRepository.read()`
 * returns `unknown`, and the pure validator must re-establish trust itself
 * (re-parsing against `candidateQuestionSchema`/`candidateProvenanceSchema`)
 * rather than assume a caller already did. `ingestion` is optional and only
 * ever inspected for `sourcePath`: not every future generator class
 * (`live_provider`, `deterministic_fixture`) will have ingestion-specific
 * provenance at all.
 */
export interface QuestionFactoryCandidate {
  readonly candidateId: string;
  readonly state: string;
  readonly question: unknown;
  readonly provenance: unknown;
  readonly ingestion?: { readonly sourcePath?: string } | undefined;
}

/**
 * Everything a caller may already know about a candidate from an earlier
 * read (e.g. a listing pass before this validation run) that the current
 * stored record must still match. Omitted fields are simply not checked —
 * `validateCandidateStructure` never invents an expectation the caller
 * didn't supply. `blueprintHash` is supplied here (never computed inside
 * the pure validator) because hashing the real blueprint record requires a
 * repository read, which only the impure orchestration layer may perform;
 * see `orchestrate-structural-validation.ts`. `validatedAt` is supplied by
 * the caller for the same reason `blueprintHash` is: reading the wall
 * clock is a side effect, and the validator must remain deterministic and
 * side-effect free.
 */
export interface StructuralValidationContext {
  readonly validatedAt: string;
  readonly expectedContentHash?: string;
  readonly expectedRevision?: number;
  readonly expectedBlueprintId?: string;
  readonly blueprintHash?: string;
}

/**
 * The closed set of structural-validation failure codes. Deliberately
 * grouped to mirror the check catalogue in
 * `docs/reports/mission2-production/02-structural-validation.md`. Several
 * codes are populated via a path-based classifier over reused Zod schema
 * issues (`questionSchema`, `candidateQuestionSchema`,
 * `candidateProvenanceSchema`) rather than hand-written duplicate checks —
 * see `production-schema-check.ts` and `candidate-checks.ts`.
 */
export const STRUCTURAL_VALIDATION_ISSUE_CODES = [
  // Candidate / provenance identity and binding.
  "invalid_candidate_id",
  "invalid_revision",
  "missing_batch_id",
  "missing_pipeline_run_id",
  "missing_blueprint_id",
  "invalid_content_hash",
  "content_hash_mismatch",
  "stale_content_hash",
  "stale_revision",
  "stale_blueprint_binding",
  "unsupported_schema_version",
  "unsupported_taxonomy_version",
  "invalid_generator_identity",
  "invalid_generator_class",
  "unsanitised_source_path",
  "invalid_lifecycle_state",
  "donor_trust_field_present",
  "malformed_candidate_record",

  // Taxonomy.
  "unknown_taxonomy_skill",
  "ambiguous_taxonomy_reference",
  "taxonomy_grade_mismatch",
  "taxonomy_subject_mismatch",
  "taxonomy_strand_mismatch",
  "taxonomy_exam_style_unsupported",

  // Registry membership (renderer / visual registries as authority).
  "question_type_not_in_renderer_registry",
  "visual_type_not_in_visual_registry",

  // Production-schema-shaped structural issues (classified from reused
  // `questionSchema`/`candidateQuestionSchema` Zod issues).
  "invalid_options",
  "invalid_visuals",
  "invalid_answer_key",
  "invalid_interaction",
  "missing_required_stimulus",
  "invalid_prompt",
  "invalid_explanation",
  "invalid_marks",
  "invalid_expected_time",
  "unsupported_question_type",
  "invalid_year_level",
  "invalid_exam_style",
  "structural_schema_violation",

  // Content safety.
  "unsafe_markup_detected",
  "answer_leakage_in_alt_text",

  // Scoring-contract compatibility (shape only — never correctness).
  "scoring_representation_failed",
] as const;

export type StructuralValidationIssueCode = (typeof STRUCTURAL_VALIDATION_ISSUE_CODES)[number];

export interface StructuralValidationIssue {
  readonly code: StructuralValidationIssueCode;
  readonly path: string;
  readonly message: string;
  readonly severity: "error";
}

/**
 * Fixed, data-independent list of check groups every run performs — never a
 * runtime execution trace. Every group in this list is always present on
 * `StructuralValidationEvidence.checksPerformed` for every run, passing or
 * failing, regardless of which checks short-circuited or found issues; it
 * documents the gate's configured catalogue, not "the checks that actually
 * ran and found something this time". See the "Deterministic guarantees"
 * section of the mission doc.
 */
export const STRUCTURAL_VALIDATION_CHECK_GROUPS = [
  "candidate_identity",
  "provenance_binding",
  "lifecycle_state",
  "donor_trust_fields",
  "source_path",
  "taxonomy",
  "registry_membership",
  "production_schema",
  "content_safety",
  "scoring_compatibility",
] as const;

export type StructuralValidationCheckGroup = (typeof STRUCTURAL_VALIDATION_CHECK_GROUPS)[number];

export interface StructuralValidationIssueSummary {
  readonly errorCount: number;
  readonly codes: readonly StructuralValidationIssueCode[];
}

/**
 * Never includes secrets, absolute local paths, or donor trust claims —
 * `candidateContentHash`/`blueprintHash` are opaque hex digests, and every
 * other field is either a version tag, a count, or a fixed code/timestamp.
 *
 * `validatedAt` is observational metadata (when this run happened) and is
 * deliberately excluded from `validationFingerprint` (what this run
 * determined). See `validationFingerprint` below and `buildEvidence` in
 * `evidence.ts` for the full rationale.
 */
export interface StructuralValidationEvidence {
  readonly candidateId: string;
  readonly candidateRevision: number;
  readonly candidateContentHash: string;
  /** Only present when a real blueprint record was read and hashed by the orchestration layer — "where applicable". */
  readonly blueprintHash?: string;
  readonly validatorVersion: string;
  readonly schemaVersion: string;
  readonly taxonomyVersion: string;
  /** Observational — when this run happened. Never part of the deterministic identity below. */
  readonly validatedAt: string;
  /** The gate's fixed, configured check catalogue — not a runtime execution trace. See `STRUCTURAL_VALIDATION_CHECK_GROUPS`. */
  readonly checksPerformed: readonly StructuralValidationCheckGroup[];
  readonly issueSummary: StructuralValidationIssueSummary;
  readonly outcome: "passed" | "failed";
  /**
   * Deterministic validation identity: a `hashJson` digest over
   * `candidateId`, `candidateRevision`, `candidateContentHash`,
   * `blueprintHash`, `validatorVersion`, `schemaVersion`, `taxonomyVersion`,
   * the check catalogue, `issueSummary`, and `outcome` — and nothing else.
   * Excludes `validatedAt` by design: two runs against unchanged candidate
   * content fingerprint identically no matter when each ran, which is what
   * makes a retry after a transient repository failure (new `validatedAt`,
   * same everything else) replay-safe instead of a false conflict. A
   * genuinely changed candidate, revision, blueprint, issue set, or
   * validator/schema/taxonomy version still changes this value.
   */
  readonly validationFingerprint: string;
}

export type StructuralValidationResult =
  | {
      readonly status: "passed";
      readonly evidence: StructuralValidationEvidence;
    }
  | {
      readonly status: "failed";
      readonly issues: readonly StructuralValidationIssue[];
      readonly evidence: StructuralValidationEvidence;
    };

/** Re-exported for orchestration callers that need to state the expected source state without importing `workflow` directly. */
export type { CandidateState };
