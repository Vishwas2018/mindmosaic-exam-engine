-- Gate A item A4, part 2: running the erasures that have come due (spec §17.5;
-- ADR-012 §4-5).
--
-- `erasure_requests` (20260817090000) schedules; this migration is what
-- actually calls `erase_student` once a request's window has closed.
--
-- TWO FUNCTIONS, ONE WORKER, FOR THE SAME REASON `erase_student` ITSELF IS
-- UNGRANTABLE. `process_due_erasures` does the work and is granted to NOBODY —
-- not `authenticated`, not `anon` — exactly the posture `erase_student` has
-- had since 20260815110000. `admin_trigger_due_erasures` is a one-line
-- `is_admin()`-gated wrapper granted to `authenticated`, which is the actual
-- admin-triggered endpoint a Next.js route calls.
--
-- The alternative — one function checking "is_admin() OR looks like a
-- background job" — was tried and rejected. There is no reliable way to
-- express "looks like a background job" from inside a SECURITY DEFINER
-- function: `current_user` becomes the function's OWNER the instant execution
-- enters the function, whoever called it, so it cannot distinguish a caller.
-- `session_user` reflects the connection's actual login role and survives
-- SECURITY DEFINER — but Supabase's own connection pooling authenticates once
-- as a fixed role and reaches `authenticated`/`anon` by `SET ROLE` per
-- request, so `session_user` may not vary between an application call and a
-- direct one either, depending on the pooler. Relying on it would be relying
-- on an implementation detail of infrastructure this repository does not
-- control. `tests/rls/db.ts`'s own harness makes the failure concrete: every
-- test connects once as `postgres` and fakes role-switching with `SET LOCAL
-- ROLE`, so `session_user` is `postgres` for every call regardless of which
-- actor the test means to be — a real non-admin refusal case that then could
-- not be written.
--
-- Splitting the authorization onto GRANTs instead needs no runtime
-- introspection at all. `process_due_erasures` is reached by exactly two
-- routes, both structural: the wrapper below (ownership: `admin_trigger_
-- due_erasures` is `SECURITY DEFINER` and its owner is the same role that
-- owns `process_due_erasures`, so ownership grants implicit EXECUTE with no
-- GRANT statement anywhere), and a scheduled `cron.schedule` call, which
-- pg_cron runs as the role that registered the job — the migration-applying
-- role, which is also the owner. Two owner-reachable callers, zero grants,
-- and a boundary that is provable by reading the GRANT/REVOKE statements
-- rather than by reasoning about which GUC survives which context switch.
--
-- IDEMPOTENT BY CONSTRUCTION. Each run selects only rows that are still
-- `status = 'pending'` and past `execute_after`; the moment a row is marked
-- `executed` it drops out of that set. Running the function again when
-- nothing is due processes zero rows and changes nothing — which is what
-- "safe to run repeatedly" has to mean for something invoked on a schedule.
--
-- SCHEDULING: pg_cron where the database can install it, an admin-triggered
-- endpoint always. The migration attempts to enable pg_cron and schedule an
-- hourly run against `process_due_erasures` directly (the ungranted worker,
-- reached the same way the wrapper reaches it — by ownership); on a host
-- where the extension cannot be created (a managed tier that reserves it for
-- the dashboard, a CI database with a narrower role) the attempt is caught
-- and logged rather than failing the migration, and `admin_trigger_due_
-- erasures` is what remains. `cron.schedule` upserts by job name, so
-- re-running this migration does not create a second job.
--
-- ERROR CODES, continuing the series:
--
--   MM228  caller is not an admin (admin_trigger_due_erasures)

-- ---------------------------------------------------------------------------
-- process_due_erasures — the worker. Granted to nobody, exactly like erase_student.
-- ---------------------------------------------------------------------------
create or replace function public.process_due_erasures()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_processed integer := 0;
  v_row       record;
begin
  /* `for update skip locked`: a concurrent call (the admin wrapper landing
     mid-hour, next to the scheduled run) takes disjoint rows rather than
     blocking on or double-processing the same one. Ordered oldest-due first
     so a backlog drains in request order rather than an arbitrary one. */
  for v_row in
    select id, student_id, ticket_ref
    from public.erasure_requests
    where status = 'pending' and execute_after <= now()
    order by execute_after
    for update skip locked
  loop
    /* THE ONLY CALL SITE. erase_student is reached by ownership, exactly as
       this function itself is (see the header). Everything erase_student does
       — both models, one transaction, the erasure_audit row — is unchanged
       from 20260815110000. */
    perform public.erase_student(v_row.student_id, v_row.ticket_ref);

    update public.erasure_requests
    set status = 'executed', executed_at = now()
    where id = v_row.id;

    v_processed := v_processed + 1;
  end loop;

  return jsonb_build_object('processed', v_processed, 'ranAt', now());
end;
$$;

-- No grant to anyone, including authenticated: this is the boundary. Reached
-- only by admin_trigger_due_erasures (ownership) and by the scheduled cron
-- job (also ownership, once registered).
revoke all on function public.process_due_erasures() from public, anon, authenticated;

comment on function public.process_due_erasures() is
  'Runs erase_student for every erasure_requests row past its execute_after (spec §17.5; ADR-012 §4-5). Idempotent: only pending, due rows are selected, so a repeat run with nothing due processes zero. Granted to nobody — reached only by admin_trigger_due_erasures and by the scheduled cron job, both through ownership rather than a grant, exactly as erase_student is reached only from here.';

-- ---------------------------------------------------------------------------
-- admin_trigger_due_erasures — the admin-triggered endpoint
-- ---------------------------------------------------------------------------
-- The whole function is the gate. It exists so a Next.js admin route can
-- invoke the worker through the caller's own authenticated session rather
-- than needing a service-role credential for something this narrow.
create or replace function public.admin_trigger_due_erasures()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'admin_trigger_due_erasures requires an admin caller'
      using errcode = 'MM228';
  end if;

  return public.process_due_erasures();
end;
$$;

revoke all on function public.admin_trigger_due_erasures() from public, anon;
grant execute on function public.admin_trigger_due_erasures() to authenticated;

comment on function public.admin_trigger_due_erasures() is
  'The admin-triggered path to process_due_erasures (spec §17.5; ADR-012 §4-5). is_admin() gated, granted to authenticated. Exists so an admin console can run the processor on demand without a service-role credential; the scheduled path (pg_cron, below) calls process_due_erasures directly.';

-- ---------------------------------------------------------------------------
-- Scheduling: pg_cron if this database can install it
-- ---------------------------------------------------------------------------
-- Wrapped so a host that refuses extension creation does not fail the
-- migration. The admin-triggered path above works with or without this block
-- succeeding.
do $$
begin
  create extension if not exists pg_cron;
exception
  when insufficient_privilege or feature_not_supported then
    raise notice 'pg_cron could not be installed in this environment (%); process_due_erasures must be run through admin_trigger_due_erasures instead.', sqlerrm;
end
$$;

-- `cron.schedule` upserts by job name (pg_cron >= 1.4), so re-applying this
-- migration updates the existing job's schedule/command rather than
-- duplicating it. Hourly: a 30-day window does not need finer granularity,
-- and it keeps a due request from waiting the better part of a day past its
-- own deadline. Calls the WORKER directly, not the admin wrapper — the
-- scheduled job has no admin session to satisfy is_admin() with, and does not
-- need one: it reaches the worker by the same ownership the wrapper does.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'process-due-erasures',
      '0 * * * *',
      $cron$select public.process_due_erasures()$cron$
    );
  end if;
end
$$;
