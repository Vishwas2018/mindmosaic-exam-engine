# NAPLAN interaction-format support

The December 2025 NAPLAN Assessment Framework Table 14 defines 12 QTI
formats. MindMosaic keeps a richer internal vocabulary because content wrappers
and scoring distinctions are useful domain concepts even when several map to
one official presentation format.

| Official Table 14 format | MindMosaic internal representation |
| --- | --- |
| Multiple-choice | `multiple_choice`; one-row `true_false` where appropriate |
| Multiple-choices | `multiple_select` |
| Interactive match (drag and drop) | `drag_drop` with `category_zones` |
| Interactive match (draw lines) | `matching` with `draw_lines` |
| Interactive match (checkbox) | `matrix_choice` |
| Interactive gap match | `drag_drop` with `inline_gap` |
| Interactive graphic gap match | `drag_drop` with `graphic_gap`; `label_diagram` with `direct_placement` |
| Hot spot | `hotspot` |
| Hot text | `hot_text` |
| Composite (inline choice) | `dropdown`; presentation-less legacy `matching`/`label_diagram` use selects as accessible equivalents |
| Text entry | `number_entry`, `fill_blank`, `short_answer` |
| Extended text | `essay` |

`inline_gap` is not a layout alias: its interaction carries an ordered sequence
of text and gap segments, and every zone appears exactly once in that sequence.
`graphic_gap` and `direct_placement` targets bind to named regions of one
structured `hotspot_svg`; the same target labels remain available through native
select controls for keyboard and screen-reader use. Matrix constraints are
validated per row as well as globally.

`reading_comprehension` is a stimulus-owning wrapper whose response format is
determined by its answer kind. `ordering` is an internal extension and does not
claim a separate Table 14 format.

`structured_response` is a platform-level multipart/partial-credit response
mechanic added after this NAPLAN mapping. It is not presented as an additional
official NAPLAN interaction format; NAPLAN-aligned content should use it only
when the applicable governed blueprint explicitly permits that mechanic.

## Deployment and persistence

Deploy runtime/schema support first, apply
`20260818090000_naplan_interaction_answer_kinds.sql` second, and only then
project or publish versions with `hot_text` or `matrix` answer kinds. The
migration widens only the closed `item_versions.answer_kind` constraint. It
does not mutate immutable content and it does not change JSONB response
storage.

`item_versions.question_type` remains open text deliberately. Closing it would
make rolling deployments order-sensitive across old and new projection
writers. Runtime Zod validation, projection checks and the renderer/scorer
parity suite remain the authoritative boundary.

Rollback is forward-only: stop new-kind publication, retain all immutable
versions, and add a later constraint-narrowing migration only after proving no
rows use the new kinds. Never delete or rewrite item-version evidence to force
a rollback.
