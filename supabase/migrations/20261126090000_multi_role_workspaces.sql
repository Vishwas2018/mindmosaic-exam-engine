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
--   * Existing admins (profiles.role = 'admin') are backfilled into user_roles (the migration aborts if any is missed).
--     After the backfill the entitlement is the ONLY source of admin power: a profile that merely says 'admin' has none.
--     Setting profiles.role to 'admin' (service role / DB owner only) is still possible, but a trigger writes the
--     entitlement and its audit row, so there is no unaudited promotion path. Demoting the profile revokes it.
--   * Every admin capability (admin review RLS, aggregate views, content-factory owner approval) calls is_admin(), so a
--     revoked grant removes all of them at once and the MFA switch applies to all of them.
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
-- "if not exists": the rollback deliberately KEEPS this table, so a re-apply must adopt it, not fail.
create table if not exists public.role_audit_events (
  id         bigint generated always as identity primary key,
  user_id    uuid        not null,
  role       text        not null,
  action     text        not null check (action in ('grant', 'revoke', 'regrant', 'backfill', 'rollback')),
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

drop trigger if exists role_audit_events_no_update_delete on public.role_audit_events;
drop trigger if exists role_audit_events_no_truncate on public.role_audit_events;
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
create table if not exists public.security_settings (
  key        text primary key,
  bool_value boolean     not null,
  updated_at timestamptz not null default now()
);
alter table public.security_settings enable row level security;
revoke all on public.security_settings from public, anon, authenticated;
insert into public.security_settings (key, bool_value) values ('require_admin_mfa', false)
  on conflict (key) do nothing;

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
-- Strict: active ONLY on an unrevoked user_roles grant for an account that is not access-revoked. profiles.role = 'admin'
-- confers nothing by itself; it matters only through sync_admin_entitlement_from_profile() below, which writes the
-- grant and its audit row. A revoked grant therefore removes every capability gated by is_admin().
create or replace function public.has_active_admin_role() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.profiles p
    join public.user_roles ur on ur.user_id = p.id and ur.role = 'admin' and ur.revoked_at is null
    where p.id = auth.uid()
      and p.access_revoked_at is null
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

-- Safety net: the strict has_active_admin_role() must never strand an existing admin. Abort (the whole script, when run
-- as one transaction) if any admin profile has no entitlement row after the backfill.
do $$
declare v_missing integer;
begin
  select count(*) into v_missing
  from public.profiles p
  where p.role = 'admin'
    and not exists (select 1 from public.user_roles ur where ur.user_id = p.id and ur.role = 'admin');
  if v_missing > 0 then
    raise exception 'multi-role migration aborted: % admin profile(s) were not backfilled', v_missing using errcode = 'MM109';
  end if;
end $$;

-- No unaudited promotion: whenever a profile becomes (or stops being) role 'admin', keep user_roles and the audit trail
-- in step. Only the service role / DB owner can write profiles.role, so this adds an audit row, not a new power.
create or replace function public.sync_admin_entitlement_from_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_actor text := 'trigger:profiles.role:' || current_user;
  v_row public.user_roles%rowtype;
begin
  if new.role = 'admin' and (tg_op = 'INSERT' or old.role is distinct from 'admin') then
    select * into v_row from public.user_roles where user_id = new.id and role = 'admin';
    if not found then
      insert into public.user_roles (user_id, role, granted_by) values (new.id, 'admin', v_actor);
      insert into public.role_audit_events (user_id, role, action, actor, reason)
        values (new.id, 'admin', 'grant', v_actor, 'profiles.role set to admin');
    elsif v_row.revoked_at is not null then
      update public.user_roles set revoked_at = null, revoked_by = null, granted_at = now(), granted_by = v_actor
        where user_id = new.id and role = 'admin';
      insert into public.role_audit_events (user_id, role, action, actor, reason)
        values (new.id, 'admin', 'regrant', v_actor, 'profiles.role set to admin');
    end if;
  elsif tg_op = 'UPDATE' and old.role = 'admin' and new.role is distinct from 'admin' then
    update public.user_roles set revoked_at = now(), revoked_by = v_actor
      where user_id = new.id and role = 'admin' and revoked_at is null;
    if found then
      insert into public.role_audit_events (user_id, role, action, actor, reason)
        values (new.id, 'admin', 'revoke', v_actor, 'profiles.role changed away from admin');
    end if;
  end if;
  return new;
end $$;
revoke all on function public.sync_admin_entitlement_from_profile() from public, anon, authenticated;

drop trigger if exists profiles_sync_admin_entitlement on public.profiles;
create trigger profiles_sync_admin_entitlement
  after insert or update of role on public.profiles
  for each row execute function public.sync_admin_entitlement_from_profile();

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

-- ---------------------------------------------------------------------------
-- Content-factory owner approval: same eligibility rules, but the "is the owner/admin" test is is_admin() (active
-- entitlement + MFA when required) instead of profiles.role, so revocation and the MFA switch apply here too and a
-- dual-role user (profile parent + admin grant) can approve. CREATE OR REPLACE keeps the grants on the functions.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_owner_approval_actor() returns trigger language plpgsql set search_path=public,pg_temp as $$
declare v_role text;
begin
  if auth.uid() is null or new.approved_by<>auth.uid() then raise exception 'authenticated owner identity required' using errcode='42501'; end if;
  if not public.is_admin() then raise exception 'owner approval required' using errcode='42501'; end if;
  return new;
end $$;

create or replace function public.owner_approve_content(p_revision_id uuid, p_qa_evidence jsonb)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare v_id uuid; v_role text;
begin
  if not public.is_admin() then raise exception 'owner approval required' using errcode='42501'; end if;
  if not exists (
    select 1 from public.authoring_question_revisions q
    where q.id=p_revision_id and q.state='reviewed'
      and (select v.passed and v.revision_content_hash=q.content_hash from public.content_validation_runs v where v.revision_id=q.id order by v.created_at desc,v.id desc limit 1) is true
      and (select r.review_stage='comparison' and r.decision='pass' and r.supplied_answer_agreement and r.revision_content_hash=q.content_hash and public.content_review_quality_passes(r.structured_evidence) from public.content_reviews r where r.revision_id=q.id order by r.created_at desc,r.id desc limit 1) is true
      and (select a.revision_content_hash=q.content_hash from public.content_risk_assessments a where a.revision_id=q.id order by a.created_at desc,a.id desc limit 1) is true
  ) then raise exception 'revision is not eligible for approval' using errcode='MM102'; end if;
  insert into public.content_owner_approvals(revision_id,approved_by,approval_mode,qa_evidence)
  values(p_revision_id,auth.uid(),'individual',p_qa_evidence) returning id into v_id;
  update public.authoring_question_revisions set state='approved' where id=p_revision_id;
  return v_id;
end $$;

create or replace function public.owner_approve_batch(p_batch_id uuid, p_qa_evidence jsonb)
returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare v_role text; v_total integer; v_sampled integer; v_approved integer;
begin
  if not public.is_admin() then raise exception 'owner approval required' using errcode='42501'; end if;
  select count(*) into v_total from public.authoring_question_revisions where batch_id=p_batch_id and state='reviewed';
  v_sampled := coalesce((p_qa_evidence->>'sampledCount')::integer,0);
  if v_total=0 or v_sampled < least(v_total,greatest(5,ceil(v_total*0.10)::integer))
     or coalesce((p_qa_evidence->>'sampleFailureCount')::integer,0) <> 0 then
    raise exception 'batch QA sample is insufficient or failed' using errcode='MM104';
  end if;
  if exists (
    select 1 from public.authoring_question_revisions q
    where q.batch_id=p_batch_id and q.state='reviewed' and (
      (select v.passed and v.revision_content_hash=q.content_hash from public.content_validation_runs v where v.revision_id=q.id order by v.created_at desc,v.id desc limit 1) is distinct from true or
      (select r.review_stage='comparison' and r.decision='pass' and r.supplied_answer_agreement and r.revision_content_hash=q.content_hash and public.content_review_quality_passes(r.structured_evidence) from public.content_reviews r where r.revision_id=q.id order by r.created_at desc,r.id desc limit 1) is distinct from true or
      (select a.requires_individual_owner_review or a.level<>'low' or a.revision_content_hash<>q.content_hash from public.content_risk_assessments a where a.revision_id=q.id order by a.created_at desc,a.id desc limit 1) is distinct from false
    )
  ) then raise exception 'batch contains ineligible or elevated-risk revisions' using errcode='MM102'; end if;
  insert into public.content_owner_approvals(batch_id,approved_by,approval_mode,qa_evidence)
  values(p_batch_id,auth.uid(),'batch_sampled',p_qa_evidence);
  update public.authoring_question_revisions set state='approved' where batch_id=p_batch_id and state='reviewed';
  get diagnostics v_approved=row_count; return v_approved;
end $$;

comment on table public.user_roles is
  'Elevated role entitlements (admin). Service-role writes only; users read their own rows. profiles.role stays the primary role.';
comment on table public.role_audit_events is
  'Append-only audit of elevated role grants/revocations (MM107).';
