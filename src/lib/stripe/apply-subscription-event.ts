import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

import { planForPriceId, type BillingPlan } from "./config";

/**
 * Translates the four Stripe event types this batch handles into a write on
 * the matching public.subscriptions row, via the service-role client. This
 * is the only place billing-state writes happen outside the app-tracked
 * trial trigger — per docs/PRIVACY_AND_BILLING_GUARDRAILS.md, "all
 * billing-state changes ... must be driven by verified webhook events", so
 * this function must only ever be called after the caller has verified the
 * Stripe signature (src/app/api/stripe/webhook/route.ts does that before
 * calling in).
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
  return {
    status: mapStatus(subscription.status),
    plan: planForPriceId(priceId),
    stripe_subscription_id: subscription.id,
    current_period_end: isoFromUnixSeconds(item?.current_period_end ?? null),
  };
}

async function findSubscriptionRowId(
  admin: SupabaseClient,
  ids: { customerId?: string | null; subscriptionId?: string | null },
): Promise<string | null> {
  if (ids.customerId) {
    const { data } = await admin
      .from("subscriptions")
      .select("id")
      .eq("stripe_customer_id", ids.customerId)
      .maybeSingle();
    if (data) return data.id as string;
  }
  if (ids.subscriptionId) {
    const { data } = await admin
      .from("subscriptions")
      .select("id")
      .eq("stripe_subscription_id", ids.subscriptionId)
      .maybeSingle();
    if (data) return data.id as string;
  }
  return null;
}

async function applyPatch(
  admin: SupabaseClient,
  rowId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  await admin.from("subscriptions").update(patch).eq("id", rowId);
}

/**
 * Applies one verified Stripe event to public.subscriptions. Unrecognised
 * event types are ignored (the webhook route can be subscribed to more
 * event types than this batch handles without erroring). Returns silently
 * (no throw) when no matching subscriptions row can be found — that can
 * happen for events unrelated to a row we manage, and the caller has
 * already recorded the event in subscription_events either way.
 */
export async function applySubscriptionEvent(
  admin: SupabaseClient,
  stripe: Stripe,
  event: Stripe.Event,
): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = customerIdOf(session.customer);
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : (session.subscription?.id ?? null);
      if (!subscriptionId) return;

      // The session payload only carries the subscription id; retrieve the
      // full object to get authoritative status/price/period-end.
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const rowId = await findSubscriptionRowId(admin, { customerId, subscriptionId });
      if (!rowId) return;
      await applyPatch(admin, rowId, patchFromStripeSubscription(subscription));
      return;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = customerIdOf(subscription.customer);
      const rowId = await findSubscriptionRowId(admin, { customerId, subscriptionId: subscription.id });
      if (!rowId) return;
      await applyPatch(admin, rowId, patchFromStripeSubscription(subscription));
      return;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = customerIdOf(invoice.customer);
      const subscriptionRef = invoice.parent?.subscription_details?.subscription ?? null;
      const subscriptionId = typeof subscriptionRef === "string" ? subscriptionRef : (subscriptionRef?.id ?? null);
      const rowId = await findSubscriptionRowId(admin, { customerId, subscriptionId });
      if (!rowId) return;
      await applyPatch(admin, rowId, { status: "past_due" });
      return;
    }

    default:
      return;
  }
}
