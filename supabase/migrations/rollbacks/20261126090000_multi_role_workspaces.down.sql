-- Rollback for 20261126090000_multi_role_workspaces.sql (DEV first; never on production without owner approval).
-- Restores the original profiles.role = 'admin' policies and is_admin(), then drops the new objects.
-- WARNING: dual-role users (profiles.role <> 'admin') lose admin access on rollback by design. Existing admins
-- (profiles.role = 'admin') are unaffected. Admin review decision/approval HISTORY is not touched.
-- The role audit trail is dropped with its table: export public.role_audit_events first if it must be kept.
begin;

drop policy if exists admin_draft_review_decisions_read on public.admin_draft_review_decisions;
create policy admin_draft_review_decisions_read on public.admin_draft_review_decisions
for select to authenticated using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.access_revoked_at is null)
);

drop policy if exists admin_draft_review_decisions_insert on public.admin_draft_review_decisions;
create policy admin_draft_review_decisions_insert on public.admin_draft_review_decisions
for insert to authenticated with check (
  reviewer_id = auth.uid()
  and lower(trim(reviewer_email)) = lower(trim(coalesce(public.authenticated_admin_email(), '')))
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and p.access_revoked_at is null
      and lower(regexp_replace(trim(coalesce(p.display_name, '')), '\s+', ' ', 'g'))
        = lower(regexp_replace(trim(reviewer_name), '\s+', ' ', 'g'))
  )
);

drop policy if exists admin_draft_review_read on public.admin_draft_review_approvals;
create policy admin_draft_review_read on public.admin_draft_review_approvals
for select to authenticated using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.access_revoked_at is null)
);

drop policy if exists admin_draft_review_insert on public.admin_draft_review_approvals;
create policy admin_draft_review_insert on public.admin_draft_review_approvals
for insert to authenticated with check (
  approved_by = auth.uid() and
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.access_revoked_at is null)
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
$$;

drop function if exists public.grant_admin_role(uuid, text, text);
drop function if exists public.revoke_admin_role(uuid, text, text);
drop function if exists public.has_active_admin_role();
drop function if exists public.admin_mfa_satisfied();
drop function if exists public.admin_mfa_required();
drop table if exists public.security_settings;
drop table if exists public.user_roles;
drop table if exists public.role_audit_events;
drop function if exists public.deny_role_audit_mutation();

commit;
