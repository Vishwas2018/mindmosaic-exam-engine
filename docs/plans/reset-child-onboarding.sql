-- reset-child-onboarding.sql  --  WRITTEN, NOT RUN.
--
-- =================================================================================
-- STATUS (read before use):
--   * This script has NEVER BEEN EXECUTED, against hosted or against any copy.
--   * Its UPDATE path is UNVERIFIED. The guard and the ROLLBACK ending are the only
--     parts reasoned about; nothing here has been seen to change a row.
--   * Before first real use: rehearse it on a restored throwaway copy (see
--     dev-to-main-release-plan-2026-10-14.md, runbook R3, for how to build one),
--     take a fresh dump of hosted, and run it once with the ROLLBACK ending.
-- =================================================================================
--
-- Puts ONE student profile back to "has not done onboarding": the onboarding dialog
-- and the 5-question diagnostic warmup banner appear again on /student.
--
-- WHAT DRIVES THE PROMPT. src/features/student/require-student.ts derives
--   onboardingCompleted = Boolean(profiles.onboarding_completed_at)
--   diagnosticCompleted = Boolean(profiles.diagnostic_completed_at)
-- and StudentOnboardingModal auto-opens whenever onboardingCompleted is false.
-- Clearing those two timestamps is therefore the whole reset. interests and
-- weekly_goal_minutes are put back to their column defaults ('{}' and 60) so the
-- dialog starts from the same state a brand-new child sees.
--
-- WHAT THIS DOES NOT DO (on purpose). Completing onboarding also created one
-- legacy exam_sessions row and one exam_attempts row (the "Diagnostic Warmup",
-- seed 'diagnostic-<child>-<year>'). Those tables are immutable by design, and
-- assessment_sessions.legacy_session_id / assessment_results.legacy_attempt_id
-- reference them ON DELETE RESTRICT once a backfill has copied them. They are left
-- in place by default. Re-running onboarding just adds another diagnostic row.
-- An opt-in block B at the bottom removes them, guarded.
--
-- HOW TO RUN (psql 17, hosted, as the project's postgres role; Free tier has no
-- backups, so take a fresh dump first -- docs/plans/dev-to-main-release-plan-2026-10-14.md):
--
--   psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 \
--        -v child_id=<profiles.id of the child> \
--        -f docs/plans/reset-child-onboarding.sql
--
-- The script ends in ROLLBACK. Read the BEFORE/AFTER output, then change the last
-- line to COMMIT and run it again. Nothing is changed until then.
--
-- GUARDS. It refuses to run unless exactly one row matches AND that row is
-- role = 'student'. A parent/teacher id, a typo, or a missing id raises and aborts.

\set ON_ERROR_STOP on
begin;

-- The one row we intend to touch, before.
select p.id, p.display_name, p.role, p.year_level,
       p.onboarding_completed_at, p.diagnostic_completed_at, p.interests, p.weekly_goal_minutes
from public.profiles p
where p.id = :'child_id'::uuid;

-- psql does not substitute :variables inside a $$ body, so hand the id to the guard
-- through a transaction-local setting.
select set_config('mm.child_id', :'child_id', true);

do $guard$
declare
  v_id   uuid := current_setting('mm.child_id')::uuid;
  v_role text;
begin
  select role into v_role from public.profiles where id = v_id;
  if v_role is null then
    raise exception 'reset-child-onboarding: no profile with id %', v_id;
  end if;
  if v_role <> 'student' then
    raise exception 'reset-child-onboarding: profile % has role %, expected student', v_id, v_role;
  end if;
end
$guard$;

-- Block A: reset the flags that drive the prompt. year_level is NOT touched.
update public.profiles
set onboarding_completed_at = null,
    diagnostic_completed_at = null,
    interests               = '{}'::text[],
    weekly_goal_minutes     = 60
where id = :'child_id'::uuid
  and role = 'student'
returning id, display_name, year_level,
          onboarding_completed_at, diagnostic_completed_at, interests, weekly_goal_minutes;

-- ---------------------------------------------------------------------------------
-- Block B (OPT-IN, commented out): also remove the diagnostic exam_sessions/attempts.
-- Only do this if you need the child's history to show no "Diagnostic Warmup".
-- Step 1 -- look first. Run this select on its own; every child_* count must be 0.
--
-- select s.id as session_id,
--        (select count(*) from public.exam_attempts a where a.session_id = s.id)               as attempts,
--        (select count(*) from public.assessment_sessions x where x.legacy_session_id = s.id)  as child_target_sessions,
--        (select count(*) from public.assessment_results r
--           join public.exam_attempts a on a.id = r.legacy_attempt_id
--           where a.session_id = s.id)                                                          as child_target_results,
--        (select count(*) from public.essay_marks em
--           join public.exam_attempts a on a.id = em.attempt_id where a.session_id = s.id)      as essay_marks
-- from public.exam_sessions s
-- where s.student_id = :'child_id'::uuid
--   and s.config->>'title' = 'Diagnostic Warmup'
--   and s.seed like 'diagnostic-' || :'child_id' || '-%';
--
-- Step 2 -- if (and only if) all counts above are 0, uncomment. exam_attempts and
-- exam_responses cascade from exam_sessions. The schema may also block direct
-- deletes (writes are revoked as "immutable by design"); if so this fails and you
-- should leave the history alone rather than loosen a guard.
--
-- delete from public.exam_sessions s
-- where s.student_id = :'child_id'::uuid
--   and s.config->>'title' = 'Diagnostic Warmup'
--   and s.seed like 'diagnostic-' || :'child_id' || '-%'
--   and not exists (select 1 from public.assessment_sessions x where x.legacy_session_id = s.id);
-- ---------------------------------------------------------------------------------

-- The row we touched, after (same transaction).
select p.id, p.display_name, p.year_level,
       p.onboarding_completed_at, p.diagnostic_completed_at, p.interests, p.weekly_goal_minutes
from public.profiles p
where p.id = :'child_id'::uuid;

-- SAFE DEFAULT: nothing is kept. Change to `commit;` only after reading the output above.
rollback;
