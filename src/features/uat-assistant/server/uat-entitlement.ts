import "server-only";

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

import { loadAdminGrants } from "@/features/auth/admin-grants";
import { isProfileRole, resolveEntitledRoles, type AdminGrantLookup } from "@/features/auth/roles";

/**
 * UAT entitlement rules. They use the SAME shared helpers as the role gate (PR #165), so the UAT Assistant can never
 * disagree with /admin about who is an administrator:
 *   - Admin is an ACTIVE `user_roles` grant (resolveEntitledRoles); a profile that merely says "admin" confers nothing
 *     once the migration is applied.
 *   - The pre-migration database (no `user_roles` table) keeps the legacy `profiles.role` rule.
 *   - Any other lookup failure fails CLOSED ("unknown").
 *   - When `security_settings.require_admin_mfa` is on, an admin needs an aal2 session (adminMfaOutcome). A UAT cookie,
 *     allowlist entry or tester id cannot stand in for it.
 */

export type UatAdminStanding =
  | { readonly kind: "admin"; readonly mfaApplies: boolean }
  | { readonly kind: "not_admin" }
  | { readonly kind: "unknown" };

/** Pure: is this account an administrator right now? "unknown" means we could not tell and must fail closed. */
export function resolveUatAdminStanding(
  profileRole: string | null | undefined,
  grants: AdminGrantLookup,
  accessRevoked: boolean,
): UatAdminStanding {
  if (accessRevoked) return { kind: "not_admin" };
  if (grants === "error") return { kind: "unknown" };
  const primary = isProfileRole(profileRole) ? profileRole : null;
  if (!resolveEntitledRoles(primary, grants).includes("admin")) return { kind: "not_admin" };
  // Pre-migration there is no MFA switch to honour yet (same rule as requireRole).
  return { kind: "admin", mfaApplies: grants !== "missing" };
}

type EnvMap = Readonly<Record<string, string | undefined>>;

export function createUatServiceClient(env: EnvMap = process.env): SupabaseClient | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createSupabaseClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export type SubjectRevalidation =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: "access_revoked" | "entitlement_revoked" | "lookup_failed" };

/**
 * Re-checks, on EVERY use of a tester cookie, that the person who minted it is still entitled: not access-revoked and
 * still an active admin (or still allowlisted). This is what makes revoking an administrator end their UAT session
 * immediately instead of when the cookie expires. Fails closed on any unexpected error.
 */
export async function revalidateTesterSubject(
  client: SupabaseClient,
  subject: string,
  allowlist: { readonly ids: ReadonlySet<string>; readonly emails: ReadonlySet<string> },
): Promise<SubjectRevalidation> {
  let profileRole: string | null = null;
  let accessRevoked = false;
  try {
    const { data, error } = await client
      .from("profiles")
      .select("role, access_revoked_at")
      .eq("id", subject)
      .maybeSingle();
    if (error) return { ok: false, reason: "lookup_failed" };
    if (!data) return { ok: false, reason: "access_revoked" };
    profileRole = (data as { role?: string | null }).role ?? null;
    accessRevoked = Boolean((data as { access_revoked_at?: string | null }).access_revoked_at);
  } catch {
    return { ok: false, reason: "lookup_failed" };
  }
  if (accessRevoked) return { ok: false, reason: "access_revoked" };

  const grants = await loadAdminGrants(client, subject);
  const standing = resolveUatAdminStanding(profileRole, grants, false);
  if (standing.kind === "unknown") return { ok: false, reason: "lookup_failed" };
  if (standing.kind === "admin") return { ok: true };

  if (allowlist.ids.has(subject.toLowerCase())) return { ok: true };
  if (allowlist.emails.size > 0) {
    try {
      const { data, error } = await client.auth.admin.getUserById(subject);
      if (error) return { ok: false, reason: "lookup_failed" };
      const email = data.user?.email?.toLowerCase();
      if (email && allowlist.emails.has(email)) return { ok: true };
    } catch {
      return { ok: false, reason: "lookup_failed" };
    }
  }
  return { ok: false, reason: "entitlement_revoked" };
}
