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
 * trial or a paid subscription in good standing). A student has no
 * subscription of their own — they inherit access from whichever linked
 * parent(s) currently have it, via parent_children (a student may in
 * principle have more than one linked parent; any one with access is
 * enough). A student with no linked parent has nothing to inherit and is
 * treated as no access.
 */
export async function requireActiveSubscription(
  userId: string,
  role: SubscriptionGateRole,
): Promise<void> {
  if (!isBillingEnforcementEnabled()) return;

  const supabase = await createClient();

  if (role === "parent") {
    const { data: hasAccess } = await supabase.rpc("current_parent_has_access");
    if (!hasAccess) redirect("/billing");
    return;
  }

  const { data: links } = await supabase
    .from("parent_children")
    .select("parent_id")
    .eq("child_id", userId);

  for (const link of (links ?? []) as { parent_id: string }[]) {
    const { data: hasAccess } = await supabase.rpc("has_active_access", { p: link.parent_id });
    if (hasAccess) return;
  }

  redirect("/billing");
}
