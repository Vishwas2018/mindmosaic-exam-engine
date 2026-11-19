import type { NextRequest } from "next/server";

import { buildContentSecurityPolicy } from "@/lib/security/csp";
import { updateSession } from "@/lib/supabase/middleware";

// These auth pages already render per request, so Next can nonce their scripts.
const dynamicAuthRoutes = new Set(["/sign-in", "/auth/confirm", "/auth/forgot", "/auth/reset"]);

function shouldEnforceAuthCsp(request: NextRequest): boolean {
  if (process.env.MM_DEV_AUTH_CSP_ENFORCE !== "1") return false;
  const { hostname, pathname } = request.nextUrl;
  const target = process.env.VERCEL_ENV;
  const loopback = !target && (hostname === "localhost" || hostname === "127.0.0.1");
  return (target === "preview" || loopback) && dynamicAuthRoutes.has(pathname);
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const enforce = shouldEnforceAuthCsp(request);
  // Next reads the request policy during dynamic rendering to nonce its scripts.
  requestHeaders.delete("Content-Security-Policy");
  if (enforce) requestHeaders.set("Content-Security-Policy", csp);

  const response = await updateSession(request, requestHeaders);
  response.headers.set(enforce ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only", csp);
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
