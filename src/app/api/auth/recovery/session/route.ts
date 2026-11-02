import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { checkOrigin } from "@/features/auth/require-origin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { inspectRecoveryGrant, issueRecoveryGrant, RECOVERY_GRANT_COOKIE } from "@/server/auth/recovery-grant";
import {
  clearGrantCookie,
  hasRecentRecoveryMethod,
  noStore,
  resolveLiveSession,
  setGrantCookie,
} from "@/server/auth/recovery-session";

/**
 * The grant for a session the Auth service itself created from a recovery link (PKCE `?code=` or an implicit
 * fragment), which the browser client exchanges by itself. The app does NOT exchange it a second time.
 *
 *   POST    issue a grant if, and only if, the server-accepted session carries a recent `recovery` method.
 *   GET     is the cookie's grant valid for the current session? Returns its CSRF token (needs the cookie).
 *   DELETE  clear the grant (sign-out, abandon).
 *
 * The claim `recovery` comes from GoTrue, which records it only when it consumed a stored recovery token. A password,
 * signup, magic-link or `verifyOtp` session never carries it.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const originCheck = checkOrigin(request);
  if (!originCheck.ok) return originCheck.response;
  if (!isSupabaseConfigured) return noStore({ error: "not_configured" }, 503);

  const live = await resolveLiveSession(await createClient());
  if (!live) return noStore({ error: "no_session" }, 401);
  if (!hasRecentRecoveryMethod(live)) return noStore({ error: "not_a_recovery_session" }, 403);

  const grant = issueRecoveryGrant(live.binding);
  if (!grant.ok) return noStore({ error: "not_configured" }, 503);
  const response = noStore({ ok: true, csrfToken: grant.csrfToken, expiresAt: grant.expiresAt });
  setGrantCookie(response, request, grant.cookieValue);
  return response;
}

export async function GET(): Promise<NextResponse> {
  if (!isSupabaseConfigured) return noStore({ valid: false });
  const live = await resolveLiveSession(await createClient());
  if (!live) return noStore({ valid: false });
  const check = inspectRecoveryGrant((await cookies()).get(RECOVERY_GRANT_COOKIE)?.value, live.binding);
  return check.ok ? noStore({ valid: true, csrfToken: check.csrfToken, expiresAt: check.expiresAt }) : noStore({ valid: false });
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const response = noStore({ ok: true });
  clearGrantCookie(response, request);
  return response;
}
