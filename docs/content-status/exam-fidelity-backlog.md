# Exam-fidelity backlog — repo changes required before authentic simulation

The generation prompt cannot exceed what the repo accepts. Everything below is **platform
work that must land before the prompt can ask Mistral for it** — specifying any of it today
produces content that `validate:questions` rejects. Ordered by value per unit of effort.

Verified against the repo on 2026-08-09.

---

## Already supported — no work needed (now unlocked in prompt v5)

- Question types: the schema has **14** — `multiple_choice`, `multiple_select`, `number_entry`,
  `fill_blank`, `dropdown`, `true_false`, `matching`, `ordering`, `short_answer`,
  `reading_comprehension`, `essay`, `label_diagram`, `hotspot`, `drag_drop` — all with
  renderers. v5 unlocks `drag_drop`; `label_diagram`, `hotspot` and `essay` remain held only
  because their answerKey/interaction pairings are not yet documented for the generator.
- Visual types: **10** exist with renderers, including `coordinate_grid`, `fraction_model`,
  `labelled_svg` and `hotspot_svg`. v5 permits six; the rest need documented shapes.

## 1. Document the held types (small — unlocks real coverage)

`label_diagram` interaction is `{type, labels:[{id,text}] 1–12, targets:[{id,label}] 1–12}`;
`hotspot` answerKey is `{kind:"hotspot", regionIds:[...]}` and pairs with the `hotspot_svg`
visual's regions. Confirm the compatible answerKey for `label_diagram`, then add both to the
prompt with worked examples. Unlocks diagram labelling and hotspot reading items.

## 2. Release coordinate_grid and fraction_model to generation (small)

Renderers exist (`CoordinateGridRenderer`, `FractionModelRenderer`). Extract their exact
`data` shapes from `src/schemas/visual.schema.ts` and add worked examples. Unlocks
coordinate/plotting and fraction-model items — currently impossible, which pushes the
generator toward over-using bar charts to meet visual quotas.

## 3. Official strand taxonomies (medium) — ✅ DONE 2026-08-11

Registered in `src/features/taxonomy/subject-registry.ts`, scoped per exam style, and
migrated by `scripts/migrate-strands.mts` (re-runnable; the mapping is a data table).
768 of 965 bank questions moved, 26 left for human review, 193 staging questions migrated.

Two corrections to what this item said:

- **Punctuation was NOT missing.** `language_conventions` already had a `punctuation`
  strand with 44 questions on it when this was written. The Vocabulary half of the
  finding was real and is fixed — Vocabulary is no longer a NAPLAN conventions strand.
- The item did not anticipate that **one subject id carries both exams**: `numeracy`
  holds NAPLAN numeracy *and* ICAS Mathematics, `reading` holds NAPLAN reading *and*
  ICAS English. A flat strand list per subject could only be the union of two disjoint
  taxonomies, so strands are now scoped by `examStyles` and validated against the
  question's own style.

Reading uses the **proficiency** axis; the content axis (Language/Literature/Literacy)
was not added as a second field because `metadata.topic` already records text type.
See the decision record in the migration script's header.

Still open, deliberately: the question-factory taxonomy (`src/features/question-factory/
taxonomy/entries.ts`) is migrated for the ICAS-only subjects only. Its numeracy, reading
and language_conventions entries still speak the internal taxonomy, because 44 factory
test fixture files pin the old labels and 22 entries claim both exam styles (one entry
cannot hold two taxonomies' strand). That is its own change.

<details><summary>Original item</summary>

Strand tokens are registry-controlled (`src/features/taxonomy/subject-registry.ts`); an
unregistered value fails `subject-registry.test.ts`. The platform's current strands are an
internal taxonomy, not the official ones. To align:

- NAPLAN numeracy: Number and algebra · Measurement and geometry · Statistics and probability
- NAPLAN reading (content): Language · Literature · Literacy; (proficiency): Locating and
  identifying · Integrating and interpreting · Analysing and evaluating
- NAPLAN language: Spelling · Grammar · **Punctuation** (currently missing; `Vocabulary` is
  currently mis-filed under language_conventions)
- ICAS Mathematics: Number & Arithmetic · Algebra & Patterns · Measures & Units · Space &
  Geometry · Chance & Data
- ICAS English: Text Comprehension · Writer's Craft · Syntax · Vocabulary
- ICAS Science (knowledge): Earth & Beyond · Natural & Processed Materials · Life & Living ·
  Energy & Change; (skills): Observing & Measuring · Interpreting · Predicting & Concluding ·
  Investigating · Reasoning & Problem Solving
- ICAS Digital Technologies: Digital Systems · Word Processing · Graphics & Multimedia ·
  Internet & Email · Spreadsheets & Databases · Programming
- ICAS Spelling Bee: Visual · Phonological · Morphological · Etymological

Register these, decide whether reading needs a second proficiency axis (a new metadata field),
and migrate existing questions before switching the generator over.

</details>

## 4. ICAS English as one subject (medium)

ICAS has a single English assessment covering text comprehension, writer's craft, syntax and
vocabulary — there is no separate ICAS reading or language paper. `SUBJECT_IDS` has no
`english`. Either add an `english` subject with `icas-y3-english` / `icas-y5-english`
programmes, or keep the split permanently labelled "targeted practice sets" (what v5 does).

## 5. NAPLAN conventions-of-language structure (medium–large)

Schema has **zero** occurrences of `section` or `audio`. Authentic structure needs:
- `section: "spelling" | "grammar_and_punctuation"` on the question
- `spellingContext: "audio_dictation" | "proofreading_highlighted" | "proofreading_unhighlighted"`
- an audio asset contract (at minimum an `audioScript`), plus playback in the renderer
- exam-engine support for a locked section (no return to spelling once grammar begins)

Until then, spelling is a **text-based adaptation** and must be described that way.

## 6. Adaptive / tailored test design (large)

NAPLAN online uses three-stage tailored pathways; the platform selects questions dynamically
by seed with no testlet concept. Options, cheapest first:
- (a) Keep linear sets, labelled "full-length fixed-path practice" — current v5 position.
- (b) Add `testlet` / `section` metadata and generate named fixed pathways (e.g. ABE).
- (c) Build testlet pools plus branching rules for a real adaptive simulation.
Reported testlet sizes to design against: numeracy 12 items (Y3) / 14 (Y5), reading 13.

## 7. Missing visual kinds (large, per item)

No schema or renderer exists for: angles/protractors, maps and scale, symmetry and
transformations, nets and 3D objects, electrical circuits, cogs and forces, classification
keys, block-based code, spreadsheet/database screens, web/email/presentation interfaces. Each
needs a schema plus a deterministic renderer plus validator coverage. Until they exist, ICAS
Science and Digital Technologies visual authenticity is capped.

---

## Open verification item

ICAS question counts and durations: ICAS's own [Mathematics subject page] and [Year 3 test
page] publish topics and skills but **no counts or times**. The sizes in prompt v5 are
secondary-source targets pending an official ICAS figure. If a source publishing them is
found, update section 2 of the prompt and `docs/content-status/exam-patterns.md` together.

NAPLAN sizes follow the latest published technical blueprint (2025) and are not guaranteed to
match a 2026 paper; the 2026 technical report is not yet published.
