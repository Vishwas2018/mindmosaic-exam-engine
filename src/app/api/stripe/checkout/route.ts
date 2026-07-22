import { NextResponse } from "next/server";
import { z } from "zod";

import { getStripeClient } from "@/lib/stripe/client";
import { isStripeConfigured, priceIdForPlan } from "@/lib/stripe/config";
import { createSubscriptionsAdminClient } from "@/lib/stripe/subscriptions-admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const checkoutRequestSchema = z.object({
  plan: z.enum(["family_monthly", "family_annual"]),
});

/**
 * Creates a Stripe Checkout Session for the signed-in parent's chosen
 * plan and returns its URL. Auth+role pattern matches
 * src/app/api/teacher/assignments/route.ts: not-configured guard first,
 * then request-scoped auth.getUser(), then a profiles.role check — never
 * a client-supplied identity claim.
 *
 * Card entry itself happens entirely on Stripe's hosted Checkout page
 * (docs/PRIVACY_AND_BILLING_GUARDRAILS.md: "card data ... never transits
 * or is logged by MindMosaic's own servers"); this route never sees a
 * card number. The `stripe_customer_id` write goes through the
 * service-role client because RLS deliberately grants `authenticated` no
 * write policy on public.subscriptions.
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

  const body = await request.json().catch(() => null);
  const parsed = checkoutRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const { plan } = parsed.data;

  const priceId = priceIdForPlan(plan);
  if (!priceId) {
    return NextResponse.json({ error: "plan_not_configured" }, { status: 503 });
  }

  const admin = createSubscriptionsAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const { data: subscriptionRow, error: fetchError } = await admin
    .from("subscriptions")
    .select("id, stripe_customer_id")
    .eq("parent_id", user.id)
    .maybeSingle();
  if (fetchError || !subscriptionRow) {
    return NextResponse.json({ error: "subscription_not_found" }, { status: 404 });
  }

  const stripe = getStripeClient();

  // Reuse an existing Stripe customer if one is already linked — never
  // create a duplicate customer for the same parent.
  let customerId: string | null = subscriptionRow.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { parent_id: user.id },
    });
    customerId = customer.id;

    const { error: linkError } = await admin
      .from("subscriptions")
      .update({ stripe_customer_id: customerId })
      .eq("id", subscriptionRow.id);
    if (linkError) {
      return NextResponse.json({ error: "customer_link_failed" }, { status: 500 });
    }
  }

  const origin = request.headers.get("origin") ?? new URL(request.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    // Redundant path back to the parent id alongside stripe_customer_id
    // matching, in case the webhook fires before the customer-id write
    // above has propagated to a read replica.
    metadata: { parent_id: user.id, plan },
    subscription_data: { metadata: { parent_id: user.id, plan } },
    success_url: `${origin}/parent?checkout=success`,
    cancel_url: `${origin}/parent?checkout=cancelled`,
  });

  if (!session.url) {
    return NextResponse.json({ error: "checkout_session_failed" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url }, { status: 200 });
}
