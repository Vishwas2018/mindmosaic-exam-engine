import { NextResponse } from "next/server";

import { getStripeClient } from "@/lib/stripe/client";
import { isStripeConfigured } from "@/lib/stripe/config";
import { isSupabaseConfigured } from "@/lib/supabase/config";

import { requireParentSubscriptionRow } from "../_lib/parent-subscription";

export interface InvoiceSummary {
  id: string;
  createdAt: string;
  amount: number;
  currency: string;
  status: string;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
}

const INVOICE_LIMIT = 12;

/** Invoice history for the signed-in parent's Stripe customer, newest first. */
export async function GET(): Promise<NextResponse> {
  if (!isSupabaseConfigured || !isStripeConfigured) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const gate = await requireParentSubscriptionRow();
  if (!gate.ok) return gate.response;

  if (!gate.row.stripe_customer_id) {
    return NextResponse.json({ invoices: [] satisfies InvoiceSummary[] }, { status: 200 });
  }

  const stripe = getStripeClient();
  const list = await stripe.invoices.list({
    customer: gate.row.stripe_customer_id,
    limit: INVOICE_LIMIT,
  });

  const invoices: InvoiceSummary[] = list.data.map((invoice) => ({
    id: invoice.id ?? "",
    createdAt: new Date(invoice.created * 1000).toISOString(),
    amount: invoice.amount_paid,
    currency: invoice.currency,
    status: invoice.status ?? "unknown",
    hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
    invoicePdf: invoice.invoice_pdf ?? null,
  }));

  return NextResponse.json({ invoices }, { status: 200 });
}
