-- Family-beta WP1: server-side, atomic, single-use consumption of a password-recovery grant.
--
-- WHY. The recovery grant (src/server/auth/recovery-grant.ts) is a signed cookie. Before this migration it was "spent"
-- only by ending the Auth session it is bound to, so two simultaneous password submissions from the same session could
-- both pass the grant check, and a failed global sign-out left the grant replayable for its 15 minutes. A cookie cannot
-- record that it has been used: that needs shared server-side state, and this is it.
--
-- WHAT IT STORES. One row per grant that reached the password endpoint: the grant's `jti` (a random UUID inside the
-- signed cookie), the user it belongs to, and a state:
--   claimed  an in-flight password change holds the grant; the claim is a LEASE that lapses on its own
--   spent    the password was changed with this grant; the grant can never be used again
-- It stores no password, no token and no cookie.
--
-- TWO-PHASE ON PURPOSE. Marking the grant spent BEFORE the password is changed would lock the user out of their own
-- recovery after any transient failure (Auth service timeout, rate limit, weak-password rejection). So the endpoint
--   1. claims   (claim_recovery_grant)   atomically: exactly one concurrent caller gets 'claimed', the others 'busy';
--   2. changes the password;
--   3a. on success: settles 'spent'  (the grant is dead; replay gets 'spent');
--   3b. on failure: settles 'released' (the claim is removed so the same grant can be used to try again).
-- If the process dies between 1 and 3, the claim's lease (2 minutes) lapses and the grant is claimable again, so a crash
-- cannot strand a user. A grant whose claim lapsed AFTER a successful password change but before settling can be claimed
-- once more by the same, still-valid session only; the endpoint's global sign-out ends that session, and the cookie's
-- 15-minute expiry bounds the rest.
--
-- WHO MAY CALL. `authenticated`, and only for its own rows: both functions are SECURITY DEFINER and key every read and
-- write on auth.uid(). A caller can therefore only ever claim, settle or learn about grants it owns, and the table has
-- no direct privilege for any client role (RLS enabled, no policy, all privileges revoked). A user who calls the
-- functions directly can at most affect their own recovery grant, which they already hold.
--
-- BOUNDS. Per-user cap of 10 live rows (a bound on rows an authenticated user can create by calling the function in a
-- loop) and opportunistic deletion of the user's expired rows.
--
-- DEPLOYMENT DEPENDENCY. The application that calls these functions FAILS CLOSED when they are absent: the password
-- endpoint answers 503 `recovery_unavailable` and changes nothing. Apply this migration BEFORE (or together with) that
-- application version. Rolling the migration back is not needed to roll the application back: the old application
-- ignores the table. Forward-only otherwise.

create table if not exists public.recovery_grant_claims (
  jti uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  state text not null check (state in ('claimed', 'spent')),
  claimed_at timestamptz not null default now(),
  lease_until timestamptz,
  grant_expires_at timestamptz not null,
  constraint recovery_grant_claims_lease_matches_state
    check ((state = 'claimed' and lease_until is not null) or (state = 'spent' and lease_until is null))
);

create index if not exists recovery_grant_claims_user_idx on public.recovery_grant_claims (user_id, grant_expires_at);

alter table public.recovery_grant_claims enable row level security;
revoke all on table public.recovery_grant_claims from public, anon, authenticated;

create or replace function public.claim_recovery_grant(p_jti uuid, p_grant_expires_at timestamptz)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_claimed boolean;
  v_state text;
  v_owner uuid;
  v_live integer;
begin
  if v_uid is null then
    raise exception 'recovery grants can only be claimed by a signed-in user' using errcode = 'MM010';
  end if;
  if p_jti is null or p_grant_expires_at is null
     or p_grant_expires_at <= now()
     or p_grant_expires_at > now() + interval '20 minutes' then
    raise exception 'invalid recovery grant claim' using errcode = 'MM011';
  end if;

  delete from public.recovery_grant_claims
  where user_id = v_uid and grant_expires_at < now() - interval '1 hour';

  select count(*) into v_live
  from public.recovery_grant_claims
  where user_id = v_uid and grant_expires_at >= now() and jti <> p_jti;
  if v_live >= 10 then
    raise exception 'too many recovery grants in flight' using errcode = 'MM012';
  end if;

  -- Atomic: the primary key makes exactly one concurrent insert win. A conflicting row is taken over only when it is
  -- this user's own, still 'claimed', and its lease has lapsed (a crashed attempt). 'spent' is never taken over.
  insert into public.recovery_grant_claims as c (jti, user_id, state, claimed_at, lease_until, grant_expires_at)
  values (p_jti, v_uid, 'claimed', now(), now() + interval '2 minutes', p_grant_expires_at)
  on conflict (jti) do update
    set claimed_at = now(), lease_until = now() + interval '2 minutes'
    where c.user_id = v_uid and c.state = 'claimed' and c.lease_until <= now()
  returning true into v_claimed;

  if v_claimed then
    return 'claimed';
  end if;

  select c.state, c.user_id into v_state, v_owner from public.recovery_grant_claims c where c.jti = p_jti;
  if v_owner is distinct from v_uid then
    -- Another user's identifier: indistinguishable from an in-flight claim, and never reveals that it exists.
    return 'busy';
  end if;
  return case when v_state = 'spent' then 'spent' else 'busy' end;
end;
$$;

create or replace function public.settle_recovery_grant(p_jti uuid, p_outcome text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_rows integer;
begin
  if v_uid is null then
    raise exception 'recovery grants can only be settled by a signed-in user' using errcode = 'MM010';
  end if;
  if p_outcome = 'spent' then
    update public.recovery_grant_claims
    set state = 'spent', lease_until = null
    where jti = p_jti and user_id = v_uid and state = 'claimed';
  elsif p_outcome = 'released' then
    delete from public.recovery_grant_claims
    where jti = p_jti and user_id = v_uid and state = 'claimed';
  else
    raise exception 'unknown outcome' using errcode = 'MM011';
  end if;
  get diagnostics v_rows = row_count;
  return v_rows = 1;
end;
$$;

-- This project's default privileges grant EXECUTE on new functions to PUBLIC/anon; take them back explicitly.
revoke all on function public.claim_recovery_grant(uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.settle_recovery_grant(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_recovery_grant(uuid, timestamptz) to authenticated;
grant execute on function public.settle_recovery_grant(uuid, text) to authenticated;

do $$
begin
  if has_function_privilege('anon', 'public.claim_recovery_grant(uuid, timestamptz)', 'EXECUTE')
     or has_function_privilege('anon', 'public.settle_recovery_grant(uuid, text)', 'EXECUTE')
     or has_table_privilege('authenticated', 'public.recovery_grant_claims', 'SELECT')
     or has_table_privilege('anon', 'public.recovery_grant_claims', 'SELECT') then
    raise exception 'recovery grant claim privileges are wider than intended';
  end if;
end;
$$;
