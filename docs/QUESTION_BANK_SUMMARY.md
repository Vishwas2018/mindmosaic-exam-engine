# Question Bank Summary

Inventory of the MindMosaic production question bank as at Phase 3 completion.
The live source of truth is `npm run validate:questions`, which prints the same
coverage from the bank itself and fails on any deviation.

## Totals

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

## Verification results

| Check | Command | Result |
| --- | --- | --- |
| Schema and distribution validation | `npm run validate:questions` | Pass — all production questions and showcase fixtures valid |
| Independent correctness check | `npm run check:answers` | Pass — 0 failures; 45 of 96 objective questions verified computationally; 51 flagged for editorial review; 100 of 100 structurally checked |
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
