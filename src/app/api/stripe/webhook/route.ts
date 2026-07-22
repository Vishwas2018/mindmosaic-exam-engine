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
 *  2. Idempotency: the event id is inserted into subscription_events
 *     (unique on stripe_event_id) BEFORE any subscriptions row is
 *     touched. If that insert hits the unique-constraint conflict — this
 *     event was already processed, which Stripe's at-least-once delivery
 *     makes routine — the row update is skipped and 200 is still
 *     returned (200 tells Stripe not to retry; only a genuine failure to
 *     verify/process should return non-2xx).
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

  const { error: insertError } = await admin.from("subscription_events").insert({
    stripe_event_id: event.id,
    type: event.type,
    payload: event as unknown as Record<string, unknown>,
  });

  if (insertError) {
    // Postgres unique_violation: this event id was already recorded, i.e.
    // already processed. Stripe retries on anything but 2xx, so this must
    // still return 200 — re-processing it would double-apply the update.
    if (insertError.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }
    return NextResponse.json({ error: "event_log_failed" }, { status: 500 });
  }

  await applySubscriptionEvent(admin, stripe, event);

  return NextResponse.json({ received: true }, { status: 200 });
}
