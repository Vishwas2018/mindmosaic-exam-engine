import { NextResponse } from "next/server";

import { checkOrigin } from "@/features/auth/require-origin";
import {
  attachTesterBadgeCookie,
  clearTesterBadgeCookie,
  verifyUatTesterAccess,
} from "@/features/uat-assistant/server/uat-access";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

export async function GET(request: Request) {
  const decision = await verifyUatTesterAccess(request);
  if (!decision.enabled) {
    // Always return 200 `{ enabled: false }` on capability checks so browsers never log a 404 console error.
    const response = NextResponse.json(
      decision.reason === "session_ended" ? { enabled: false, ended: true } : { enabled: false },
      { status: 200, headers: NO_STORE },
    );
    // Revoked / MFA-lapsed tester: discard the credential in this browser as well as refusing it.
    if (decision.clearCredentials) clearTesterBadgeCookie(response);
    return response;
  }

  const response = NextResponse.json(
    {
      enabled: true,
      activeRole: decision.activeRole,
      authorizedVia: decision.authorizedVia,
      aiConfigured: decision.aiConfigured,
      githubConfigured: decision.githubConfigured,
      githubRepo: decision.githubRepo,
    },
    { status: 200, headers: NO_STORE },
  );

  if (decision.shouldIssueTesterCookie || decision.authorizedVia === "local_preview") {
    attachTesterBadgeCookie(response, decision.testerSubject);
  }

  return response;
}

/** Explicit "Start UAT session": requires full, current entitlement (admin + MFA, or allowlist) and mints a fresh cookie. */
export async function POST(request: Request) {
  const origin = checkOrigin(request);
  if (!origin.ok) return origin.response;

  const decision = await verifyUatTesterAccess(request, process.env, { ignoreEnded: true });
  if (!decision.enabled) {
    const response = NextResponse.json(
      { ok: false, reason: decision.reason },
      { status: decision.status, headers: NO_STORE },
    );
    if (decision.clearCredentials) clearTesterBadgeCookie(response);
    return response;
  }
  const response = NextResponse.json({ ok: true }, { status: 200, headers: NO_STORE });
  attachTesterBadgeCookie(response, decision.testerSubject);
  return response;
}

/**
 * "End UAT session": always succeeds (even for an expired/revoked cookie), drops the tester credential and leaves an
 * "ended" marker so the assistant stays off in this browser until the tester explicitly starts a new session. Local
 * defects in IndexedDB are NOT touched (testers export them first).
 */
export async function DELETE(request: Request) {
  const origin = checkOrigin(request);
  if (!origin.ok) return origin.response;

  const response = NextResponse.json({ ok: true }, { status: 200, headers: NO_STORE });
  clearTesterBadgeCookie(response, { ended: true });
  return response;
}
