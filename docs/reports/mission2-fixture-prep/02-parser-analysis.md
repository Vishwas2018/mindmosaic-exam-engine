# Parser Analysis — Mission 2 Fixture Prep

Status: **prep-only, non-authoritative reference**. No parser or adapter code exists yet — this
document specifies what a future Mission 2 structural-validation gate and migration adapter must
handle, grounded in the actual harvest content, not speculation.

Method: every JSON file under `03-question-banks/` was parsed with `JSON.parse` (no schema
library) and fingerprinted by top-level key set; the CSV harvest was read against its own
documented format; both were diffed field-by-field against the current trusted schema
(`src/schemas/question.schema.ts`, `src/schemas/visual.schema.ts`). Full raw output of the
analysis script's run is not committed (it is a throwaway research script, not fixture data);
this document and the fixtures under `src/tests/fixtures/question-factory/mission2-calibration/`
are the durable output.

## 1. Valid JSON shapes found

### 1.1 Harvest question shape (`03-question-banks/schemas/question.schema.json`)

The dominant shape. 302 unique questions (404 files counting the `approved-bank` duplicates), 0
malformed, 4 field-set variants (see the inventory doc §2.1). Field names (harvest → current
trusted schema):

| Harvest field | Trusted schema equivalent | Notes |
|---|---|---|
| `id` | `id` | Harvest IDs are free-form (`bank-<exam>-<year>-<subject>-<skill>-<seq>`); trusted IDs use the same `identifierSchema` regex (`^[a-z0-9]+(?:[-_][a-z0-9]+)*$`) — harvest IDs already satisfy it |
| `examType: "NAPLAN" \| "ICAS" \| "SKILL" \| "DIAGNOSTIC"` | `examStyle: "naplan_style" \| "icas_style"` | Harvest has 2 extra values (`SKILL`, `DIAGNOSTIC`) never observed in the corpus (0 occurrences) but schema-legal; trusted schema has no equivalent — an adapter must decide how to handle a future `SKILL`/`DIAGNOSTIC` candidate (reject, or extend `EXAM_STYLES`) |
| `yearLevel: 3 \| 5` | `yearLevel: 3 \| 5` | Identical domain |
| `subject` (free string: `"Numeracy"`, `"Mathematics"`, `"Reading"`, `"English"`, `"Grammar and Punctuation"`) | `metadata.subject: "numeracy" \| "reading" \| "writing" \| "language_conventions"` | Harvest subject is exam-branded prose, not an enum; needs a mapping table (5 harvest values seen → 4 trusted values; `"Mathematics"`/`"Numeracy"` both map to `numeracy`; `"English"` maps to either `reading` or `language_conventions` depending on `strand`) |
| `strand` (free string) | `metadata.strand` (free string, `.max(80)`) | Compatible, but harvest strands are exam-taxonomy names (`"Patterns and Algebra"`, `"Comprehension"`) not curriculum strands — needs review, not blind copy |
| `skillId` | *(none directly — closest is the Mission 1 taxonomy ID)* | Harvest skill IDs (`num.addition.two-digit`, `lit.reading.main-idea`, …) are dotted, lower-case, already alias-shaped; Mission 1's taxonomy registry should already treat these as the alias source per the Shared Governance instructions — confirm against `src/features/question-factory/taxonomy/entries.ts` before building an adapter |
| `skill` (display text) | `metadata.skill?` (optional display text) | Compatible |
| `difficulty: "easy" \| "medium" \| "hard" \| "challenge"` | `metadata.difficulty: "easy" \| "medium" \| "challenging"` | **Value mismatch**: harvest's `"hard"`/`"challenge"` vs trusted's single `"challenging"`. **Correction from the mechanical inventory** (`src/tests/fixtures/question-factory/mission2-calibration/harvest-inventory.json`): `"hard"` occurs 92 times and `"challenge"` 62 times across the 404 files — both must map to `"challenging"`; this doc's first pass under-counted by spot-checking only a handful of files instead of scanning all of them |
| `questionType` | `type` | See table below — not a 1:1 name mapping |
| `prompt` | `prompt` | Compatible (harvest max length unbounded by schema; trusted caps at 2000 chars — no harvest prompt observed over ~300 chars) |
| `stimulus: { kind, title, body } \| null` | `stimulus?: { title?, body, attribution }` | Harvest's `kind` (`passage \| scenario \| instructions`) has no trusted equivalent; trusted adds a mandatory `attribution: "MindMosaic original"` literal that harvest content obviously cannot claim without becoming original — **the adapter must treat this attribution field as a statement the adapter is not entitled to set for verbatim-harvested proseic**; only genuinely rewritten/original content may carry it |
| `assets[]` | `visuals[]` | See §3 |
| `options[]: { id, text }` | `options[]: { id, text, accessibleLabel? }` | Compatible; harvest option `id`s are often `"A"`/`"B"`/`"C"`/`"D"` (upper-case) or `"O1"`/`"L1"`/`"R1"` — **fails** the trusted `identifierSchema` regex, which requires lower-case (`^[a-z0-9]+(?:[-_][a-z0-9]+)*$`). Every harvested option/blank/match-column ID needs lower-casing before it can validate. |
| `blanks[]: { id, label?, choices? }` | `interaction.blanks[]` (presentation) + `answerKey.blanks[].acceptedAnswers` (scoring) | Harvest conflates presentation and scoring into one `blanks` array with `answerKey.answers[].acceptable`; trusted schema splits these into two parallel structures. Non-trivial 1-to-2 mapping. |
| `matchColumns: { left[], right[] }` | `interaction: { type: "matching", sources[], targets[] }` | Field renamed and restructured (`left`→`sources`, `right`→`targets`); `answerKey.pairs[].left/right` → `sourceId/targetId` |
| `answerKey` (13-variant `oneOf` keyed by `type`) | `answerKey` (12-variant discriminated union keyed by `kind`) | Discriminator field renamed (`type`→`kind`); see §2 |
| `explanation` | `explanation` | Compatible |
| `estimatedTimeSeconds` | `metadata.estimatedTimeSeconds` | Moved under `metadata` |
| `tags[]` | `metadata.tags[]` | Compatible, **but harvest tags carry machine semantics** (`verify:34+28=62`, `multipleBase:6`, `chartExtreme:max`, `predicate:isPrime`) consumed by `checkAnswerCorrectness.mjs`. The trusted schema's `tags` field has no such contract — these are free-text labels there. An adapter must NOT copy `verify:*`/`multipleBase:*`/`chartExtreme:*`/`predicate:*` tags into `metadata.tags` verbatim (harmless as inert text, but pointless clutter); if a future correctness verifier wants this tag vocabulary it needs its own typed field, not overloaded `tags`. |
| `origin: "ai_generated" \| "manual"` | `origin: "original_seed"` (single literal) | Every harvested question is, by definition, not `original_seed` — this field cannot be copied through; it is the strongest signal that harvest content is provenance-tracked candidate input, never a direct bank write (already covered by the Shared Governance "generator class" rule) |
| `status: "draft" \| "review" \| "published" \| "archived"` | `status: "draft" \| "reviewed" \| "published" \| "rejected"` | Different vocabulary; every harvested file has `status: "draft"` (404/404) |
| `createdAt?`, `updatedAt?` | *(none — trusted schema has no timestamp fields; provenance timestamps live in Mission 1's `provenance/` records)* | Drop, do not map |

### 1.2 Harvest visual-asset shape (`03-question-banks/schemas/visual-asset.schema.json`)

See §3 (visual-data variations) — kept separate because the differences are structurally the
most consequential finding of this analysis.

### 1.3 `review-queue.json` wrapper shape

A **legacy schema variant**, not the same shape as the 404 single-question files:

```
{ question: <harvest question shape>, skillId, sourcePromptId, validationStatus: "valid" | ...,
  validationErrors: string[], reviewerStatus: "approve" | ..., reviewerComments, riskFlags: string[],
  approvalStatus: "approved" | ..., createdAt }
```

Only 5 sample rows exist in the harvest, but the shape itself maps closely onto Mission 1's
provenance `reviewRecords[]` concept (`result`, `confidence`, `findings`, `evidence`, `reviewedAt`)
— worth a side-by-side comparison during Mission 3 review-record design, not this prep.

### 1.4 `approvedBank.generated.json` shape

A **compiled array** of the harvest question shape (`Question[]`, no wrapper) — the same 102
questions as `approved-bank/*.json`, just concatenated into one file. Confirms harvest already
had its own "compile many files into one array" step (`importers/compileApproved.mjs`), which is
the same pattern Mission 3's publication step (`batch-<batch-id>.json`) needs — worth reviewing
that importer's atomicity (or lack of it) before Mission 3, not adopting its code.

### 1.5 CSV harvest shape (`15-csv-import-seed/`)

A **third, unrelated schema family** — different donor project, different question-type
vocabulary, different serialisation. 15 columns per row (`slug, type, topic_slug, year_levels,
difficulty, prompt, tier_required, review_status, authored_by, reviewed_by,
source_descriptor_id, version, content_data_json, group_slug, group_position`), with the actual
question content nested as a **JSON-encoded string** in `content_data_json` — a JSON-in-CSV
double-parse (parse the CSV row, then `JSON.parse` one cell). 12 declared question types, none
of which share a name with the harvest JSON's `questionType` enum:

| CSV `type` | Harvest JSON equivalent | Trusted schema equivalent |
|---|---|---|
| `choice_single` | `multiple_choice` | `multiple_choice` |
| `choice_multi` | `multiple_select` | `multiple_select` |
| `true_false` | `true_false` | `true_false` |
| `numeric` | `number_entry` | `number_entry` |
| `short_answer` | `short_answer` | `short_answer` |
| `free_response` | *(none)* | closest is `short_answer` with `kind: "text"`, but semantically closer to an ungraded prompt — needs a policy decision, not an automatic mapping |
| `essay_response` | *(none — 0 `essay` in JSON harvest)* | `essay` |
| `fill_in_blank` | `fill_blank` | `fill_blank` |
| `dropdown_selection` | `dropdown` | `dropdown` |
| `matching` | `matching` | `matching` |
| `ordering` | `ordering` | `ordering` |
| `label_diagram` | *(none — 0 `label_diagram` in JSON harvest)* | `label_diagram` |

The CSV format is the **only** harvested source that contains any `label_diagram` or
essay/free-response-shaped content at all — see the correctness-verifier coverage matrix for why
this matters (those question types have real trusted-schema verifiers with zero harvested
examples to exercise them otherwise).

`year_levels` is pipe-delimited and can express values the trusted schema does not support
(`Y7`, `Y5|Y7`) — `YEAR_LEVELS = [3, 5]` in the trusted schema. Any CSV row above Year 5 is
out of scope for MindMosaic entirely, not just malformed.

`difficulty` is an **integer 1–5** in the CSV format vs a 3-value enum in both the harvest JSON
and trusted schemas — needs a numeric→enum bucketing decision (not specified anywhere in the
harvest; a migration adapter would have to invent one, e.g. 1–2→easy, 3→medium, 4–5→challenging,
and that invented mapping must be documented and reviewed, not silently assumed).

## 2. Legacy schema variants — summary

Five distinct serialisations of "a question" exist in the harvest, in order of how close they
are to the trusted schema:

1. Harvest JSON single-question files (`03-question-banks/{approved-bank,starter-bank}/*.json`, `schemas/examples/*.json`) — closest, one schema, well-formed, documented above.
2. `approvedBank.generated.json` — same shape, compiled array wrapper.
3. `review-queue.json` — same inner shape, review-metadata wrapper.
4. CSV harvest (`15-csv-import-seed/`) — unrelated schema, JSON-in-CSV, 12 question types, none named the same as the harvest JSON's types.
5. Trusted production schema (`src/schemas/question.schema.ts`) — the actual target; every field name, several structural decisions, and both discriminator keys (`type`→`kind` on answer keys, `questionType`→`type` on the question itself) differ from (1).

## 3. Visual-data variations (the highest-risk area)

| | Harvest `visual-asset.schema.json` | Trusted `visual.schema.ts` |
|---|---|---|
| Enum name | `type` | `type` |
| Values | `image, svg, bar_chart, line_graph, pie_chart, table, number_line, geometry_shape, coordinate_grid, fraction_model` (10) | `bar_chart, line_graph, pie_chart, table, number_line, geometry_shape, coordinate_grid, fraction_model, labelled_svg, hotspot_svg` (10) |
| Shared | 8 chart/data types | — |
| Harvest-only | `image`, `svg` — **both forbidden by Shared Governance** ("Visuals are structured deterministic JSON only — no raw SVG strings, screenshots, or opaque images") | — |
| Trusted-only | — | `labelled_svg`, `hotspot_svg` — the governance-compliant replacement: a `structuredSvgDataSchema` of typed, enumerated primitives (`circle \| rectangle \| line \| polygon \| text`, numeric coordinates, hex-colour strings) instead of a free string |
| Raw-content field | `svgContent?: string` — a free string on **any** asset type, schema-legal on all 10 types | **does not exist anywhere in the trusted schema** |
| Data field | `spec?: object` (untyped `{}` — any shape) required for the 8 chart/data types | `data` — a fully typed, per-type Zod object (see `visual.schema.ts` for each of the 10 variants), including deliberate render-safety bounds (`MAX_NUMBER_LINE_TICKS`, `MAX_COORDINATE_GRID_LINES_PER_AXIS`) absent from the harvest schema entirely |

**Empirical finding, not just a schema-level risk**: across all 404 harvested single-question
files, **zero** assets use `type: "image"` or `type: "svg"`, and **zero** assets populate
`svgContent`. The risk is real (the schema permits it, and any future `manual_external` LLM
candidate could produce it) but is not realised anywhere in the current harvested corpus. The
`format` field (`svg` on 112 assets, `json` on 58) is a *rendering-format hint* on structured
data (e.g. "render this `bar_chart`'s `spec` as SVG output"), not a raw-content field, and should
not be confused with `svgContent` — the parser must check the field name, not just search for the
substring `"svg"`.

Because harvest `spec` is untyped, every one of the 8 shared visual types still needs a
per-type structural check before it can become a trusted `data` object — e.g. harvest
`bar_chart.spec.data[]: { label, value }` vs trusted `barChartVisualSchema.data: { labels: string[],
values: number[] }` (parallel arrays, not an array of pairs) is a real reshape, not a rename.
`table.spec: { columns[], rows[][] }` vs trusted `table.data: { headers[], rows[][], rowHeaders }`
is a rename (`columns`→`headers`) plus a new required boolean. `number_line.spec: { min, max, step:
null, points[] }` vs trusted `number_line.data: { min, max, step (required, positive), highlightedValues[]
}` — the harvest schema allows `step: null` (used in both `bank-icas-3-num-pattern-*` fixtures
inspected for the calibration corpus) where the trusted schema requires a positive number; an
adapter must derive `step` from the point spacing or reject the asset, it cannot pass `null`
through.

## 4. Malformed records

**Zero malformed JSON files exist among the 404 harvested single-question files or the 3
compiled/wrapper JSON files** — every one parses and validates cleanly against
`question.schema.json`. This harvest was itself already schema-checked before being handed off
(`SUMMARY.md`: "302 schema-valid, 0 invalid"), so it is not a naturally-occurring source of
malformed-JSON fixtures.

The CSV harvest **does** contain deliberately-planted invalid rows —
`15-csv-import-seed/fixtures/invalid-mixed.csv` (8 rows: 3 valid + 5 invalid), already
purpose-built by the donor as a validator exercise fixture:

| Row | Defect |
|---|---|
| row 5 | empty `slug` (required field) |
| row 6 | `type: "unknown_question_type"` — not in the 12-value enum |
| row 7 | broken JSON in `content_data_json`: `{"prompt":"broken json is here ""options"": MISSING_BRACKET}` — unescaped quote + missing bracket, fails `JSON.parse` |
| row 8 | `year_levels: "G5"` — fails the `^Y[1-9]([0-2]?)$` pattern (should be `Y5`) |
| row 9 | `difficulty: "10"` — out of the CSV format's declared 1–5 range |

This is real, already-committed-by-the-donor malformed-record coverage, reused as-is (see the
fixtures under `src/tests/fixtures/question-factory/mission2-calibration/`).

Because the JSON harvest has no naturally-occurring malformed records, six **synthetic**
malformed-JSON fixtures were constructed for parser-robustness coverage (truncated file,
trailing comma, wrong-type field, missing required field, unknown top-level field, duplicate ID
within one array) — clearly labelled `"source": "synthetic"` in the corpus, never presented as
harvested content. See `06-unsafe-content-report.md` for why constructing rather than harvesting
malformed data is the safer choice here (a genuinely malformed harvested file might also carry
unreviewed prose).

## 5. Unsupported fields (fields the trusted schema has no slot for)

| Field | Where seen | Disposition |
|---|---|---|
| `svgContent` | harvest visual-asset schema (unused in the corpus, but schema-legal) | **Reject** — forbidden by content rules; a migration adapter must fail closed if this field is ever populated, not silently drop it |
| `stimulus.kind` | harvest question schema | Drop — trusted `stimulus` has no discriminator; the value (`passage \| scenario \| instructions`) is informative for classification but not representable |
| `createdAt` / `updatedAt` | harvest question schema | Drop — trusted schema has no timestamp fields; provenance timestamps belong in Mission 1's `provenance/candidate-provenance.ts`, not the question object |
| `origin: "ai_generated" \| "manual"` | harvest question schema | Drop / reinterpret — becomes the provenance `generatorAdapter`/generator-class fields, never the trusted schema's `origin: "original_seed"` literal |
| `estimatedTimeSeconds` at top level | harvest question schema | Move under `metadata.estimatedTimeSeconds` |
| CSV `tier_required`, `authored_by`, `reviewed_by`, `source_descriptor_id`, `version`, `group_slug`, `group_position` | CSV harvest row metadata | No trusted-schema equivalent at all; these are billing/authorship/curriculum-mapping/composite-grouping concerns that belong in provenance or a future composite-group feature, not the question object itself |
| harvest `tags` machine vocabulary (`verify:`, `multipleBase:`, `chartExtreme:`, `predicate:`) | harvest question `tags[]` | See §1.1 — do not copy into trusted `metadata.tags` as inert text; either build a typed successor field or discard |

## 6. Cross-references

- Family-by-family duplicate examples drawn from this analysis: [`03-duplicate-calibration-report.md`](./03-duplicate-calibration-report.md)
- Which verifier a given harvested question type/interaction would exercise: [`04-correctness-verifier-coverage-matrix.md`](./04-correctness-verifier-coverage-matrix.md)
- Full adapter requirements derived from every mapping table above: [`05-migration-adapter-requirements.md`](./05-migration-adapter-requirements.md)
- Content-safety implications of the above (the `svgContent` risk, the CSV email hygiene finding, originality caveats): [`06-unsafe-content-report.md`](./06-unsafe-content-report.md)
