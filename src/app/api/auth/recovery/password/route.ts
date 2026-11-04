import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { evaluatePassword } from "@/features/auth/password";
import { checkOrigin } from "@/features/auth/require-origin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  csrfMatches,
  inspectRecoveryGrant,
  RECOVERY_CSRF_HEADER,
  RECOVERY_GRANT_COOKIE,
} from "@/server/auth/recovery-grant";
import {
  classifyUpdateError,
  claimRecoveryGrant,
  resolveRecoveryClaim,
  settleRecoveryGrant,
} from "@/server/auth/recovery-claim";
import { clearGrantCookie, noStore, resolveLiveSession } from "@/server/auth/recovery-session";

/**
 * POST /api/auth/recovery/password { password } — the application's password-reset endpoint.
 *
 * Accepts a new password only when ALL of these hold, each decided on the server:
 *   1. same-origin `Origin` (the existing MM-SEC-03 check) and a JSON content type;
 *   2. a live session the Auth service accepts;
 *   3. a recovery grant cookie that verifies (signature, expiry) AND is bound to that exact user and session — so a
 *      forged, expired, replayed or other-account grant is refused;
 *   4. the grant's CSRF token in the `x-mm-recovery-csrf` header;
 *   5. a password that meets the policy;
 *   6. an atomic CLAIM of the grant in the database (src/server/auth/recovery-claim.ts), so of any number of concurrent
 *      requests with the same grant exactly one proceeds ('busy' 409 for the rest) and a used grant is 'spent' (403).
 * Then it changes the password. On success the grant is marked spent in the database (the real single-use control, not
 * the cookie), every session of the user is revoked (global sign-out: this one and the ones on other devices) and the
 * browser's cookie is cleared (hygiene only). After a DEFINITIVE refusal by Auth the claim is RELEASED so the same grant
 * can try again. After an UNCERTAIN outcome (timeout, crash, 5xx with the password unchanged) the claim is NOT released:
 * its 2-minute lease lapses and the grant is abandoned for good, and the user requests a fresh recovery link. If the claim cannot be made at all (migration absent, database error) the answer is 503 and nothing changed.
 * (The Auth service itself also ends the user's OTHER sessions on a password change; the explicit sign-out does not
 * rely on that, and is the part that ends THIS session.)
 *
 * SCOPE OF THIS PROTECTION. It guards this application's reset path. It cannot stop a session holder calling Supabase
 * Auth's own update-user API directly; see src/server/auth/recovery-grant.ts.
 */
const bodySchema = z.object({ password: z.string().min(1).max(256) }).strict();

const refuse = (error: string, status: number, reason?: string) => noStore(reason ? { error, reason } : { error }, status);

export async function POST(request: Request): Promise<NextResponse> {
  const originCheck = checkOrigin(request);
  if (!originCheck.ok) return originCheck.response;
  if (!isSupabaseConfigured) return refuse("not_configured", 503);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return refuse("unsupported_media_type", 415);
  }

  const supabase = await createClient();
  const live = await resolveLiveSession(supabase);
  if (!live) return refuse("recovery_required", 401, "no_session");

  const grant = inspectRecoveryGrant((await cookies()).get(RECOVERY_GRANT_COOKIE)?.value, live.binding);
  if (!grant.ok) {
    return refuse("recovery_required", grant.reason === "not_configured" ? 503 : 403, grant.reason);
  }
  if (!csrfMatches(request.headers.get(RECOVERY_CSRF_HEADER), grant.csrfToken)) return refuse("csrf", 403);

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return refuse("invalid_request", 400);
  if (!evaluatePassword(parsed.data.password).allMet) return refuse("password_too_weak", 400);

  /* CLAIM the grant atomically in the database before anything irreversible. Exactly one of any number of concurrent
     requests gets it. Nothing has changed if this fails, so every non-'claimed' answer is safe to retry or abandon. */
  const claim = await claimRecoveryGrant(supabase, grant.jti, grant.expiresAt);
  if (claim.outcome !== "claimed") {
    if (claim.outcome === "busy") return refuse("grant_in_use", 409);
    if (claim.outcome === "spent") return refuse("recovery_required", 403, "spent");
    if (claim.outcome === "lapsed") return refuse("recovery_required", 403, "lapsed"); // uncertain earlier attempt: fresh link
    return refuse("recovery_unavailable", 503);
  }
  const { token } = claim;

  let updateError: { status?: number } | null = null;
  try {
    ({ error: updateError } = await supabase.auth.updateUser({ password: parsed.data.password }));
  } catch {
    updateError = {}; // thrown (network, abort): no answer from Auth at all, so AMBIGUOUS
  }

  const kind = classifyUpdateError(updateError);
  if (kind === "refused") {
    /* Auth DEFINITIVELY refused (4xx: weak or same password, rate limit): the password was not changed. RELEASE the claim,
       with this request's own fencing token, so the same grant can try again. If the release itself fails the lease
       lapses on its own in 2 minutes: a transient failure never locks the user out. */
    await settleRecoveryGrant(supabase, grant.jti, token, "released");
    return refuse(updateError?.status === 422 ? "password_rejected" : "update_failed", updateError?.status === 422 ? 400 : 502);
  }
  if (kind === "ambiguous") {
    /* No definitive answer (network failure, timeout, 5xx): the password MAY have changed. Never release on a guess. Ask
       the database whether the user's password hash differs from the one recorded at claim time. */
    const resolved = await resolveRecoveryClaim(supabase, grant.jti, token);
    if (resolved !== "changed") {
      /* Unchanged or unknown: the claim is deliberately LEFT in place (the Auth call might still be in flight). It lapses
         after its 2-minute lease and then becomes ABANDONED, never claimable again (fail closed: a slow Auth request may
         still commit). The user is told to request a fresh recovery link; nothing can be applied twice. */
      return refuse("update_uncertain", 503);
    }
    /* 'changed': the password did change; the grant is now spent. Continue as a success. */
  }

  /* The password is changed: the grant is now spent, for good, in the database. This must happen while the session is
     still alive (the sign-out below ends it). Idempotent, and if it fails the claim self-heals: a lapsed claim whose
     password hash changed becomes spent on the next claim attempt. */
  const grantSpent = await settleRecoveryGrant(supabase, grant.jti, token, "spent");

  /* Then revoke every session of this user, this one included. One retry, because a transient failure here would leave
     the session usable; a persistent one is reported, never hidden. With the grant spent in the database a failed
     sign-out no longer leaves the GRANT replayable, only the already-authenticated session alive. */
  let { error: signOutError } = await supabase.auth.signOut({ scope: "global" });
  if (signOutError) ({ error: signOutError } = await supabase.auth.signOut({ scope: "global" }));
  const response = noStore({ ok: true, otherSessionsRevoked: !signOutError, grantSpent });
  clearGrantCookie(response, request);
  return response;
}
