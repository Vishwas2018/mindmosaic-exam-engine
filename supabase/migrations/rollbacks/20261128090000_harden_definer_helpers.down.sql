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

grant execute on function public.has_active_access(uuid) to public, anon, authenticated, service_role;
grant execute on function public.is_student_profile(uuid) to public, anon, authenticated, service_role;
grant execute on function public.session_has_attempt(uuid) to public, anon, authenticated, service_role;

commit;
