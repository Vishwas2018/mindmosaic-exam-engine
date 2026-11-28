-- P1 assessment-integrity fix, part 2 of 2 (BREAKING for the previous application version).
-- ADR-005 interim. Apply ONLY after the application that calls create_exam_session_for /
-- record_exam_attempt_for (via EXAM_WRITE_DB_URL) is deployed and verified; see the PR's rollout sequence.
--
-- Removes the direct client path: after this, no signed-in student, anonymous caller or PUBLIC can execute
-- public.create_exam_session or public.record_exam_attempt, so neither a forged paper nor a forged result can
-- be created over PostgREST. The route handlers are unaffected: they call the _for functions as the dedicated
-- writer role (20261031090000).
--
-- OVERLOADS. The revoke is applied to every function in `public` with either name, found in the catalogue,
-- rather than to one hard-coded signature, so an overload added by any earlier or later migration cannot be
-- left executable.
--
-- DEFAULT PRIVILEGES. Not altered here: changing `postgres`'s default privileges for functions in `public` would
-- alter the grants of every future function in the project, and many migrations rely on the current defaults.
-- The standing control is the catalogue test in tests/rls/exam-write-lockdown.test.ts, which fails if any
-- function of these names (or their _for replacements) is ever executable by anon, authenticated or PUBLIC.
--
-- WHAT IS DELIBERATELY LEFT. service_role keeps EXECUTE on the legacy functions: it already bypasses RLS and has
-- full table access, and both functions take their student from auth.uid(), which is null for it, so a call
-- raises MM001 and writes nothing. The functions are not dropped: ADR-005 §8 keeps them until the legacy drain,
-- and a drop would need the drain condition this migration does not claim to check.
--
-- ROLLBACK. Forward-only. In an emergency the previous behaviour is restored by re-granting EXECUTE to
-- `authenticated` on both functions, which re-opens the vulnerability; prefer rolling the application back and
-- leaving this migration applied only if the _for path itself is the failing component.

do $$
declare
  fn record;
begin
  -- Refuse to run without the replacements: revoking the only working write path would stop every exam.
  if to_regprocedure('public.create_exam_session_for(uuid, jsonb, text, text[], timestamptz)') is null
     or to_regprocedure('public.record_exam_attempt_for(uuid, uuid, jsonb, jsonb)') is null then
    raise exception 'apply 20261031090000 first: the server-only write functions do not exist';
  end if;

  for fn in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('create_exam_session', 'record_exam_attempt')
  loop
    execute format('revoke all on function %s from public, anon, authenticated', fn.signature);
  end loop;

  -- Assert the outcome rather than assume it.
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('create_exam_session', 'record_exam_attempt')
      and (has_function_privilege('authenticated', p.oid, 'EXECUTE')
        or has_function_privilege('anon', p.oid, 'EXECUTE'))
  ) then
    raise exception 'legacy exam write function is still executable by a client role';
  end if;
end;
$$;
