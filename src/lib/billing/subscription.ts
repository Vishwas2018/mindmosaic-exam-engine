import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Read-only lookup of the signed-in parent's subscription row, for display
 * in the parent dashboard billing panel. Mirrors the read-only pattern in
 * src/features/parent-dashboard/queries.ts: runs as the signed-in parent
 * through the anon-key server client, so RLS ("subscriptions: parent reads
 * own", supabase/migrations/20260720100000_subscriptions.sql) is the
 * enforcement mechanism — no service-role key, no write, ever.
 *
 * `hasAccess` here is a simple derived read for display copy only (e.g.
 * "Trial expired"). It intentionally mirrors the SQL has_active_access()
 * function's condition, but is NOT wired into any route guard or gating
 * logic — enforcement is a separate, later batch
 * (docs/PRIVACY_AND_BILLING_GUARDRAILS.md).
 */

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "paused"
  | "canceled"
  | "incomplete"
  | "trial_expired";

export interface MySubscriptionDetails {
  status: SubscriptionStatus;
  plan: "family_monthly" | "family_annual" | null;
  trialEnd: string | null;
  currentPeriodEnd: string | null;
  seats: number;
  /** Display-only derived flag — not an entitlement/gating check. */
  hasAccess: boolean;
}

export type MySubscriptionResult =
  | { status: "error" }
  | { status: "ready"; subscription: MySubscriptionDetails | null };

interface SubscriptionRow {
  status: SubscriptionStatus;
  plan: "family_monthly" | "family_annual" | null;
  trial_end: string | null;
  current_period_end: string | null;
  seats: number;
}

function deriveHasAccess(row: SubscriptionRow): boolean {
  const now = Date.now();
  if (row.status === "trialing") {
    return row.trial_end !== null && new Date(row.trial_end).getTime() > now;
  }
  if (row.status === "active" || row.status === "past_due") {
    return (
      row.current_period_end !== null &&
      new Date(row.current_period_end).getTime() > now
    );
  }
  return false;
}

export async function getMySubscription(): Promise<MySubscriptionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { status: "error" };
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .select("status, plan, trial_end, current_period_end, seats")
    .eq("parent_id", user.id)
    .maybeSingle();

  if (error) {
    return { status: "error" };
  }

  if (!data) {
    return { status: "ready", subscription: null };
  }

  const row = data as SubscriptionRow;
  return {
    status: "ready",
    subscription: {
      status: row.status,
      plan: row.plan,
      trialEnd: row.trial_end,
      currentPeriodEnd: row.current_period_end,
      seats: row.seats,
      hasAccess: deriveHasAccess(row),
    },
  };
}
