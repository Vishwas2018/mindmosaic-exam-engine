-- READ-ONLY verification for 20261126090000_multi_role_workspaces (run in the DEV SQL editor; production out of scope).
-- Run block A BEFORE the migration and blocks B-D AFTER it. Nothing here writes.

-- A. PREFLIGHT: every admin profile that the backfill will carry (expect the same number after).
select p.id, u.email, p.display_name, p.access_revoked_at
from public.profiles p join auth.users u on u.id = p.id
where p.role = 'admin'
order by u.email;

-- B. POSTFLIGHT: admin profiles WITHOUT an active entitlement. Expect ZERO rows (access-revoked accounts excepted by design).
select p.id, u.email
from public.profiles p join auth.users u on u.id = p.id
where p.role = 'admin'
  and not exists (select 1 from public.user_roles ur where ur.user_id = p.id and ur.role = 'admin' and ur.revoked_at is null);

-- C. POSTFLIGHT: counts must reconcile (profiles admin = active grants for admin-profile users; each has a backfill audit row).
select
  (select count(*) from public.profiles where role = 'admin')                                  as admin_profiles,
  (select count(*) from public.user_roles ur join public.profiles p on p.id = ur.user_id
     where ur.role = 'admin' and ur.revoked_at is null and p.role = 'admin')                    as active_grants_for_admin_profiles,
  (select count(*) from public.role_audit_events where action = 'backfill')                     as backfill_audit_rows,
  (select count(*) from public.user_roles ur join public.profiles p on p.id = ur.user_id
     where p.role = 'student')                                                                  as student_entitlements_must_be_0;

-- D. POSTFLIGHT: nothing else moved (parent billing and child links are untouched by this migration).
select
  (select count(*) from public.subscriptions)   as subscriptions,
  (select count(*) from public.parent_children) as parent_children,
  (select count(*) from public.admin_draft_review_decisions) as review_decisions;
