import { NextResponse } from "next/server";

import { checkOrigin } from "@/features/auth/require-origin";
import { getStripeClient } from "@/lib/stripe/client";
import { isStripeConfigured } from "@/lib/stripe/config";
import { isSupabaseConfigured } from "@/lib/supabase/config";

import { requireParentSubscriptionRow } from "../_lib/parent-subscription";

/** Undoes a pending cancel-at-period-end (see ../cancel/route.ts). */
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
    cancel_at_period_end: false,
  });

  return NextResponse.json({ cancelAtPeriodEnd: subscription.cancel_at_period_end }, { status: 200 });
}
