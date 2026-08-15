-- Phase 2 step 8: the six admin aggregate views read through the resolution
-- rule (spec §12.7 step 8; ADR-005 §7 and Amendment A).
--
-- WHY THESE ARE THE HARD ONES. No application file names the tables they read.
-- `src/server/admin-analytics.ts` says so at its top: it queries these views and
-- never `exam_attempts`, `exam_sessions` or `profiles`. The dependency lives
-- entirely in 20260718120000, which is why ADR-005 §7 moves them as an explicit
-- workflow step rather than trusting a grep — and why a cutover that forgot them
-- would not fail, it would quietly report only legacy sittings for ever.
--
-- WHAT CHANGES: the row source, and nothing else. Every view keeps its name,
-- its column list, its types, its `is_admin()` gate inside the body, its
-- `security_barrier`, its owner-rights posture and its grants. With the cohort
-- empty, `resolved_sittings` contains exactly the legacy rows these views read
-- before, so every number they produce today is unchanged — which is asserted
-- against both definitions in `tests/rls/admin-views-resolution.test.ts` rather
-- than argued here.
--
-- WHAT IT BUYS: the day a cohort opens, a target sitting is counted once, from
-- its origin, and a backfilled sitting is not counted twice. The de-duplication
-- is inherited from `resolved_sittings`; none of these views restates it.
--
-- Read-side and additive. No table, policy, grant or write path changes.

-- ---------------------------------------------------------------------------
-- Platform totals
-- ---------------------------------------------------------------------------
-- `total_attempts` becomes "sittings with a submission" and `total_sessions`
-- "sittings", which is what both meant: an attempt row IS a submitted legacy
-- session, one per session by unique constraint, so the two numbers are the same
-- ones as before on legacy data.
create or replace view public.admin_platform_totals
with (security_barrier) as
select
  count(*) filter (where rs.submitted_at is not null)::bigint as total_attempts,
  count(distinct rs.student_id) filter (where rs.submitted_at is not null)::bigint
    as active_students,
  count(*)::bigint as total_sessions,
  round(avg(rs.objective_percentage) filter (where rs.submitted_at is not null), 1)
    as avg_score_pct,
  round(avg(rs.time_taken_seconds) filter (where rs.submitted_at is not null), 0)
    as avg_time_seconds
from public.resolved_sittings rs
where public.is_admin();

-- ---------------------------------------------------------------------------
-- Weekly activity
-- ---------------------------------------------------------------------------
create or replace view public.admin_weekly_activity
with (security_barrier) as
select
  date_trunc('week', rs.submitted_at)::date as week_start,
  count(*)::bigint as attempts,
  count(distinct rs.student_id)::bigint as active_students,
  round(avg(rs.objective_percentage), 1) as avg_score_pct,
  round(avg(rs.time_taken_seconds), 0) as avg_time_seconds
from public.resolved_sittings rs
where public.is_admin() and rs.submitted_at is not null
group by 1;

-- ---------------------------------------------------------------------------
-- Score distribution
-- ---------------------------------------------------------------------------
-- The NULL band is preserved deliberately. A sitting whose stored result has no
-- objectivePercentage — an early or malformed row — produced a null band_start in
-- the original view rather than being dropped, and admin-analytics.ts renders
-- what it is given. Filtering it out here would have been a defensible cleanup
-- and a silent change to a dashboard, which is not what a cutover step is for.
create or replace view public.admin_score_distribution
with (security_barrier) as
select
  least(90, (floor(rs.objective_percentage / 15.0) * 15))::int as band_start,
  count(*)::bigint as attempts
from public.resolved_sittings rs
where public.is_admin() and rs.submitted_at is not null
group by 1;

-- ---------------------------------------------------------------------------
-- Subject and skill performance
-- ---------------------------------------------------------------------------
-- Two branches, one rule. The legacy half reads the aggregate `breakdowns` the
-- legacy scorer computed and stored, because that model recorded per-question
-- status without per-question subject — there is nothing finer to group. The
-- target half groups the served items themselves, which do carry it.
--
-- Both branches are driven from `resolved_sittings`, so which sittings exist and
-- which model owns each is decided in one place; only where the detail lives
-- differs.
create or replace view public.admin_subject_performance
with (security_barrier) as
with legacy_rows as (
  select
    b.key as subject,
    1::bigint as attempts,
    (b.value ->> 'total')::numeric as questions_total,
    (b.value ->> 'attempted')::numeric as questions_attempted,
    (b.value ->> 'correct')::numeric as questions_correct,
    (b.value ->> 'incorrect')::numeric as questions_incorrect,
    (b.value ->> 'unanswered')::numeric as questions_unanswered,
    (b.value ->> 'objectiveMarksEarned')::numeric as marks_earned,
    (b.value ->> 'objectiveMarksAvailable')::numeric as marks_available
  from public.resolved_sittings rs
  cross join lateral jsonb_each(rs.legacy_result -> 'breakdowns' -> 'bySubject') as b(key, value)
  where rs.origin = 'legacy' and rs.legacy_result is not null
),
target_rows as (
  select
    q.subject,
    count(distinct q.session_id)::bigint as attempts,
    count(*)::numeric as questions_total,
    count(*) filter (where q.attempted)::numeric as questions_attempted,
    count(*) filter (where q.status = 'correct')::numeric as questions_correct,
    count(*) filter (where q.status = 'incorrect')::numeric as questions_incorrect,
    count(*) filter (where q.status = 'unanswered')::numeric as questions_unanswered,
    coalesce(sum(q.awarded_marks), 0) as marks_earned,
    coalesce(sum(q.available_marks) filter (where not q.pending_manual), 0) as marks_available
  from public.resolved_sitting_questions q
  where q.origin = 'version_pinned' and q.subject is not null
  group by q.subject
)
select
  subject,
  sum(attempts)::bigint as attempts,
  /* numeric, not bigint: the original views summed `(b.value->>'total')::bigint`
     and `sum(bigint)` is numeric in Postgres. `create or replace view` refuses a
     type change, which is a useful check — it means the replacement cannot
     quietly hand admin-analytics.ts a differently-typed column. */
  sum(questions_total) as questions_total,
  sum(questions_attempted) as questions_attempted,
  sum(questions_correct) as questions_correct,
  sum(questions_incorrect) as questions_incorrect,
  sum(questions_unanswered) as questions_unanswered,
  sum(marks_earned) as marks_earned,
  sum(marks_available) as marks_available
from (select * from legacy_rows union all select * from target_rows) both_models
where public.is_admin()
group by subject;

create or replace view public.admin_skill_performance
with (security_barrier) as
with legacy_rows as (
  select
    b.key as skill,
    1::bigint as attempts,
    (b.value ->> 'total')::numeric as questions_total,
    (b.value ->> 'attempted')::numeric as questions_attempted,
    (b.value ->> 'correct')::numeric as questions_correct,
    (b.value ->> 'incorrect')::numeric as questions_incorrect,
    (b.value ->> 'unanswered')::numeric as questions_unanswered,
    (b.value ->> 'objectiveMarksEarned')::numeric as marks_earned,
    (b.value ->> 'objectiveMarksAvailable')::numeric as marks_available
  from public.resolved_sittings rs
  cross join lateral jsonb_each(rs.legacy_result -> 'breakdowns' -> 'bySkill') as b(key, value)
  where rs.origin = 'legacy' and rs.legacy_result is not null
),
target_rows as (
  select
    q.skill,
    count(distinct q.session_id)::bigint as attempts,
    count(*)::numeric as questions_total,
    count(*) filter (where q.attempted)::numeric as questions_attempted,
    count(*) filter (where q.status = 'correct')::numeric as questions_correct,
    count(*) filter (where q.status = 'incorrect')::numeric as questions_incorrect,
    count(*) filter (where q.status = 'unanswered')::numeric as questions_unanswered,
    coalesce(sum(q.awarded_marks), 0) as marks_earned,
    coalesce(sum(q.available_marks) filter (where not q.pending_manual), 0) as marks_available
  from public.resolved_sitting_questions q
  where q.origin = 'version_pinned' and q.skill is not null
  group by q.skill
)
select
  skill,
  sum(attempts)::bigint as attempts,
  sum(questions_total) as questions_total,
  sum(questions_attempted) as questions_attempted,
  sum(questions_correct) as questions_correct,
  sum(questions_incorrect) as questions_incorrect,
  sum(questions_unanswered) as questions_unanswered,
  sum(marks_earned) as marks_earned,
  sum(marks_available) as marks_available
from (select * from legacy_rows union all select * from target_rows) both_models
where public.is_admin()
group by skill;

-- ---------------------------------------------------------------------------
-- Per-question item statistics
-- ---------------------------------------------------------------------------
-- The one view both models can feed identically, because both record a
-- per-question status keyed by the same identifier space: the projection set
-- `items.item_code` from the authored question's id, which is what the legacy
-- `questionDetails[].questionId` also holds.
create or replace view public.admin_question_stats
with (security_barrier) as
select
  q.question_key as question_id,
  count(*)::bigint as attempts,
  count(*) filter (where q.status = 'correct')::bigint as correct,
  count(*) filter (where q.status = 'incorrect')::bigint as incorrect,
  count(*) filter (where q.status = 'unanswered')::bigint as unanswered,
  count(*) filter (where q.pending_manual)::bigint as pending_manual,
  round(avg(q.sitting_percentage) filter (where q.status = 'correct'), 1)
    as avg_overall_when_correct,
  round(avg(q.sitting_percentage) filter (where q.status in ('incorrect', 'unanswered')), 1)
    as avg_overall_when_missed
from public.resolved_sitting_questions q
where public.is_admin()
group by 1;

-- ---------------------------------------------------------------------------
-- Grants, restated because `create or replace view` does not change them but a
-- reader should not have to know that.
-- ---------------------------------------------------------------------------
revoke all on public.admin_platform_totals from anon, public;
revoke all on public.admin_weekly_activity from anon, public;
revoke all on public.admin_score_distribution from anon, public;
revoke all on public.admin_subject_performance from anon, public;
revoke all on public.admin_skill_performance from anon, public;
revoke all on public.admin_question_stats from anon, public;

grant select on public.admin_platform_totals to authenticated;
grant select on public.admin_weekly_activity to authenticated;
grant select on public.admin_score_distribution to authenticated;
grant select on public.admin_subject_performance to authenticated;
grant select on public.admin_skill_performance to authenticated;
grant select on public.admin_question_stats to authenticated;
