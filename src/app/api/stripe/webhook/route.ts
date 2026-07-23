import { NextResponse } from "next/server";

import { applySubscriptionEvent } from "@/lib/stripe/apply-subscription-event";
import { getStripeClient } from "@/lib/stripe/client";
import { STRIPE_WEBHOOK_SECRET, isStripeConfigured, isStripeWebhookConfigured } from "@/lib/stripe/config";
import { createSubscriptionsAdminClient } from "@/lib/stripe/subscriptions-admin";

/**
 * Stripe webhook receiver. Per docs/PRIVACY_AND_BILLING_GUARDRAILS.md
 * ("All billing-state changes ... must be driven by verified webhook
 * events ... not by trusting a client-side callback"), this is the ONLY
 * path that ever writes subscription status — never a client callback.
 *
 * Two guarantees this route provides, in order:
 *  1. The raw body's signature is verified against STRIPE_WEBHOOK_SECRET
 *     before anything in the payload is trusted. An invalid or missing
 *     signature is rejected with 400 and the body is never parsed as an
 *     event.
 *  2. Idempotency + atomicity (MM-SEC-01 fix): recording the event, applying
 *     the subscriptions patch, and marking the event complete all happen in
 *     one Postgres transaction inside the apply_stripe_subscription_event
 *     RPC (applySubscriptionEvent() calls it — see
 *     src/lib/stripe/apply-subscription-event.ts and
 *     supabase/migrations/20260723090000_stripe_webhook_transactional_apply.sql).
 *     A genuine replay of an already-completed event comes back marked
 *     `duplicate` and still gets 200 (200 tells Stripe not to retry); any
 *     other failure — Stripe retrieval, or the RPC itself erroring — is
 *     never swallowed and always yields a non-2xx response so Stripe
 *     retries instead of silently losing the entitlement write.
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (!isStripeConfigured || !isStripeWebhookConfigured) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  const stripe = getStripeClient();
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
  } catch {
    // Do not process an unverified body: reject before it's ever parsed as
    // a trusted Stripe event.
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  const admin = createSubscriptionsAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  let outcome;
  try {
    outcome = await applySubscriptionEvent(admin, stripe, event);
  } catch (error) {
    // Never silently discard a processing failure: whether this is a
    // Stripe retrieval failure (resolveSubscriptionPatch's network call to
    // Stripe) or the apply_stripe_subscription_event RPC itself erroring,
    // the event is guaranteed NOT to be marked processed (the RPC does its
    // work in one transaction), so a non-2xx here makes Stripe retry
    // against a clean slate rather than treating this as done.
    const message = error instanceof Error ? error.message : String(error);
    console.error("[stripe webhook] failed to apply event", event.id, event.type, message);
    return NextResponse.json({ error: "event_apply_failed" }, { status: 502 });
  }

  return NextResponse.json(
    { received: true, ...(outcome === "duplicate" ? { duplicate: true } : {}) },
    { status: 200 },
  );
}
