# Legacy-Ingestion Requirements — Mission 2 Fixture Prep

Status: **prep-only, non-authoritative reference**. Requirements only — no ingestion adapter,
parser, or CLI is implemented on this branch. Grounded in the mechanical
`harvest-inventory.json` fixture and direct inspection of `_HARVEST`, not assumption.

**Authoritative statement (per Shared Governance, restated for this doc specifically):**
Any future legacy-ingestion adapter converts a donor record into a candidate that enters the
factory at the `generated` lifecycle state, carrying `manual_external`-shaped or equivalent
provenance. It is untrusted input like every other class of candidate. **An ingestion adapter
must never confer approval, skip a gate, or write into any compartment past `generated`.**
Donor fields like `status: "published"`, `reviewerStatus: "approve"`, or `approvalStatus:
"approved"` (all present in the harvest — see `review-queue.json`) describe the *donor's own*
now-defunct workflow and carry zero weight in this repository's lifecycle. Filenames like
`approved-bank/` establish nothing either — see the inventory's 102
`duplicate_copy_of_other_record` entries, which are simply the same drafts promoted into a
differently-named directory, not independently reviewed content.

## 1. Recognised donor JSON shapes

| Shape | Files | Notes |
|---|---|---|
| Harvest question JSON | 404 files, `03-question-banks/{approved-bank,starter-bank}/*.json` + 15 canonical examples | The dominant shape; see §3–§5 for its field-level differences from the trusted schema |
| Compiled array | `approvedBank.generated.json` (102-element `Question[]`, no wrapper) | Same shape as above, just concatenated — not additional content |
| Review-queue wrapper | `review-queue.json` (5 sample items) | `{ question: <harvest shape>, skillId, sourcePromptId, validationStatus, validationErrors, reviewerStatus, reviewerComments, riskFlags, approvalStatus, createdAt }` — an adapter must unwrap `.question` and **discard** every reviewer/approval field; none of it is independent evidence in this repository's terms |
| JSON Schema definitions | `schemas/question.schema.json`, `schemas/visual-asset.schema.json` | Not content; useful only as the formal spec of the shape above |

An adapter must dispatch on shape (does this object have a `.question` key? is it a bare array?
a single object?) before attempting field-level parsing — a single flat parser will silently
misread the wrapper/compiled shapes.

## 2. CSV shapes

`15-csv-import-seed/` is a **second donor project's schema entirely**, unrelated to the harvest
JSON shape:

- 15 columns: `slug, type, topic_slug, year_levels, difficulty, prompt, tier_required,
  review_status, authored_by, reviewed_by, source_descriptor_id, version, content_data_json,
  group_slug, group_position`.
- Question content is **JSON-encoded inside a CSV cell** (`content_data_json`) — a double-parse
  (CSV row, then `JSON.parse` one field). A CSV parser alone is not sufficient; the adapter needs
  a CSV parser *and* a JSON parser *and* per-`type` shape validation of the inner blob.
  `15-csv-import-seed/fixtures/invalid-mixed.csv` row `invalid-json-row` demonstrates a row where
  the outer CSV parses fine but the inner JSON does not — the adapter must handle that
  independently of outer-row malformation.
- 12 declared question types (`choice_single`, `choice_multi`, `true_false`, `numeric`,
  `short_answer`, `free_response`, `essay_response`, `fill_in_blank`, `dropdown_selection`,
  `matching`, `ordering`, `label_diagram`), **none sharing a name** with the harvest JSON's
  `questionType` enum — see the alias table in §3.
- `group_slug`/`group_position` express composite reading groups (anchor passage + sibling
  questions) — a structural concept the harvest JSON shape and the trusted schema have no
  equivalent for today. An adapter must decide whether to (a) synthesize a `stimulus` on every
  sibling by copying the anchor's content_data_json.prompt, or (b) defer composite-group support
  entirely and reject/quarantine group members until it exists. Do not silently drop the
  grouping information.

## 3. Field-name aliases

The mapping tables in `02-parser-analysis.md` §1.1 are the authoritative field-by-field diff;
summarised as an alias table an adapter would need:

| Concept | Harvest JSON | CSV | Trusted schema |
|---|---|---|---|
| Question kind | `questionType` | `type` | `type` |
| Exam program | `examType` (`NAPLAN`\|`ICAS`\|`SKILL`\|`DIAGNOSTIC`) | *(none)* | `examStyle` (`naplan_style`\|`icas_style`) |
| Difficulty | `difficulty` (`easy`\|`medium`\|`hard`\|`challenge`) | `difficulty` (integer 1–5) | `metadata.difficulty` (`easy`\|`medium`\|`challenging`) |
| Skill display text | `skill` | *(none — only `topic_slug`)* | `metadata.skill?` |
| Skill machine id | `skillId` | *(none — only `topic_slug`, a curriculum path, not a taxonomy id)* | *(resolved via Mission 1 taxonomy alias table, not a bare field)* |
| Passage/scenario | `stimulus.body` (+ `stimulus.kind`) | inferred from `content_data_json.prompt` on the anchor row of a composite group | `stimulus.body` (+ mandatory `attribution` literal) |
| Visual assets | `assets[]` | *(none — CSV harvest has no visual-asset concept beyond `label_diagram`'s inline `image`)* | `visuals[]` |
| Answer key discriminator | `answerKey.type` | varies per `content_data_json` shape, no shared discriminator field name | `answerKey.kind` |
| Time estimate | `estimatedTimeSeconds` (top level) | *(none)* | `metadata.estimatedTimeSeconds` |
| Timestamps | `createdAt`/`updatedAt` | *(none)* | *(none — lives in provenance, not the question)* |

## 4. Answer-key variants

Harvest `answerKey.type` has 8 variants observed in the corpus (`single_option` 243,
`numeric` 70, `blanks` 24, `boolean` 21, `multiple_option` 19, `matching` 10, `ordering` 10,
`text` 7 — counts from the mechanical inventory) plus a 9th (`rubric`) declared in the schema but
never observed. CSV `content_data_json` has no shared discriminator at all — the answer shape is
implied entirely by the row's `type` column (`correct_id` for `choice_single`, `correct_ids[]`
for `choice_multi`, `correct` boolean for `true_false`, `answer`+`unit` for `numeric`, `pairs[]`
of `{term_id, target_id}` for `matching`, `correct_order[]` for `ordering`, `correct_answers[]`
per blank for `fill_in_blank`, `drop_zones[]`+`correct_label_id` for `label_diagram` — a shape
with no harvest-JSON or trusted-schema equivalent). None of these map 1:1 onto the trusted
schema's `kind`-discriminated union (`single_option`→`kind:"single_option"` with
`optionId` not `correctOptionId`, `multiple_option`→`kind:"multiple_options"` with
`optionIds` not `correctOptionIds`, etc. — full table in `02-parser-analysis.md`).

**Non-lowercase option/blank/match-column ids are pervasive**: the mechanical inventory found
289 of 404 harvest files use upper-case option ids (`"A"`, `"B"`, `"O1"`, `"L1"`, `"R1"`), which
fail the trusted schema's `identifierSchema` regex outright (`^[a-z0-9]+(?:[-_][a-z0-9]+)*$`,
lower-case only). Every option/blank/match id must be lower-cased (and re-checked for
post-lowering collisions) as a mandatory adapter step, not an edge case.

## 5. Visual-data variants

Full comparison in `02-parser-analysis.md` §3. Restated as ingestion requirements:

- Harvest `type: "image"` and `type: "svg"` (and the free-string `svgContent` field, legal on
  any asset type) are **forbidden outright** by content rules — an adapter must reject, not
  convert, any asset using them. Empirically: 0 of 404 harvest files populate either, but the
  donor schema permits both, and a future `manual_external` (pasted-from-ChatGPT) candidate could
  easily produce one — this must fail closed, not silently pass through unconverted.
- The 8 chart/data visual types shared between harvest and trusted schemas (`bar_chart`,
  `line_graph`, `pie_chart`, `table`, `number_line`, `geometry_shape`, `coordinate_grid`,
  `fraction_model`) all need a **structural reshape**, not a rename: harvest `spec` is untyped
  (`{}` — any shape); trusted `data` is a fully-typed per-variant Zod object with explicit
  render-safety bounds the harvest schema has no equivalent for at all (`MAX_NUMBER_LINE_TICKS`,
  `MAX_COORDINATE_GRID_LINES_PER_AXIS`). A harvest `bar_chart.spec.data[]: {label, value}` array
  of pairs must become trusted `data: {labels: string[], values: number[]}` parallel arrays.
  `table.spec.columns` → `table.data.headers` (rename) plus a new required `rowHeaders: boolean`
  the harvest has no source for (must default, document the default, and flag it for review, not
  guess silently). `number_line.spec.step` can be `null` in the harvest (both
  `bank-icas-3-num-pattern-*` fixtures in the calibration corpus use `step: null`) where the
  trusted schema requires a positive number — the adapter must derive `step` from point spacing
  or reject the asset outright; it must never pass `null` through.
- Trusted-only types `labelled_svg`/`hotspot_svg` (the governance-compliant structured-SVG
  replacement for the forbidden raw `svg` type) have **no harvest-JSON equivalent at all** and no
  automatic construction path — a harvest `svg`/`image` asset cannot be mechanically converted
  into one; it requires a human/LLM to re-author the visual as typed primitives.
- CSV `label_diagram`'s `image: {storage_path, alt_text}` + `drop_zones[]` (fractional x/y
  coordinates + `correct_label_id`) is a third, distinct visual-data shape again — closer to a
  hotspot than to `labelled_svg`'s element-based structure, and maps to neither cleanly.

## 6. Missing fields

Fields the trusted schema requires that donor material never supplies:

- `stimulus.attribution` (trusted-only, must literally be `"MindMosaic original"`) — **an
  adapter is never entitled to set this** for content derived from harvest/CSV prose; only
  genuinely rewritten/original text may carry it. Ingested candidates should carry no attribution
  claim, or an explicit `"derived from untrusted donor material — not yet reviewed"` marker if a
  provenance-adjacent field is added for this later (not this branch's decision to make).
- `metadata.marks` (harvest/CSV have no per-question marks value) — needs an explicit default
  policy (e.g. `1`), not a silent invention.
- Interaction config (`interaction: {type, ...}`) — the trusted schema's presentation layer for
  fill_blank/dropdown/matching/ordering/drag_drop/label_diagram has no harvest or CSV source at
  all; it must be *derived* from the answer-key structure (e.g. a `matching` answerKey's
  `pairs[]` implies `interaction.sources`/`targets`), not copied from anywhere.

## 7. Invalid status fields

Harvest `status` values (`draft` 100%, confirmed by the mechanical inventory — every one of the
404 files is `status: "draft"`) never overlap meaningfully with the trusted schema's
(`draft`\|`reviewed`\|`published`\|`rejected`) in a way that matters: **every harvested question,
regardless of its donor `status` string, enters the factory at `generated`**, never anything
past it. `review-queue.json`'s `approvalStatus: "approved"` is the single most dangerous field in
the entire harvest for a careless adapter to trust — it describes a defunct donor human-review
step this repository has no record of and no ability to verify, and must be discarded, not
mapped to any trusted-repository state.

## 8. Unsupported types

- Harvest `examType` values `SKILL`/`DIAGNOSTIC` (schema-legal, 0 occurrences in the 404-file
  corpus) have no `examStyle` equivalent — an adapter must reject or quarantine a future
  candidate using either, not guess a mapping.
- CSV `free_response` and CSV `essay_response`'s exact shape has no 1:1 harvest-JSON precedent
  (closest trusted equivalents are `short_answer` with a `text` answer key, and `essay` with a
  `manual` answer key respectively — see the type-alias table in `02-parser-analysis.md`).
- CSV `label_diagram` is the **only** source of `label_diagram`-typed content anywhere in the
  harvest or CSV material (0 in harvest JSON, 0 in the trusted 100-question bank — see the
  correctness-verifier matrix's gap note). Its shape is CSV-project-specific and unmapped.

## 9. Schema-version ambiguity

Neither the harvest JSON schema nor the CSV schema carries an explicit version field or number.
`schemas/question.schema.json`/`visual-asset.schema.json` are the only static declaration of "the
shape at harvest time" and have no version identifier themselves (no `$id` version suffix, no
`schemaVersion` sibling field on individual records). An adapter cannot distinguish "this record
predates a harvest schema change" from "this record was always shaped this way" — Mission 1's
`FACTORY_VERSIONS.SCHEMA_VERSION`/`taxonomyVersion` concept has no donor-side counterpart to
compare against. Treat every harvested/CSV record as **one unversioned snapshot**; do not attempt
version-conditional parsing logic that the donor material gives no evidence to justify.

## 10. Identifier collisions

- The 102 `approved-bank`/`starter-bank` file-path collisions (same `id`, byte-identical content,
  different directory) are real and already characterised in the inventory
  (`publicationSuitability: "duplicate_copy_of_other_record"`). An adapter ingesting the full
  harvest tree must dedupe by `id` before generating candidate ids, not ingest 404 candidates for
  302 unique questions.
- Harvest ids are free-form strings (`bank-<exam>-<year>-<subject>-<skill>-<seq>`); nothing
  prevents a *future* harvest drop from reusing an id already ingested in a prior batch. An
  adapter must always mint a fresh internal `candidateId` (never reuse the donor `id` directly as
  the factory identifier) and record the donor id as a separate provenance field, so a donor-side
  id collision across two ingestion runs can never collide with an existing factory candidate.
- CSV `slug` has the same free-form-collision risk, plus the CSV format's own `invalid-mixed.csv`
  row `""` (empty slug) demonstrates a slug that is not even a usable identifier at all — must be
  rejected before candidate-id minting is attempted, not passed through as `""`.

## 11. Character-encoding issues

All harvest and CSV files inspected are valid UTF-8 with no BOM and no encoding-declaration
mismatch found during this pass. The one real cross-platform-safety requirement already exists
and must be reused, not reinvented: `provenance/content-hash.ts`'s `normaliseNewlines()` (CRLF/CR
→ LF) and `normalisePathSeparators()`, applied before any hashing, per the Windows-determinism
rule in Shared Governance. An adapter reading CSV files in particular should not assume LF line
endings — CSV files are a common source of CRLF on a Windows-authored donor repo (not verified
either way in this pass; assume worst case).

## 12. Malformed records

No malformed JSON exists among the 404 harvest single-question files (0/404, confirmed by both
the original parser-analysis pass and the mechanical inventory). The CSV harvest **does** contain
deliberately-planted malformed rows (`15-csv-import-seed/fixtures/invalid-mixed.csv`: empty slug,
unrecognised type, broken inner JSON, invalid year-level format, out-of-range difficulty) —
already real, already reusable malformed-record fixtures, no synthesis needed for that category.
An adapter must handle at minimum: outer-CSV-row malformation, inner-JSON malformation (broken
`content_data_json` with an otherwise-valid outer row), and top-level JSON malformation for the
(currently hypothetical, since none exist today) case of a corrupted harvest JSON file — the last
of these already has a real, tested mechanism to reuse: `FsFactoryRepository`'s
`quarantineCorruptedFile()` (Mission 1 repair), which fails closed on `JSON.parse` failure,
quarantines transactionally, and never overwrites an existing quarantined artefact.

## 13. Safe quarantine behavior

Per the Mission 1 repair already merged onto this branch, safe quarantine is not a new concept an
ingestion adapter needs to invent — `FsFactoryRepository.read()` already:

1. Fails closed on `JSON.parse` failure (never throws an uncontrolled `SyntaxError`).
2. Writes the corrupted bytes to the `quarantined` compartment **before** removing the source
   (crash-safe, idempotent retry).
3. Never overwrites an existing quarantined artefact (content-hash-suffixed name on collision).
4. Writes a concise `.quarantine-reports/<id>.json` (bounded preview length, no secret/excessive
   raw-content dump).

An ingestion adapter's job is narrower: detect *ingestion-time* malformation (a CSV row's inner
JSON doesn't parse, a required field is missing, an id is empty) **before** ever calling
`repository.create()`, and route those candidates to a quarantine/rejection report of its own —
it should not rely on the storage layer's corruption-quarantine as its primary defence, since
that layer only protects against corruption *after* a syntactically-valid-at-ingestion-time write
somehow gets corrupted later (e.g. disk-level bit rot, a bad merge) — a different failure mode
from "the donor CSV row was always broken."

## 14. Cross-references

- Field-by-field diff tables: [`02-parser-analysis.md`](./02-parser-analysis.md)
- Machine-readable per-file evidence for every claim above: `src/tests/fixtures/question-factory/mission2-calibration/harvest-inventory.json`
- Concrete malformed-CSV-row fixture already reusable: `_HARVEST/15-csv-import-seed/fixtures/invalid-mixed.csv` (do not copy into this repo verbatim without first reviewing `04-unsafe-content-report.md` §2 for the email-hygiene finding on that file)
