import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { isBillingEnforcementEnabled } from "./config";

export type SubscriptionGateRole = "parent" | "student";

/**
 * Central billing gate for the parent/student role trees, mirroring
 * require-role.ts's shape: called once per request from each role's
 * layout.tsx, after requireRole has already confirmed a signed-in profile
 * of that role. Guests and unauthenticated visitors never reach here — they
 * never get past requireRole's own redirect — so this file has no guest
 * path to protect and none to accidentally gate (see
 * docs/PRIVACY_AND_BILLING_GUARDRAILS.md: "must never gate whether a guest
 * can practise").
 *
 * BILLING_ENFORCEMENT_ENABLED defaults off (see ./config.ts): while off this
 * is a no-op, so shipping this file changes nothing until a later batch
 * flips the flag.
 *
 * A parent's own entitlement is current_parent_has_access() (an unexpired
 * trial or a paid subscription in good standing). A student's entitlement is
 * inherited from their linked parent(s) and decides how much of the bank they
 * are served (student-access.ts), not whether they can sign in.
 */
export async function requireActiveSubscription(
  userId: string,
  role: SubscriptionGateRole,
): Promise<void> {
  if (!isBillingEnforcementEnabled()) return;

  /*
   * Only parents are redirected. A student without access is NOT sent to
   * /billing: a child cannot buy anything, and the Free plan promises them a
   * sample of every programme. They keep reaching practice; the exam session
   * route narrows what they are served to the free sample
   * (see ./student-access.ts and src/lib/billing/free-sample.ts).
   */
  if (role === "student") return;

  const supabase = await createClient();
  const { data: hasAccess } = await supabase.rpc("current_parent_has_access");
  if (!hasAccess) redirect("/billing");
}
