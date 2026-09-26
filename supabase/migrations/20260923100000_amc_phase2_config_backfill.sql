-- Backfills the Phase-2 config-version rows 20260823100000
-- (config_version_seed_phase2_fixed) would have seeded for the two AMC
-- programme_offerings, had they existed when that migration ran.
--
-- 20260823100000 seeds exactly one blueprint_version + one blueprint_cell +
-- one assessment_profile_version per row THEN present in
-- programme_offerings, and scripts/migrations/registry.ts's own check for
-- that migration asserts a live invariant, not a historical one: today's
-- counts of blueprint_versions/assessment_profile_versions/blueprint_cells
-- must equal today's count of active programme_offerings. 20260923090000
-- (amc_programme_offerings) added two new active programme_offerings
-- without a matching config-version row for either — the exact gap CI's
-- rls job caught (migrations:record: "one blueprint_version and one
-- assessment_profile_version per active programme_offering" — REFUSED).
--
-- Same "whole eligible pool" shape as 20260823100000, scoped to only the
-- AMC offerings and guarded with `on conflict do nothing` so this is safe
-- to apply alongside a future re-run of the same backfill pattern.
do $$
declare
  v_framework_id uuid;
begin
  select id into v_framework_id
  from public.framework_versions
  where framework_id = 'phase2-fixed-framework' and revision = 1;

  if v_framework_id is null then
    raise exception 'phase2-fixed-framework revision 1 not found — 20260823100000 must run before this migration';
  end if;

  insert into public.blueprint_versions (blueprint_id, revision, label, total_items, total_marks)
  select
    'phase2-whole-pool.' || po.programme_id || '.' || po.subject_id || '.y' || po.year_level,
    1,
    'Whole eligible pool -- ' || pr.display_name || ' / ' || s.display_name || ' / Year ' || po.year_level,
    200,
    200
  from public.programme_offerings po
  join public.programmes pr on pr.id = po.programme_id
  join public.subjects s on s.id = po.subject_id
  where po.active and po.programme_id = 'australian_mathematics_competition'
  on conflict on constraint blueprint_versions_natural_key do nothing;

  insert into public.blueprint_cells (
    blueprint_version_id, cell_id, stage_id, subject_id,
    stimulus_requirement, scoring_eligibility, proportion, marks, estimated_time_seconds
  )
  select
    bv.id, 'whole-pool', 'main', po.subject_id,
    'any', 'either', 1, 200, 86400
  from public.programme_offerings po
  join public.blueprint_versions bv
    on bv.blueprint_id = 'phase2-whole-pool.' || po.programme_id || '.' || po.subject_id || '.y' || po.year_level
   and bv.revision = 1
  where po.active and po.programme_id = 'australian_mathematics_competition'
  on conflict on constraint blueprint_cells_natural_key do nothing;

  insert into public.assessment_profile_versions (
    profile_id, revision, label, programme_offering_id, framework_version_id, blueprint_version_id,
    delivery_mode, duration_seconds, scoring_algorithm_id, scoring_algorithm_version, availability
  )
  select
    'phase2-fixed.' || po.programme_id || '.' || po.subject_id || '.y' || po.year_level,
    1,
    'Phase 2 fixed -- ' || pr.display_name || ' / ' || s.display_name || ' / Year ' || po.year_level,
    po.id, v_framework_id, bv.id,
    'fixed_path', null, 'question-scorers', 1, 'available'
  from public.programme_offerings po
  join public.programmes pr on pr.id = po.programme_id
  join public.subjects s on s.id = po.subject_id
  join public.blueprint_versions bv
    on bv.blueprint_id = 'phase2-whole-pool.' || po.programme_id || '.' || po.subject_id || '.y' || po.year_level
   and bv.revision = 1
  where po.active and po.programme_id = 'australian_mathematics_competition'
  on conflict on constraint assessment_profile_versions_natural_key do nothing;
end $$;
