/**
 * Fixed lookup tables and constants for the legacy-ingestion adapter. Every
 * alias table here is grounded in
 * `docs/reports/mission2-fixture-prep/02-parser-analysis.md` and
 * `03-legacy-ingestion-requirements.md`. Where the source docs do not give
 * an exact donor field name (the CSV inner-content shapes beyond what
 * `03-legacy-ingestion-requirements.md` §4 states explicitly), the adapter
 * defines its own documented convention rather than guessing at undocumented
 * donor internals — see `docs/reports/mission2-production/01-legacy-ingestion-adapter.md`.
 */

/** Bump when the normalisation/mapping logic changes shape, per the determinism contract. */
export const INGESTION_ADAPTER_VERSION = "1" as const;

/**
 * Ingested candidates rarely originate from a blueprint (legacy content
 * predates the blueprint workflow entirely). When the caller does not
 * supply one, this fixed, documented placeholder satisfies
 * `candidateProvenanceSchema.blueprintId` (required by the shared schema)
 * without fabricating a link to a blueprint that never existed.
 */
export const LEGACY_INGESTION_PLACEHOLDER_BLUEPRINT_ID = "legacy-ingestion-unblueprinted" as const;

/** Satisfies `candidateProvenanceSchema.promptVersion` (required, non-empty) for a path with no generation prompt. */
export const LEGACY_INGESTION_PROMPT_VERSION = "n-a-legacy-ingestion" as const;

/**
 * Harvest `difficulty` -> trusted `metadata.difficulty`. Per
 * 02-parser-analysis.md: `"hard"` (92 occurrences) and `"challenge"` (62
 * occurrences) both collapse onto the trusted schema's single `"challenging"`
 * value. Any other declared value is ambiguous and must be rejected, never
 * guessed.
 */
export const HARVEST_DIFFICULTY_ALIASES: Readonly<Record<string, "easy" | "medium" | "challenging">> = {
  easy: "easy",
  medium: "medium",
  hard: "challenging",
  challenge: "challenging",
};

/**
 * Harvest `examType` -> trusted `examStyle`. `SKILL`/`DIAGNOSTIC` are
 * schema-legal on the donor side but have no trusted equivalent (0
 * occurrences in the corpus, per the inventory) — reject rather than guess.
 */
export const HARVEST_EXAM_TYPE_ALIASES: Readonly<Record<string, "naplan_style" | "icas_style">> = {
  NAPLAN: "naplan_style",
  ICAS: "icas_style",
};

/**
 * Harvest `subject` (exam-branded prose) -> trusted
 * `metadata.subject` enum. `"English"` is ambiguous on its own — the strand
 * decides whether it resolves to `reading` or `language_conventions`.
 */
export const HARVEST_SUBJECT_ALIASES: Readonly<Record<string, "numeracy" | "reading" | "writing" | "language_conventions">> = {
  Numeracy: "numeracy",
  Mathematics: "numeracy",
  Reading: "reading",
  "Grammar and Punctuation": "language_conventions",
};

const LANGUAGE_STRAND_HINTS = ["grammar", "punctuation", "language", "spelling", "vocabulary"];

/** Resolves the harvest `"English"` subject using the accompanying strand, per the doc's disambiguation rule. */
export function resolveEnglishSubject(strand: string): "reading" | "language_conventions" {
  const lowerStrand = strand.toLowerCase();
  return LANGUAGE_STRAND_HINTS.some((hint) => lowerStrand.includes(hint))
    ? "language_conventions"
    : "reading";
}

/** Harvest `questionType` values already share identifiers with the trusted `type` enum (field rename only). */
export const HARVEST_SUPPORTED_QUESTION_TYPES = [
  "multiple_choice",
  "multiple_select",
  "number_entry",
  "fill_blank",
  "dropdown",
  "true_false",
  "matching",
  "ordering",
  "short_answer",
  "reading_comprehension",
] as const;

/**
 * CSV `type` -> trusted `type`, per
 * 03-legacy-ingestion-requirements.md §3 / 02-parser-analysis.md §1.5.
 * `free_response`, `essay_response` and `label_diagram` are deliberately
 * absent: the docs flag all three as needing a policy decision or having no
 * automatic construction path, so this adapter rejects them rather than
 * inventing a mapping.
 */
export const CSV_QUESTION_TYPE_ALIASES: Readonly<Record<string, (typeof HARVEST_SUPPORTED_QUESTION_TYPES)[number]>> = {
  choice_single: "multiple_choice",
  choice_multi: "multiple_select",
  true_false: "true_false",
  numeric: "number_entry",
  short_answer: "short_answer",
  fill_in_blank: "fill_blank",
  dropdown_selection: "dropdown",
  matching: "matching",
  ordering: "ordering",
};

/** Visual types this adapter can structurally reshape today (documented field-level detail exists for all three). */
export const SUPPORTED_STRUCTURAL_VISUAL_TYPES = ["bar_chart", "table", "number_line"] as const;

/** Visual types forbidden outright by content rules — never converted, always rejected. */
export const FORBIDDEN_VISUAL_TYPES = ["svg", "image"] as const;

/**
 * Harvest tag vocabulary consumed by the donor's own
 * `checkAnswerCorrectness.mjs` (verify machine directives), never intended
 * as free-text metadata tags in the trusted schema. Filtered out, never
 * copied through — see 02-parser-analysis.md §1.1.
 */
const MACHINE_TAG_PREFIXES = ["verify:", "multipleBase:", "chartExtreme:", "predicate:"];

export function isMachineVocabularyTag(tag: string): boolean {
  return MACHINE_TAG_PREFIXES.some((prefix) => tag.startsWith(prefix));
}

/** Stimulus `kind` values the harvest schema declares; anything else is rejected as unsupported. */
export const SUPPORTED_STIMULUS_KINDS = ["passage", "scenario", "instructions"] as const;

/** Donor status/approval-family field values that must never be read as evidence of anything. */
export const DONOR_TRUST_CLAIM_VALUES = [
  "approved",
  "reviewed",
  "published",
  "validated",
  "production",
] as const;

/** Default marks value when the donor supplies none, per the documented policy (not a silent invention). */
export const DEFAULT_MARKS_WHEN_ABSENT = 1;
