-- ---------------------------------------------------------------------------
-- Migration: 20261014090000_scholarship_programme_offerings.sql
-- Scholarship Phase 1b: Authority & Offerings for Scholarship Track
-- Local database migration only (never applied directly to hosted DB).
-- ---------------------------------------------------------------------------

-- 1. Assessment Family: scholarship_entry
insert into public.assessment_families (id, display_name, description) values
  ('scholarship_entry', 'Scholarship-entry practice', 'Original scholarship-style practice formatted like common independent-school scholarship examinations; not affiliated with or endorsed by Edutest or ACER.')
on conflict (id) do nothing;

-- 2. Programmes: edutest_scholarship_prep
insert into public.programmes (id, assessment_family_id, display_name, style_disclaimer) values
  ('edutest_scholarship_prep', 'scholarship_entry', 'Scholarship-style practice programme', 'Original practice materials formatted like common independent-school scholarship examinations such as Edutest; no official affiliation or endorsement is implied.')
on conflict (id) do nothing;

-- 3. Subjects: verbal_reasoning and numerical_reasoning
insert into public.subjects (id, display_name, selection_filter_alias) values
  ('verbal_reasoning', 'Verbal Reasoning', null),
  ('numerical_reasoning', 'Numerical Reasoning', null)
on conflict (id) do nothing;

-- 4. Programme Offerings: Year 6 offerings under edutest_scholarship_prep
insert into public.programme_offerings (programme_id, subject_id, year_level, locale, region) values
  ('edutest_scholarship_prep', 'verbal_reasoning', 6, 'en-AU', 'global'),
  ('edutest_scholarship_prep', 'numerical_reasoning', 6, 'en-AU', 'global'),
  ('edutest_scholarship_prep', 'reading', 6, 'en-AU', 'global'),
  ('edutest_scholarship_prep', 'numeracy', 6, 'en-AU', 'global'),
  ('edutest_scholarship_prep', 'writing', 6, 'en-AU', 'global')
on conflict (programme_id, subject_id, year_level, locale, region) do nothing;

-- 5. Publication Gate Settings: Set scholarship programme and section offerings to ENFORCE mode
insert into public.publication_gate_settings (programme_id, enforced) values
  ('edutest_scholarship_prep', true),
  ('scholarship-y6-verbal-reasoning', true),
  ('scholarship-y6-numerical-reasoning', true),
  ('scholarship-y6-reading', true),
  ('scholarship-y6-numeracy', true),
  ('scholarship-y6-mathematics', true),
  ('scholarship-y6-writing', true)
on conflict (programme_id) do update set enforced = excluded.enforced;

-- 6. Phase-2 config-version backfill for scholarship programme offerings
-- Invariant checked by 20260823100000 and 20260923100000 requires one
-- blueprint_version, one blueprint_cell, and one assessment_profile_version per
-- active programme_offering.
do $$
declare
  v_framework_id uuid;
begin
  select id into v_framework_id
  from public.framework_versions
  where framework_id = 'phase2-fixed-framework' and revision = 1;

  if v_framework_id is not null then
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
    where po.active and po.programme_id = 'edutest_scholarship_prep'
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
    where po.active and po.programme_id = 'edutest_scholarship_prep'
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
    where po.active and po.programme_id = 'edutest_scholarship_prep'
    on conflict on constraint assessment_profile_versions_natural_key do nothing;
  end if;
end $$;

-- 7. First-class session mode on exam_sessions
alter table public.exam_sessions
  add column if not exists mode text not null default 'standard'
  check (mode in ('standard', 'confidence'));

create or replace function public.create_exam_session(
  p_config jsonb,
  p_seed text,
  p_selected_question_ids text[],
  p_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_student uuid := auth.uid();
  v_session_id uuid;
  v_mode text;
begin
  if v_student is null then
    raise exception 'create_exam_session requires an authenticated caller'
      using errcode = 'MM001';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = v_student
      and p.role = 'student'
  ) then
    raise exception 'only a student may create an exam session'
      using errcode = 'MM002';
  end if;

  v_mode := coalesce(
    p_config->>'mode',
    case when (p_config->>'confidenceMode')::boolean is true then 'confidence' else 'standard' end
  );

  insert into public.exam_sessions
    (student_id, config, seed, selected_question_ids, expires_at, mode)
  values (v_student, p_config, p_seed, p_selected_question_ids, p_expires_at, v_mode)
  returning id into v_session_id;

  return v_session_id;
end;
$$;

revoke all on function public.create_exam_session(jsonb, text, text[], timestamptz)
  from public, anon;
grant execute on function public.create_exam_session(jsonb, text, text[], timestamptz)
  to authenticated;
