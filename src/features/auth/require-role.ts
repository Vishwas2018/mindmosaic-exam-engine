import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  isProfileRole,
  landingForEntitled,
  resolveEntitledRoles,
  type AdminGrantRow,
  type ProfileRole,
} from "@/features/auth/roles";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

async function hadAuthCookie(): Promise<boolean> {
  try {
    const jar = await cookies();
    return jar.getAll().some((cookie) => /^sb-.+-auth-token(\.\d+)?$/.test(cookie.name));
  } catch {
    /* No request scope (e.g. unit tests): fall back to the ordinary sign-in redirect. */
    return false;
  }
}

export type RoleGateResult =
  | { configured: false }
  | {
      configured: true;
      userId: string;
      /** Every workspace this login may enter (primary role plus any active admin entitlement). */
      roles: ProfileRole[];
    };

/** Loads the signed-in user's own entitlement rows. Null = table unavailable (pre-migration database). */
async function loadAdminGrants(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<AdminGrantRow[] | null> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role, revoked_at")
    .eq("user_id", userId);
  if (error) return null;
  return (data ?? []) as AdminGrantRow[];
}

/**
 * Step-up for privileged work. When the platform switch (security_settings.require_admin_mfa) is on, an admin session
 * must be MFA-verified (aal2). Unauthenticated-MFA sessions are sent to /staff/mfa, then back. The same switch is
 * enforced again inside the database (is_admin()), so a stale page or a direct API call cannot bypass this.
 */
async function mfaStepUpPath(
  supabase: Awaited<ReturnType<typeof createClient>>,
  nextPath: string,
): Promise<string | null> {
  const { data: required, error } = await supabase.rpc("admin_mfa_required");
  if (error || required !== true) return null;
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel === "aal2") return null;
  return `/staff/mfa?next=${encodeURIComponent(nextPath)}`;
}

/**
 * Central auth+role gate for every /{role} route tree, run once per request
 * from each role's layout.tsx (src/app/{student,parent,teacher,admin}/layout.tsx).
 * Guests are sent to sign-in, un-entitled roles to an entitled home; an entitled
 * role passes through untouched. Entitlement = primary profile role, plus admin
 * only through an active user_roles grant (see resolveEntitledRoles). RLS is the real enforcement
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
  if (!user) {
    /* A browser that still carries Supabase auth cookies, but whose session
       no longer resolves, was signed in and has been signed out: say so,
       rather than greeting it like a stranger. The cookie is the browser's
       own, so this reveals nothing to anyone else. */
    if (await hadAuthCookie()) {
      redirect(`/session-expired?next=${encodeURIComponent(nextPath)}`);
    }
    redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, access_revoked_at")
    .eq("id", user.id)
    .single();

  if (profile?.access_revoked_at) {
    await supabase.auth.signOut();
    redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`);
  }

  const primary = isProfileRole(profile?.role) ? profile.role : null;
  const roles = resolveEntitledRoles(primary, await loadAdminGrants(supabase, user.id));
  if (!roles.includes(role)) redirect(landingForEntitled(roles, primary));

  if (role === "admin") {
    const stepUp = await mfaStepUpPath(supabase, nextPath);
    if (stepUp) redirect(stepUp);
  }

  return { configured: true, userId: user.id, roles };
}
