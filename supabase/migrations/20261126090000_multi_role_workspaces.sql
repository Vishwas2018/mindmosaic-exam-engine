-- Multi-role workspaces: one login can hold Parent + Admin (single login, workspace switcher).
--
-- Model (additive, backward compatible):
--   * profiles.role is UNCHANGED and remains the user's PRIMARY role. Every existing parent/student/teacher RLS policy,
--     billing rule and parent_children link keeps working exactly as before.
--   * Elevated capability is a separate, auditable entitlement: public.user_roles (role = 'admin').
--   * Entitlements can only be created or revoked by the service role through the functions below. Authenticated users
--     can read their OWN rows and can never insert/update/delete: there is no self-promotion path.
--   * is_admin() now means "holds an active admin entitlement, account not revoked, and (when the platform switch is on)
--     the session is MFA-verified (aal2)". The admin review RLS policies use it instead of profiles.role = 'admin'.
--   * Existing admins (profiles.role = 'admin') are backfilled into user_roles so nothing changes for them.
--   * Student profiles can never be granted an elevated role.
-- Rollback: supabase/migrations/rollbacks/20261126090000_multi_role_workspaces.down.sql

-- ---------------------------------------------------------------------------
-- Entitlements
-- ---------------------------------------------------------------------------
create table public.user_roles (
  user_id    uuid        not null references public.profiles (id) on delete cascade,
  role       text        not null check (role in ('admin')),
  granted_by text        not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by text,
  primary key (user_id, role),
  check (revoked_at is null or revoked_at >= granted_at)
);

alter table public.user_roles enable row level security;
revoke all on public.user_roles from public, anon, authenticated;
grant select on public.user_roles to authenticated;

create policy user_roles_read_own on public.user_roles
  for select to authenticated using (user_id = auth.uid());

-- Append-only audit of every grant / revoke. No FK so history survives profile erasure.
create table public.role_audit_events (
  id         bigint generated always as identity primary key,
  user_id    uuid        not null,
  role       text        not null,
  action     text        not null check (action in ('grant', 'revoke', 'regrant', 'backfill')),
  actor      text        not null,
  reason     text        not null check (length(trim(reason)) >= 5),
  created_at timestamptz not null default now()
);

alter table public.role_audit_events enable row level security;
revoke all on public.role_audit_events from public, anon, authenticated;

create or replace function public.deny_role_audit_mutation() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'Role audit events are append-only' using errcode = 'MM107';
end $$;

create trigger role_audit_events_no_update_delete
  before update or delete on public.role_audit_events
  for each row execute function public.deny_role_audit_mutation();
create trigger role_audit_events_no_truncate
  before truncate on public.role_audit_events
  for each statement execute function public.deny_role_audit_mutation();

-- ---------------------------------------------------------------------------
-- Platform switch: require MFA (aal2) for privileged admin operations. Default OFF so this migration cannot lock
-- anyone out; the owner turns it on after enrolling their authenticator (see docs/security/multi-role).
-- ---------------------------------------------------------------------------
create table public.security_settings (
  key        text primary key,
  bool_value boolean     not null,
  updated_at timestamptz not null default now()
);
alter table public.security_settings enable row level security;
revoke all on public.security_settings from public, anon, authenticated;
insert into public.security_settings (key, bool_value) values ('require_admin_mfa', false);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.admin_mfa_required() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select bool_value from public.security_settings where key = 'require_admin_mfa'), false)
$$;

create or replace function public.admin_mfa_satisfied() returns boolean
language sql stable security definer set search_path = '' as $$
  select not public.admin_mfa_required() or coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
$$;

-- Entitlement only (no MFA): used by the app to decide which workspaces to OFFER.
-- Active when EITHER an unrevoked grant exists, OR (legacy path) the profile itself says admin and no grant row has
-- ever been written for that user. A grant row that has been revoked always denies, so offboarding a backfilled or
-- script-granted admin cannot be undone by the profile column. The legacy path keeps the documented manual promotion
-- (`update profiles set role = 'admin'`, service role only; authenticated users cannot write profiles.role) working.
create or replace function public.has_active_admin_role() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.access_revoked_at is null
      and (
        exists (
          select 1 from public.user_roles ur
          where ur.user_id = p.id and ur.role = 'admin' and ur.revoked_at is null
        )
        or (
          p.role = 'admin'
          and not exists (select 1 from public.user_roles ur where ur.user_id = p.id and ur.role = 'admin')
        )
      )
  )
$$;

-- Privileged capability: entitlement AND (MFA when required). Replaces the profiles.role = 'admin' check.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.has_active_admin_role() and public.admin_mfa_satisfied()
$$;

revoke all on function public.admin_mfa_required(), public.admin_mfa_satisfied(),
  public.has_active_admin_role(), public.is_admin() from public, anon;
grant execute on function public.admin_mfa_required(), public.admin_mfa_satisfied(),
  public.has_active_admin_role(), public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Grant / revoke: service role only. No authenticated or anon execute, so no self-promotion path exists.
-- ---------------------------------------------------------------------------
create or replace function public.grant_admin_role(p_user uuid, p_actor text, p_reason text) returns text
language plpgsql security definer set search_path = '' as $$
declare v_role text; v_existing public.user_roles%rowtype;
begin
  select role into v_role from public.profiles where id = p_user;
  if v_role is null then raise exception 'unknown user' using errcode = 'MM108'; end if;
  if v_role = 'student' then raise exception 'students can never hold an elevated role' using errcode = 'MM108'; end if;
  select * into v_existing from public.user_roles where user_id = p_user and role = 'admin';
  if found and v_existing.revoked_at is null then return 'already-granted'; end if;
  if found then
    update public.user_roles set revoked_at = null, revoked_by = null, granted_at = now(), granted_by = p_actor
      where user_id = p_user and role = 'admin';
    insert into public.role_audit_events (user_id, role, action, actor, reason) values (p_user, 'admin', 'regrant', p_actor, p_reason);
    return 'regranted';
  end if;
  insert into public.user_roles (user_id, role, granted_by) values (p_user, 'admin', p_actor);
  insert into public.role_audit_events (user_id, role, action, actor, reason) values (p_user, 'admin', 'grant', p_actor, p_reason);
  return 'granted';
end $$;

create or replace function public.revoke_admin_role(p_user uuid, p_actor text, p_reason text) returns text
language plpgsql security definer set search_path = '' as $$
begin
  update public.user_roles set revoked_at = now(), revoked_by = p_actor
    where user_id = p_user and role = 'admin' and revoked_at is null;
  if not found then return 'not-active'; end if;
  insert into public.role_audit_events (user_id, role, action, actor, reason) values (p_user, 'admin', 'revoke', p_actor, p_reason);
  return 'revoked';
end $$;

revoke all on function public.grant_admin_role(uuid, text, text), public.revoke_admin_role(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.grant_admin_role(uuid, text, text), public.revoke_admin_role(uuid, text, text) to service_role;

-- ---------------------------------------------------------------------------
-- Backfill: existing admins keep working. Idempotent; revocation of access stays with profiles.access_revoked_at.
-- ---------------------------------------------------------------------------
with inserted as (
  insert into public.user_roles (user_id, role, granted_by)
  select p.id, 'admin', 'migration:20261126090000' from public.profiles p where p.role = 'admin'
  on conflict do nothing
  returning user_id
)
insert into public.role_audit_events (user_id, role, action, actor, reason)
select user_id, 'admin', 'backfill', 'migration:20261126090000', 'existing profiles.role = admin carried into user_roles' from inserted;

-- ---------------------------------------------------------------------------
-- Admin review policies: same rules as before, but the admin test is the entitlement (+ MFA when required).
-- The display-name identity check on decisions is unchanged (still profiles.display_name).
-- ---------------------------------------------------------------------------
drop policy admin_draft_review_decisions_read on public.admin_draft_review_decisions;
create policy admin_draft_review_decisions_read on public.admin_draft_review_decisions
  for select to authenticated using (public.is_admin());

drop policy admin_draft_review_decisions_insert on public.admin_draft_review_decisions;
create policy admin_draft_review_decisions_insert on public.admin_draft_review_decisions
  for insert to authenticated with check (
    reviewer_id = auth.uid()
    and lower(trim(reviewer_email)) = lower(trim(coalesce(public.authenticated_admin_email(), '')))
    and public.is_admin()
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and lower(regexp_replace(trim(coalesce(p.display_name, '')), '\s+', ' ', 'g'))
          = lower(regexp_replace(trim(reviewer_name), '\s+', ' ', 'g'))
    )
  );

drop policy admin_draft_review_read on public.admin_draft_review_approvals;
create policy admin_draft_review_read on public.admin_draft_review_approvals
  for select to authenticated using (public.is_admin());

drop policy admin_draft_review_insert on public.admin_draft_review_approvals;
create policy admin_draft_review_insert on public.admin_draft_review_approvals
  for insert to authenticated with check (approved_by = auth.uid() and public.is_admin());

comment on table public.user_roles is
  'Elevated role entitlements (admin). Service-role writes only; users read their own rows. profiles.role stays the primary role.';
comment on table public.role_audit_events is
  'Append-only audit of elevated role grants/revocations (MM107).';
