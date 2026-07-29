import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { isProfileRole, roleHomePath } from "@/features/auth/roles";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/*
 * Same reasoning as src/app/parent/layout.tsx's own comment: a role check
 * that only calls cookies() when Supabase is configured would let Next
 * statically prerender this layout with the check baked out entirely.
 * billing/page.tsx also forces this itself, but the gate belongs here so it
 * holds regardless.
 */
export const dynamic = "force-dynamic";

/*
 * /billing is deliberately NOT a plain parent-only route like /parent or
 * /student — it has three legitimate kinds of visitor:
 *  - Guests: content.ts's familyPlanCta wires the public homepage's
 *    "Subscribe to Family" CTA straight to "/billing" (see Pricing.tsx on
 *    the marketing page). A hard sign-in redirect here would break that
 *    conversion path — guest practice and guest pricing visibility must
 *    never be gated (docs/PRIVACY_AND_BILLING_GUARDRAILS.md).
 *  - Students: requireActiveSubscription's student branch (see
 *    features/billing/require-active-subscription.ts) redirects a student
 *    whose linked parent(s) lack access to "/billing" — currently dormant
 *    since BILLING_ENFORCEMENT_ENABLED defaults off, but wiring a
 *    parent-only redirect here would turn that into a redirect loop
 *    (/student -> requireActiveSubscription -> /billing -> redirected back
 *    to /student -> ...) the moment enforcement ships.
 *  - Parents: the only role with real subscription data to manage;
 *    getMySubscription() already scopes to the signed-in user's own row via
 *    RLS (parent_id = auth.uid()), and the checkout API route separately
 *    enforces profiles.role === "parent" server-side — so this layout isn't
 *    the security boundary for checkout, it's UX routing on top of it.
 *
 * Only teacher and admin have no legitimate reason to land on a subscribe/
 * manage-billing page for a product they can't own — send them to their own
 * role home instead of rendering a page that offers something they can
 * never use.
 *
 * No metadata export here — billing/page.tsx already owns title/description,
 * and unlike /parent this route is meant to stay indexable (it's the real
 * public pricing/subscribe destination, not an authenticated dashboard).
 */
export default async function BillingLayout({ children }: { children: ReactNode }) {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      const role = isProfileRole(profile?.role) ? profile.role : null;
      if (role === "teacher" || role === "admin") {
        redirect(roleHomePath(role));
      }
    }
  }

  return children;
}
