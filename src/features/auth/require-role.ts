import "server-only";

import { redirect } from "next/navigation";

import { isProfileRole, roleHomePath, type ProfileRole } from "@/features/auth/roles";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type RoleGateResult =
  | { configured: false }
  | { configured: true; userId: string };

/**
 * Central auth+role gate for every /{role} route tree, run once per request
 * from each role's layout.tsx (src/app/{student,parent,teacher,admin}/layout.tsx).
 * Guests are sent to sign-in, wrong roles to their own home; a matching
 * profile role passes through untouched. RLS is the real enforcement
 * (docs/DATA_MODEL_AND_ROLES.md) — this exists to route each visitor
 * somewhere sensible instead of rendering a page they can't use.
 *
 * When Supabase isn't configured there are no accounts to check against, so
 * this passes through without redirecting; each role's page decides how to
 * present that state (the shells differ on purpose — see the per-page
 * "not configured" UI in each role's data helper).
 */
export async function requireRole(
  role: ProfileRole,
  nextPath: string,
): Promise<RoleGateResult> {
  if (!isSupabaseConfigured) return { configured: false };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const profileRole = isProfileRole(profile?.role) ? profile.role : null;
  if (profileRole !== role) redirect(roleHomePath(profileRole));

  return { configured: true, userId: user.id };
}
