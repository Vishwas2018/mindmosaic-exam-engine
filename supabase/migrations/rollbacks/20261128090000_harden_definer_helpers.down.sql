-- Rollback for 20261128090000_harden_definer_helpers.sql
-- Restores the previous bodies and the previous (PUBLIC-executable) grants. Idempotent. Run ONLY with owner approval:
-- it re-opens the cross-account yes/no oracle the migration closed.

begin;

create or replace function public.has_active_access(p uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.subscriptions s
    where s.parent_id = p
      and (
        (s.status = 'trialing' and s.trial_end > now())
        or (s.status in ('active', 'past_due') and s.current_period_end > now())
      )
  );
$$;

create or replace function public.is_student_profile(target uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.profiles p where p.id = target and p.role = 'student');
$$;

create or replace function public.session_has_attempt(session uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.exam_attempts a where a.session_id = session);
$$;

-- Restore the pre-hardening policies exactly as 20260811092000 / 20260811094000 defined them.
drop trigger if exists class_students_require_student on public.class_students;
drop function if exists public.enforce_class_student_is_student();

drop policy if exists "class_students: teacher adds to own class" on public.class_students;
create policy "class_students: teacher adds to own class" on public.class_students
  for insert to authenticated
  with check (
    public.teaches_class(class_id)
    and public.caller_is_teacher()
    and public.is_student_profile(student_id)
  );

drop policy if exists "exam_responses: student inserts own" on public.exam_responses;
create policy "exam_responses: student inserts own" on public.exam_responses
  for insert to authenticated
  with check (
    student_id = auth.uid()
    and exists (select 1 from public.exam_sessions s where s.id = session_id and s.student_id = auth.uid())
    and not public.session_has_attempt(session_id)
  );

drop policy if exists "exam_responses: student updates own" on public.exam_responses;
create policy "exam_responses: student updates own" on public.exam_responses
  for update to authenticated
  using (student_id = auth.uid() and not public.session_has_attempt(session_id))
  with check (student_id = auth.uid() and not public.session_has_attempt(session_id));

grant execute on function public.has_active_access(uuid) to public, anon, authenticated, service_role;
grant execute on function public.is_student_profile(uuid) to public, anon, authenticated, service_role;
grant execute on function public.session_has_attempt(uuid) to public, anon, authenticated, service_role;

commit;
