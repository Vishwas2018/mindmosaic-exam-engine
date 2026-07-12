# Harvest Inventory — Mission 2 Fixture Prep

Status: **prep-only, non-authoritative reference**. Produced on `claude/mission2-fixture-prep`,
branched from `integration/governed-question-factory` @ `cdd8703`. Not part of the factory
domain; nothing here is wired into `src/features/question-factory/`. This branch has no
separate final-summary document — this file, together with
[`02-parser-analysis.md`](./02-parser-analysis.md),
[`03-legacy-ingestion-requirements.md`](./03-legacy-ingestion-requirements.md), and
[`04-unsafe-content-report.md`](./04-unsafe-content-report.md), is the full picture.

Source reviewed: `<local-harvest-scratch-dir>/_HARVEST` (a local, non-repository scratch
directory; path generalised here — read-only; every number below was produced by scripts run
against a local scratch copy — the harvest directory itself was left untouched). Cross-referenced
against the current trusted production bank
(`src/content/questions/`, `src/schemas/question.schema.ts`, `src/schemas/visual.schema.ts`).

## 1. Top-level harvest folders

| Folder | Contents | Relevance to Mission 2 |
|---|---|---|
| `00-*.md` | Mission prompts, legacy repo reuse audit, README | Context only |
| `01-ai-generation-pipeline/` | Working two-pass Anthropic (Haiku→Sonnet) generator, TS source only, no question data | Reference for the future live-provider adapter (Mission 3); no fixtures needed |
| `02-question-factory/question-factory/` | Deterministic generators, validators, QA script, prompt templates, `config/skill-taxonomy.json` | Already the seed for Mission 1's taxonomy; its `validators/checkAnswerCorrectness.mjs` and `qa/contentQa.mjs` are the direct precedent for Mission 2 gates 2–3 |
| `03-question-banks/` | **The question-data harvest** — see §2 | Primary source for this prep work |
| `04-ai-prompt-docs/` | Prompt-template docs | Mission 3 (generation) |
| `05`–`18` | Supabase blueprints, skill-mastery, engines, TTS, SVG sanitiser, visual components, brand/design/product docs, docs/ADRs, CSV import-seed, Stripe/landing/dashboard reference | Not question content; `15-csv-import-seed/` is the one exception — see §3 |

## 2. `03-question-banks/` — question-data harvest

425 filesystem entries total in this folder; 423 are `.json`, 2 are narrative Markdown reports
not modeled as data records (see §2.2 for the full cross-location reconciliation). Breakdown:

| Location | Files | Notes |
|---|---|---|
| `approved-bank/*.json` | 102 | **Byte-identical duplicates** of 102 of the 302 `starter-bank/` files (verified by SHA-256 over content with `id`/`status`/`origin` excluded — every file diffs clean against its `starter-bank` counterpart). Not a distinct 102 additional questions. |
| `starter-bank/*.json` | 302 | The full generated batch (`SUMMARY.md`: "302 questions generated, 302 schema-valid, 0 invalid"). This is the true single-question corpus. |
| `starter-bank/SUMMARY.md` | 1 | Generation report, not question data |
| `approvedBank.generated.json` | 1 | A **compiled array** of the same 102 approved questions in one file — a third representation of the same 102 IDs, not new content |
| `review-queue.json` | 1 | 5 sample items, a **different wrapper shape**: `{ question, skillId, sourcePromptId, validationStatus, validationErrors, reviewerStatus, reviewerComments, riskFlags, approvalStatus, createdAt }` around the same question object |
| `content-qa-report.md` | 1 | Human-readable QA summary over the 302 (see §4 and the parser-analysis report) |
| `schemas/question.schema.json` | 1 | The JSON Schema the 302+102 files validate against |
| `schemas/visual-asset.schema.json` | 1 | Referenced `$ref` schema for `assets[]` |
| `schemas/examples/*.json` | 15 | One canonical example per interaction shape (`fill-blank`, `matching`, `mcq`, `true-false`, `table`, `dropdown`, `short-answer`, `true-false` (ICAS), `multiple-select`, `mcq-barchart`, `number-entry`, `line-graph`, `pie-chart`, `ordering`, `reading-comprehension`) |

**Corrected headline number:** the harvest contains **302 unique legacy questions**, not 404/426.
The Mission prompt's "404 legacy question JSONs" count is the *file* count across
`approved-bank/` + `starter-bank/`, which double-counts the 102 promoted duplicates. Anyone
consuming this harvest for Mission 2 should dedupe by `id` first (or read `starter-bank/` alone
plus `approvedBank.generated.json`'s 102 IDs as a "promoted" subset flag, not as extra content).

### 2.2 Reconciled inventory accounting

This section defines every counting term used in this report and in `harvest-inventory.json`,
and reconciles the two numbers that previously disagreed (this file's own **426 filesystem
entries** headline vs. the mechanical inventory's **427 fixture records**).

**Definitions**

| Term | Meaning |
|---|---|
| Filesystem entry | Any file that physically exists under a harvested source location relevant to Mission 2 (`03-question-banks/**` and `15-csv-import-seed/fixtures/**`), regardless of whether it was inventoried as a data record. |
| Fixture record | One entry in `harvest-inventory.json`'s `records[]` array — one per machine-parseable, data-bearing file (a JSON file, or a CSV file counted at file granularity). Narrative-only Markdown reports carry no structured question/schema/row data and are not modeled as records. |
| Question-content record | A fixture record of `sourceFormat: "harvest_question_json"` — a single harvested question JSON file (`approved-bank/` + `starter-bank/`). |
| CSV file | One physical `.csv` file under `15-csv-import-seed/fixtures/`. |
| CSV data row | One data row (header excluded) within a CSV file. |
| Malformed CSV row | A CSV data row that fails to parse, or fails validation against the CSV harvest's own declared shape. |
| Duplicate copy | A question-content record whose content is byte-identical (SHA-256 over content with `id`/`status`/`origin` excluded) to another record's content, differing only in directory (`approved-bank/` vs `starter-bank/`). |
| Unique content record | A question-content record that is not a duplicate copy of another. |

**Reconciled counts**

| Metric | Count |
|---|---|
| Raw filesystem entries — `03-question-banks/` | 425 (423 `.json` + 2 narrative Markdown: `starter-bank/SUMMARY.md`, `content-qa-report.md`) |
| Raw filesystem entries — `15-csv-import-seed/fixtures/` | 4 (`.csv` files) |
| **Raw filesystem entries — total, both locations** | **429** |
| Fixture-record count (`harvest-inventory.json`, `records.length`) | **427** (429 total filesystem entries minus the 2 narrative Markdown files, which carry no data to inventory) |
| CSV-file count | 4 |
| CSV data-row count (all 4 files, header rows excluded) | 29 (12 + 5 + 4 + 8) |
| Valid CSV data-row count | 24 |
| Malformed CSV-row count | 5 (all in `invalid-mixed.csv`; see `02-parser-analysis.md` §4) |
| Question-content record count | 404 (`approved-bank/` 102 + `starter-bank/` 302) |
| Exact duplicate-copy count | 102 |
| Unique-content count | 302 |

**What the "426 vs 427" discrepancy actually was:** this file's earlier headline ("426
filesystem entries") was an arithmetic slip — summing this section's own breakdown table
correctly gives **425**, not 426 — and that headline described `03-question-banks/` alone, never
including the 4 CSV files from `15-csv-import-seed/fixtures/` (covered separately in §3).
`harvest-inventory.json`'s **427** fixture records is a different, correctly-scoped total: every
data-bearing file across *both* harvest locations (425 − 2 narrative Markdown + 4 CSV = 427).
There is no unexplained "extra" record once both totals are placed on the same basis — every
fixture record maps to a real filesystem entry, and the 2 filesystem entries with no fixture
record (`starter-bank/SUMMARY.md`, `content-qa-report.md`) are accounted for explicitly above,
not silently dropped.

The mechanical inventory's `bySourceFormat.csv_row: 4` counts **CSV files**, not CSV data rows —
the key name was misleading. The true CSV data-row total is **29** (12 + 5 + 4 + 8, one count per
file, see §3), of which **24** are valid and **5** are the deliberately malformed rows in
`invalid-mixed.csv`. Each CSV-file record's `recordCount` field in `harvest-inventory.json`
already carries the correct row-level number for that file; only the aggregate
`bySourceFormat` key name and this report's prose previously conflated file-count with row-count.

### 2.1 Shape signatures (302 unique + 102 duplicate copies = 404 single-question files)

All 404 single-question files parse as valid JSON and validate against one schema
(`question.schema.json`) with **zero malformed records**. Four field-set variants exist,
purely from optional-field presence:

| Fields present (beyond the 15 always-present fields) | Count | Question types |
|---|---|---|
| + `options` | 272 | `multiple_choice`, `multiple_select`, `number_entry`\*, `true_false`\*, `reading_comprehension`, `ordering` |
| (none of options/blanks/matchColumns) | 98 | `number_entry`, `true_false` |
| + `blanks` | 24 | `fill_blank`, `dropdown` |
| + `matchColumns` | 10 | `matching` |

\* `number_entry` and `true_false` never carry `options`; the 272-row bucket is dominated by
`multiple_choice`/`multiple_select`/`reading_comprehension`/`ordering`.

Question-type distribution (302 unique, counted from `starter-bank/`):

| `questionType` | Count |
|---|---|
| `multiple_choice` | 120 (184 across all 404 file copies) |
| `reading_comprehension` | 59 |
| `number_entry` | 42 (70 across 404 copies) |
| `fill_blank` | 19 |
| `multiple_select` | 17 |
| `true_false` | 13 (21 across 404 copies) |
| `matching` | 10 |
| `ordering` | 10 |
| `short_answer` | 7 |
| `dropdown` | 5 |

No `essay` or `label_diagram` questions exist anywhere in the JSON harvest — the generator
deliberately deferred both ("no rubric-scoring UI / labelling UI yet" per `SUMMARY.md`). This is
a real coverage gap — see the correctness-verifier matrix fixture
(`src/tests/fixtures/question-factory/mission2-calibration/correctness-verifier-matrix.json`,
`gapNote` field on the affected categories). No separate Markdown report for this matrix exists
on this branch; the fixture itself is the durable artefact.

Answer-key type distribution: `single_option` 243, `numeric` 70, `blanks` 24, `boolean` 21,
`multiple_option` 19, `matching` 10, `ordering` 10, `text` 7. No `rubric` answer keys occur
(consistent with no `essay`/`label_diagram` questions).

Visual asset `type` distribution (170 assets total across 404 files): `bar_chart` 38,
`line_graph` 38, `pie_chart` 36, `table` 26, `geometry_shape` 24, `number_line` 8. **Zero**
assets use `type: "image"` or `type: "svg"` even though the harvest's own
`visual-asset.schema.json` permits both — see the unsafe-content report. Asset `format` field:
`svg` 112, `json` 58 (this is a rendering-format hint, not a raw-content field — see the
parser-analysis report for why this distinction matters).

## 3. `15-csv-import-seed/` — a second, unrelated legacy format

A CSV-based importer for a **different donor project's schema** (its own Zod
`questionContentSchema`, 12 question types, `content_data_json` string blob per row). Not
convertible to the `03-question-banks/` JSON shape without a real adapter — see
[`03-legacy-ingestion-requirements.md`](./03-legacy-ingestion-requirements.md).

| File | Rows | Purpose |
|---|---|---|
| `fixtures/valid-all-types.csv` | 12 | One row per question type (`choice_single`, `choice_multi`, `true_false`, `numeric`, `matching`, `dropdown_selection`, `fill_in_blank`, `ordering`, `label_diagram`, `essay_response`, `short_answer`, `free_response`) |
| `fixtures/valid-choice-single.csv` | 5 | All `choice_single` |
| `fixtures/valid-composite-reading.csv` | 4 | One reading-comprehension composite group (`group_slug`/`group_position`: anchor passage + 3 sibling questions) |
| `fixtures/invalid-mixed.csv` | 8 (3 valid, 5 deliberately invalid) | Purpose-built malformed-row fixture — see the parser-analysis report |

This CSV format is genuinely useful as **its own harvested legacy variant** (it is Mission 2's
"CSV formats" requirement) but is a different project's content model, not a preview of the
current bank. It also contains one real hygiene finding — see
[`04-unsafe-content-report.md`](./04-unsafe-content-report.md) §2.

## 4. Existing QA signal already computed by the donor tooling

`02-question-factory/question-factory/qa/contentQa.mjs` is a second, independent, deterministic
QA pass the donor already ran over the 302-question `starter-bank`
(`content-qa-report.md`, re-derived read-only for this prep — see §5 of the parser-analysis
report for the full breakdown):

| Flag | Count | Severity |
|---|---|---|
| `unsupported_visual_type` | 32 | major → `needs_revision` |
| `literal_answer_not_in_passage` | 15 | minor |
| `surface_double_space` | 15 | minor |
| `near_duplicate` (donor's own >=0.95 same-skill token-Jaccard heuristic) | 8 | minor |

**270 `approved_candidate`, 32 `needs_revision`, 0 `rejected_candidate`.** None of the 8
`near_duplicate` flags were independently confirmed as true duplicates on inspection — see
`duplicate-pairs.json` (`src/tests/fixtures/question-factory/mission2-calibration/`), pairs
`cal-0015`–`cal-0022` (signal `donor_tool_false_positive`), for why this matters and how those 8
pairs were relabelled `structurally_similar_but_allowed` for the calibration corpus. No separate
Markdown "duplicate-calibration report" exists on this branch — the fixture is the durable
artefact.

## 5. Current trusted production bank (for comparison)

`src/content/questions/{grade-3,grade-5}/*.ts`, validated by `src/schemas/question.schema.ts`
+ `src/schemas/visual.schema.ts`. 10 files, 4,738 lines, one `Question[]` array per
exam-style/subject/year combination, exported through `question-bank.ts`. This is the schema
Mission 2's structural-validation gate and any future migration adapter must target — its shape
differs from the harvest shape in every field name and several structural decisions (discriminated
union `kind` vs `type`, nested `metadata` object, separate `interaction` config, `visuals` vs
`assets`, no raw `svg`/`image` visual types). Full field-by-field diff is in the parser-analysis
report.
