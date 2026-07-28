import "server-only";

import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createSubscriptionsAdminClient } from "@/lib/stripe/subscriptions-admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Shared auth + row lookup for the read/write Stripe routes added alongside
 * checkout/portal (payment-method, invoices, cancel, resume, status): same
 * "signed-in parent, then service-role row fetch" shape those two already
 * use, factored out so five routes don't each re-type the same ~20 lines.
 * A leading underscore keeps this directory out of Next's route resolution
 * (see Next's file-based routing docs) — it holds a helper module, not a
 * handler.
 */

export interface SubscriptionRow {
  id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

export type ParentSubscriptionGate =
  | { ok: true; userId: string; admin: SupabaseClient; row: SubscriptionRow }
  | { ok: false; response: NextResponse };

export async function requireParentSubscriptionRow(): Promise<ParentSubscriptionGate> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "unauthenticated" }, { status: 401 }) };
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "parent") {
    return { ok: false, response: NextResponse.json({ error: "parents_only" }, { status: 403 }) };
  }

  const admin = createSubscriptionsAdminClient();
  if (!admin) {
    return { ok: false, response: NextResponse.json({ error: "not_configured" }, { status: 503 }) };
  }

  const { data: row, error } = await admin
    .from("subscriptions")
    .select("id, stripe_customer_id, stripe_subscription_id")
    .eq("parent_id", user.id)
    .maybeSingle();
  if (error || !row) {
    return { ok: false, response: NextResponse.json({ error: "subscription_not_found" }, { status: 404 }) };
  }

  return { ok: true, userId: user.id, admin, row: row as SubscriptionRow };
}
