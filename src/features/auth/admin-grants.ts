import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { AdminGrantLookup, AdminGrantRow } from "@/features/auth/roles";

/**
 * Postgres undefined_table, and PostgREST's "not in the schema cache": the ONLY two outcomes that mean the multi-role
 * migration has not been applied yet. Anything else (network, timeout, permission, schema drift) is an unexpected
 * failure and must not be mistaken for "pre-migration", or an outage would silently re-enable the legacy admin rule.
 */
const TABLE_MISSING_CODES = new Set(["42P01", "PGRST205"]);

export function classifyGrantLookup(
  data: readonly AdminGrantRow[] | null,
  error: { code?: string } | null,
): AdminGrantLookup {
  if (error) return TABLE_MISSING_CODES.has(error.code ?? "") ? "missing" : "error";
  return data ?? [];
}

/** The signed-in user's own entitlement rows (RLS: user_roles_read_own). Fails closed, see AdminGrantLookup. */
export async function loadAdminGrants(
  supabase: SupabaseClient,
  userId: string,
): Promise<AdminGrantLookup> {
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role, revoked_at")
      .eq("user_id", userId);
    return classifyGrantLookup((data ?? null) as AdminGrantRow[] | null, error);
  } catch {
    return "error";
  }
}

export type AdminMfaOutcome = "ok" | "step_up" | "deny";

/**
 * The one Admin MFA decision, shared by the role gate and the UAT Assistant so they can never disagree.
 * Reads the platform switch (security_settings.require_admin_mfa via admin_mfa_required()); when it is on, an aal2 session
 * is required. Fails CLOSED: an unreadable switch is "deny"; an unprovable aal2 is "step_up".
 */
export async function adminMfaOutcome(
  supabase: Pick<SupabaseClient, "rpc" | "auth">,
): Promise<AdminMfaOutcome> {
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
    /* Cannot prove aal2: treat as not verified. */
  }
  return "step_up";
}
