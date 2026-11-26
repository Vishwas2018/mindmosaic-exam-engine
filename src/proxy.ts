import type { NextRequest } from "next/server";

import { buildContentSecurityPolicy } from "@/lib/security/csp";
import { updateSession } from "@/lib/supabase/middleware";

// These auth pages already render per request, so Next can nonce their scripts.
const dynamicAuthRoutes = new Set(["/sign-in", "/auth/confirm", "/auth/forgot", "/auth/reset", "/staff/sign-in", "/staff/mfa"]);

function isNonProductionTarget(request: NextRequest): boolean {
  const { hostname } = request.nextUrl;
  const target = process.env.VERCEL_ENV;
  const loopback = !target && (hostname === "localhost" || hostname === "127.0.0.1");
  return target === "preview" || loopback;
}

function shouldEnforceAuthCsp(request: NextRequest): boolean {
  if (process.env.MM_DEV_AUTH_CSP_ENFORCE !== "1") return false;
  return isNonProductionTarget(request) && dynamicAuthRoutes.has(request.nextUrl.pathname);
}

// Every /admin page renders per request (src/app/admin/layout.tsx is force-dynamic), so Next nonces its
// scripts and the policy can be enforced. DEV (Preview) and loopback only; production stays report-only until
// the owner approves. MM_ADMIN_CSP_ENFORCE=0 is the kill switch if a regression ever needs a quick rollback.
function shouldEnforceAdminCsp(request: NextRequest): boolean {
  if (process.env.MM_ADMIN_CSP_ENFORCE === "0") return false;
  const { pathname } = request.nextUrl;
  if (pathname !== "/admin" && !pathname.startsWith("/admin/")) return false;
  return isNonProductionTarget(request);
}

// Local e2e/dev talks to a Supabase on loopback (e.g. 127.0.0.1:56321). Allow exactly that origin, and only when
// the app itself is on loopback with no Vercel target. Hosted policy keeps just *.supabase.co.
function localSupabaseConnectSrc(request: NextRequest): string[] {
  const { hostname } = request.nextUrl;
  if (process.env.VERCEL_ENV || (hostname !== "localhost" && hostname !== "127.0.0.1")) return [];
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
    if (url.hostname !== "localhost" && url.hostname !== "127.0.0.1") return [];
    return [url.origin, `${url.protocol === "https:" ? "wss" : "ws"}://${url.host}`];
  } catch {
    return [];
  }
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildContentSecurityPolicy(nonce, localSupabaseConnectSrc(request));
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const enforce = shouldEnforceAuthCsp(request) || shouldEnforceAdminCsp(request);
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
