/**
 * Shared, side-effect-free selection of orphaned synthetic Admin entitlements on DEV.
 *
 * A synthetic Admin fixture is an active `user_roles` row whose auth email is `mm-accept-<runId>-<label>@example.com`
 * (the stable identifier every hosted spec uses, see seededEmail()). Nothing else is ever selected: the retained
 * Admins, real mailboxes and any account outside that pattern are untouchable by construction, and a PROTECTED list is
 * checked as a second, independent barrier. Revocation goes only through the audited `revoke_admin_role` RPC.
 * Accounts are never deleted.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export const FIXTURE_EMAIL = /^mm-accept-([a-z0-9]+)-[a-z0-9-]+@example\.com$/i;
export const PROTECTED_EMAILS = new Set(["mm-qa-admin@example.com", "mmfw-beta-admin@e2e.mindmosaic.local"]);

export interface OrphanAdmin {
  userId: string;
  email: string;
  runId: string;
  grantedAt: string;
}

export async function findFixtureAdmins(
  sb: SupabaseClient,
  opts: { runId?: string; olderThanMs?: number } = {},
): Promise<OrphanAdmin[]> {
  const { data, error } = await sb.from("user_roles").select("user_id, granted_at").eq("role", "admin").is("revoked_at", null);
  if (error) throw new Error(`user_roles read failed: ${error.message}`);
  const out: OrphanAdmin[] = [];
  for (const row of data ?? []) {
    const { data: u } = await sb.auth.admin.getUserById(row.user_id as string);
    const email = u?.user?.email?.toLowerCase() ?? "";
    const m = FIXTURE_EMAIL.exec(email);
    if (!m || PROTECTED_EMAILS.has(email)) continue;
    if (opts.runId && m[1] !== opts.runId) continue;
    if (opts.olderThanMs && Date.now() - Date.parse(row.granted_at as string) < opts.olderThanMs) continue;
    out.push({ userId: row.user_id as string, email, runId: m[1]!, grantedAt: row.granted_at as string });
  }
  return out;
}

export async function revokeFixtureAdmins(sb: SupabaseClient, admins: OrphanAdmin[], actor: string): Promise<number> {
  let revoked = 0;
  for (const a of admins) {
    const { data, error } = await sb.rpc("revoke_admin_role", {
      p_user: a.userId,
      p_actor: actor,
      p_reason: "orphaned synthetic fixture reconciled",
    });
    if (error) console.warn(`reconcile: revoke failed for a fixture of run ${a.runId}: ${error.message}`);
    else if (data === "revoked") revoked += 1;
  }
  return revoked;
}
