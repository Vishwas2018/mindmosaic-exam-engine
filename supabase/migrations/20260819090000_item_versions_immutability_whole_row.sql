-- Gate A item A10 (docs/phase2-cutover-readiness-checklist.md): the
-- immutability trigger froze an explicit list of 15 columns, and every column
-- added to item_versions after it — answer_kind, source_strand, source_topic,
-- source_tags, min_words, max_words (20260814090000) — was never added to
-- that list. The projection then updated three of them in place
-- (scripts/project-runtime-content.mts's "update pass"), unnoticed by the
-- trigger, which is exactly the drift ADR-003 Amendment A5 exists to prevent:
-- a published version's candidate-visible semantics moving out from under its
-- own content_hash, silently.
--
-- THE FIX IS STRUCTURAL, NOT ANOTHER LIST. An explicit column list is exactly
-- the shape that broke once already, and will break again the next time a
-- column is added and the trigger isn't remembered. So the freeze is now
-- "every column except the ones named mutable", computed from the row itself
-- via `to_jsonb(...) - excluded_keys`, so a future `alter table ... add
-- column` is frozen the moment it exists — no second migration required.
--
-- The one mutable column is `projected_at`: re-running the projection may
-- legitimately re-stamp when a row was last confirmed, and that timestamp is
-- not learner-visible content (20260812090000's own comment already said so).
-- Nothing else on item_versions is operational in that sense — published_at,
-- the source_* scope columns and the answer-kind/word-guidance columns are all
-- facts about the published content, not about the row's lifecycle, so they
-- join the frozen set here rather than needing their own entry.
create or replace function public.reject_content_version_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_table_name = 'item_versions' then
    if (to_jsonb(new) - array['projected_at']::text[])
       is distinct from
       (to_jsonb(old) - array['projected_at']::text[])
    then
      raise exception 'item_versions is immutable; publish a new revision instead'
        using errcode = 'MM101';
    end if;
    return new;
  end if;

  -- stimulus_versions and item_answer_versions are immutable in full.
  raise exception '% is immutable; write a new version instead', tg_table_name
    using errcode = 'MM101';
end;
$$;

comment on function public.reject_content_version_update() is
  'Freezes item_versions whole-row-minus-projected_at (Gate A item A10): any column present on the row is frozen by default, including one added by a future migration, because the check is computed from to_jsonb(new/old) rather than named column-by-column. stimulus_versions and item_answer_versions remain immutable in full.';
