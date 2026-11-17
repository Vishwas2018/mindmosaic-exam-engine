import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { isBillingEnforcementEnabled } from "./config";

/**
 * Whether a signed-in student gets the full question bank, or only the Free
 * plan's sample.
 *
 * A student has no subscription of their own: they inherit access from any
 * linked parent whose trial or paid plan is in good standing
 * (has_active_access, the same predicate requireActiveSubscription used to
 * redirect on). With BILLING_ENFORCEMENT_ENABLED off — the default — every
 * student keeps full access, exactly as before, so nothing changes for an
 * existing deployment until enforcement is deliberately switched on.
 *
 * Takes the request-scoped client so RLS does the reading as the student.
 */
export async function studentHasFullAccess(
  supabase: SupabaseClient,
  studentId: string,
): Promise<boolean> {
  if (!isBillingEnforcementEnabled()) return true;

  const { data: links } = await supabase
    .from("parent_children")
    .select("parent_id")
    .eq("child_id", studentId);

  for (const link of (links ?? []) as { parent_id: string }[]) {
    const { data: hasAccess } = await supabase.rpc("has_active_access", { p: link.parent_id });
    if (hasAccess) return true;
  }
  return false;
}
