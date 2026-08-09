# Manual questions

A staging area for hand-authored questions, held as plain JSON outside the
generated pipeline.

## This directory is not wired into anything

Nothing here reaches the app or the gates, by location rather than by any
exclusion rule:

- **`npm run build`** compiles `src/`. Repo-root `content/` is not part of the
  Next build — the same reason `content/question-factory/` never appears in it.
- **`npm run validate:questions`** imports the `src/content/questions/question-bank`
  *module* and validates what that module exports. It does not scan the
  filesystem, so a JSON file here is invisible to it.

A question only ships once it has been moved into a bank file under
`src/content/questions/<grade>/<programme>.ts` and exported through
`question-bank.ts`. Until then, files here are inert drafts — which is the
point: you can write and review them without touching a gated path.

## Layout

```
content/manual-questions/
  _TEMPLATE.question.json
  grade-3/{icas,naplan}/
  grade-5/{icas,naplan}/
```

Grades and programmes mirror `src/content/questions/`. The `.gitkeep` files
exist only so the empty directories survive in git; delete one once its
directory holds real files.

## The template

`_TEMPLATE.question.json` carries the required fields from
`src/schemas/question.schema.ts` with a `multiple_choice` body. It is a
starting point, not a schema — the schema is the Zod definition, which is
authoritative and covers question types this template does not show
(`fill_blank`, `dropdown`, `matching`, `ordering`, `drag_drop`,
`label_diagram`, `number_entry`, …), each with its own `answerKey` shape.

Field notes:

- `yearLevel` — `3` or `5`.
- `examStyle` — `naplan_style` or `icas_style`.
- `difficulty` — `easy`, `medium` or `challenging`.
- `marks` — positive integer, max 20. `estimatedTimeSeconds` — max 3600.
- `tags` — max 12 entries. `skill` is optional.
- `status` — start at `draft`. Only `published` questions with
  `origin: "original_seed"` enter the production bank.

Because these files are not validated by any gate, a mistake here surfaces
only when the question is promoted into a bank file. Run
`npm run validate:questions` after promoting.
