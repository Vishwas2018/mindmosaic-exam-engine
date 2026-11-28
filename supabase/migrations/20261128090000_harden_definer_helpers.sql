-- Security hardening: caller-relationship checks + closed EXECUTE grants for three SECURITY DEFINER helpers.
--
-- Finding (DEV advisor review, 2026-11-28): has_active_access(uuid), is_student_profile(uuid) and
-- session_has_attempt(uuid) answer questions about an ARBITRARY identifier supplied by the caller, run as the table
-- owner (RLS bypassed), and were executable by PUBLIC / anon. Any client could therefore ask "does parent X have an
-- active subscription", "is profile Y a student" or "does session Z have a submitted attempt" for ids that are not
-- theirs. The answers are one bit each and the ids are random UUIDs, so this is an oracle / enumeration risk, not a
-- data dump, but it crosses the account boundary and needs no authentication.
--
-- Fix, with NO signature change and NO behaviour change for any legitimate caller:
--   * has_active_access(p)      -> true only for the caller's own parent id, a parent of the caller (student asking about
--                                  the parent who pays for them, the one production caller), or the service role.
--   * is_student_profile(t)     -> NO LONGER callable by clients at all (service role only). It was a student-status lookup
--                                  for arbitrary ids, open to any teacher. Its one legitimate use (class enrolment must target a
--                                  student) moves into a BEFORE INSERT trigger that clients cannot call or read the result of.
--   * session_has_attempt(s)    -> only sees attempts of sessions the caller owns (every policy that uses it already
--                                  requires session ownership); false for foreign sessions.
--   * EXECUTE revoked from PUBLIC and anon; granted to authenticated (RLS policies evaluate these as the caller) and
--     service_role.
-- Rollback: supabase/migrations/rollbacks/20261128090000_harden_definer_helpers.down.sql

begin;

create or replace function public.has_active_access(p uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.subscriptions s
    where s.parent_id = p
      and (
        (s.status = 'trialing' and s.trial_end > now())
        or (s.status in ('active', 'past_due') and s.current_period_end > now())
      )
      and (
        auth.role() = 'service_role'
        or p = auth.uid()
        or exists (
          select 1 from public.parent_children pc
          where pc.parent_id = p and pc.child_id = auth.uid()
        )
      )
  );
$$;

create or replace function public.is_student_profile(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = target
      and p.role = 'student'
      and (auth.role() = 'service_role' or public.caller_is_teacher())
  );
$$;

-- Enrolment guard. Trigger functions are not RPC-callable and return nothing to the caller; a non-student target is refused
-- with the SAME error (42501, "row-level security") the policy raises for a class the teacher does not own, so a teacher
-- learns nothing about an arbitrary id beyond whether the (otherwise legitimate) enrolment was refused.
create or replace function public.enforce_class_student_is_student()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (select 1 from public.profiles p where p.id = new.student_id and p.role = 'student') then
    raise exception 'new row violates row-level security policy for table "class_students"' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists class_students_require_student on public.class_students;
create trigger class_students_require_student
  before insert or update of student_id on public.class_students
  for each row execute function public.enforce_class_student_is_student();

revoke all on function public.enforce_class_student_is_student() from public, anon, authenticated;

drop policy "class_students: teacher adds to own class" on public.class_students;
create policy "class_students: teacher adds to own class" on public.class_students
  for insert to authenticated
  with check (
    public.teaches_class(class_id)
    and public.caller_is_teacher()
  );

-- exam_responses: session ownership is now explicit in BOTH policies (the UPDATE pair previously relied on row ownership
-- alone, so an own row could be re-pointed at another student's session id). session_has_attempt() only sees the caller's
-- own sessions, so "not session_has_attempt(x)" is meaningful ONLY together with "x is my session": every policy below
-- states both.
drop policy "exam_responses: student inserts own" on public.exam_responses;
create policy "exam_responses: student inserts own" on public.exam_responses
  for insert to authenticated
  with check (
    student_id = auth.uid()
    and exists (select 1 from public.exam_sessions s where s.id = session_id and s.student_id = auth.uid())
    and not public.session_has_attempt(session_id)
  );

drop policy "exam_responses: student updates own" on public.exam_responses;
create policy "exam_responses: student updates own" on public.exam_responses
  for update to authenticated
  using (
    student_id = auth.uid()
    and exists (select 1 from public.exam_sessions s where s.id = session_id and s.student_id = auth.uid())
    and not public.session_has_attempt(session_id)
  )
  with check (
    student_id = auth.uid()
    and exists (select 1 from public.exam_sessions s where s.id = session_id and s.student_id = auth.uid())
    and not public.session_has_attempt(session_id)
  );

create or replace function public.session_has_attempt(session uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.exam_attempts a
    join public.exam_sessions s on s.id = a.session_id
    where a.session_id = session
      and (auth.role() = 'service_role' or s.student_id = auth.uid())
  );
$$;

revoke all on function public.has_active_access(uuid) from public, anon;
revoke all on function public.is_student_profile(uuid) from public, anon;
revoke all on function public.session_has_attempt(uuid) from public, anon;
grant execute on function public.has_active_access(uuid) to authenticated, service_role;
revoke all on function public.is_student_profile(uuid) from authenticated;
grant execute on function public.is_student_profile(uuid) to service_role;
grant execute on function public.session_has_attempt(uuid) to authenticated, service_role;

commit;
