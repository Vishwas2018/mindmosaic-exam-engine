-- Fixes MM-SEC-01 (webhook records the event as processed before applying
-- it, and swallows the entitlement-update error): the previous flow was
-- src/app/api/stripe/webhook/route.ts inserting into subscription_events
-- (the idempotency ledger) BEFORE calling applySubscriptionEvent(), whose
-- applyPatch() in src/lib/stripe/apply-subscription-event.ts never checked
-- the .update() error at all. A failed subscriptions write therefore still
-- returned HTTP 200 — Stripe's retry contract only retries on non-2xx, so
-- the event was never retried and the entitlement write was lost silently.
--
-- This migration moves "record the event, apply the subscription patch,
-- mark the event complete" into one Postgres function so all three happen
-- in a single transaction: if the patch step raises, the whole function
-- call aborts, which rolls back the subscription_events insert too — the
-- event is NOT left marked processed, so Stripe's retry actually reaches
-- this function again instead of being treated as an already-handled
-- duplicate. The route (reworked in the same change) calls this function
-- and returns non-2xx whenever it raises.
--
-- security definer + execute restricted to service_role only (see the
-- grant at the bottom): this function writes to subscriptions and
-- subscription_events, neither of which has an insert/update policy for
-- authenticated (supabase/migrations/20260720100000_subscriptions.sql) —
-- exactly like that migration's own security-definer trigger, this
-- function must not be callable by anon/authenticated, only by the
-- service-role webhook route (src/lib/stripe/subscriptions-admin.ts).
--
-- IMPORTANT — this migration is not applied to the real Supabase database
-- as part of this change (local ephemeral `supabase start` /
-- `supabase db reset` harness only, per the batch contract for this fix).

alter table public.subscription_events
  add column processed_at timestamptz;

create or replace function public.apply_stripe_subscription_event(
  p_stripe_event_id text,
  p_type text,
  p_payload jsonb,
  p_customer_id text,
  p_subscription_id text,
  p_patch jsonb
)
returns table (duplicate boolean, subscription_row_id uuid)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row_id uuid;
begin
  -- Idempotency ledger, unique on stripe_event_id. `found` is set by INSERT
  -- to true only when a row was actually inserted — ON CONFLICT DO NOTHING
  -- leaves it false on a replay, which is how a genuine duplicate is told
  -- apart from a first delivery.
  insert into public.subscription_events (stripe_event_id, type, payload)
  values (p_stripe_event_id, p_type, p_payload)
  on conflict (stripe_event_id) do nothing;

  if not found then
    return query select true as duplicate, null::uuid as subscription_row_id;
    return;
  end if;

  -- Resolve the subscriptions row: same two-step lookup
  -- (findSubscriptionRowId in apply-subscription-event.ts used to do this
  -- in application code) — try the Stripe customer id first, then fall
  -- back to the Stripe subscription id.
  if p_customer_id is not null then
    select id into v_row_id
    from public.subscriptions
    where stripe_customer_id = p_customer_id;
  end if;

  if v_row_id is null and p_subscription_id is not null then
    select id into v_row_id
    from public.subscriptions
    where stripe_subscription_id = p_subscription_id;
  end if;

  -- No matching row (event unrelated to a row we manage) or no patch to
  -- apply (event type this batch doesn't act on) is not an error — the
  -- event is still recorded and marked complete below, exactly like
  -- applySubscriptionEvent()'s old silent-return behaviour.
  if v_row_id is not null and p_patch is not null then
    -- Only fields present as a key in p_patch are touched — `?` tests key
    -- presence (true even for an explicit JSON null), matching the old
    -- applyPatch(admin, rowId, patch) semantics where a JS object's absent
    -- key left the column untouched but an explicit `null` value cleared it.
    update public.subscriptions
    set
      status = case when p_patch ? 'status' then p_patch ->> 'status' else status end,
      plan = case when p_patch ? 'plan' then p_patch ->> 'plan' else plan end,
      stripe_subscription_id = case
        when p_patch ? 'stripe_subscription_id' then p_patch ->> 'stripe_subscription_id'
        else stripe_subscription_id
      end,
      current_period_end = case
        when p_patch ? 'current_period_end' then (p_patch ->> 'current_period_end')::timestamptz
        else current_period_end
      end,
      updated_at = now()
    where id = v_row_id;
  end if;

  update public.subscription_events
  set processed_at = now()
  where stripe_event_id = p_stripe_event_id;

  return query select false as duplicate, v_row_id as subscription_row_id;
end;
$$;

-- Execute is PUBLIC by default on a freshly created function, and this
-- local Supabase stack's ALTER DEFAULT PRIVILEGES also grants EXECUTE on
-- every new public-schema function directly to anon/authenticated/
-- service_role — revoking from PUBLIC alone does not strip an explicit
-- per-role grant like that, so anon and authenticated are named
-- explicitly here too (confirmed: without these two lines,
-- `authenticated` could still call the function despite the `from public`
-- revoke above having already run). Only service_role may call this
-- function, since it bypasses RLS (it's security definer) to write two
-- tables that no other role may write to directly — without these
-- revokes, anon/authenticated could call the function directly and forge
-- a subscription-state write despite having no table-level grant to do so.
revoke all on function public.apply_stripe_subscription_event(
  text, text, jsonb, text, text, jsonb
) from public, anon, authenticated;

grant execute on function public.apply_stripe_subscription_event(
  text, text, jsonb, text, text, jsonb
) to service_role;
