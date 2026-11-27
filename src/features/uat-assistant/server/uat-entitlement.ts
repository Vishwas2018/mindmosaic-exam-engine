import "server-only";

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * UAT entitlement rules, aligned with the multi-role model of PR #165:
 *   - Admin is an ACTIVE `user_roles` grant (not merely `profiles.role = 'admin'`).
 *   - A revoked grant removes the privilege, even when the profile still says "admin".
 *   - The pre-migration database (no `user_roles` table) keeps the legacy `profiles.role` rule so this PR is safe to
 *     deploy before or after the migration.
 *   - Any other lookup failure fails CLOSED.
 *   - When `security_settings.require_admin_mfa` is on, an admin needs an aal2 session. The UAT assistant never relaxes
 *     that: a UAT cookie, allowlist entry or tester id cannot stand in for it.
 * These helpers intentionally do not import PR #165's modules so the two PRs can land in either order; once #165 is on
 * `dev` they can be swapped for `loadAdminGrants` / `resolveEntitledRoles` (the semantics are identical and tested).
 */

export type UatGrantRow = { readonly role: string; readonly revoked_at: string | null };
export type UatGrantLookup = readonly UatGrantRow[] | "missing" | "error";

/** Undefined table / PostgREST "not in schema cache": the only outcomes that mean "migration not applied yet". */
const TABLE_MISSING_CODES = new Set(["42P01", "PGRST205"]);

export function classifyUatGrantLookup(
  data: readonly UatGrantRow[] | null,
  error: { code?: string } | null,
): UatGrantLookup {
  if (error) return TABLE_MISSING_CODES.has(error.code ?? "") ? "missing" : "error";
  return data ?? [];
}

export async function loadUatGrants(
  client: Pick<SupabaseClient, "from">,
  userId: string,
): Promise<UatGrantLookup> {
  try {
    const { data, error } = await client
      .from("user_roles")
      .select("role, revoked_at")
      .eq("user_id", userId);
    return classifyUatGrantLookup((data ?? null) as UatGrantRow[] | null, error);
  } catch {
    return "error";
  }
}

export type UatAdminStanding =
  | { readonly kind: "admin"; readonly mfaApplies: boolean }
  | { readonly kind: "not_admin" }
  | { readonly kind: "unknown" };

/** Pure: is this account an administrator right now? "unknown" means we could not tell and must fail closed. */
export function resolveUatAdminStanding(
  profileRole: string | null | undefined,
  grants: UatGrantLookup,
  accessRevoked: boolean,
): UatAdminStanding {
  if (accessRevoked) return { kind: "not_admin" };
  if (grants === "error") return { kind: "unknown" };
  if (grants === "missing") {
    // Pre-migration: the legacy rule, and there is no MFA switch to honour yet.
    return profileRole === "admin" ? { kind: "admin", mfaApplies: false } : { kind: "not_admin" };
  }
  const active = grants.some((row) => row.role === "admin" && !row.revoked_at);
  return active ? { kind: "admin", mfaApplies: true } : { kind: "not_admin" };
}

export type UatMfaOutcome = "ok" | "step_up" | "deny";

/** Admin MFA gate. Reads the platform switch; fails closed if it cannot be read or aal2 cannot be proven. */
export async function checkUatAdminMfa(
  supabase: Pick<SupabaseClient, "rpc" | "auth">,
): Promise<UatMfaOutcome> {
  let required: unknown;
  try {
    const result = await supabase.rpc("admin_mfa_required");
    if (result.error) return "deny";
    required = result.data;
  } catch {
    return "deny";
  }
  if (required !== true) return "ok";
  try {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (data?.currentLevel === "aal2") return "ok";
  } catch {
    /* cannot prove aal2 */
  }
  return "step_up";
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

  const grants = await loadUatGrants(client, subject);
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
