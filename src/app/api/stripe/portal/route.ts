import { NextResponse } from "next/server";

import { getStripeClient } from "@/lib/stripe/client";
import { isStripeConfigured } from "@/lib/stripe/config";
import { createSubscriptionsAdminClient } from "@/lib/stripe/subscriptions-admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Returns a Stripe Customer Portal session URL scoped to the signed-in
 * parent's own Stripe customer. Same auth+role pattern as
 * /api/stripe/checkout. A parent with no `stripe_customer_id` yet (never
 * checked out) gets a 404 — a portal session can't be scoped to a
 * customer that doesn't exist.
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (!isSupabaseConfigured || !isStripeConfigured) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "parent") {
    return NextResponse.json({ error: "parents_only" }, { status: 403 });
  }

  const admin = createSubscriptionsAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const { data: subscriptionRow, error: fetchError } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("parent_id", user.id)
    .maybeSingle();
  if (fetchError || !subscriptionRow?.stripe_customer_id) {
    return NextResponse.json({ error: "no_stripe_customer" }, { status: 404 });
  }

  const origin = request.headers.get("origin") ?? new URL(request.url).origin;

  const stripe = getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: subscriptionRow.stripe_customer_id,
    return_url: `${origin}/parent`,
  });

  return NextResponse.json({ url: session.url }, { status: 200 });
}
