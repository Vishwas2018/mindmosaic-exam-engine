-- Billing data + entitlement foundation (Phase 6, data-only batch).
--
-- Scope: schema, the trial-provisioning trigger, entitlement helper
-- functions, and RLS. No Stripe SDK, no route/feature gating, no UI —
-- see docs/PRIVACY_AND_BILLING_GUARDRAILS.md ("Billing status determines
-- feature access ... but must never gate whether a guest can practise";
-- enforcement is a later batch, not this one).
--
-- Model: guests always free (untouched by this migration). A signed-in
-- parent gets a 7-day, no-card trial the moment their profile is created
-- (handled entirely in Postgres, no Stripe call involved yet). One Family
-- plan, up to 3 children, monthly or annual. Stripe wiring (customer id,
-- subscription id, webhook-driven status transitions) lands in a later
-- batch and writes through the service role — never through a client
-- policy, per the "verified webhook events, not a client callback" rule
-- in the guardrails doc.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- One row per parent. Created automatically (trialing) when a parent
-- profile is created; later updated only by the security-definer trigger
-- below or, in a future batch, a service-role Stripe webhook handler.
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null unique references public.profiles (id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null check (
    status in (
      'trialing',
      'active',
      'past_due',
      'paused',
      'canceled',
      'incomplete',
      'trial_expired'
    )
  ),
  plan text check (plan in ('family_monthly', 'family_annual')),
  seats int not null default 3,
  trial_end timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Webhook audit log + idempotency key. Written only by the (future)
-- service-role webhook handler, never by client code.
create table public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text unique,
  type text,
  payload jsonb,
  received_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Trial provisioning on parent sign-up
--
-- Every new parent profile gets a 7-day, no-card trial with no Stripe
-- involvement. on_conflict guards re-running this trigger against a parent
-- who (somehow) already has a subscriptions row rather than erroring.
-- ---------------------------------------------------------------------------

create or replace function public.create_parent_trial_subscription()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.subscriptions (parent_id, status, trial_end, seats)
  values (new.id, 'trialing', now() + interval '7 days', 3)
  on conflict (parent_id) do nothing;
  return new;
end;
$$;

create trigger on_parent_profile_created
  after insert on public.profiles
  for each row
  when (new.role = 'parent')
  execute function public.create_parent_trial_subscription();

-- ---------------------------------------------------------------------------
-- Entitlement helpers
--
-- Single source of truth for "does this parent currently have access":
-- either an unexpired trial, or an active/past_due subscription whose
-- current billing period hasn't ended yet (past_due still has access —
-- Stripe gives a dunning window before it lapses to canceled).
-- ---------------------------------------------------------------------------

create or replace function public.has_active_access(p uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.subscriptions s
    where s.parent_id = p
      and (
        (s.status = 'trialing' and s.trial_end > now())
        or (s.status in ('active', 'past_due') and s.current_period_end > now())
      )
  );
$$;

create or replace function public.current_parent_has_access()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.has_active_access(auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Default-deny, same posture as every other table in this project. A
-- parent may only ever read their own row. There are deliberately no
-- insert/update/delete policies for authenticated on either table: every
-- write to subscriptions happens via the security-definer trigger above,
-- and every write to subscription_events (and later subscriptions-status
-- transitions) happens via a service-role webhook handler — never the
-- client, per docs/PRIVACY_AND_BILLING_GUARDRAILS.md.
-- ---------------------------------------------------------------------------

alter table public.subscriptions enable row level security;
alter table public.subscription_events enable row level security;

revoke all on public.subscriptions from anon;
revoke all on public.subscription_events from anon;

-- subscription_events is service-role only: no policy is granted to
-- authenticated at all, and the explicit revoke below is belt-and-braces
-- on top of RLS's own default-deny.
revoke all on public.subscription_events from authenticated;

create policy "subscriptions: parent reads own" on public.subscriptions
  for select to authenticated
  using (parent_id = auth.uid());

-- No insert/update/delete policies on subscriptions for authenticated:
-- writes only ever come from the trigger above (security definer) or,
-- later, the service-role webhook handler.
