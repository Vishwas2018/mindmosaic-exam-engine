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
 *
 * THIS IS THE AUTH BOUNDARY `profiles.access_revoked_at` IS CHECKED AT
 * (ADR-012 §5, Gate A item A4). Every `/{role}` route runs through here
 * exactly once, so it is the one place a revoked account can be refused
 * without editing a policy on every table the account could otherwise read.
 * A revoked account is sent to sign-in — the same redirect a guest gets — and
 * signed out first, so its cookies do not keep re-arriving at this gate. It is
 * deliberately not distinguished from "never signed in" in the URL or the
 * response: a former sitting's presence in the product is not something an
 * anonymous visitor at this route should be able to infer either way.
 *
 * This is one layer of §5's three. GoTrue's own `banned_until` (set by
 * `request_student_erasure`) refuses sign-in and token refresh independently
 * of this check ever running; deleting `auth.sessions`/`auth.refresh_tokens`
 * ends whatever session already existed. This check is what stops an
 * already-issued, not-yet-expired access token from still reaching an
 * application page during the access-token's remaining lifetime — the residual
 * risk ADR-012 §5 names and does not claim to close.
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
    .select("role, access_revoked_at")
    .eq("id", user.id)
    .single();

  if (profile?.access_revoked_at) {
    await supabase.auth.signOut();
    redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`);
  }

  const profileRole = isProfileRole(profile?.role) ? profile.role : null;
  if (profileRole !== role) redirect(roleHomePath(profileRole));

  return { configured: true, userId: user.id };
}
