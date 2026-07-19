-- Admin aggregate views for the analytics and content-intelligence
-- dashboards. Implements the rule in docs/PRIVACY_AND_BILLING_GUARDRAILS.md
-- and docs/DATA_MODEL_AND_ROLES.md: admin dashboards read pre-aggregated
-- views, never raw per-child rows. Every view here:
--
--   * aggregates across students — no student_id, no display_name, no
--     individual responses or results ever appear in a view column;
--   * is gated by public.is_admin() inside the view body, so any
--     non-admin (or anonymous) caller gets zero rows, not an error;
--   * runs with the view owner's rights (Postgres default for views),
--     which deliberately bypasses the caller's RLS on exam_attempts —
--     the is_admin() predicate is the access control, and security_barrier
--     stops predicate pushdown from leaking rows around it.
--
-- Individual-child raw data access is intentionally absent: that goes
-- through a named, logged support workflow in a later phase, never through
-- these aggregate views.

-- ---------------------------------------------------------------------------
-- Helper: is the calling user an admin?
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Platform totals — one row of headline counts.
-- ---------------------------------------------------------------------------

create view public.admin_platform_totals
with (security_barrier) as
select
  count(*)::bigint as total_attempts,
  count(distinct a.student_id)::bigint as active_students,
  (select count(*) from public.exam_sessions where public.is_admin())::bigint
    as total_sessions,
  round(avg((a.result ->> 'objectivePercentage')::numeric), 1) as avg_score_pct,
  round(avg((a.result ->> 'timeTakenSeconds')::numeric), 0) as avg_time_seconds
from public.exam_attempts a
where public.is_admin();

-- ---------------------------------------------------------------------------
-- Weekly activity — attempts, distinct active students and average score
-- per ISO week. active_students is a count, never a list.
-- ---------------------------------------------------------------------------

create view public.admin_weekly_activity
with (security_barrier) as
select
  date_trunc('week', a.submitted_at)::date as week_start,
  count(*)::bigint as attempts,
  count(distinct a.student_id)::bigint as active_students,
  round(avg((a.result ->> 'objectivePercentage')::numeric), 1) as avg_score_pct,
  round(avg((a.result ->> 'timeTakenSeconds')::numeric), 0) as avg_time_seconds
from public.exam_attempts a
where public.is_admin()
group by 1;

-- ---------------------------------------------------------------------------
-- Score distribution — attempts per 15-point objective-percentage band.
-- band_start is 0, 15, 30, …, 90 (the top band spans 90–100).
-- ---------------------------------------------------------------------------

create view public.admin_score_distribution
with (security_barrier) as
select
  least(90, (floor((a.result ->> 'objectivePercentage')::numeric / 15) * 15))::int
    as band_start,
  count(*)::bigint as attempts
from public.exam_attempts a
where public.is_admin()
group by 1;

-- ---------------------------------------------------------------------------
-- Subject and skill performance — sums of the per-attempt breakdown rows
-- the server already computes into result.breakdowns (see
-- src/features/exam-engine/scoring/exam-report.ts). Aggregated across all
-- attempts; no per-student figures survive the group by.
-- ---------------------------------------------------------------------------

create view public.admin_subject_performance
with (security_barrier) as
select
  b.key as subject,
  count(*)::bigint as attempts,
  sum((b.value ->> 'total')::bigint) as questions_total,
  sum((b.value ->> 'attempted')::bigint) as questions_attempted,
  sum((b.value ->> 'correct')::bigint) as questions_correct,
  sum((b.value ->> 'incorrect')::bigint) as questions_incorrect,
  sum((b.value ->> 'unanswered')::bigint) as questions_unanswered,
  sum((b.value ->> 'objectiveMarksEarned')::numeric) as marks_earned,
  sum((b.value ->> 'objectiveMarksAvailable')::numeric) as marks_available
from public.exam_attempts a
cross join lateral jsonb_each(a.result -> 'breakdowns' -> 'bySubject') as b(key, value)
where public.is_admin()
group by b.key;

create view public.admin_skill_performance
with (security_barrier) as
select
  b.key as skill,
  count(*)::bigint as attempts,
  sum((b.value ->> 'total')::bigint) as questions_total,
  sum((b.value ->> 'attempted')::bigint) as questions_attempted,
  sum((b.value ->> 'correct')::bigint) as questions_correct,
  sum((b.value ->> 'incorrect')::bigint) as questions_incorrect,
  sum((b.value ->> 'unanswered')::bigint) as questions_unanswered,
  sum((b.value ->> 'objectiveMarksEarned')::numeric) as marks_earned,
  sum((b.value ->> 'objectiveMarksAvailable')::numeric) as marks_available
from public.exam_attempts a
cross join lateral jsonb_each(a.result -> 'breakdowns' -> 'bySkill') as b(key, value)
where public.is_admin()
group by b.key;

-- ---------------------------------------------------------------------------
-- Per-question item statistics — the content-intelligence source. Rows are
-- keyed by question id (bank content, not student data). The two
-- avg_overall_* columns are the attempt-level average score split by
-- whether this question was answered correctly; their gap approximates the
-- item's discrimination (computed app-side). Question text and metadata
-- stay in the server-only bank and are joined server-side — this view
-- never stores question content or answer keys in the database.
-- ---------------------------------------------------------------------------

create view public.admin_question_stats
with (security_barrier) as
select
  qd.value ->> 'questionId' as question_id,
  count(*)::bigint as attempts,
  count(*) filter (where qd.value ->> 'status' = 'correct')::bigint as correct,
  count(*) filter (where qd.value ->> 'status' = 'incorrect')::bigint as incorrect,
  count(*) filter (where qd.value ->> 'status' = 'unanswered')::bigint as unanswered,
  count(*) filter (where (qd.value ->> 'pendingManualReview')::boolean)::bigint
    as pending_manual,
  round(
    avg((a.result ->> 'objectivePercentage')::numeric)
      filter (where qd.value ->> 'status' = 'correct'),
    1
  ) as avg_overall_when_correct,
  round(
    avg((a.result ->> 'objectivePercentage')::numeric)
      filter (where qd.value ->> 'status' in ('incorrect', 'unanswered')),
    1
  ) as avg_overall_when_missed
from public.exam_attempts a
cross join lateral jsonb_array_elements(a.result -> 'questionDetails') as qd(value)
where public.is_admin()
group by 1;

-- ---------------------------------------------------------------------------
-- Grants. Views are owner-rights by design (see header comment); anon gets
-- nothing, authenticated may select but non-admins receive zero rows via
-- the is_admin() gate inside each view.
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
