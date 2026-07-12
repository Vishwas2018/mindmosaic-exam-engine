# Legacy Question Ingestion Adapter — Mission 2A

Status: **implemented, not yet exercised against real harvest content**. This mission builds the
deterministic, non-publishing ingestion adapter itself and proves its behaviour with small
synthetic fixtures. It does **not** import the 302 harvested questions, and it does not implement
any of the remaining Mission 2 engines (correctness verification, semantic/originality/difficulty
review, or publication).

**Repair note (Mission 2A follow-up, second commit):** an independent review (Codex) found that
the original boolean-answer mapping used JavaScript truthiness coercion (`Boolean(value)`), which
would have silently accepted ambiguous donor values (`"0"`, `"1"`, `"no"`, `{}`, `[]`, …) as a
definite true/false. This revision replaces it with a single strict boolean parser shared by both
ingestion paths, strengthens id canonicalisation (trim → Unicode NFKC → lower-case, applied
identically to every identifier and every reference to it), adds bounded input-size checks ahead
of expensive parsing, and removes the internal adapter-preflight schema from the public API
surface. See "Boolean answer parsing", "Identifiers", "Input-size safeguards", and "Public API"
below for the corrected behaviour.

Code: `src/features/question-factory/ingestion/`. Tests:
`src/tests/unit/question-factory/ingestion.test.ts`. Grounded in the Mission 2 fixture-prep
analysis: `docs/reports/mission2-fixture-prep/{01-harvest-inventory,02-parser-analysis,03-legacy-ingestion-requirements,04-unsafe-content-report}.md`.

## Architecture

```text
legacy source file/row
  → parseDonorSource (shape dispatch: JSON.parse / shape validation, never throws for bad donor data)
  → normaliseLegacyQuestion | normaliseCsvRow (field mapping, alias tables, safety checks)
  → candidateQuestionSchema.safeParse (adapter preflight, not the future structural gate)
  → mintCandidateId / hashJson (deterministic identity + content hash)
  → candidateProvenanceSchema (shared provenance, reused unmodified)
  → FactoryRepository.create("generated", candidateId, record)  [skipped under dryRun]
```

Single entry point: `ingestLegacyQuestions(request, repository): Promise<readonly IngestionResult[]>`.
Returns one result per question found in the source — one for
`legacy_question_json`/`review_queue_wrapper`/`csv_row`, one per array element for
`compiled_question_array`.

### Files

| File | Responsibility |
|---|---|
| `types.ts` | `IngestionRequest`/`IngestionResult`/`IngestionWarning`/`IngestionIssue` contracts, closed warning/rejection code enums |
| `legacy-shapes.ts` | Loose structural Zod schemas for the four donor shapes (shape-dispatch layer, not business validation); bounds `review_queue_wrapper`'s `validationErrors`/`riskFlags` array lengths |
| `candidate-question.ts` | `candidateQuestionSchema` — the normalised candidate question shape, reusing trusted `answerKeySchema`/`interactionSchema`/`questionOptionSchema`/`visualSchema` but never the trusted `origin`/`status`/`stimulus.attribution` trust markers. **Internal only** — not re-exported from `index.ts` (see "Public API"). |
| `mappings.ts` | All alias tables (difficulty, exam type, subject, question type, visual type) and fixed constants, each traceable to a specific line in the Mission 2 analysis docs |
| `boolean-parsing.ts` | `parseStrictBoolean` — the single sanctioned strict boolean parser used by both ingestion paths |
| `canonicalise-id.ts` | `canonicaliseId`/`canonicaliseIds` — the single sanctioned id-canonicalisation sequence (trim → NFKC → lower-case) used for every identifier and every reference to it |
| `limits.ts` | `INGESTION_LIMITS` — every bounded input size in one place, consumed by `parse.ts`/`csv-normalise.ts`/`legacy-shapes.ts` |
| `safety.ts` | Deterministic unsafe-markup and alt-text-leakage detection (literal pattern/substring matching only) |
| `normalise.ts` | Harvest-JSON field-by-field mapping pipeline |
| `csv-normalise.ts` | CSV-row field-by-field mapping pipeline (donor project schema, entirely distinct from the harvest JSON shape) |
| `parse.ts` | Shape dispatch: unwraps `review_queue_wrapper`, iterates `compiled_question_array`, JSON-parses raw text, enforces the raw-payload and compiled-array-size limits |
| `identity.ts` | Deterministic `candidateId` minting and raw-input content hashing |
| `source-path.ts` | Rejects absolute/UNC/path-traversal `sourcePath` values |
| `ingest.ts` | Orchestrator: ties parsing → normalisation → schema preflight → provenance → repository write together |
| `index.ts` | Narrow public export surface only |

## Supported source formats

| `sourceFormat` | `rawInput` | Notes |
|---|---|---|
| `legacy_question_json` | raw JSON string | One donor question object |
| `compiled_question_array` | raw JSON string | A bare `Question[]` array (e.g. `approvedBank.generated.json`'s shape) — one `IngestionResult` per element |
| `review_queue_wrapper` | raw JSON string | `{ question, skillId, sourcePromptId, validationStatus, reviewerStatus, reviewerComments, riskFlags, approvalStatus, createdAt }` — every field except `.question` is discarded as non-authoritative and surfaces only as a `donor_review_metadata_ignored` warning |
| `csv_row` | already-parsed row object | Outer CSV parsing is **not** this adapter's job (per the Mission 2 requirements doc §2); the adapter receives one row record and JSON-parses its `content_data_json` cell itself |

Shape dispatch happens before any field-level parsing (`parse.ts`), so a wrapper/array/CSV row is
never misread by a flat single-question parser. A `sourceFormat` value outside the four supported
ones is rejected (`unsupported_source_format`) rather than guessed.

## Mappings

### Difficulty
`easy`→`easy`, `medium`→`medium`, `hard`→`challenging`, `challenge`→`challenging`. Any other value
is rejected as `ambiguous_difficulty` — never guessed. CSV integer `1`–`5` buckets `1–2`→`easy`,
`3`→`medium`, `4–5`→`challenging`; out-of-range or non-integer values are rejected the same way.

### Exam type / subject
`examType` `NAPLAN`→`naplan_style`, `ICAS`→`icas_style`; `SKILL`/`DIAGNOSTIC` (0 occurrences in the
harvest, per the inventory) are rejected as `unsupported_exam_type`. `subject` `Numeracy`/
`Mathematics`→`numeracy`, `Reading`→`reading`, `Grammar and Punctuation`→`language_conventions`,
`English`→`reading` or `language_conventions` depending on whether `strand` mentions grammar/
punctuation/language/spelling/vocabulary. Any other subject string is `unsupported_subject`.

### Question type
Harvest `questionType` values already share identifiers with the trusted `type` enum (a field
rename only): `multiple_choice`, `multiple_select`, `number_entry`, `fill_blank`, `dropdown`,
`true_false`, `matching`, `ordering`, `short_answer`, `reading_comprehension`. Anything else is
`unsupported_question_type`. CSV `type` uses its own 12-value vocabulary; this adapter maps the
9 with a clear trusted equivalent (`choice_single`→`multiple_choice`, `choice_multi`→
`multiple_select`, `true_false`, `numeric`→`number_entry`, `short_answer`, `fill_in_blank`→
`fill_blank`, `dropdown_selection`→`dropdown`, `matching`, `ordering`) and rejects `free_response`,
`essay_response` and `label_diagram` outright — the source docs flag all three as needing a policy
decision or having no automatic construction path, so this adapter does not invent one.

### Identifiers

Every option/blank/match-source/match-target/dropdown-field id — and every answer-key reference to
one of those ids (`answerKey.optionId`/`optionIds`, matching `pairs[].left/right`, blanks
`answers[].id`, CSV `correct_id`/`correct_ids`/`correct_order`/`term_id`/`target_id`/
`correct_option_id`) — is canonicalised through the exact same three-step sequence,
`canonicaliseId` (`canonicalise-id.ts`), in this fixed order:

1. **Trim** leading/trailing whitespace.
2. **Unicode NFKC-normalise** (compatibility variants — full-width forms, ligatures, etc. —
   collapse to one canonical form).
3. **Lower-case** last, after both of the above.

Definitions (`options[]`, `blanks[]`, `matchColumns.left/right`, dropdown fields/options) are
canonicalised first via `canonicaliseIds`, which fails closed in two distinct ways: an id that
canonicalises to the **empty string** (e.g. whitespace-only) is rejected as
`empty_identifier_after_normalisation`; two originally-distinct ids that canonicalise to the
**same** value are rejected as `duplicate_ids_after_normalisation`. Every answer-key reference is
then canonicalised the same way and checked against the resulting canonical id set — never
re-derived with a bare `.toLowerCase()`, so a reference that differs from its definition only by
whitespace or a Unicode-compatibility variant still resolves correctly instead of silently failing
to match.

### Boolean answer parsing

The harvest JSON `boolean` answer key (`answerKey.value`) and the CSV `true_false` `correct` field
both go through the single shared `parseStrictBoolean` (`boolean-parsing.ts`). It **never** uses
JavaScript truthiness (`Boolean(value)`, `!!value`, `value ? true : false`) — only four donor
representations are accepted as unambiguous:

- the JSON booleans `true` and `false`;
- the strings `"true"` and `"false"`, trimmed and compared case-insensitively (so `" True "`,
  `"FALSE"`, `"\tfalse\n"` all parse deterministically).

Every other value is rejected as `ambiguous_boolean_value` — including `"0"`, `"1"`, `"yes"`,
`"no"`, `"TRUE-ish"`, an empty string, the numbers `0`/`1`, `{}`, `[]`, `null`, and `undefined`.
Critically, `"false"` (or `false`) can never become `true`: the parser only ever returns `true` for
the exact strings/values that mean `true`, so there is no fallthrough path (e.g. "not recognised,
default to true") that could invert a donor's intended answer.

### Visuals
`svg`, `image`, and any asset with a populated `svgContent` field (regardless of declared type) are
**forbidden outright** (`forbidden_raw_visual_content`) — never converted, per the content-safety
rule that visuals are structured deterministic JSON only. Of the 8 shared chart/data types, this
adapter reshapes the 3 the source docs give exact field-level detail for: `bar_chart`
(`spec.data[]: {label,value}` → `data:{labels[],values[]}`), `table` (`spec.columns/rows` →
`data.headers/rows`, with `rowHeaders` defaulted `false` and flagged), and `number_line`
(`spec.step` may be `null`; derived from point spacing when possible, otherwise rejected — never
passed through as `null`). `line_graph`, `pie_chart`, `geometry_shape`, `coordinate_grid` and
`fraction_model` are rejected as `unsupported_visual_type` — see Known limitations.

### Stimulus
`kind: passage | scenario | instructions` are accepted (kept as informative classification only,
dropped from the stored object — the trusted schema has no discriminator slot for it); any other
`kind` is `unsupported_stimulus_kind`. The candidate's stimulus never carries an `attribution`
field — the adapter is never entitled to assert `"MindMosaic original"` for donor-derived prose.

### Tags, marks, timestamps
Machine-vocabulary tags (`verify:`, `multipleBase:`, `chartExtreme:`, `predicate:`) are filtered
out with a `machine_tag_filtered` warning, never copied into candidate metadata as inert text.
`marks` has no donor equivalent and is always defaulted to `1` with a `marks_defaulted` warning.
`createdAt`/`updatedAt` are dropped with `timestamp_field_dropped` warnings (no trusted-schema
equivalent; provenance timestamps come from the ingestion adapter's own clock, not the donor's).

## Rejection rules

Every rejection returns a structured `{ status: "rejected", reasonCode, issues[] }` — the adapter
never throws for expected-bad donor input (`src/tests/unit/question-factory/ingestion.test.ts`
covers malformed JSON syntax, a well-formed-but-unrecognised shape, an unsupported source format,
unsafe raw markup, forbidden/unsupported visual types, an unsupported stimulus kind, an ambiguous
difficulty, an ambiguous boolean value, post-normalisation id collisions, an empty id after
canonicalisation, a dangling answer-key reference, an absolute `sourcePath`, answer leakage in alt
text, malformed inner CSV JSON, an empty CSV slug, an oversized payload, and a simulated partial
repository failure). Unexpected programming errors (a thrown exception from the repository layer,
for example) are caught at the orchestration boundary and converted into a
`repository_write_failed` rejection rather than propagating.

## Trust boundary

Donor `origin`, `status`, `reviewerStatus`, `validationStatus`, `approvalStatus` and `riskFlags`
are read only to produce a warning (`origin_field_ignored`, `donor_status_ignored`,
`donor_review_metadata_ignored`) and are never written into the candidate question object — there
is no `status`/`origin`/`approvalStatus` field anywhere on `candidateQuestionSchema` for such a
claim to land on. `docs/reports/mission2-production` and
`src/tests/unit/question-factory/ingestion.test.ts`'s `"trust-boundary"` describe block prove this
directly: parametrised over every value in `DONOR_TRUST_CLAIM_VALUES` (`approved`, `reviewed`,
`published`, `validated`, `production`), the resulting candidate's `state` is always exactly
`"generated"`. `generatorAdapter.class` is hard-coded to `"manual_external"` inside the orchestrator
— the `IngestionRequest` contract does not expose a `class` field, so a caller cannot request a
different (more trusted) generator class. Donor-supplied `id` is recorded only as
non-authoritative provenance evidence (`donorSourceId`) and never becomes the candidate's actual
identifier — `mintCandidateId` derives it solely from `(sourcePath, batchId, pipelineRunId,
adapterVersion, indexInSource, sourceContentHash)`.

## Lifecycle behaviour

Every accepted candidate is created with `state: "generated"` — the first state in
`CANDIDATE_STATES` — and nothing in this module ever calls `applyTransition` or constructs any
other state. There is no code path from this adapter to `structural_validation_passed`,
`correctness_check_passed`, `semantic_review_passed`, `originality_review_passed`,
`difficulty_review_passed`, `staged`, or `published`. `candidateQuestionSchema.safeParse` is an
adapter preflight (catches obviously malformed answer references/shapes before they ever reach
storage) — it is explicitly not the future structural-validation gate, and passing it never sets
or implies `structural_validation_passed`.

## Provenance model

Two composed parts, deliberately not merged into one schema:

- **`provenance` (`CandidateProvenance`, the shared, unmodified `candidateProvenanceSchema`)** —
  `candidateId`, `blueprintId` (the fixed placeholder `legacy-ingestion-unblueprinted` when the
  caller supplies none — legacy content predates the blueprint workflow entirely), `batchId`,
  `pipelineRunId`, `revision: 0`, `generatedAt`, `generatorAdapter: { class: "manual_external",
  identity }`, `generatorVersion`/`promptVersion` (fixed sentinels for a path with no generation
  prompt), `schemaVersion`/`taxonomyVersion` (from `FACTORY_VERSIONS`), `contentHash` (stable-JSON
  hash of the normalised candidate question), `reviewRecords: []`.
- **`ingestion` (`LegacyIngestionProvenance`, ingestion-specific)** — `sourceFormat`, `sourcePath`
  (repository-relative, forward-slash-normalised; absolute paths are rejected before this point,
  never merely sanitised), `sourceContentHash` (hash of the *raw*, pre-normalisation donor
  payload), `adapterVersion`, an optional `donorSourceId` (non-authoritative), `ingestedAt`, and
  the full `warnings[]` array (every dropped/mapped/rejected field the normaliser touched).

## Determinism and replay

`candidateId = "ing-" + hash(sourcePath, batchId, pipelineRunId, adapterVersion, indexInSource,
sourceContentHash)`. Re-ingesting identical inputs always mints the same id and produces
byte-identical normalised content (`ingestion.test.ts`'s `"produces deterministic normalisation
for identical inputs"` test). Before writing, the orchestrator reads back any existing record at
that id: if its `provenance.contentHash` matches, the call is treated as a no-op replay
(`written: false, replay: true`); if it differs, the write is refused
(`candidate_already_exists`) rather than overwriting an unrelated record.

## Dry-run behaviour

`dryRun: true` runs parsing, normalisation, and the schema preflight, and returns the full
candidate preview and warnings — and performs **no** repository read-back and **no**
`repository.create()` call at all. `ingestion.test.ts` proves this directly:
`repo.list("generated")` is empty after a dry-run ingestion of the same input that, without
`dryRun`, would have written a record.

## Input-size safeguards

`limits.ts`'s `INGESTION_LIMITS` centralises every bounded size (no scattered magic numbers):

| Limit | Value | Enforced in |
|---|---|---|
| `MAX_RAW_INPUT_LENGTH` | 1,000,000 characters | `parse.ts`, before `JSON.parse` on any raw JSON-string source |
| `MAX_COMPILED_ARRAY_RECORDS` | 500 elements | `parse.ts`, checked on the parsed array before the (more expensive) per-element Zod shape validation |
| `MAX_CSV_EMBEDDED_JSON_LENGTH` | 200,000 characters | `csv-normalise.ts`, before `JSON.parse` on `content_data_json` |
| `MAX_REVIEW_METADATA_ARRAY_LENGTH` | 100 entries | `legacy-shapes.ts`, as a `.max()` bound on `review_queue_wrapper`'s `validationErrors`/`riskFlags` |

Exceeding any of the first three returns a structured `source_payload_too_large` rejection before
the expensive parse/normalisation work runs; exceeding the fourth surfaces through the existing
shape-mismatch path (`unrecognised_donor_shape`), since it is a per-field Zod bound rather than a
whole-payload gate. **No recursive object-depth analyser is implemented, and none is planned for
this adapter** — every donor shape accepted by `legacy-shapes.ts` is already a shallow, explicitly
bounded object graph (each nested array/object has its own `.max()`/field list), so the trusted
`answerKeySchema`/`interactionSchema`/`visualSchema` bounds reused by `candidateQuestionSchema`
remain the adapter's post-parse structural defence against deeply nested or over-long payloads.
Adding a bespoke depth walker on top would duplicate that defence without a concrete threat this
adapter's own shape schemas do not already close off.

## Public API

`ingestion/index.ts` exports only: `ingestLegacyQuestions`, `INGESTION_ADAPTER_VERSION`,
`LEGACY_SOURCE_FORMATS`, and the `IngestionRequest`/`IngestionResult`/`IngestionWarning`/
`IngestionIssue`/`IngestionRejectionCode`/`IngestionWarningCode`/`IngestedCandidateRecord`/
`LegacyIngestionProvenance`/`LegacySourceFormat` types. `candidateQuestionSchema` and its
`CandidateQuestion`/`CandidateQuestionInput` types were removed from both `ingestion/index.ts` and
the top-level `question-factory/index.ts` barrel (which re-exports `./ingestion`) — no production
caller imported them, and the schema is an internal adapter-preflight check, not a public
contract. `candidate-question.ts` still exists and is still imported directly (by file path) from
`ingest.ts`, `normalise.ts`, `csv-normalise.ts`, and the test suite; it is simply no longer
re-exported through the barrel.

## Known limitations

- **Visual coverage is partial by design.** Only `bar_chart`, `table`, and `number_line` are
  reshaped; `line_graph`, `pie_chart`, `geometry_shape`, `coordinate_grid`, and `fraction_model`
  are rejected as `unsupported_visual_type`. The harvest's own `visual-asset.schema.json` leaves
  `spec` completely untyped, and the Mission 2 analysis docs give exact field-level shape detail
  for only the three implemented types — extending coverage to the rest requires confirming their
  real donor field names against `_HARVEST` first, not guessing.
- **CSV `subject`/`strand`/`examStyle` are adapter-invented policy, not donor data.** The CSV
  donor project has no subject, strand, or exam-program field at all (only `topic_slug`). This
  adapter infers `subject` from `topic_slug` via a keyword heuristic, defaults `strand` to the raw
  `topic_slug`, and defaults `examStyle` to `naplan_style` — each flagged with its own warning
  every time. These are placeholder conventions pending a real product decision, not values the
  CSV format encodes.
- **CSV composite reading groups are not supported.** A row carrying `group_slug`/`group_position`
  is rejected (`composite_reading_group_unsupported`) rather than synthesising a stimulus from the
  anchor row, per the open policy question in the requirements doc §2.
- **CSV `free_response`, `essay_response`, `label_diagram` are rejected outright** — no
  automatic construction path exists for any of the three today.
- **Answer-leakage detection is a literal substring check only** — deliberately not semantic/NLP,
  per the determinism requirement. It will miss paraphrased leaks and may rarely false-positive on
  short numeric answers that happen to appear in prose for unrelated reasons.
- **Taxonomy resolution is best-effort.** An unresolved `skillId`/`skill` label is carried through
  as free text with a `skill_not_in_taxonomy` warning rather than rejecting the candidate — Mission
  1's taxonomy coverage is not yet complete enough to gate ingestion on it.
- **No CLI or batch-file-driven runner exists yet.** This mission implements the adapter function
  and its tests only; a script that walks a real `_HARVEST`-shaped directory and calls
  `ingestLegacyQuestions` per file is out of scope here (and, per the mission's scope
  restrictions, the 302 harvested questions are not imported by this mission regardless).

## Confirmation: no production content touched

- `src/content/questions/` was not read, written, or referenced by any file in this mission.
- The 302 harvested questions under the local `_HARVEST` scratch directory were **not** imported —
  every test fixture in `ingestion.test.ts` is a small, hand-written synthetic object.
- Every ingested test candidate is written only under the `generated` compartment of a temporary,
  per-test `FsFactoryRepository` root (`mkdtemp`), never under `content/question-factory/` in the
  real repository working tree.
- No candidate produced by this adapter is ever created, moved, or observed at any lifecycle state
  other than `generated`.
