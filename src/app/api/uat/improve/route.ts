import { NextResponse } from "next/server";

import { checkOrigin } from "@/features/auth/require-origin";
import { improveDefectWithAi } from "@/features/uat-assistant/server/ai-improver";
import { verifyUatTesterAccess } from "@/features/uat-assistant/server/uat-access";
import { uatImproveRequestSchema } from "@/features/uat-assistant/types";
import { consumeRateLimit } from "@/lib/security/rate-limit";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

export async function POST(request: Request) {
  const origin = checkOrigin(request);
  if (!origin.ok) return origin.response;

  const access = await verifyUatTesterAccess(request);
  if (!access.enabled) {
    return NextResponse.json({ error: "uat_unavailable" }, { status: access.status, headers: NO_STORE });
  }

  const rate = await consumeRateLimit(
    request,
    {
      address: { name: "uat_improve_ip", limit: 40, windowMs: 10 * 60 * 1000 },
      browser: { name: "uat_improve_tester", limit: 25, windowMs: 10 * 60 * 1000 },
    },
    access.testerSubject,
  );
  if (!rate.allowed) {
    return NextResponse.json(
      {
        ok: false,
        code: "rate_limited",
        message: "Too many AI formatting requests in a short window. Wait a moment or edit the fields directly.",
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

  const parsed = uatImproveRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        code: "validation_failed",
        message: parsed.error.issues[0]?.message ?? "Please enter your observation notes before improving with AI.",
      },
      { status: 400, headers: NO_STORE },
    );
  }

  const outcome = await improveDefectWithAi(parsed.data);
  if (!outcome.ok) {
    const status = outcome.code === "provider_not_configured" ? 503 : 502;
    return NextResponse.json(outcome, { status, headers: NO_STORE });
  }

  return NextResponse.json(outcome, { status: 200, headers: NO_STORE });
}
