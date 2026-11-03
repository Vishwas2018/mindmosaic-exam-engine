import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * SERVER-SIDE, ATOMIC, SINGLE-USE CONSUMPTION of a recovery grant (family-beta WP1; migration 20261102090000).
 *
 * A signed cookie cannot record that it was used, and deleting the browser's copy is not invalidation: whoever captured
 * the cookie still holds a valid one. The record lives in the database (`public.recovery_grant_claims`), reached through
 * two SECURITY DEFINER functions that act only on the caller's own rows (`auth.uid()`).
 *
 * THE PROTOCOL (see the migration for the reasoning):
 *   claim    exactly one of any number of concurrent callers gets 'claimed'; the rest get 'busy'; a used grant is 'spent'
 *   change   the caller changes the password
 *   settle   'spent' after success; 'released' after failure so the same grant can try again. A crash between claim and
 *            settle is covered by a 2-minute lease, after which the grant is claimable again.
 *
 * FAIL CLOSED. If the claim cannot be made (functions missing because the migration is not applied, database error,
 * network) the answer is 'unavailable' and the password is NOT changed. Nothing has been consumed, so the user can retry.
 * Settling is best-effort with one retry: a failed 'spent' or 'released' is reported to the caller, never swallowed.
 *
 * The grant id passed in is the `jti` of a grant the server has already verified (signature, expiry, bound user and
 * session); it never comes from the request body.
 */

export type ClaimOutcome = "claimed" | "busy" | "spent" | "unavailable";

const OUTCOMES = new Set(["claimed", "busy", "spent"]);

export async function claimRecoveryGrant(
  supabase: SupabaseClient,
  jti: string,
  grantExpiresAtSeconds: number,
): Promise<ClaimOutcome> {
  try {
    const { data, error } = await supabase.rpc("claim_recovery_grant", {
      p_jti: jti,
      p_grant_expires_at: new Date(grantExpiresAtSeconds * 1000).toISOString(),
    });
    if (error || typeof data !== "string" || !OUTCOMES.has(data)) return "unavailable";
    return data as ClaimOutcome;
  } catch {
    return "unavailable";
  }
}

/** Returns true when the database recorded the outcome. One retry; the caller reports a false. */
export async function settleRecoveryGrant(
  supabase: SupabaseClient,
  jti: string,
  outcome: "spent" | "released",
): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const { data, error } = await supabase.rpc("settle_recovery_grant", { p_jti: jti, p_outcome: outcome });
      if (!error && data === true) return true;
    } catch {
      /* try once more */
    }
  }
  return false;
}
