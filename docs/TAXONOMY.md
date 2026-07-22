# Subjects, strands and skills

## Purpose

`src/features/taxonomy/subject-registry.ts` is the single source of truth for which subjects and strands the
product knows about. Before this registry existed, `subject` was a hardcoded `z.enum([...])` in
`src/schemas/question.schema.ts`, and everything else that cared about subjects (the question-factory skill
taxonomy, blueprint validation) derived from that schema indirectly. Adding a subject meant editing the schema
and hoping every consumer picked it up. Now there is one array to edit.

## How it flows

```text
SUBJECT_REGISTRY (subject-registry.ts)
  -> SUBJECT_IDS (derived tuple, via subjectIdsFromRegistry)
    -> question.schema.ts: questionMetadataSchema.subject = z.enum(SUBJECT_IDS)
      -> exam-engine/types re-exports QuestionMetadata["subject"]
        -> question-factory/blueprints/schema.ts: subjectSchema = questionMetadataSchema.shape.subject
    -> question-factory/taxonomy/types.ts: TaxonomySubject = SubjectId (imported directly from the registry)
```

Every place that validates or types a question's `subject` reads from `SUBJECT_REGISTRY`, directly or
transitively — there is no second hardcoded subject list.

## What's in a registry entry

```ts
interface SubjectStrand {
  id: string;              // stable slug, e.g. "vocabulary-in-context" — never renamed once shipped
  label: string;            // display text, matches metadata.strand content, e.g. "Vocabulary in context"
  skills: readonly string[]; // known skill descriptions under this strand
}

interface SubjectRegistryEntry {
  id: string;                              // e.g. "numeracy" — the schema's subject enum value
  label: string;
  supportedExamStyles: readonly ExamStyle[]; // naplan_style / icas_style
  strands: readonly SubjectStrand[];
  coverageTargets?: Readonly<Record<string, number>>; // optional, unused today
}
```

The seeded strand and skill lists for the four existing subjects (`numeracy`, `reading`, `writing`,
`language_conventions`) were derived directly from the 100-question production bank
(`src/content/questions/grade-3/*`, `src/content/questions/grade-5/*`) — every `(subject, strand)` pair and every
`metadata.skill` string used by a real published question is represented.

## Why `strand` is still a free string in the schema

`questionMetadataSchema.strand` is `z.string().trim().min(1).max(80)`, **not** an enum derived from the registry,
even though the registry does model strands. Two large existing content sources are schema-validated at import
time with a strand vocabulary broader than the production bank's:

- `src/content/questions/practice-bank.ts` validates 1,103 auto-generated practice questions
  (`generated/generated-questions.ts`) whose strands include things like `"Conventions of language"` and
  `"Number and Algebra"`.
- `src/content/questions/showcase-fixtures.ts` uses strands like `"Science link"` and `"Narrative"`.

Turning `strand` into a registry-derived enum would reject that already-valid content. `getStrandsForSubject` and
`isKnownStrandLabel` (exported from the registry) are available for anything that *does* want to check a strand
against the curated production-bank list — the production 100-question bank's `(subject, strand)` pairs are
covered (see `src/tests/unit/subject-registry.test.ts`) — but that check isn't wired into the base question
schema.

## Known gap: the skill taxonomy's strand vocabulary

`src/features/question-factory/taxonomy/entries.ts` (the skill taxonomy used for blueprint generation) uses a
broader strand vocabulary than `subject-registry.ts` — e.g. `"Comprehension"`, `"Chance"`,
`"Patterns and Algebra"` don't appear in the registry's seeded strand lists. `TaxonomyEntry.subject` is now typed
directly from the registry's `SubjectId`, but `TaxonomyEntry.strand` remains an unchecked `string` and is **not**
cross-validated against `SUBJECT_REGISTRY`. Bringing those two strand vocabularies fully in sync (either by
expanding the registry or narrowing the taxonomy) is future work, not part of this change.

## How to add a subject

Add one entry to `SUBJECT_REGISTRY` in `src/features/taxonomy/subject-registry.ts`:

```ts
{
  id: "new_subject",
  label: "New Subject",
  supportedExamStyles: ["naplan_style", "icas_style"],
  strands: [
    { id: "some-strand", label: "Some Strand", skills: ["A skill description"] },
  ],
},
```

That's it — `questionMetadataSchema.subject` and `TaxonomySubject` both pick it up automatically. Adding a
question with the new subject also needs `metadata.strand` to be a non-empty string (any string; strand is not
enum-enforced, see above).

## How to add a strand or skill to an existing subject

Append to that subject's `strands` array (for a new strand) or to a strand's `skills` array (for a new skill
description). Strand `id`s are permanent slugs — do not rename an existing one, since nothing currently depends
on it being stable, but future consumers (e.g. blueprint tooling) may.
