-- Gate A item A4, part 1: erasure requests, and the reversible revocation a
-- request applies immediately (spec §17.5 steps 1-2; ADR-012 §4-5).
--
-- WHERE THIS PICKS UP. `erase_student` (20260815110000) is complete and
-- irreversible: one transaction, both storage models, the profile and the auth
-- identity. It was left executable by nobody, on purpose, because §17.5 step 1's
-- requester verification did not exist yet — wiring a caller before the
-- verification existed would have been the wrong half to build first. ADR-012
-- §4 records the verification model this project is adopting for its MVP:
-- an administrator, verifying a parent/guardian out of band, against a ticket
-- reference. THIS IS NOT PARENT SELF-SERVICE. There is no policy or function
-- here a signed-in parent can reach; every path in this file is is_admin()-gated.
--
-- THE 30-DAY WINDOW (ADR-012 §5). Recording a request does not delete
-- anything. It revokes the child's access immediately and schedules the
-- irreversible erasure for `requested_at + 30 days`, matching §17.5's own
-- "verified account closure ... within 30 days after any documented recovery
-- grace period" — the window IS that documented grace period, not an extra
-- delay in front of one. An admin may cancel within it, which restores access.
-- `erase_student` itself is unchanged and is not called from here at all —
-- that is the processor's job, in the next migration, once a request is due.
--
-- THE REVOCATION MECHANISM, exactly, and why it is three actions rather than
-- one (ADR-012 §5's table, restated where the code that does it lives):
--
--   1. `profiles.access_revoked_at` set. Checked at `requireRole`
--      (src/features/auth/require-role.ts), the one gate every `/{role}` route
--      runs through — so this is the application boundary, not a policy edited
--      onto every table the child could otherwise reach.
--   2. `auth.users.banned_until` set to the execute-after date. GoTrue's own
--      gate: no sign-in, no token refresh, independent of anything this
--      repository's code does or fails to do.
--   3. `auth.sessions` / `auth.refresh_tokens` rows deleted. Ends whatever
--      session the child already had. Not restored by a cancel, and does not
--      need to be — restoring the ABILITY to sign in is what a cancel gives
--      back; a session is transient state, not the child's data.
--
-- All three are reversible: cancel sets (1) and (2) back to null and lets (3)
-- happen again naturally on the next sign-in. None of the three touches a row
-- of assessment data — for the length of the window the record is intact and
-- the only thing that changed is who may reach it.
--
-- WHAT THIS DOES NOT CLOSE, named rather than implied. §17.5's schedule names
-- telemetry, logs, caches, exports, job payloads and backups alongside a
-- verified closure request. This migration and its processor close the request
-- lifecycle for the two exam-data models `erase_student` already reaches.
-- Telemetry, caches and exports do not exist as built subsystems in this
-- repository yet (ADR-012 §6); logs and backup aging are platform settings this
-- migration cannot reach into; legal hold has no mechanism anywhere in the
-- product (ADR-012 §8). Recorded as tracked follow-ups rather than claimed
-- closed — a schedule the system does not enforce is a commitment, not a
-- control, and calling it one would be the mistake ADR-006's own verification
-- table was rewritten to stop making.
--
-- ERROR CODES, continuing the series:
--
--   MM222  caller is not an admin
--   MM223  no ticket reference given
--   MM224  no such student
--   MM225  the student already has a pending erasure request
--   MM226  no such pending erasure request for that id
--   MM227  the erasure window has already closed — too late to cancel

-- ---------------------------------------------------------------------------
-- profiles.access_revoked_at — the reversible flag the auth boundary checks
-- ---------------------------------------------------------------------------
-- Additive column. No new grant: `authenticated`'s UPDATE privilege on
-- `profiles` is column-level (20260718090000: `grant update (display_name,
-- year_level)`), so a plain `add column` does not hand a learner write access
-- to their own flag. Only `request_student_erasure` and
-- `cancel_student_erasure` below ever write it.
alter table public.profiles
  add column access_revoked_at timestamptz;

comment on column public.profiles.access_revoked_at is
  'Set the moment an admin-processed erasure request is recorded against this student, checked at requireRole (the auth boundary every /{role} route runs through). Reversible: a cancel within the 30-day window sets it back to null. Never set for any role other than the student named in an erasure_requests row.';

-- ---------------------------------------------------------------------------
-- erasure_requests — one row per request, its own minimal audit
-- ---------------------------------------------------------------------------
-- `student_id` carries NO foreign key, deliberately, matching `erasure_audit
-- .subject_id` (20260815110000) for the same reason: the row must survive the
-- moment `erase_student` deletes the child's own `profiles` row at execution,
-- and a `references profiles(id)` with the default NO ACTION would make that
-- delete fail with this row still pointing at it — the exact ON DELETE RESTRICT
-- trap ADR-005 §3 already produced once for the backfill's own edges.
--
-- `requested_by` / `cancelled_by` DO reference `profiles(id)`, ON DELETE
-- RESTRICT: these name the ADMIN, whose profile `erase_student` never touches,
-- so there is no equivalent trap, and an admin's account should not be able to
-- vanish while erasure requests are attributed to it.
--
-- THIS TABLE IS ITS OWN AUDIT for the request and cancel events — who
-- requested, when, under what ticket, who cancelled, when the window closes —
-- with no name, email, response, score or config anywhere on the row. A
-- separate events table would duplicate exactly this. The 'executed' event's
-- audit is `erasure_audit`, which already exists and already carries the
-- deletion counts; this row's own `executed_at` timestamp is what links the
-- two without a foreign key, since by the time execution happens the row this
-- one would reference is target information that erase_student is about to
-- remove.
create table public.erasure_requests (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid        not null,
  ticket_ref    text        not null,
  requested_by  uuid        not null references public.profiles (id) on delete restrict,
  requested_at  timestamptz not null default now(),
  execute_after timestamptz not null,
  status        text        not null default 'pending',
  cancelled_at  timestamptz,
  cancelled_by  uuid references public.profiles (id) on delete restrict,
  executed_at   timestamptz,

  constraint erasure_requests_status_known
    check (status in ('pending', 'cancelled', 'executed')),
  constraint erasure_requests_ticket_ref_present
    check (length(trim(ticket_ref)) > 0 and length(ticket_ref) <= 200),
  constraint erasure_requests_execute_after_future
    check (execute_after > requested_at),
  constraint erasure_requests_cancelled_fields_consistent
    check ((status = 'cancelled') = (cancelled_at is not null)),
  constraint erasure_requests_executed_fields_consistent
    check ((status = 'executed') = (executed_at is not null))
);

-- At most one live request per student. Without this, a second admin acting on
-- the same ticket (or a different one) could schedule a duplicate, and cancel
-- would then have to decide which of two pending requests it meant.
create unique index erasure_requests_one_pending_per_student
  on public.erasure_requests (student_id)
  where status = 'pending';

-- The processor's own query shape: pending rows whose window has closed,
-- oldest first.
create index erasure_requests_due_idx
  on public.erasure_requests (execute_after)
  where status = 'pending';

alter table public.erasure_requests enable row level security;
revoke all on public.erasure_requests from anon, authenticated;

-- Admin-readable, so an operations screen can list requests without a new
-- function for every view of them. No insert/update/delete policy: every
-- write goes through the two functions below, which is where max_marks-style
-- reasoning applies again — "this request is real and this admin made it" is a
-- fact about how the row was produced, not a predicate a policy can check.
grant select on public.erasure_requests to authenticated;

create policy "erasure_requests: admin reads all" on public.erasure_requests
  for select to authenticated
  using (public.is_admin());

comment on table public.erasure_requests is
  'One row per erasure request: the ticket, who requested and cancelled it, when the window opened and closes. Admin-readable; every write goes through request_student_erasure/cancel_student_erasure/process_due_erasures. No child-data payload — this table plus erasure_audit is the minimal audit §17.5 step 7 requires (ADR-012 §3).';

-- ---------------------------------------------------------------------------
-- request_student_erasure — records the request, revokes access now
-- ---------------------------------------------------------------------------
create or replace function public.request_student_erasure(
  p_student uuid,
  p_ticket_ref text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_admin        uuid := auth.uid();
  v_request_id   uuid;
  v_execute_after timestamptz;
begin
  if v_admin is null or not public.is_admin() then
    raise exception 'request_student_erasure requires an admin caller'
      using errcode = 'MM222';
  end if;

  if p_ticket_ref is null or length(trim(p_ticket_ref)) = 0 then
    raise exception 'a ticket reference is required to request an erasure'
      using errcode = 'MM223';
  end if;

  /* Locked, so two admins racing on the same student cannot both pass the
     "no pending request" check below before either inserts. `role = 'student'`
     because erasure is a child-data workflow; an admin naming a teacher or
     parent account here has named the wrong table for what they mean. */
  perform 1
  from public.profiles
  where id = p_student and role = 'student'
  for update;

  if not found then
    raise exception 'no such student %', p_student
      using errcode = 'MM224';
  end if;

  if exists (
    select 1 from public.erasure_requests
    where student_id = p_student and status = 'pending'
  ) then
    raise exception 'student % already has a pending erasure request', p_student
      using errcode = 'MM225';
  end if;

  v_execute_after := now() + interval '30 days';

  insert into public.erasure_requests (student_id, ticket_ref, requested_by, execute_after)
  values (p_student, p_ticket_ref, v_admin, v_execute_after)
  returning id into v_request_id;

  -- THE REVOCATION. See the header for what each of the three does and why.
  update public.profiles set access_revoked_at = now() where id = p_student;
  update auth.users set banned_until = v_execute_after where id = p_student;
  delete from auth.sessions where user_id = p_student;
  delete from auth.refresh_tokens where user_id = p_student::text;

  return jsonb_build_object(
    'requestId', v_request_id,
    'studentId', p_student,
    'executeAfter', v_execute_after
  );
end;
$$;

revoke all on function public.request_student_erasure(uuid, text) from public, anon;
grant execute on function public.request_student_erasure(uuid, text) to authenticated;

comment on function public.request_student_erasure(uuid, text) is
  'Records an erasure request and revokes the student''s access immediately (spec §17.5 steps 1-2; ADR-012 §4-5). is_admin() gated; the requester is auth.uid() and is not a parameter. Deletes nothing — schedules erase_student for execute_after (requested_at + 30 days), run by process_due_erasures.';

-- ---------------------------------------------------------------------------
-- cancel_student_erasure — restores access, only inside the window
-- ---------------------------------------------------------------------------
create or replace function public.cancel_student_erasure(
  p_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_admin   uuid := auth.uid();
  v_request public.erasure_requests%rowtype;
begin
  if v_admin is null or not public.is_admin() then
    raise exception 'cancel_student_erasure requires an admin caller'
      using errcode = 'MM222';
  end if;

  select * into v_request
  from public.erasure_requests
  where id = p_request_id and status = 'pending'
  for update;

  if not found then
    raise exception 'no pending erasure request %', p_request_id
      using errcode = 'MM226';
  end if;

  /* The window is what makes this reversible at all. Past execute_after the
     processor may already be running against this exact row (it also takes
     `for update`, so the two cannot interleave); refusing here rather than
     racing it is what keeps "cancelled" and "executed" from both being true of
     the same request. */
  if now() >= v_request.execute_after then
    raise exception 'the erasure window for request % has already closed', p_request_id
      using errcode = 'MM227';
  end if;

  update public.erasure_requests
  set status = 'cancelled', cancelled_at = now(), cancelled_by = v_admin
  where id = p_request_id;

  -- THE REVERSE of request_student_erasure's first two steps. The third —
  -- the sessions that existed at request time — is not restored, and does not
  -- need to be: cancel gives back the ability to sign in, and the student's
  -- next sign-in creates a session the ordinary way.
  update public.profiles set access_revoked_at = null where id = v_request.student_id;
  update auth.users set banned_until = null where id = v_request.student_id;

  return jsonb_build_object(
    'requestId', p_request_id,
    'studentId', v_request.student_id,
    'status', 'cancelled'
  );
end;
$$;

revoke all on function public.cancel_student_erasure(uuid) from public, anon;
grant execute on function public.cancel_student_erasure(uuid) to authenticated;

comment on function public.cancel_student_erasure(uuid) is
  'Cancels a pending erasure request and restores the student''s access, only while the request is pending and before execute_after (spec §17.5; ADR-012 §5). is_admin() gated. After the window closes the request can no longer be cancelled through this path — see process_due_erasures.';
