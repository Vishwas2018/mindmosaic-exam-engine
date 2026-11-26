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
    return NextResponse.json(
      { enabled: false },
      { status: decision.status === 404 ? 404 : 200, headers: NO_STORE },
    );
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

  if (decision.shouldIssueTesterCookie) {
    attachTesterBadgeCookie(response, decision.testerSubject);
  }

  return response;
}

export async function DELETE(request: Request) {
  const origin = checkOrigin(request);
  if (!origin.ok) return origin.response;

  const response = NextResponse.json({ ok: true }, { status: 200, headers: NO_STORE });
  clearTesterBadgeCookie(response);
  return response;
}
