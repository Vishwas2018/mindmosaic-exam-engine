import "server-only";

import { NextResponse } from "next/server";

export type OriginCheckResult =
  | { ok: true; origin: string }
  | { ok: false; response: NextResponse };

/**
 * MM-SEC-03: canonical same-origin check for every state-changing (POST)
 * Route Handler. Mirrors the check Next.js itself runs internally for
 * Server Actions — compare the browser-set `Origin` header's host against
 * the request's own `Host` header, which the platform (not the caller)
 * controls, rather than trusting the `Origin` header as self-certifying.
 *
 * Before this existed, /api/stripe/checkout and /api/stripe/portal did
 * `request.headers.get("origin") ?? new URL(request.url).origin` and used
 * the result unvalidated to build Stripe's `success_url`/`cancel_url`/
 * `return_url` — a cross-site caller could set an arbitrary `Origin` and
 * have it echoed straight into the redirect Stripe sends the browser back
 * to. Callers that pass this check get the validated origin back so they
 * can use it instead of re-deriving it from the same untrusted header.
 *
 * Never applied to GET/HEAD (no state change, no CSRF surface) or to
 * /api/stripe/webhook (Stripe itself calls that, not a browser — it has no
 * same-origin relationship with this app and is verified by signature
 * instead; see src/app/api/stripe/webhook/route.ts).
 */
export function checkOrigin(request: Request): OriginCheckResult {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) {
    return {
      ok: false,
      response: NextResponse.json({ error: "origin_required" }, { status: 403 }),
    };
  }

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "origin_invalid" }, { status: 403 }),
    };
  }

  if (originHost !== host) {
    return {
      ok: false,
      response: NextResponse.json({ error: "origin_mismatch" }, { status: 403 }),
    };
  }

  return { ok: true, origin };
}
