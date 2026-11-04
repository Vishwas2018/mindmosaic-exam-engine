-- Family-beta WP1: server-side, atomic, fenced, single-use consumption of a password-recovery grant.
--
-- WHY. The recovery grant (src/server/auth/recovery-grant.ts) is a signed cookie. Before this migration it was "spent"
-- only by ending the Auth session it is bound to, so two simultaneous password submissions from the same session could
-- both pass the grant check, and a failed global sign-out left the grant replayable for its 15 minutes. A cookie cannot
-- record that it has been used: that needs shared server-side state, and this is it.
--
-- WHAT IT STORES. One row per grant that reached the password endpoint: the grant's `jti` (a random UUID inside the
-- signed cookie), the user it belongs to, and a state:
--   claimed  an in-flight password change holds the grant; the claim is a LEASE (2 minutes) that lapses on its own
--   spent    the password was changed with this grant; the grant can never be used again
-- plus, per claim, a FENCING TOKEN (`claim_token`, a fresh random uuid each time the grant is claimed) and a DIGEST of the
-- user's password hash taken at claim time (`pw_digest` = sha256 of auth.users.encrypted_password). It stores no password,
-- no token usable against Auth and no cookie; the digest is of a hash, is unreadable by every client role, and exists so
-- the database can answer the one question a client cannot answer reliably: "did this user's password change since this
-- claim was taken?".
--
-- THE PROTOCOL.
--   1. claim    (claim_recovery_grant)   atomic: exactly one concurrent caller gets {outcome:'claimed', token}; the others
--                                        get 'busy'; a used grant is 'spent'.
--   2. change the password.
--   3. settle   (settle_recovery_grant)
--        'spent'     after a successful change. Safe in every state: marking a grant spent can never re-open it.
--        'released'  ONLY after a definitive refusal by Auth (nothing changed). Requires the caller's own fencing token,
--                    so an old claimant whose lease lapsed can never release (delete) a NEWER claimant's claim, and is
--                    refused (and the grant marked spent instead) if the password hash changed since the claim.
--   3'. resolve  (resolve_recovery_claim) when Auth's answer was AMBIGUOUS (network failure, timeout, 5xx): the password may
--        have changed. The database compares the digest: 'changed' -> the grant is marked spent and the caller treats the
--        change as done; 'unchanged' -> nothing is released (the Auth call might still be in flight) and the claim is left
--        to lapse, so an uncertain outcome never both keeps the lock and re-opens the grant.
--
-- WHY A LAPSED LEASE IS NOT SIMPLY RE-CLAIMABLE. If the process dies (or the settle call fails) AFTER the password was
-- changed, the claim stays 'claimed' until its lease lapses. Re-claiming it blindly would let the same grant change the
-- password a second time. So a lapsed claim is first compared against the current password hash: changed -> it becomes
-- 'spent' (the original attempt did succeed); unchanged -> the crashed attempt achieved nothing and the grant is claimable
-- again with a NEW token. A user is therefore never stranded by a crash, and a successful change is never replayable.
--
-- WHO MAY CALL. `authenticated`, and only for its own rows: the functions are SECURITY DEFINER and key every read and
-- write on auth.uid(). The table has no direct privilege for any client role (RLS enabled, no policy, all revoked).
--
-- BOUNDS. Per-user cap of 10 live rows and opportunistic deletion of the user's long-expired rows.
--
-- REMAINING LIMITATION (documented, not hidden): the fence cannot stop a request to Auth that is still in flight, unlike a
-- lapsed database lease. A password-change request that takes longer than the 2-minute lease AND commits after a second
-- claimant has taken over could be followed by a second change from the same still-valid session. Both are by the same
-- authenticated holder of the same grant; the global sign-out that follows either success ends the session, and the cookie's
-- 15-minute expiry bounds the rest.
--
-- DEPLOYMENT DEPENDENCY. The application that calls these functions FAILS CLOSED when they are absent: the password
-- endpoint answers 503 `recovery_unavailable` and changes nothing. Apply this migration BEFORE (or together with) that
-- application version. The previous application ignores the table. This migration has not been applied to any hosted
-- project; `npm run migrations:status` tells which migrations a project already has.

create table if not exists public.recovery_grant_claims (
  jti uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  state text not null check (state in ('claimed', 'spent')),
  claim_token uuid not null,
  pw_digest bytea not null,
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
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_digest bytea;
  v_token uuid := gen_random_uuid();
  v_won uuid;
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

  select sha256(convert_to(coalesce(u.encrypted_password, ''), 'UTF8')) into v_digest
  from auth.users u where u.id = v_uid;
  if v_digest is null then
    raise exception 'unknown user' using errcode = 'MM010';
  end if;

  delete from public.recovery_grant_claims
  where user_id = v_uid and grant_expires_at < now() - interval '1 hour';

  select count(*) into v_live
  from public.recovery_grant_claims
  where user_id = v_uid and grant_expires_at >= now() and jti <> p_jti;
  if v_live >= 10 then
    raise exception 'too many recovery grants in flight' using errcode = 'MM012';
  end if;

  -- A lapsed claim whose password hash has since changed is a SUCCESSFUL attempt that never got to settle: it is spent.
  update public.recovery_grant_claims
  set state = 'spent', lease_until = null
  where jti = p_jti and user_id = v_uid and state = 'claimed' and lease_until <= now() and pw_digest <> v_digest;

  -- Atomic: the primary key makes exactly one concurrent insert win. A conflicting row is taken over only when it is this
  -- user's own, still 'claimed', its lease has lapsed, and the password is unchanged (a crashed attempt that achieved
  -- nothing). The takeover gets a NEW token, so the previous claimant is fenced out. 'spent' is never taken over.
  insert into public.recovery_grant_claims as c (jti, user_id, state, claim_token, pw_digest, claimed_at, lease_until, grant_expires_at)
  values (p_jti, v_uid, 'claimed', v_token, v_digest, now(), now() + interval '2 minutes', p_grant_expires_at)
  on conflict (jti) do update
    set claim_token = excluded.claim_token, pw_digest = excluded.pw_digest, claimed_at = now(),
        lease_until = now() + interval '2 minutes'
    where c.user_id = v_uid and c.state = 'claimed' and c.lease_until <= now() and c.pw_digest = v_digest
  returning c.claim_token into v_won;

  if v_won is not null then
    return jsonb_build_object('outcome', 'claimed', 'token', v_won);
  end if;

  select c.state, c.user_id into v_state, v_owner from public.recovery_grant_claims c where c.jti = p_jti;
  if v_owner is distinct from v_uid then
    -- Another user's identifier: indistinguishable from an in-flight claim, and never reveals that it exists.
    return jsonb_build_object('outcome', 'busy');
  end if;
  return jsonb_build_object('outcome', case when v_state = 'spent' then 'spent' else 'busy' end);
end;
$$;

create or replace function public.settle_recovery_grant(p_jti uuid, p_token uuid, p_outcome text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_digest bytea;
  v_rows integer;
begin
  if v_uid is null then
    raise exception 'recovery grants can only be settled by a signed-in user' using errcode = 'MM010';
  end if;
  if p_outcome = 'spent' then
    -- Marking spent is the safe direction in every state and needs no token: a late success report from a claimant that
    -- lost its lease must still kill the grant.
    update public.recovery_grant_claims
    set state = 'spent', lease_until = null
    where jti = p_jti and user_id = v_uid and state = 'claimed';
    get diagnostics v_rows = row_count;
    if v_rows = 1 then
      return true;
    end if;
    return exists (select 1 from public.recovery_grant_claims where jti = p_jti and user_id = v_uid and state = 'spent');
  elsif p_outcome = 'released' then
    select sha256(convert_to(coalesce(u.encrypted_password, ''), 'UTF8')) into v_digest
    from auth.users u where u.id = v_uid;
    -- Release only the caller's OWN claim (fencing token) and only while the password is provably unchanged. If it has
    -- changed, the attempt succeeded after all: the grant becomes spent and the release is refused.
    update public.recovery_grant_claims
    set state = 'spent', lease_until = null
    where jti = p_jti and user_id = v_uid and state = 'claimed' and pw_digest <> v_digest;
    delete from public.recovery_grant_claims
    where jti = p_jti and user_id = v_uid and state = 'claimed' and claim_token = p_token and pw_digest = v_digest;
    get diagnostics v_rows = row_count;
    return v_rows = 1;
  end if;
  raise exception 'unknown outcome' using errcode = 'MM011';
end;
$$;

-- Used after an AMBIGUOUS answer from Auth. Returns 'changed' (the password hash differs from the one at claim time, or the
-- grant is already spent: the grant is now spent), 'unchanged' (the caller still holds the live claim and nothing changed),
-- or 'unknown' (no such claim for this user, or it has been taken over by a newer claimant).
create or replace function public.resolve_recovery_claim(p_jti uuid, p_token uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_digest bytea;
  v_row public.recovery_grant_claims%rowtype;
begin
  if v_uid is null then
    raise exception 'recovery grants can only be resolved by a signed-in user' using errcode = 'MM010';
  end if;
  select * into v_row from public.recovery_grant_claims where jti = p_jti and user_id = v_uid for update;
  if not found then
    return 'unknown';
  end if;
  if v_row.state = 'spent' then
    return 'changed';
  end if;
  if v_row.claim_token <> p_token then
    return 'unknown';
  end if;
  select sha256(convert_to(coalesce(u.encrypted_password, ''), 'UTF8')) into v_digest
  from auth.users u where u.id = v_uid;
  if v_row.pw_digest is distinct from v_digest then
    update public.recovery_grant_claims set state = 'spent', lease_until = null where jti = p_jti;
    return 'changed';
  end if;
  return 'unchanged';
end;
$$;

-- This project's default privileges grant EXECUTE on new functions to PUBLIC/anon; take them back explicitly.
revoke all on function public.claim_recovery_grant(uuid, timestamptz) from public, anon, authenticated;
revoke all on function public.settle_recovery_grant(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.resolve_recovery_claim(uuid, uuid) from public, anon, authenticated;
grant execute on function public.claim_recovery_grant(uuid, timestamptz) to authenticated;
grant execute on function public.settle_recovery_grant(uuid, uuid, text) to authenticated;
grant execute on function public.resolve_recovery_claim(uuid, uuid) to authenticated;

do $$
begin
  if has_function_privilege('anon', 'public.claim_recovery_grant(uuid, timestamptz)', 'EXECUTE')
     or has_function_privilege('anon', 'public.settle_recovery_grant(uuid, uuid, text)', 'EXECUTE')
     or has_function_privilege('anon', 'public.resolve_recovery_claim(uuid, uuid)', 'EXECUTE')
     or has_table_privilege('authenticated', 'public.recovery_grant_claims', 'SELECT')
     or has_table_privilege('anon', 'public.recovery_grant_claims', 'SELECT') then
    raise exception 'recovery grant claim privileges are wider than intended';
  end if;
end;
$$;
