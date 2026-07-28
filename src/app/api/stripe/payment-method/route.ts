import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getStripeClient } from "@/lib/stripe/client";
import { isStripeConfigured } from "@/lib/stripe/config";
import { isSupabaseConfigured } from "@/lib/supabase/config";

import { requireParentSubscriptionRow } from "../_lib/parent-subscription";

export interface PaymentMethodSummary {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

/**
 * Returns the signed-in parent's default card on file, for display only —
 * updating it happens on Stripe's own hosted customer portal
 * (/api/stripe/portal), never through a card form on this domain (see
 * docs/PRIVACY_AND_BILLING_GUARDRAILS.md: "no cardholder data ever transits
 * ... MindMosaic's own servers").
 */
export async function GET(): Promise<NextResponse> {
  if (!isSupabaseConfigured || !isStripeConfigured) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const gate = await requireParentSubscriptionRow();
  if (!gate.ok) return gate.response;

  if (!gate.row.stripe_customer_id) {
    return NextResponse.json({ paymentMethod: null }, { status: 200 });
  }

  const stripe = getStripeClient();
  const customer = await stripe.customers.retrieve(gate.row.stripe_customer_id, {
    expand: ["invoice_settings.default_payment_method"],
  });

  if (customer.deleted) {
    return NextResponse.json({ paymentMethod: null }, { status: 200 });
  }

  let card: Stripe.PaymentMethod | null = null;
  const defaultMethod = customer.invoice_settings.default_payment_method;
  if (defaultMethod && typeof defaultMethod !== "string") {
    card = defaultMethod;
  } else {
    const methods = await stripe.paymentMethods.list({
      customer: gate.row.stripe_customer_id,
      type: "card",
      limit: 1,
    });
    card = methods.data[0] ?? null;
  }

  if (!card?.card) {
    return NextResponse.json({ paymentMethod: null }, { status: 200 });
  }

  const paymentMethod: PaymentMethodSummary = {
    brand: card.card.brand,
    last4: card.card.last4,
    expMonth: card.card.exp_month,
    expYear: card.card.exp_year,
  };

  return NextResponse.json({ paymentMethod }, { status: 200 });
}
