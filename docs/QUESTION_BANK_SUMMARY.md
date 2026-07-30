# Question Bank Summary

Inventory of the MindMosaic production question bank as at Phase 3 completion.
The live source of truth is `npm run validate:questions`, which prints the same
coverage from the bank itself and fails on any deviation.

Two separate pools are inventoried below. The **curated bank** (100 questions,
`src/content/questions/question-bank.ts`) is the governed set every section from
"Totals" down to "Distribution by difficulty" describes, and its exact counts are
enforced by `validate:questions`. The **factory-published pool** (288 questions,
`src/content/questions/generated/batch-published.json`) is inventoried
separately under "Factory-published pool" — it has its own governance chain and
deliberately no fixed distribution contract.

## Curated bank totals

| Measure | Value |
| --- | ---: |
| Production questions | 100 |
| Questions with visuals | 48 |
| Manual-review questions (essays) | 4 |
| Objective questions | 96 |

Every production question has `status: "published"` and `origin: "original_seed"`.

## Distribution by question type (exact, enforced)

| Question type | Count |
| --- | ---: |
| `multiple_choice` | 14 |
| `multiple_select` | 7 |
| `number_entry` | 12 |
| `fill_blank` | 8 |
| `dropdown` | 7 |
| `true_false` | 6 |
| `matching` | 6 |
| `ordering` | 6 |
| `short_answer` | 6 |
| `reading_comprehension` | 8 |
| `essay` | 4 |
| `label_diagram` | 6 |
| `hotspot` | 5 |
| `drag_drop` | 5 |
| **Total** | **100** |

## Distribution by visual type (minimums enforced)

| Visual type | Count | Minimum |
| --- | ---: | ---: |
| `bar_chart` | 5 | 5 |
| `line_graph` | 4 | 4 |
| `pie_chart` | 4 | 4 |
| `table` | 6 | 6 |
| `number_line` | 5 | 5 |
| `geometry_shape` | 5 | 5 |
| `coordinate_grid` | 4 | 4 |
| `fraction_model` | 4 | 4 |
| `labelled_svg` | 6 | 5 |
| `hotspot_svg` | 5 | 5 |

Each visual question carries exactly one visual; 48 questions ≥ the required 45.

## Distribution by year level and exam style (ranges enforced)

| Category | Count | Permitted range |
| --- | ---: | ---: |
| Grade 3 | 47 | 45–50 |
| Grade 5 | 53 | 50–55 |
| NAPLAN-style | 72 | 70–75 |
| ICAS-style | 28 | 25–30 |

## Distribution by subject

| Subject | Count |
| --- | ---: |
| Numeracy | 45 |
| Reading | 23 |
| Language conventions | 28 |
| Writing (manual review) | 4 |

## Distribution by strand

| Strand | Count |
| --- | ---: |
| Geometry | 14 |
| Number | 13 |
| Statistics | 13 |
| Literal comprehension | 8 |
| Vocabulary | 7 |
| Grammar | 5 |
| Parts of speech | 5 |
| Inference | 4 |
| Measurement | 4 |
| Vocabulary in context | 4 |
| Fact and opinion | 3 |
| Punctuation | 3 |
| Sequencing | 3 |
| Spelling | 3 |
| Text structure | 3 |
| Logical language reasoning | 2 |
| Main idea | 1 |
| Patterns | 1 |
| Narrative writing | 1 |
| Persuasive writing | 1 |
| Procedural writing | 1 |
| Informative writing | 1 |

Skills are finer-grained than strands: the bank covers 95 distinct named skills
(run `npm run validate:questions` for the full list).

## Distribution by difficulty

| Difficulty | Count |
| --- | ---: |
| Easy | 26 |
| Medium | 57 |
| Challenging | 17 |

## Factory-published pool

288 questions cleared the full question-factory governance chain (structural ->
correctness -> semantic -> originality -> difficulty -> staged -> published) on
2026-07-30 and were assembled into
`src/content/questions/generated/batch-published.json` by
`npm run questions:assemble-bank`. One manifest per question lives in
`content/question-factory/published-manifests/`; the gate evidence for each is
in `content/question-factory/reports/`.

All 288 carry `status: "published"` and `origin: "original_seed"`. None is a
manual-review (essay/rubric) item, so all 288 are machine-scored. 112 of the 288
carry a visual. They span 19 strands and 74 distinct named skills. No id
collides with the curated bank or with the auto-generated practice seeds
(1103), so the combined `practiceExamBank` is 1491 questions with 1491 unique
ids.

### Published totals by grade and subject

| Grade | Subject | Count |
| --- | --- | ---: |
| Grade 3 | Numeracy | 50 |
| Grade 3 | Language conventions | 25 |
| Grade 3 | Reading | 7 |
| Grade 5 | Numeracy | 106 |
| Grade 5 | Reading | 62 |
| Grade 5 | Language conventions | 38 |
| **Total** | | **288** |

### Published totals by grade

| Grade | Count |
| --- | ---: |
| Grade 3 | 82 |
| Grade 5 | 206 |

### Published totals by subject

| Subject | Count |
| --- | ---: |
| Numeracy | 156 |
| Reading | 69 |
| Language conventions | 63 |

### Published by exam style, difficulty and question type

| Exam style | Count |
| --- | ---: |
| NAPLAN-style | 232 |
| ICAS-style | 56 |

| Difficulty | Count |
| --- | ---: |
| Easy | 146 |
| Medium | 100 |
| Challenging | 42 |

| Question type | Count |
| --- | ---: |
| `number_entry` | 82 |
| `reading_comprehension` | 54 |
| `fill_blank` | 41 |
| `dropdown` | 29 |
| `multiple_choice` | 24 |
| `multiple_select` | 22 |
| `short_answer` | 15 |
| `ordering` | 10 |
| `matching` | 7 |
| `true_false` | 4 |
| **Total** | **288** |

No `essay`, `label_diagram`, `hotspot` or `drag_drop` items have been published
yet; those four types remain curated-bank-only.

### Reachability and gating

There are three nested banks (`ExamBankId`, `curated ⊂ published ⊂ practice`):

| Bank | Composition | Size | Ungated content? |
| --- | --- | ---: | --- |
| `curated` | `questionBank` | 100 | no |
| `published` | curated + `factoryPublishedQuestions` | 388 | no |
| `practice` | published + `practiceQuestions` seeds | 1491 | **yes — 1103 seeds** |

The `practice` bank's auto-generated seeds have never been through the
publication gates, so **it must never be a program's default**. The `published`
bank exists for exactly that reason: it is the whole gate-passed pool and
nothing else.

The five NAPLAN programs that previously started from `"curated"` — and so could
never serve any published content — now start from `"published"`:

| Program | Curated | Published (default) | of which factory-published | seeds |
| --- | ---: | ---: | ---: | ---: |
| `naplan-g3-numeracy` | 14 | 64 | 50 | 0 |
| `naplan-g3-reading` | 10 | 17 | 7 | 0 |
| `naplan-g5-numeracy` | 16 | 91 | 75 | 0 |
| `naplan-g5-reading` | 11 | 56 | 45 | 0 |
| `naplan-g5-language` | 10 | 40 | 30 | 0 |

The other seven scoped programs (`naplan-g3-language` and the six ICAS entries)
remain on `"practice"`: curated coverage there is too thin to fill the smallest
selectable exam, so their pre-existing seed exposure is retained as a content
decision rather than a publication one. `src/tests/unit/published-bank-reachability.test.ts`
pins that list as an exact set, so moving any other program onto `"practice"`
fails a test rather than shipping.

The seed pool stays reachable by deliberate opt-in: the configurator's "include
the extended practice bank" toggle widens the session from its program's base
bank to `practice`. Because the banks are nested, turning it on is always a
widening and turning it off never yields ungated content.

The landing stat band's "Original Questions" figure counts `publishedExamBank`
itself (388) via `getPublishedQuestionCount()` in `src/server/exam-bank.ts`, so
the marketing number and the pool those five programs actually serve cannot
drift apart.

## Verification results

| Check | Command | Result |
| --- | --- | --- |
| Schema and distribution validation | `npm run validate:questions` | Pass — all production questions and showcase fixtures valid. Curated bank only by design: this script's checks 1–3 hardcode the exactly-100 total and per-type distribution, which *is* the curated bank's governance contract. |
| Factory-published schema validation | `generated/index.ts` module load + `validateQuestionBank` | Pass — 288 of 288 valid against the live production `questionSchema` and the whole-bank validator; 0 duplicate ids across all three pools |
| Independent correctness check | `npm run check:answers` | Pass — 0 failures; 45 of 96 objective questions verified computationally; 51 flagged for editorial review; 100 of 100 structurally checked |
| Independent correctness check over the published pool | `npx tsx scripts/check-question-correctness.mts --include-published` | Pass — 0 failures over all 388; 126 of 384 objective questions verified computationally, 258 flagged for editorial review, 388 of 388 structurally checked. Reaching this took two fixes to the checker (exact option→data-entry resolution replacing a substring match; number-line pattern continuation) and no edits to any question. |
| Publication reachability and gating | `published-bank-reachability.test.ts` (23 assertions) | Pass — the `published` bank contains zero seed questions, each of the five `"published"` programs serves factory-published content and no seeds, and real seeded selections for a Grade 3 and a Grade 5 program draw only gate-passed questions |
| Canonical self-scoring | `npm test` | Pass — every objective question scores its canonical answer as fully correct through the real scoring dispatcher; every essay routes to manual review |
| End-to-end flows | `npm run test:e2e` | Pass — 4 seeded exam flows plus showcase and smoke coverage |

## Originality statement

Every question, passage, option, explanation, dataset and visual in this bank
was written specifically for MindMosaic. Nothing is copied or closely
paraphrased from official NAPLAN or ICAS material, textbooks, websites,
commercial question banks or other protected sources. "NAPLAN-style practice"
and "ICAS-style practice" describe practice formats only and imply no
affiliation with ACARA, Janison, UNSW Global, ICAS Assessments or any testing
authority.

## Accessibility considerations

- Every visual includes meaningful alternative text (schema-enforced, minimum length).
- All interactions are keyboard operable, including a select-based drag-and-drop fallback, button-based reordering, and checkbox-semantics hotspots.
- Answered, flagged, current, timer-warning and result states pair colour with icons or text; nothing relies on colour alone.
- Timer milestones are announced politely (two minutes, thirty seconds), not every second.

## Known limitations and accepted risks

- **Seed exposure on seven programs**: `naplan-g3-language` and the six ICAS programs still default to the `practice` bank, so most of what they serve is auto-generated seed content that has never been through the publication gates. Narrowing them needs enough published ICAS/Grade-3-language content to fill a 10-question exam from `published` alone; until then this is the main remaining ungated-content exposure. The five NAPLAN programs above no longer have it.
- **Editorial review over published content**: 258 of the 384 objective questions across both banks depend on language semantics the checker cannot verify (up from 51, because the published pool is mostly reading and language). They rest on the factory's semantic-review gate rather than on an independent computational second opinion.
- **Editorial review**: 51 objective questions (mostly reading and language) depend on language semantics that automation cannot verify. The correctness checker flags them with warnings instead of claiming certainty. They have been authored and self-reviewed but have not had an independent human editorial pass — this is the main accepted audit risk.
- **Essay marking**: the 4 writing tasks carry rubrics but no marking workflow; marks stay pending until a person marks them.
- **Session persistence**: exam state is in-memory; refreshing the browser ends the attempt.
- **Single visual per question**: no question currently combines multiple visuals.
- **Fixed linear delivery**: no adaptive sequencing; order is the deterministic seeded shuffle.

## Phase 4 direction

The recommended next step is durable attempt persistence behind the existing
domain boundary (a service adapter that stores sessions, responses and results),
followed by a marking workflow for manual-review writing tasks and a human
editorial pass over the 51 language-semantics questions.
