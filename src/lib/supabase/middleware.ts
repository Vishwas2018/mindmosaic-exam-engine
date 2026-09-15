import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

/**
 * Refreshes the Supabase auth session on every request and keeps the auth
 * cookies in sync between the request and the response. Guests (no session)
 * pass straight through — this NEVER blocks a route, matching the
 * guests-allowed decision; sign-in only unlocks saved progress. When Supabase
 * is not configured it is a no-op.
 *
 * `requestHeaders` (defaults to a clone of the incoming request's headers)
 * lets the caller forward extra headers — e.g. the CSP nonce set in
 * src/proxy.ts — into the request context that Server Components read via
 * `headers()`, without this function needing to know about CSP at all.
 */
export async function updateSession(
  request: NextRequest,
  requestHeaders: Headers = new Headers(request.headers),
): Promise<NextResponse> {
  let response = NextResponse.next({ request: { headers: requestHeaders } });

  if (!isSupabaseConfigured) {
    return response;
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request: { headers: requestHeaders } });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Touching getUser() refreshes an expiring session and rewrites cookies.
  await supabase.auth.getUser();

  return response;
}
