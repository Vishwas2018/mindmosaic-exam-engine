-- Deploy application/schema support for hot_text and matrix_choice before this
-- migration, then deploy content using the new kinds only after it is applied.
-- This is a metadata-only widening: immutable item-version content is not
-- rewritten and JSONB response storage remains unchanged.
alter table public.item_versions
  drop constraint item_versions_answer_kind_known;

alter table public.item_versions
  add constraint item_versions_answer_kind_known
    check (answer_kind is null or answer_kind in (
      'single_option', 'multiple_options', 'number', 'text', 'fill_blank',
      'dropdown', 'boolean', 'matching', 'ordering', 'manual', 'hotspot',
      'drag_drop', 'hot_text', 'matrix'
    ));

comment on constraint item_versions_answer_kind_known on public.item_versions is
  'Closed candidate-visible answer discriminants. hot_text and matrix were added for the December 2025 NAPLAN interaction vocabulary; answer material remains isolated in item_answer_versions.';

-- Rollback guidance: first stop writes/publication of the two new kinds and
-- confirm no item_versions rows use them. A later forward migration may then
-- replace this constraint with the former list. Never delete or rewrite an
-- immutable item version merely to make a rollback pass.
--
-- question_type intentionally remains open text. Closing it in the database
-- would make mixed-version rolling deployments reject newly projected items
-- before every writer has been upgraded; the authoritative Zod contract and
-- projection validation remain the type boundary.
