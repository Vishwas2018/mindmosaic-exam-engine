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
 *   5. a password that meets the policy.
 * On success it changes the password, revokes EVERY session of the user (global sign-out: this one and the ones on
 * other devices), and clears the grant. The grant is therefore single-use: it was bound to a session that no longer
 * exists. (The Auth service itself also ends the user's OTHER sessions on a password change; the explicit sign-out
 * does not rely on that, and is the part that ends THIS session.)
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

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    /* The grant stays valid so the user can try another password. 422 is GoTrue's "same password" / weak password. */
    return refuse(error.status === 422 ? "password_rejected" : "update_failed", error.status === 422 ? 400 : 502);
  }

  /* The password is changed. Revoke every session of this user, this one included: that is what spends the grant.
     One retry, because a transient failure here would leave the grant usable; a persistent one is reported, never hidden. */
  let { error: signOutError } = await supabase.auth.signOut({ scope: "global" });
  if (signOutError) ({ error: signOutError } = await supabase.auth.signOut({ scope: "global" }));
  const response = noStore({ ok: true, otherSessionsRevoked: !signOutError });
  clearGrantCookie(response, request);
  return response;
}
