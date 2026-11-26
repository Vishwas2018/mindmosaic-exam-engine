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
