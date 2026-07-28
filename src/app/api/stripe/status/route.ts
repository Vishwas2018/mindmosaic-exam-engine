import { NextResponse } from "next/server";

import { requireParentSubscriptionRow } from "../_lib/parent-subscription";
import { getStripeClient } from "@/lib/stripe/client";
import { isStripeConfigured } from "@/lib/stripe/config";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Live cancel_at_period_end + current_period_end, read straight from
 * Stripe rather than public.subscriptions — that table has no
 * cancel_at_period_end column (see supabase/migrations/20260720100000),
 * and adding one is a schema change outside this batch's lane. Stripe is
 * already the source of truth for these two fields, so a GET call here
 * costs one extra network round trip and needs no migration.
 */
export async function GET(): Promise<NextResponse> {
  if (!isSupabaseConfigured || !isStripeConfigured) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const gate = await requireParentSubscriptionRow();
  if (!gate.ok) return gate.response;

  if (!gate.row.stripe_subscription_id) {
    return NextResponse.json(
      { status: null, cancelAtPeriodEnd: false, currentPeriodEnd: null },
      { status: 200 },
    );
  }

  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(gate.row.stripe_subscription_id);
  const item = subscription.items.data[0];
  const currentPeriodEnd =
    typeof item?.current_period_end === "number"
      ? new Date(item.current_period_end * 1000).toISOString()
      : null;

  return NextResponse.json(
    {
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd,
    },
    { status: 200 },
  );
}
