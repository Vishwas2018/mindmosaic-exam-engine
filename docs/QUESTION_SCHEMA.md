# Question Schema

## Purpose

The question schema is the validated contract between authored content, the exam engine, renderer selection, response capture, and scoring. It is designed as an extensible model keyed by `type`, with discriminated answer-key variants and compatibility checks.

Shared question data includes identity and metadata, year level, exam style, lifecycle status, origin, prompt content, answer information, an explanation, and any structured visual reference. Type-specific branches add fields such as options, blanks, pairs, ordered items, or selectable regions.

The schema represents Years 1–12; the shipped question bank currently contains Years 3 and 5. The supported exam styles are `naplan_style` and `icas_style` (NAPLAN-style and ICAS-style practice). The content lifecycle is:

```text
draft → schema validated → correctness checked → editorially reviewed → published
```

with statuses `draft`, `reviewed`, `published` and `rejected`. Every production question carries `status: "published"` and `origin: "original_seed"`. Metadata records subject, strand, topic, skill, difficulty, marks and estimated time.

## Supported question types

The `QUESTION_TYPES` catalogue contains exactly these 17 values:

| Type | Intended response model |
| --- | --- |
| `multiple_choice` | Select exactly one answer from a set of labelled options |
| `multiple_select` | Select every correct answer from a set of options |
| `number_entry` | Enter a numeric response, including any defined unit or precision rules |
| `fill_blank` | Complete one or more identified blanks in a sentence or expression |
| `dropdown` | Choose an answer for each inline or grouped dropdown control |
| `true_false` | Decide whether a statement is true or false |
| `matching` | Pair each item in one set with its corresponding item in another set |
| `ordering` | Arrange items into the required sequence |
| `short_answer` | Enter a brief free-text response for accepted-answer or manual review |
| `reading_comprehension` | Respond to a question associated with an original reading stimulus |
| `essay` | Submit an extended written response for manual review |
| `label_diagram` | Assign supplied labels to defined targets on a structured diagram |
| `hotspot` | Select one or more defined regions of a structured visual |
| `drag_drop` | Move defined items to valid target zones |
| `hot_text` | Select one or more authored regions embedded in structured text |
| `matrix_choice` | Select one or more cells using row and column headings |
| `structured_response` | Complete ordered numeric or short-text parts with part-level marking evidence |

All 17 question types have functional, accessible renderers and pure scorers. Essays with a non-blank response resolve to a manual-review outcome (`correct: null`, no automatic marks) and are excluded from objective percentages; a **blank** essay is `unanswered`, not pending review — see [Assessment security model](ASSESSMENT_SECURITY_MODEL.md) and [Phase 3 hardening](PHASE3_HARDENING.md) for the full manual-marking vs. pending-review distinction.

`ordering` questions never display their authored item order as the default. `OrderingRenderer` shows a deterministic rotation of the authored order (`deriveInitialOrder`, `question-renderers/ordering-utils.ts`) until the learner moves an item — four of the six ordering questions in the production bank are authored with items already in the correct sequence, and showing that unmodified would let an untouched question look answered-and-correct. No response is recorded until the learner actually reorders something, so scoring is unaffected: an untouched ordering question is still `unanswered`.

### Cross-cutting presentation and grouping

Presentation capabilities are orthogonal to response type. Existing question types may carry governed `media` assets, and multiple-choice/select options may use text, a referenced structured visual, or both. Visual-only options require an accessible label; all references must resolve to a structured visual on the question.

Audio sources are restricted to `/media/assessment/` or the private `assessment-media/audio/` namespace and an allowlisted MIME type. Autoplay is forbidden. Candidate projection omits private storage coordinates and any `review_only` or `accommodation_only` transcript.

`structured_response` uses ordered numeric/short-text parts. Each answer-key part declares marks and either a deterministic rule or versioned manual rubric. Part marks must total `metadata.marks`; hybrid responses remain provisional until manual evidence is recorded. Mathematical-expression equivalence is not supported.

Shared stimuli and multipart/testlet membership are not question types. They are immutable item-group versions whose ordered children retain their ordinary question schemas and answer versions.

## Validation responsibilities

Zod validation should reject unsupported type discriminators and malformed type-specific data. At minimum, a valid question must satisfy the shared metadata contract and the requirements of its selected type.

The schema boundary should verify:

- a stable question identifier and supported `type`;
- a Year 1–12 schema value, with programme and content-readiness gates applied separately;
- `naplan_style` or `icas_style` exam style;
- a lifecycle status and an `original_seed` origin;
- a clear prompt;
- correctly identified and uniquely keyed options where relevant;
- an answer-key shape compatible with the question type;
- an original, age-appropriate explanation;
- valid structured visual data and accessible alternative text when a visual is used.

Published content should be treated more strictly than draft content. Authoring workflows may allow incomplete draft material, but a published question must be renderable, answerable, and reviewable without hidden assumptions.

## Answers and scoring

Answer keys are structured data, not display text embedded in components. Machine-scorable types should define an unambiguous canonical answer and any explicit comparison rules. Free-text or extended-response types may define accepted responses where reliable; otherwise they must be marked for manual review.

Scoring is performed by pure functions outside React. Question renderers capture a response in the expected shape and must not contain marking logic.

## Extending the schema

To add or complete a question type:

1. Define its type-specific content, response, and answer-key shapes.
2. Extend the Zod type-specific validation and inferred TypeScript types.
3. Register an accessible question renderer.
4. Add a pure scorer or an explicit manual-review outcome.
5. Add valid and invalid fixtures plus registry, renderer, and scoring tests.

New fields should remain JSON-compatible so question data can move from local modules to a future backend without changing the rendering contract.
