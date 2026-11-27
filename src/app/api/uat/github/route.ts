import { NextResponse } from "next/server";

import { checkOrigin } from "@/features/auth/require-origin";
import { createGitHubIssueForDefect } from "@/features/uat-assistant/server/github-issues";
import { clearTesterBadgeCookie, verifyUatTesterAccess } from "@/features/uat-assistant/server/uat-access";
import { uatGitHubCreateRequestSchema } from "@/features/uat-assistant/types";
import { consumeRateLimit } from "@/lib/security/rate-limit";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

export async function POST(request: Request) {
  const origin = checkOrigin(request);
  if (!origin.ok) return origin.response;

  const access = await verifyUatTesterAccess(request);
  if (!access.enabled) {
    const denied = NextResponse.json({ error: "uat_unavailable" }, { status: access.status, headers: NO_STORE });
    if (access.clearCredentials) clearTesterBadgeCookie(denied);
    return denied;
  }

  const rate = await consumeRateLimit(
    request,
    {
      address: { name: "uat_github_ip", limit: 20, windowMs: 10 * 60 * 1000 },
      browser: { name: "uat_github_tester", limit: 15, windowMs: 10 * 60 * 1000 },
    },
    access.testerSubject,
  );
  if (!rate.allowed) {
    return NextResponse.json(
      {
        ok: false,
        code: "rate_limited",
        message: "Too many GitHub issue requests in a short window. Please wait a moment and try again.",
      },
      {
        status: 429,
        headers: { ...NO_STORE, "Retry-After": String(rate.retryAfterSeconds) },
      },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid_json", message: "Invalid JSON request payload." },
      { status: 400, headers: NO_STORE },
    );
  }

  const parsed = uatGitHubCreateRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        code: "validation_failed",
        message: parsed.error.issues[0]?.message ?? "Explicit confirmation and valid defect details are required.",
      },
      { status: 400, headers: NO_STORE },
    );
  }

  const outcome = await createGitHubIssueForDefect(parsed.data);
  if (!outcome.ok) {
    const status = outcome.code === "github_not_configured" ? 503 : 502;
    return NextResponse.json(outcome, { status, headers: NO_STORE });
  }

  return NextResponse.json(outcome, { status: 201, headers: NO_STORE });
}
