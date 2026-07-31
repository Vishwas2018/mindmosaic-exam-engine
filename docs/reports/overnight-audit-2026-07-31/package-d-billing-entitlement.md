# Package D — billing/entitlement audit

Live project. Code trace plus one rolled-back RPC probe (`BEGIN...ROLLBACK`,
confirmed zero residue afterward).

## The premise has changed here too

The brief assumes the `stripe_webhook_transactional_apply` migration is
still unapplied and that `processed_at`/`apply_stripe_subscription_event`
are absent live. Package A reconfirmed, independently, that this migration
**is** applied (commit `49760cf`, already on `main`). So the question this
package actually answers is not "what protection exists given the RPC is
missing" but "does the now-present RPC actually deliver the idempotency
guarantee it claims to."

## Webhook idempotency — empirically confirmed, not just read from source

`src/app/api/stripe/webhook/route.ts:36-51` rejects any request without a
valid `stripe-signature` header verified against `STRIPE_WEBHOOK_SECRET`
*before* the body is ever parsed as a trusted event — no unverified payload
reaches the apply path.

`applySubscriptionEvent()` (`src/lib/stripe/apply-subscription-event.ts:155-177`)
calls the RPC with the event id, type, full payload, and a resolved patch.
I called the live RPC directly, twice, with the same fabricated event id,
inside one rolled-back transaction:

```
first call:              {"duplicate":false,"subscription_row_id":null}
replay (same event id):  {"duplicate":true,"subscription_row_id":null}
subscription_events row inside txn: processed=true
residue after rollback (expect 0): 0
```

This is the guarantee working end-to-end: `insert ... on conflict
(stripe_event_id) do nothing` (`20260723090000_stripe_webhook_transactional_apply.sql`)
correctly distinguishes first-delivery from replay via Postgres's own
`FOUND` variable, and does so inside the single transaction the whole RPC
runs in — so a genuine duplicate delivery gets marked duplicate and returns
200 (Stripe stops retrying), while a Stripe-retrieval failure or an RPC
error propagates as a thrown `SubscriptionEventApplyError`
(`apply-subscription-event.ts:139-144`) that the route turns into a 502
(`webhook/route.ts:61-71`) — Stripe retries, and because everything happened
in one transaction, nothing was left half-recorded to reconcile.

**What "replay/out-of-order protection actually exists right now," stated
plainly: exactly what the code intends, and it is live-verified.** The
brief's implied worse case (no protection because the migration never
landed) does not describe this project's actual current state.

## Untested in production, for an honest reason

`subscription_events` has **0 rows** (confirmed in both Package A and this
package). **No real Stripe webhook has ever been delivered to this
project.** The RPC's correctness above is proven by direct call, not by
observing it survive a real Stripe delivery — there is no such delivery to
observe yet. This matters for the go-live decision in Package G: the path is
correct by construction and by direct test, but it has zero production
mileage.

## Trial creation — confirmed against the one real account

`create_parent_trial_subscription()` fires `after insert on public.profiles
... when (new.role = 'parent')` (`20260720100000_subscriptions.sql:67-85`),
inserting a 7-day trial, `on conflict (parent_id) do nothing` (guards a
double-fire). Checked the real parent's live row:

```
parent_id: 583dab64-...   status: trialing
trial_end: 2026-08-02T10:45:05.662Z
```

Parent profile was created `2026-07-26T10:45:05.664008Z` — trial_end is
that instant plus exactly 7 days, to the second. The trigger fired
correctly for the one real account that exists to check it against. Two
days of trial remain as of this audit.

## Entitlements are server-authoritative — confirmed by call site, not by intent alone

`requireActiveSubscription()` (`src/features/billing/require-active-subscription.ts:33-53`)
is called from `src/app/parent/layout.tsx:24` and `src/app/student/layout.tsx:24`
— both server components, both `layout.tsx` files that every request under
`/parent` and `/student` passes through before any page renders. It resolves
access via `supabase.rpc("current_parent_has_access")` /
`supabase.rpc("has_active_access", {p: parentId})` — both `security definer`
SQL functions that read the live `subscriptions` table
(`20260720100000_subscriptions.sql:96-122`) — never from anything the
client asserts about its own plan. A student inherits access from any
linked parent with access, checked per-parent via the same RPC
(`require-active-subscription.ts:44-49`); a student with no linked parent
falls through to `redirect("/billing")`. This is genuinely server-side and
cannot be bypassed by a client that lies about its own state, because there
is no client state involved in the decision at all.

## The gate is currently a global no-op — reported, not a code defect

`isBillingEnforcementEnabled()` gates the entire function
(`require-active-subscription.ts:34`: `if (!isBillingEnforcementEnabled())
return;`). `BILLING_ENFORCEMENT_ENABLED` is **not set** in `.env.local` —
only an empty placeholder exists in `.env.local.example:47` with the
documented default-off behavior. So today, regardless of any subscription's
real status (trialing, expired, canceled), every parent and student passes
this gate freely. This was an intentional design (`require-active-
subscription.ts`'s own comment: "shipping this file changes nothing until a
later batch flips the flag") written before `/billing` existed as a real
page — it does now (`src/app/billing/layout.tsx` and the route appear in
`npm run build`'s output). Whether to flip it is a product decision, not
something this audit is deciding; it is reported here because "family
go-live" readiness (Package G) depends on knowing entitlement is currently
unenforced, correctly built but switched off.

## Scope note — what was not deeply examined

Given the time available, `src/app/api/stripe/checkout`, `/cancel`,
`/portal`, `/resume`, `/status`, and `/invoices` route handlers were not
traced line-by-line the way the webhook path was. Nothing here should be
read as a claim that those routes are clean; they are simply out of scope
for this pass and worth a dedicated look before launch if billing goes live
before the trial audience grows past this one household.

## Verdict

| Guarantee | Status | Evidence |
|---|---|---|
| Webhook idempotency (replay-safe, one transaction) | **IMPLEMENTED, live-verified** | Direct rolled-back RPC call: first=applied, replay=duplicate, both inside one transaction, zero residue |
| Out-of-order/failure handling (never silently drops an entitlement write) | **IMPLEMENTED** | `webhook/route.ts:61-71` — any RPC or Stripe-retrieval failure yields non-2xx, nothing marked processed |
| Trial creation | **IMPLEMENTED, confirmed against real data** | Live `subscriptions` row's `trial_end` matches `profiles.created_at + 7 days` exactly |
| Server-authoritative entitlements (not client-trusted) | **IMPLEMENTED** | Both call sites are server `layout.tsx` files; decision is 100% RPC-derived, no client input in the check |
| Entitlement actually enforced today | **NO — by design, currently off** | `BILLING_ENFORCEMENT_ENABLED` unset; `/parent` and `/student` are open to everyone regardless of subscription state until this flag is flipped |
