-- Beta hardening: a self-service sign-up can only ever become a parent.
--
-- BEFORE: handle_new_user() (20260718090000) took the new profile's role from
-- raw_user_meta_data ->> 'role', accepting 'student' or 'parent' and falling
-- back to 'student'. raw_user_meta_data is the `data` object a browser passes
-- to supabase.auth.signUp(), and the anon key is in every page, so anyone could
-- POST /auth/v1/signup with {"role":"student"} and obtain an unlinked student
-- profile — a role the product says is "never self-service" (D1).
--
-- AFTER: the role comes only from a source a browser cannot write.
--
--   1. raw_app_meta_data ->> 'role' ('student' | 'parent'), if present.
--      app_metadata can be set only with the service-role key
--      (auth.admin.createUser / updateUserById); GoTrue's public signup
--      endpoint never reads it from the request. provisionChild() and the
--      e2e fixture seeder pass role: 'student' here.
--   2. Otherwise, a row GoTrue created (it always stamps
--      raw_app_meta_data.provider — email, google, an invite, ...) is a
--      parent. This is the self-service case and the only role it may have.
--   3. Otherwise (no app metadata at all — a direct SQL insert, which only a
--      database-privileged role can do) the long-standing fail-closed default
--      of 'student' is kept, so no existing seed/RLS fixture changes meaning.
--
-- raw_user_meta_data is no longer consulted for the role. display_name still
-- comes from it: a name is cosmetic and was never a privilege.
--
-- Teacher and admin were never reachable from here and still are not; they are
-- assigned by an operator in the database.
--
-- Existing profiles are untouched: the trigger fires on INSERT only.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  trusted_role text := new.raw_app_meta_data ->> 'role';
  resolved_role text;
begin
  if trusted_role in ('student', 'parent') then
    resolved_role := trusted_role;
  elsif new.raw_app_meta_data ? 'provider' then
    resolved_role := 'parent';
  else
    resolved_role := 'student';
  end if;

  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    resolved_role,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Creates the profiles row for a new auth user. Role is taken from raw_app_meta_data (service-role-only) or, for a GoTrue-created self-service user, forced to ''parent''; raw_user_meta_data.role is ignored. See 20261016090000.';

-- ---------------------------------------------------------------------------
-- GoTrue applies app_metadata AFTER the insert, not with it.
--
-- Verified against a real GoTrue (admin createUser with app_metadata
-- {"role":"student"}): the auth.users row is first inserted with only
-- {"provider","providers"}, and the role is merged in by a following UPDATE.
-- So handle_new_user above, which runs on INSERT, sees no role for a
-- provisioned child and makes a parent (plus its 7-day trial subscription).
-- The e2e-auth suite caught exactly this: seeded students signed in to the
-- parent dashboard.
--
-- apply_provisioned_role() closes it. It fires only when the service-role-only
-- app_metadata role changes to 'student', and moves the profile from the
-- self-service default 'parent' to 'student', removing the trial subscription
-- that the parent default created (never one that has touched Stripe). It is
-- deliberately narrow:
--   - only parent -> student: it never touches a teacher, admin or an
--     existing student, and never promotes anyone;
--   - refuses (leaves the profile alone) when the account already has linked
--     children, so a real parent can never be silently demoted;
--   - the trigger condition compares old and new role, so ordinary GoTrue
--     updates to the row (sign-in timestamps) never reach it.
-- app_metadata is writable only with the service-role key, so a browser still
-- cannot reach this path.
-- ---------------------------------------------------------------------------

create or replace function public.apply_provisioned_role()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.raw_app_meta_data ->> 'role' = 'student' then
    update public.profiles p
       set role = 'student'
     where p.id = new.id
       and p.role = 'parent'
       and not exists (select 1 from public.parent_children pc where pc.parent_id = p.id);

    if found then
      delete from public.subscriptions s
       where s.parent_id = new.id
         and s.status = 'trialing'
         and s.stripe_customer_id is null
         and s.stripe_subscription_id is null;
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.apply_provisioned_role() from public, anon, authenticated;

create trigger on_auth_user_role_provisioned
  after update of raw_app_meta_data on auth.users
  for each row
  when (old.raw_app_meta_data ->> 'role' is distinct from new.raw_app_meta_data ->> 'role')
  execute function public.apply_provisioned_role();

comment on function public.apply_provisioned_role() is
  'Moves a freshly created GoTrue user from the self-service ''parent'' default to ''student'' when the service role sets app_metadata.role = ''student'' (GoTrue applies app_metadata after insert). Parent -> student only; never touches teacher/admin or a parent with linked children. See 20261016090000.';
