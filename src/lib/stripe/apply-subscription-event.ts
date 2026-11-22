import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

import { planForPriceId, type BillingPlan } from "./config";

/**
 * Translates the four Stripe event types this batch handles into a call to
 * the `apply_stripe_subscription_event` RPC (see
 * supabase/migrations/20260723090000_stripe_webhook_transactional_apply.sql),
 * which records the event, applies the subscriptions patch, and marks the
 * event complete in one Postgres transaction — per
 * docs/PRIVACY_AND_BILLING_GUARDRAILS.md, "all billing-state changes ...
 * must be driven by verified webhook events", so this function must only
 * ever be called after the caller has verified the Stripe signature
 * (src/app/api/stripe/webhook/route.ts does that before calling in).
 *
 * Resolving the patch (this file) is kept separate from applying it (the
 * RPC) because checkout.session.completed needs a network call to Stripe
 * (subscriptions.retrieve) to get authoritative status/price/period-end —
 * something a Postgres function cannot do. That call is made before the RPC
 * runs; if it throws, the RPC is never called and the event is never
 * recorded, so the caller's non-2xx response makes Stripe retry cleanly
 * from the start.
 */

type SubscriptionPatch = {
  status: string;
  plan?: BillingPlan | null;
  stripe_subscription_id?: string;
  current_period_end?: string | null;
};

/** Maps Stripe's subscription.status values onto the DB's status check constraint. */
const STRIPE_TO_DB_STATUS: Record<string, string> = {
  trialing: "trialing",
  active: "active",
  past_due: "past_due",
  paused: "paused",
  canceled: "canceled",
  incomplete: "incomplete",
  incomplete_expired: "incomplete",
  unpaid: "past_due",
};

function mapStatus(stripeStatus: string): string {
  return STRIPE_TO_DB_STATUS[stripeStatus] ?? "incomplete";
}

function isoFromUnixSeconds(seconds: number | null | undefined): string | null {
  return typeof seconds === "number" ? new Date(seconds * 1000).toISOString() : null;
}

function customerIdOf(customer: string | { id: string } | null): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

/**
 * current_period_end and price live on the subscription's first item in
 * this API version, not on the subscription itself (Stripe moved billing
 * period tracking to items in the 2025 API versions to support multiple
 * items with independent periods).
 */
function patchFromStripeSubscription(subscription: Stripe.Subscription): SubscriptionPatch {
  const item = subscription.items.data[0];
  const priceId = item?.price?.id ?? null;
  const plan = planForPriceId(priceId);
  return {
    status: mapStatus(subscription.status),
    // An unmapped price must not blank an existing plan: omit the key so the
    // RPC leaves the column untouched (an explicit null would clear it).
    ...(plan ? { plan } : {}),
    stripe_subscription_id: subscription.id,
    current_period_end: isoFromUnixSeconds(item?.current_period_end ?? null),
  };
}

/**
 * Stripe does not guarantee event order, and retries deliver old events late.
 * Writing a stale payload (an `updated` that arrives after `deleted`, or a
 * `payment_failed` after the retry succeeded) would resurrect or downgrade an
 * entitlement. So the event only tells us WHICH subscription changed; the
 * state we write is always the subscription as Stripe holds it right now,
 * which makes every delivery an idempotent re-sync regardless of order.
 * If Stripe says the subscription no longer exists we fall back to the
 * payload, which for a deleted subscription is the canceled state anyway.
 */
async function currentSubscription(
  stripe: Stripe,
  subscriptionId: string,
  fallback: Stripe.Subscription | null,
): Promise<Stripe.Subscription | null> {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    const code = (error as { code?: string; statusCode?: number } | null)?.code;
    const status = (error as { statusCode?: number } | null)?.statusCode;
    if (code === "resource_missing" || status === 404) return fallback;
    throw error;
  }
}

type ResolvedPatch = {
  customerId: string | null;
  subscriptionId: string | null;
  patch: SubscriptionPatch;
};

/**
 * Computes what should be written for one verified Stripe event, without
 * touching the database. Returns null for event types this batch doesn't
 * act on (the RPC still records+completes the event either way) and for a
 * checkout.session.completed session with no subscription attached (there
 * is nothing to patch).
 *
 * The only network call in this whole apply path lives here
 * (stripe.subscriptions.retrieve) — lets it throw; the caller must not call
 * the RPC if this throws.
 */
async function resolveSubscriptionPatch(
  stripe: Stripe,
  event: Stripe.Event,
): Promise<ResolvedPatch | null> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = customerIdOf(session.customer);
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : (session.subscription?.id ?? null);
      if (!subscriptionId) return null;

      // The session payload only carries the subscription id; retrieve the
      // full object to get authoritative status/price/period-end.
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      return { customerId, subscriptionId, patch: patchFromStripeSubscription(subscription) };
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const payload = event.data.object as Stripe.Subscription;
      const customerId = customerIdOf(payload.customer);
      const current = await currentSubscription(stripe, payload.id, payload);
      return {
        customerId,
        subscriptionId: payload.id,
        patch: patchFromStripeSubscription(current ?? payload),
      };
    }

    case "invoice.paid":
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = customerIdOf(invoice.customer);
      const subscriptionRef = invoice.parent?.subscription_details?.subscription ?? null;
      const subscriptionId = typeof subscriptionRef === "string" ? subscriptionRef : (subscriptionRef?.id ?? null);
      if (!subscriptionId) {
        // A one-off invoice with no subscription says nothing about entitlement.
        return null;
      }
      // Late delivery after a successful retry must not flip an active
      // subscription back to past_due: trust Stripe's current status. A paid
      // invoice is a renewal or a recovery; the re-sync picks up the new
      // period end and status.
      const current = await currentSubscription(stripe, subscriptionId, null);
      if (current) return { customerId, subscriptionId, patch: patchFromStripeSubscription(current) };
      return {
        customerId,
        subscriptionId,
        patch: event.type === "invoice.payment_failed" ? { status: "past_due" } : null,
      };
    }

    default:
      return null;
  }
}

export type ApplyOutcome = "applied" | "duplicate";

/** Thrown when the RPC itself errors (DB-side failure, e.g. the patch update fails). */
export class SubscriptionEventApplyError extends Error {
  constructor(cause: string) {
    super(`apply_stripe_subscription_event RPC failed: ${cause}`);
    this.name = "SubscriptionEventApplyError";
  }
}

/**
 * Applies one verified Stripe event. Throws (never swallows) on any
 * failure — a Stripe retrieval failure (network/API error from
 * resolveSubscriptionPatch) propagates as-is; an RPC-side failure is
 * wrapped as SubscriptionEventApplyError. Either way, the caller
 * (src/app/api/stripe/webhook/route.ts) must respond non-2xx so Stripe
 * retries, and — because the RPC does its work in one transaction — no
 * event has been left half-recorded for the caller to reconcile.
 */
export async function applySubscriptionEvent(
  admin: SupabaseClient,
  stripe: Stripe,
  event: Stripe.Event,
): Promise<ApplyOutcome> {
  const resolved = await resolveSubscriptionPatch(stripe, event);

  const { data, error } = await admin.rpc("apply_stripe_subscription_event", {
    p_stripe_event_id: event.id,
    p_type: event.type,
    p_payload: event as unknown as Record<string, unknown>,
    p_customer_id: resolved?.customerId ?? null,
    p_subscription_id: resolved?.subscriptionId ?? null,
    p_patch: resolved?.patch ?? null,
  });

  if (error) {
    throw new SubscriptionEventApplyError(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;
  return row?.duplicate ? "duplicate" : "applied";
}
