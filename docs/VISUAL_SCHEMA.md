# Visual Schema

## Core principle

**Structured visual JSON → deterministic React/SVG renderer**

Visuals are represented as validated data rather than arbitrary markup. The same valid visual data must always produce the same React or SVG structure, geometry, labels, and reading order.

## Supported visual types

The `VISUAL_TYPES` catalogue contains exactly these 11 values:

| Type | Intended representation |
| --- | --- |
| `bar_chart` | Categorised values rendered as consistently scaled bars, axes, labels, and an optional legend |
| `line_graph` | Ordered data points rendered with deterministic axes, labels, points, and connecting lines |
| `pie_chart` | Part-to-whole values rendered as labelled sectors with an accessible textual equivalent |
| `table` | Structured headers, rows, cells, captions, and appropriate semantic relationships |
| `number_line` | A bounded numeric scale with deterministic ticks, labels, points, or intervals |
| `geometry_shape` | Schema-defined geometric primitives, dimensions, annotations, and labels |
| `coordinate_grid` | Axes, scale, coordinates, points, lines, or shapes on a defined plane |
| `fraction_model` | Structured part-to-whole models such as bars, regions, or grouped objects |
| `labelled_svg` | An SVG assembled from allowed structured primitives with deterministic labels and callouts |
| `hotspot_svg` | An SVG assembled from allowed structured primitives with defined selectable regions |
| `bar_model` | A schematic Model Method bar diagram with units, braces and relationships (Phase 1: render-only, not in the question factory) |

All 11 visual types have functional deterministic renderers registered in `visualRendererRegistry`.

## Shared visual contract

A structured visual asset should provide:

- a supported visual `type`;
- a stable identifier when the visual is referenced independently;
- the data series, values, labels, or primitives required by that type;
- bounded presentation settings such as dimensions, scale, or legend behaviour;
- concise alternative text that communicates the visual’s assessment-relevant meaning.

Type-specific Zod branches should validate domain constraints before rendering. Examples include finite chart values, compatible label and value counts, valid coordinate bounds, non-negative part-to-whole quantities, and hotspot regions that remain within the view box.

## Renderer boundary

`visualRendererRegistry` resolves a supported discriminator to a focused renderer. A renderer owns layout calculations and the allowed React/SVG elements for its type. Page and question components request a visual through the registry rather than branching on visual type.

Unknown types must produce an accessible unsupported-type fallback. Declared types without a completed renderer use an accessible next-phase placeholder.

## Determinism and safety

- Identical validated input produces identical output.
- Layout does not depend on randomness, current time, browser-specific measurement, or remote mutable assets.
- Rendering uses React elements and controlled SVG primitives; arbitrary unsanitised SVG or HTML is not accepted.
- Geometry and scaling rules are testable with fixed fixtures.
- Text and numeric formatting are explicit and consistent.
- Interactive regions use stable identifiers that response and answer-key data can reference.

### Bounded ranges (`number_line`, `coordinate_grid`)

A schema-valid range and step (finite, `step > 0`, `min < max`) can still combine into an effectively unbounded tick or gridline count — a tiny step over a huge span — which would freeze the tab if rendered with a naive `for (v = min; v <= max; v += step)` loop. Two layers enforce a hard cap of 200 ticks per number line and 200 gridlines per axis on a coordinate grid:

1. **Schema validation** (`src/schemas/visual.schema.ts`, `superRefine`) rejects any `number_line` or `coordinate_grid` whose tick/gridline count would exceed the cap, computed via the shared `calculateBoundedStepCount` helper (`src/schemas/visual-safety.ts`). This is the primary defence — unsafe content never reaches a renderer.
2. **Render-time generation** (`NumberLineRenderer`, `CoordinateGridRenderer`) builds ticks by index up to the same bounded count rather than an open-ended float loop, as a backstop for any configuration that reaches the renderer without going through schema validation (for example a hand-constructed fixture in a test).

`calculateBoundedStepCount` returns `0` for non-finite input, a non-positive step, or `max < min`, so callers never need their own guard clause.

## `bar_model` (Model Method) - Phase 1, render-only

`bar_model` draws a schematic bar model (part-whole, comparison, times-as-many, equal units, before/after, transfer). **Phase 1 is render-only:** it has a schema, validators, a deterministic renderer, fixtures and tests, but it is not in any question bank, lesson or catalogue, and it is deliberately **not** enabled in the AI question factory (`RENDER_ONLY_VISUAL_TYPES`, `src/features/question-factory/config/render-only-visual-types.ts`; the factory's `ALLOWED_VISUAL_TYPES` excludes it and `candidateQuestionSchema` rejects it). Generation is enabled in a later phase.

### Answer secrecy

The learner-facing JSON contains **givens only**. An unknown or blank element has no numeric field, and the schema rejects a blank/unknown element that still carries a number. The solved answer is computed by the validator and is never an input to rendering, alt text or the generated description.

### Fields

| Field | Meaning |
| --- | --- |
| `data.layout.mode` | `"schematic"` only; widths are not proportional ("Diagram not to scale"). Proportional mode is deferred. |
| `data.units[]` | Equal-size units: `id`, optional `label`, and `value` only when the size is a given. |
| `data.quantities[]` | Change amounts stated once: `id`, optional `label`, `value` or `unknown`, `display`, optional `target`. Elements and relationships reference them by `quantityId`. |
| `data.bars[]` | 1-6 bars: `id`, `label`, optional `stage` (`before`/`after`), ordered `segments[]`. |
| `bars[].segments[]` | `id`, optional `label`, `display` (`value`/`unknown`/`blank`), and exactly one size: `value`, `units`+`unitId`, `unknown` (a symbol), or `quantityId`. Optional `target`, and `role: "change"` (must then use `quantityId`). |
| `data.braces[]` | `kind` `part`/`total`/`difference`, a `value`, `unknown` or `quantityId`, `display`, optional `label`/`side`/`target`. `part`: `spans` (contiguous segment IDs of one bar). `total`: `spans` or `barIds` (whole bars, adjacent rows). `difference`: `longerBarId` and `shorterBarId`. |
| `data.groups[]` | Comparison groups: bars share a left edge, a single unit scale, and are the scope for `difference` braces. |
| `data.relationships[]` | `add`/`remove` (`fromStage`, `toStage`, `quantityId`), `transfer` (`fromBar`, `toBar`, `quantityId`, `beforeBars`, `afterBars`; the total is conserved) and `equal` (`barIds`). |

Exactly one element (segment, brace or quantity) has `target: true` and `display: "unknown"`; it renders as `?`. Other unknowns render as their symbol or blank, never `?`.

### Three validation layers

Zod alone does not prove a bar model is solvable. Each layer owns different mistakes (`src/features/visuals/bar-model/`):

1. **Schema** (`barModelVisualSchema`): shape only - types, missing fields, bounds (`visual-safety.ts`), enums, and a blank/unknown element carrying a value.
2. **Structural** (`validateBarModelStructure`): unique IDs, no dangling `unitId`/`barId`/`segmentId`/`quantityId`, contiguous braces, a `difference` linking two bars of one group, one common unit scale per group, exactly one target, a change amount referenced rather than repeated.
3. **Mathematical** (`solveBarModel`): the model becomes linear equations over exact rationals (BigInt, no floats) - segments, braces, multi-bar totals, differences, add/remove/transfer (with a separate conservation pass) and equal. It reports contradictions, infeasible (negative) quantities, a target that is not uniquely determined, a fractional target (warning), `answer_leak` (the answer appears as a number token in a label, title, caption, alt text or ID) and `answer_equals_given` (warning, when the answer genuinely equals a displayed given).

`solveBarModel(model, context?)` returns `{ ok, target: { numerator, denominator } | null, isWhole, issues[], conservationChecks }`; rationals are strings, never floats or raw BigInt. Limitations: number *words* ("twenty-seven") are not detected in the leak check, and feasibility is checked only for quantities the equations determine.

`npm run visuals:validate-bar-models` validates every fixture in `src/content/visual-fixtures/bar-model/` (6 valid, 2 valid-with-warning, 17 invalid) and runs in CI next to the other validators.

### Rendering

`BarModelRenderer` (registered in `visualRendererRegistry`, reused by lessons) lays out deterministically from the JSON only: every unit with the same `unitId` is the same width, given values use a fixed digit-count banding, unknown/blank segments are a fixed width, braces sit in reserved lanes (no overlap), and unit ticks divide multi-unit segments. The SVG is `role="img"` named from the title and described by `altText` plus a generated description of the givens and relationships (never the solved value). Ink is `currentColor`; the target is also hatched, thick-outlined and labelled `?`, so colour never carries meaning alone.

### Internal preview

`/dev/bar-model` renders every valid fixture twice - the learner view exactly as a child would see it, and a separate developer diagnostics panel (solved target, warnings, issues). It returns 404 in production builds (`preview-gate.ts`), is evaluated per request, and is not linked from navigation. `BAR_MODEL_PREVIEW_ENABLED=1` exists only for the Playwright production web server; never set it on a deployment.

## Accessibility

Every meaningful visual requires alternative text. Rendered SVG should expose an accessible name and, where useful, a description. Data needed to answer a question must not be communicated by colour alone. Labels, patterns, shapes, text summaries, or semantic tables should provide equivalent information, and interactive hotspots must be keyboard operable with visible focus.

Decorative details should be hidden from assistive technology so they do not obscure the assessment content.

## Adding a visual type

1. Define a JSON-compatible Zod branch and inferred TypeScript type.
2. Specify deterministic layout and accessibility behaviour.
3. Implement and register the React/SVG renderer.
4. Add valid and invalid fixtures.
5. Test registry selection, output determinism, fallback behaviour, and accessibility.
