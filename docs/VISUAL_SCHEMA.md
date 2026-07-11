# Visual Schema

## Core principle

**Structured visual JSON → deterministic React/SVG renderer**

Visuals are represented as validated data rather than arbitrary markup. The same valid visual data must always produce the same React or SVG structure, geometry, labels, and reading order.

## Supported visual types

The `VISUAL_TYPES` catalogue contains exactly these 10 values:

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

All 10 visual types have functional deterministic renderers registered in `visualRendererRegistry`.

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

## Accessibility

Every meaningful visual requires alternative text. Rendered SVG should expose an accessible name and, where useful, a description. Data needed to answer a question must not be communicated by colour alone. Labels, patterns, shapes, text summaries, or semantic tables should provide equivalent information, and interactive hotspots must be keyboard operable with visible focus.

Decorative details should be hidden from assistive technology so they do not obscure the assessment content.

## Adding a visual type

1. Define a JSON-compatible Zod branch and inferred TypeScript type.
2. Specify deterministic layout and accessibility behaviour.
3. Implement and register the React/SVG renderer.
4. Add valid and invalid fixtures.
5. Test registry selection, output determinism, fallback behaviour, and accessibility.
