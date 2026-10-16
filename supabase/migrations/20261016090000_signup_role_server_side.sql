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
