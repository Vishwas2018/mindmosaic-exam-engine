import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * SERVER-SIDE, ATOMIC, FENCED, SINGLE-USE CONSUMPTION of a recovery grant (family-beta WP1; migration 20261102090000).
 *
 * A signed cookie cannot record that it was used, and deleting the browser's copy is not invalidation: whoever captured
 * the cookie still holds a valid one. The record lives in the database (`public.recovery_grant_claims`), reached through
 * SECURITY DEFINER functions that act only on the caller's own rows (`auth.uid()`).
 *
 * THE PROTOCOL (the migration holds the reasoning):
 *   claim    exactly one of any number of concurrent callers gets 'claimed' AND a fencing token; the rest get 'busy'; a
 *            used grant is 'spent'. A claim is a 2-minute lease.
 *   change   the caller changes the password.
 *   settle   'spent' after success (always safe). 'released' ONLY after Auth DEFINITIVELY refused (see classifyUpdateError);
 *            it needs the caller's own token, so an old claimant can never release a newer claimant's claim.
 *   resolve  after an AMBIGUOUS answer from Auth the database compares the user's password hash with the one taken at
 *            claim time: 'changed' (treat as success, grant is now spent) or 'unchanged' (keep the claim, do not release).
 * FAIL CLOSED ON UNCERTAINTY (migration 20261103090000). A claim is never taken over. When its lease lapses it becomes
 * 'spent' if the password hash changed (the attempt succeeded) and 'abandoned' (answer 'lapsed') if it did not: a slow
 * request to Auth may still be in flight and commit later, so the grant is dead and the user needs a FRESH recovery link.
 *
 * FAIL CLOSED. If the claim cannot be made (functions missing because the migration is not applied, database error,
 * network) the answer is 'unavailable' and the password is NOT changed. Nothing has been consumed, so the user can retry.
 *
 * The grant id passed in is the `jti` of a grant the server has already verified (signature, expiry, bound user and
 * session); it never comes from the request body.
 */

export type ClaimResult =
  | { outcome: "claimed"; token: string }
  | { outcome: "busy" | "spent" | "lapsed" | "unavailable" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function claimRecoveryGrant(
  supabase: SupabaseClient,
  jti: string,
  grantExpiresAtSeconds: number,
): Promise<ClaimResult> {
  try {
    const { data, error } = await supabase.rpc("claim_recovery_grant", {
      p_jti: jti,
      p_grant_expires_at: new Date(grantExpiresAtSeconds * 1000).toISOString(),
    });
    if (error || typeof data !== "object" || data === null) return { outcome: "unavailable" };
    const { outcome, token } = data as { outcome?: unknown; token?: unknown };
    if (outcome === "claimed" && typeof token === "string" && UUID.test(token)) return { outcome, token };
    if (outcome === "busy" || outcome === "spent" || outcome === "lapsed") return { outcome };
    return { outcome: "unavailable" };
  } catch {
    return { outcome: "unavailable" };
  }
}

/** Returns true when the database recorded the outcome. One retry; the caller reports a false. */
export async function settleRecoveryGrant(
  supabase: SupabaseClient,
  jti: string,
  token: string,
  outcome: "spent" | "released",
): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const { data, error } = await supabase.rpc("settle_recovery_grant", { p_jti: jti, p_token: token, p_outcome: outcome });
      if (!error && typeof data === "boolean") return data;
    } catch {
      /* try once more */
    }
  }
  return false;
}

export type ResolveResult = "changed" | "unchanged" | "unknown";

/** After an ambiguous Auth answer. Anything this cannot establish is 'unknown' (the claim is then left alone). */
export async function resolveRecoveryClaim(supabase: SupabaseClient, jti: string, token: string): Promise<ResolveResult> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const { data, error } = await supabase.rpc("resolve_recovery_claim", { p_jti: jti, p_token: token });
      if (!error && (data === "changed" || data === "unchanged" || data === "unknown")) return data;
    } catch {
      /* try once more */
    }
  }
  return "unknown";
}

/**
 * Did Auth DEFINITIVELY refuse the password change? Only a genuine HTTP 4xx answer from the Auth service (it validated and
 * rejected the request before changing anything: 400/401/403/422 validation, same-password, weak password; 429 rate limit)
 * counts. No status (network failure, abort, thrown error), 408, and every 5xx (including a gateway 502/504 that may have
 * forwarded a request which then committed) are AMBIGUOUS: the password may already have changed.
 */
export function classifyUpdateError(error: { status?: number } | null | undefined): "none" | "refused" | "ambiguous" {
  if (!error) return "none";
  const status = error.status;
  if (typeof status === "number" && status >= 400 && status < 500 && status !== 408) return "refused";
  return "ambiguous";
}
