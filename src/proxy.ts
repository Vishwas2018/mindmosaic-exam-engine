import type { NextRequest } from "next/server";

import { buildContentSecurityPolicy } from "@/lib/security/csp";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  // Per-request nonce for the CSP script-src allowlist. Forwarded as a
  // request header so Server Components can read it via `headers()` if a
  // future inline <script> needs it explicitly; Next's own injected scripts
  // pick it up automatically from the CSP header below.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildContentSecurityPolicy(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = await updateSession(request, requestHeaders);

  /* Report-only, deliberately. The policy is nonce-based ('strict-dynamic'), and a nonce only reaches pages rendered
     per request. Most public and practice routes are statically prerendered, so their scripts carry no nonce: enforcing
     this header blocks every script on them and the pages never hydrate. Enforce only after those routes are either
     rendered dynamically or covered by hashes, and prove it with the E2E suite. */
  response.headers.set("Content-Security-Policy-Report-Only", csp);

  return response;
}

export const config = {
  /*
   * Run on every path except Next internals and static asset files, so the
   * auth session cookie stays fresh across navigations without touching image
   * or font requests.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
