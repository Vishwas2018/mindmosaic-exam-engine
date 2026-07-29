import { NextResponse } from "next/server";

import { checkOrigin } from "@/features/auth/require-origin";
import { getStripeClient } from "@/lib/stripe/client";
import { isStripeConfigured } from "@/lib/stripe/config";
import { isSupabaseConfigured } from "@/lib/supabase/config";

import { requireParentSubscriptionRow } from "../_lib/parent-subscription";

/**
 * Cancel-at-period-end (not an immediate cancel): the parent keeps access
 * through the current billing period, matching how the Stripe customer
 * portal itself handles cancellation. The DB row's `status` is left alone
 * here — it only changes when Stripe's own webhook fires
 * customer.subscription.updated/deleted at the end of the period
 * (src/app/api/stripe/webhook/route.ts), per
 * docs/PRIVACY_AND_BILLING_GUARDRAILS.md's "driven by verified webhook
 * events, not a client callback".
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (!isSupabaseConfigured || !isStripeConfigured) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const originCheck = checkOrigin(request);
  if (!originCheck.ok) {
    return originCheck.response;
  }

  const gate = await requireParentSubscriptionRow();
  if (!gate.ok) return gate.response;

  if (!gate.row.stripe_subscription_id) {
    return NextResponse.json({ error: "no_active_subscription" }, { status: 404 });
  }

  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.update(gate.row.stripe_subscription_id, {
    cancel_at_period_end: true,
  });
  const item = subscription.items.data[0];
  const currentPeriodEnd =
    typeof item?.current_period_end === "number"
      ? new Date(item.current_period_end * 1000).toISOString()
      : null;

  return NextResponse.json(
    { cancelAtPeriodEnd: subscription.cancel_at_period_end, currentPeriodEnd },
    { status: 200 },
  );
}
