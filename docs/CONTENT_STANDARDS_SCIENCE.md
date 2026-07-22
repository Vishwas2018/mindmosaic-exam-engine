# Content Standards: Science

Subject-specific companion to `docs/CONTENT_RULES.md` (which applies to every
subject) and `docs/TAXONOMY.md` (which explains the subject-registry
mechanism). This is the first subject-specific standards doc in the repo —
treat its shape as the template for the next subject added after Science,
rather than one-off Science-only structure.

## Status

Foundation only. This document, the `science` entry in `SUBJECT_REGISTRY`
(`src/features/taxonomy/subject-registry.ts`), and a small number of seed
blueprints (`content/question-factory/blueprints/`) exist. **No Science
questions have been generated or staged** — `src/content/questions/**` (the
governed 100-question bank) is unchanged and out of scope for this work.
Generating and reviewing actual Science candidates is deliberate follow-up
work, gated on that decision being made separately.

## Curriculum grounding

Strands and skills are seeded from the Australian Curriculum: Science content
descriptions for Year 3 and Year 5, covering all four F–10 strands examined
by ICAS Science at this year range:

| Strand id | Label | Example Year 3/5 content descriptions |
| --- | --- | --- |
| `biological-sciences` | Biological Sciences | Basic needs of living things; life cycles; structural adaptations |
| `chemical-sciences` | Chemical Sciences | Properties of solids/liquids/gases; changes of state; reversible vs irreversible change |
| `physical-sciences` | Physical Sciences | Forces and motion; light and shadows; heat transfer |
| `earth-and-space-sciences` | Earth and Space Sciences | Day/night from Earth's rotation; the water cycle; Earth's place in the solar system |

Unlike the four existing subjects (`numeracy`, `reading`, `writing`,
`language_conventions`), whose registry strand/skill lists were derived
directly from the production bank, Science has no bank content to derive
from — its strand and skill lists are hand-authored against the curriculum
instead. Treat them as a starting seed: expect to extend `strands[].skills`
as real content coverage needs emerge, following
`docs/TAXONOMY.md`'s "how to add a strand or skill" section.

## Exam style

Science supports `icas_style` only. NAPLAN does not assess Science, so
(unlike the other four subjects) `supportedExamStyles` is a single-element
array rather than both styles.

## Blueprint seeds

`content/question-factory/blueprints/` holds a small number of
schema-validated (`blueprints/schema.ts`) blueprint templates per new
subject, one per representative strand, as a worked example of a valid
blueprint for that subject's taxonomy entries — not a batch ready for
generation. Each blueprint's `skill` must resolve against a real
`SKILL_TAXONOMY_ENTRIES` entry (`src/features/question-factory/taxonomy/entries.ts`)
with a matching `subject`, `yearLevel`/`examStyle`/`difficulty` coverage, and
`questionType`/`visualType` drawn from that entry's own recommended lists —
`blueprints/validate.ts` enforces all of this.

## What the deferred sample-generation follow-up needs

Generating and staging actual Science candidate questions (explicitly out of
scope here) will additionally need, beyond what this foundation provides:

- AI provider keys configured (none are set in this environment; live
  generation was not attempted as part of this work).
- Deterministic answer-correctness rules for Science question types, mirrored
  from `scripts/check-question-correctness.mts`'s per-subject logic — that
  script currently has no Science-specific verification path.
- Editorial review against `docs/CONTENT_RULES.md` (originality, Australian
  English, age suitability, answer accuracy, explanation, visual consistency,
  accessibility) before anything reaches `published` status.
- A decision on how many Science questions join the production bank and in
  what proportion across the four strands — `SUBJECT_REGISTRY.science` does
  not set `coverageTargets` yet, deliberately left for that decision.
