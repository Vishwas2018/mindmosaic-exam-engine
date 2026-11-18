-- P1 assessment-integrity fix, part 1 of 2 (ADDITIVE; safe to apply before the application deploy).
-- ADR-005 interim; spec v1.2 §9.3.1 pattern (dedicated least-privilege role, not service_role).
--
-- THE DEFECT. public.create_exam_session and public.record_exam_attempt are SECURITY DEFINER and were
-- granted to `authenticated` (20260811090000) so the route handlers could call them with the learner's own
-- JWT. PostgREST exposes every function granted to `authenticated`, so any signed-in student could call them
-- directly: create_exam_session accepts a caller-chosen question list and config (a one-question "full NAPLAN
-- paper"; even non-existent question ids), and record_exam_attempt stores a caller-chosen `p_result` (a forged
-- 100%). The route computes the score; nothing forced the caller to be the route. 20260811090000's own comment
-- says the route is "the only origin a `result` can have" -- true of the route, not of the function behind it.
--
-- THE FIX, IN TWO STEPS. This migration adds the replacement write path. 20261031090100 then removes the
-- client path. They are separate files so the application can be deployed between them: the application that
-- calls the old functions keeps working until the second file is applied, and the application that calls the
-- new ones keeps working because the first file already exists. Applying only this file changes no behaviour.
--
-- THE REPLACEMENT. create_exam_session_for / record_exam_attempt_for take the student id as an ARGUMENT, because
-- their only caller is the server, which has already authenticated the user (supabase.auth.getUser(), with the
-- archived-account denial) and takes the id from that verified identity, never from the request body. They keep
-- every check the originals had: student role gate (MM002), session ownership (MM003), expiry (MM004), and the
-- unique-violation on exam_attempts.session_id that the route maps to an idempotent 409. Nothing about session
-- selection, scoring, timing or duplicate protection moves into the database.
--
-- WHO MAY CALL THEM. One role: mindmosaic_exam_writer. Not service_role, for the reason 20260812110000 gives
-- for the scoring role: service_role bypasses RLS on every table, so a leaked credential would expose the whole
-- database, whereas this role's entire privilege set is EXECUTE on these two functions (asserted by
-- tests/rls/exam-write-lockdown.test.ts, not merely described here). It has no table privilege of any kind.
--
-- DEFAULT PRIVILEGES. This project's `postgres` role has ALTER DEFAULT PRIVILEGES that grant EXECUTE on every
-- new function in `public` to anon, authenticated and service_role, and PostgreSQL grants EXECUTE to PUBLIC by
-- default. `revoke ... from public` alone removes none of the explicit per-role grants, so each role is named.
-- service_role is revoked too: it needs none of this, and "executable by the writer role only" is the
-- property the tests assert. (service_role keeps full table access through BYPASSRLS regardless.)
--
-- LOGIN. The role is created with LOGIN and no password, deliberately (a migration is committed; a credential
-- must not be). Set the password out of band: `npm run exam-writer:bootstrap` locally and in CI; a deploy step
-- that runs `alter role mindmosaic_exam_writer password <secret>` hosted. EXAM_WRITE_DB_URL points at it.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'mindmosaic_exam_writer') then
    create role mindmosaic_exam_writer
      with login nosuperuser nocreatedb nocreaterole noinherit nobypassrls noreplication;
  else
    alter role mindmosaic_exam_writer
      with login nosuperuser nocreatedb nocreaterole noinherit nobypassrls noreplication;
  end if;
end;
$$;

-- A runaway statement on a serverless request path should not hold a connection; these two writes are
-- single-row inserts.
alter role mindmosaic_exam_writer set statement_timeout = '10s';

-- Needed to resolve public.<function>; grants nothing on any object inside the schema.
grant usage on schema public to mindmosaic_exam_writer;

create or replace function public.create_exam_session_for(
  p_student_id uuid,
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
  v_session_id uuid;
  v_mode text;
begin
  if p_student_id is null then
    raise exception 'create_exam_session_for requires a student id'
      using errcode = 'MM001';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = p_student_id
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
  values (p_student_id, p_config, p_seed, p_selected_question_ids, p_expires_at, v_mode)
  returning id into v_session_id;

  return v_session_id;
end;
$$;

create or replace function public.record_exam_attempt_for(
  p_student_id uuid,
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
  v_expires_at timestamptz;
  v_attempt_id uuid;
begin
  if p_student_id is null then
    raise exception 'record_exam_attempt_for requires a student id'
      using errcode = 'MM001';
  end if;

  -- Ownership, re-derived here rather than taken on trust (the same condition the original enforced).
  select s.expires_at into v_expires_at
  from public.exam_sessions s
  where s.id = p_session_id
    and s.student_id = p_student_id;

  if not found then
    raise exception 'no such exam session for this student'
      using errcode = 'MM003';
  end if;

  -- expires_at already includes the submit route's grace window, so this is the same deadline the route
  -- enforces. A late submission inside the grace window still lands and is recorded as timer_expired by the
  -- route's own clamping.
  if now() > v_expires_at then
    raise exception 'exam session has expired'
      using errcode = 'MM004';
  end if;

  insert into public.exam_attempts (session_id, student_id, responses, result)
  values (p_session_id, p_student_id, p_responses, p_result)
  returning id into v_attempt_id;

  return v_attempt_id;
end;
$$;

revoke all on function public.create_exam_session_for(uuid, jsonb, text, text[], timestamptz)
  from public, anon, authenticated, service_role;
grant execute on function public.create_exam_session_for(uuid, jsonb, text, text[], timestamptz)
  to mindmosaic_exam_writer;

revoke all on function public.record_exam_attempt_for(uuid, uuid, jsonb, jsonb)
  from public, anon, authenticated, service_role;
grant execute on function public.record_exam_attempt_for(uuid, uuid, jsonb, jsonb)
  to mindmosaic_exam_writer;
