/**
 * Does this visit need the Supabase browser client at boot?
 *
 * The client (~70 KB gzipped with its auth and REST code) used to be bundled into every page's first
 * load, so a visitor who never signs in still downloaded and ran it before the page could paint.
 * AuthProvider now loads it with a dynamic import, and skips the load entirely when there is nothing
 * for it to do on this visit:
 *
 *  - a signed-in browser always carries the session cookie (`sb-<project>-auth-token`, written by
 *    @supabase/ssr and readable by the browser client), so a visit without one is anonymous;
 *  - a link back from an email (confirmation, password reset, OAuth) carries `code`, `token_hash`
 *    or `access_token` in the URL, and creating the client is what turns that into a session;
 *  - the auth routes themselves are about to use it, so it is loaded for them straight away.
 *
 * Anything else that needs the client (a sign-in click, say) loads it on demand. Nothing here changes
 * what an auth method does; it only changes when the client first exists.
 */

const AUTH_COOKIE = /^\s*sb-.*-auth-token/;
const AUTH_URL_TOKENS = ["code=", "token_hash", "access_token", "error_description", "type=recovery"];
const AUTH_ROUTES = new Set(["/sign-in", "/sign-up", "/student-sign-in"]);

export function hasStoredAuthSession(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((part) => AUTH_COOKIE.test(part));
}

export function urlCarriesAuthParams(): boolean {
  if (typeof window === "undefined") return false;
  const { search, hash } = window.location;
  const carried = `${search}${hash}`;
  return AUTH_URL_TOKENS.some((token) => carried.includes(token));
}

export function isAuthRoute(pathname: string): boolean {
  return pathname.startsWith("/auth/") || AUTH_ROUTES.has(pathname);
}

export function shouldLoadSupabaseAtBoot(): boolean {
  if (typeof window === "undefined") return false;
  return hasStoredAuthSession() || urlCarriesAuthParams() || isAuthRoute(window.location.pathname);
}
