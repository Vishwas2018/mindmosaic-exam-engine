-- MM-AUD-SEC-001, step 1 of 2: give the two trusted exam writes a server
-- path that does not depend on the caller's own table privileges.
--
-- The problem this closes. Both writes went through the request-scoped
-- client (createClient() from @/lib/supabase/server), i.e. the student's
-- own JWT, so every check that made them trustworthy lived in the route
-- handler and nowhere else. PostgREST exposes the same tables to that same
-- JWT directly, and the insert policies were the only thing standing in
-- the way:
--
--   exam_sessions — with check (student_id = auth.uid() and role='student')
--     constrains WHO the row belongs to, and nothing else. selected_question_ids
--     is the server's answer to "which questions is this student sitting",
--     so a student who inserts their own session row picks their own paper.
--   exam_attempts — with check (student_id = auth.uid() and the session is
--     theirs), leaving `responses` and `result` entirely unconstrained. The
--     `result` column IS the score: a student could POST a finished attempt
--     with full marks and never sit the exam.
--
-- Neither is a policy that can be tightened into correctness. "Is this the
-- paper the server selected" and "is this the score the server computed"
-- are not properties of the row — they are properties of how the row was
-- produced. So the fix is to stop granting the write at all (step 2,
-- 20260811091000) and route it through these two definer functions, which
-- are the only remaining way to put a row in either table.
--
-- Why SECURITY DEFINER rather than the service-role client. The alternative
-- was the pattern in src/features/auth/provision-child.ts, which holds
-- SUPABASE_SERVICE_ROLE_KEY. That key bypasses RLS on every table at once,
-- so each new place that touches it widens the blast radius of a single
-- leaked env var; provision-child needs it because it calls the Auth admin
-- API, which has no in-database equivalent. These two writes do not need
-- anything of the sort. Keeping the privilege here means it is scoped to
-- exactly two functions with fixed signatures, the grant is visible in
-- pg_proc.proacl, and no additional surface holds the service key.
--
-- These functions re-check role, ownership and expiry themselves rather
-- than trusting the route to have done it. That is the same belt-and-braces
-- split used throughout this schema (see the RLS helper functions in the
-- Phase 0 migration): the route's checks produce a clear error code for the
-- client, and the database independently refuses anything that should not
-- happen. The route checks are all still in place; none were moved here.
--
-- Errors are raised with custom SQLSTATEs so the routes can map each cause
-- to the status code it already returns, instead of pattern-matching on
-- message text:
--
--   MM001  no authenticated caller
--   MM002  caller is not a student            -> 403 students_only
--   MM003  session absent or not the caller's -> 404 session_not_found
--   MM004  session past expires_at            -> 410 session_expired
--
-- 23505 from exam_attempts_session_id_key (20260722100000) is deliberately
-- NOT caught here: the submit route already turns that into an idempotent
-- 409 already_submitted, and swallowing it would break MM-SEC-02's
-- guarantee that the constraint, not the route's pre-check, is what makes
-- duplicate submission impossible.

-- ---------------------------------------------------------------------------
-- exam_sessions
-- ---------------------------------------------------------------------------

-- student_id is not a parameter: it is taken from auth.uid() inside the
-- function, so a caller cannot name anyone but themselves however the
-- request is shaped. config/seed/selected_question_ids/expires_at all come
-- from the route's own server-side selection against the server-only bank.
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
begin
  if v_student is null then
    raise exception 'create_exam_session requires an authenticated caller'
      using errcode = 'MM001';
  end if;

  -- MM-AUTH-01, carried forward. 20260724090000 added this condition to the
  -- "exam_sessions: student creates own" insert policy; step 2 drops that
  -- policy along with the grant it depended on, so the check has to live
  -- somewhere that survives. Every real student profile is
  -- parent-provisioned (src/features/auth/provision-child.ts), so
  -- role = 'student' remains the complete set of authorised identities.
  if not exists (
    select 1
    from public.profiles p
    where p.id = v_student
      and p.role = 'student'
  ) then
    raise exception 'only a student may create an exam session'
      using errcode = 'MM002';
  end if;

  insert into public.exam_sessions
    (student_id, config, seed, selected_question_ids, expires_at)
  values (v_student, p_config, p_seed, p_selected_question_ids, p_expires_at)
  returning id into v_session_id;

  return v_session_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- exam_attempts
-- ---------------------------------------------------------------------------

-- p_result is the ExamResult the route computed with buildExamResult() from
-- the session's own stored selected_question_ids. The function cannot
-- verify that arithmetic in SQL, and does not try to; what it enforces is
-- that only this path can write the column at all, which is what makes the
-- route's computation the sole origin of a score.
create or replace function public.record_exam_attempt(
  p_session_id uuid,
  p_responses jsonb,
  p_result jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_student uuid := auth.uid();
  v_expires_at timestamptz;
  v_attempt_id uuid;
begin
  if v_student is null then
    raise exception 'record_exam_attempt requires an authenticated caller'
      using errcode = 'MM001';
  end if;

  -- Ownership, re-derived here rather than taken on trust: this is the
  -- condition the dropped "exam_attempts: student submits own" policy used
  -- to enforce, and the reason a student cannot attach an attempt to
  -- someone else's session (tests/rls/exam-attempts.test.ts R4).
  select s.expires_at into v_expires_at
  from public.exam_sessions s
  where s.id = p_session_id
    and s.student_id = v_student;

  if not found then
    raise exception 'no such exam session for this caller'
      using errcode = 'MM003';
  end if;

  -- expires_at already includes the submit route's grace window (the
  -- session row is created with duration + TIMED_GRACE_SECONDS), so this is
  -- the same deadline the route enforces, not a stricter one — a late
  -- submission inside the grace window still lands, and is recorded as
  -- timer_expired by the route's own clamping.
  if now() > v_expires_at then
    raise exception 'exam session has expired'
      using errcode = 'MM004';
  end if;

  insert into public.exam_attempts (session_id, student_id, responses, result)
  values (p_session_id, v_student, p_responses, p_result)
  returning id into v_attempt_id;

  return v_attempt_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
--
-- Unlike public.apply_stripe_subscription_event (20260723090000), which is
-- service_role-only, these two are meant to be called by the signed-in
-- student through the route handlers — so authenticated keeps EXECUTE and
-- only anon and PUBLIC are stripped. EXECUTE is granted to PUBLIC by
-- default on a new function, and this project's local stack additionally
-- grants it to anon/authenticated/service_role via ALTER DEFAULT
-- PRIVILEGES; revoking `from public` alone does not remove such an explicit
-- per-role grant, so anon is named explicitly (the same finding recorded in
-- that migration).
-- ---------------------------------------------------------------------------

revoke all on function public.create_exam_session(jsonb, text, text[], timestamptz)
  from public, anon;
grant execute on function public.create_exam_session(jsonb, text, text[], timestamptz)
  to authenticated;

revoke all on function public.record_exam_attempt(uuid, jsonb, jsonb)
  from public, anon;
grant execute on function public.record_exam_attempt(uuid, jsonb, jsonb)
  to authenticated;
