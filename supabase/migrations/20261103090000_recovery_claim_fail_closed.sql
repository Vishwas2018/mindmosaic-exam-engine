-- Family-beta WP1: fail-closed recovery claims. Supersedes the "lapsed lease is re-claimable" rule of 20261102090000.
--
-- WHY. Before this, a claim whose 2-minute lease lapsed with the password hash UNCHANGED was handed to a new claimant. That
-- is unsafe when the first claimant's request to Auth was merely SLOW: it can still commit after the takeover, and the same
-- grant would then have changed the password twice. A database lease cannot cancel a request already in flight at Auth.
--
-- THE RULE NOW. A claim is held for its lease. When the lease lapses:
--   password hash changed since the claim -> the attempt succeeded: the grant is 'spent'.
--   password hash unchanged               -> the outcome is UNCERTAIN (crashed, or still in flight): the grant becomes
--                                            'abandoned', which is terminal. It is never claimed again.
-- The user's way forward is a FRESH recovery link (new grant, new jti). Nothing is stranded: a recovery link is free to
-- request. A late success report from the original claimant still marks the grant 'spent' (the safe direction), and a
-- password change that lands after abandonment is detected by the hash comparison on the next touch and recorded as spent.
--
-- WHAT THIS GUARANTEES. For any one grant, at most one password-change request is ever DISPATCHED to Auth, except after a
-- DEFINITIVE refusal (a 4xx, which means Auth changed nothing), when the claim is released and one more attempt may follow.
-- It does not make Auth's own update-user API single-use for a session holder who calls it directly (see
-- src/server/auth/recovery-grant.ts), and it does not claim to.
--
-- Not applied to any hosted project. Apply after 20261102090000. The application treats an unrecognised 'lapsed' outcome as
-- 'unavailable' (503, nothing changed), so deploying the old application against this migration fails closed.

alter table public.recovery_grant_claims drop constraint if exists recovery_grant_claims_state_check;
alter table public.recovery_grant_claims drop constraint if exists recovery_grant_claims_lease_matches_state;
alter table public.recovery_grant_claims
  add constraint recovery_grant_claims_state_check check (state in ('claimed', 'spent', 'abandoned')),
  add constraint recovery_grant_claims_lease_matches_state
    check ((state = 'claimed' and lease_until is not null) or (state in ('spent', 'abandoned') and lease_until is null));

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

  -- Password hash changed since the claim (lapsed or abandoned): the attempt did succeed. Spent.
  update public.recovery_grant_claims
  set state = 'spent', lease_until = null
  where jti = p_jti and user_id = v_uid and pw_digest <> v_digest
    and ((state = 'claimed' and lease_until <= now()) or state = 'abandoned');

  -- Lapsed and unchanged: UNCERTAIN. Terminal. Never claimed again.
  update public.recovery_grant_claims
  set state = 'abandoned', lease_until = null
  where jti = p_jti and user_id = v_uid and state = 'claimed' and lease_until <= now() and pw_digest = v_digest;

  -- Atomic: the primary key lets exactly one concurrent insert win. An existing row is NEVER taken over.
  insert into public.recovery_grant_claims as c (jti, user_id, state, claim_token, pw_digest, claimed_at, lease_until, grant_expires_at)
  values (p_jti, v_uid, 'claimed', v_token, v_digest, now(), now() + interval '2 minutes', p_grant_expires_at)
  on conflict (jti) do nothing
  returning c.claim_token into v_won;

  if v_won is not null then
    return jsonb_build_object('outcome', 'claimed', 'token', v_won);
  end if;

  select c.state, c.user_id into v_state, v_owner from public.recovery_grant_claims c where c.jti = p_jti;
  if v_owner is distinct from v_uid then
    return jsonb_build_object('outcome', 'busy'); -- another user's identifier: never reveals that it exists
  end if;
  return jsonb_build_object('outcome', case v_state when 'spent' then 'spent' when 'abandoned' then 'lapsed' else 'busy' end);
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
    -- Safe in every state and needs no token: a late success report, even for an abandoned claim, must kill the grant.
    update public.recovery_grant_claims
    set state = 'spent', lease_until = null
    where jti = p_jti and user_id = v_uid and state in ('claimed', 'abandoned');
    get diagnostics v_rows = row_count;
    if v_rows = 1 then
      return true;
    end if;
    return exists (select 1 from public.recovery_grant_claims where jti = p_jti and user_id = v_uid and state = 'spent');
  elsif p_outcome = 'released' then
    select sha256(convert_to(coalesce(u.encrypted_password, ''), 'UTF8')) into v_digest
    from auth.users u where u.id = v_uid;
    update public.recovery_grant_claims
    set state = 'spent', lease_until = null
    where jti = p_jti and user_id = v_uid and state in ('claimed', 'abandoned') and pw_digest <> v_digest;
    -- Only the caller's OWN, still-live claim, and only while the password is provably unchanged. An abandoned claim is
    -- never released: its outcome was already uncertain.
    delete from public.recovery_grant_claims
    where jti = p_jti and user_id = v_uid and state = 'claimed' and claim_token = p_token and pw_digest = v_digest
      and lease_until > now();
    get diagnostics v_rows = row_count;
    return v_rows = 1;
  end if;
  raise exception 'unknown outcome' using errcode = 'MM011';
end;
$$;

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
  return 'unchanged'; -- still 'claimed' or 'abandoned': either way it is not released
end;
$$;

-- The table holds sha256(password hash) per claim. Supabase's default privileges give service_role full access to new tables;
-- nothing in the application reads or writes this table directly (only the SECURITY DEFINER functions do), so take it back.
-- (service_role can read auth.users anyway, so this removes a redundant copy of a derived value, not a new protection.)
revoke all on table public.recovery_grant_claims from service_role;

revoke all on function public.claim_recovery_grant(uuid, timestamptz) from public, anon, authenticated, service_role;
revoke all on function public.settle_recovery_grant(uuid, uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.resolve_recovery_claim(uuid, uuid) from public, anon, authenticated, service_role;
grant execute on function public.claim_recovery_grant(uuid, timestamptz) to authenticated;
grant execute on function public.settle_recovery_grant(uuid, uuid, text) to authenticated;
grant execute on function public.resolve_recovery_claim(uuid, uuid) to authenticated;

do $$
begin
  if has_function_privilege('anon', 'public.claim_recovery_grant(uuid, timestamptz)', 'EXECUTE')
     or has_function_privilege('anon', 'public.settle_recovery_grant(uuid, uuid, text)', 'EXECUTE')
     or has_function_privilege('anon', 'public.resolve_recovery_claim(uuid, uuid)', 'EXECUTE')
     or has_table_privilege('authenticated', 'public.recovery_grant_claims', 'SELECT')
     or has_table_privilege('anon', 'public.recovery_grant_claims', 'SELECT')
     or has_table_privilege('service_role', 'public.recovery_grant_claims', 'SELECT')
     or has_function_privilege('service_role', 'public.claim_recovery_grant(uuid, timestamptz)', 'EXECUTE') then
    raise exception 'recovery grant claim privileges are wider than intended';
  end if;
end;
$$;
