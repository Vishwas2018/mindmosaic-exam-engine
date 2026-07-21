import "server-only";

import type { BillingPlan } from "@/lib/stripe/config";
import { createClient } from "@/lib/supabase/server";

export interface MySubscription {
  status: string | null;
  plan: BillingPlan | null;
  trialEnd: string | null;
  currentPeriodEnd: string | null;
  seats: number | null;
  hasAccess: boolean;
}

const ACCESS_GRANTING_STATUSES = new Set(["active", "past_due"]);

/**
 * Mirrors public.has_active_access()/current_parent_has_access() from
 * supabase/migrations/20260720100000_subscriptions.sql:
 *   (status = 'trialing' and trial_end > now())
 *   or (status in ('active', 'past_due') and current_period_end > now())
 *
 * Replicated in TS rather than called via `.rpc()`: no other read path in
 * this codebase uses supabase.rpc() (every existing query is a plain
 * .from().select()), so this stays consistent with that convention rather
 * than introducing the first RPC call. The DB function remains the actual
 * enforcement point (it's what RLS-adjacent policies and any future
 * server-side gating should call); this is a read-only mirror for display
 * purposes only, so a values-only drift here doesn't create a privilege
 * bug, but if the SQL logic above ever changes, update this function to
 * match.
 */
function computeHasAccess(row: {
  status: string | null;
  trial_end: string | null;
  current_period_end: string | null;
}): boolean {
  const now = Date.now();
  if (row.status === "trialing" && row.trial_end) {
    return new Date(row.trial_end).getTime() > now;
  }
  if (row.status && ACCESS_GRANTING_STATUSES.has(row.status) && row.current_period_end) {
    return new Date(row.current_period_end).getTime() > now;
  }
  return false;
}

/**
 * Reads the calling parent's own billing state. Uses the normal
 * RLS-scoped client (no service role needed) — the "subscriptions: parent
 * reads own" policy already permits `parent_id = auth.uid()` selects.
 * Returns null when nobody is signed in, or when the caller has no
 * subscriptions row yet (e.g. not a parent).
 */
export async function getMySubscription(): Promise<MySubscription | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: row } = await supabase
    .from("subscriptions")
    .select("status, plan, trial_end, current_period_end, seats")
    .eq("parent_id", user.id)
    .maybeSingle();
  if (!row) return null;

  return {
    status: row.status,
    plan: (row.plan as BillingPlan | null) ?? null,
    trialEnd: row.trial_end,
    currentPeriodEnd: row.current_period_end,
    seats: row.seats,
    hasAccess: computeHasAccess(row),
  };
}
