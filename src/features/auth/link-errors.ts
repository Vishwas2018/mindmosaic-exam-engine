/**
 * Emailed auth links reach the app in three shapes, and only the first is tied to the browser that asked for it:
 *   - `?code=…`                          PKCE: exchanged with a verifier stored in the *requesting* browser.
 *   - `?token_hash=…&type=…`             OTP: verified by the token alone, so it works on any device.
 *   - `#access_token=…&refresh_token=…`  implicit: the tokens are the session; the fragment never reaches the server.
 * A PKCE link opened on another phone or laptop therefore fails with a raw GoTrue message about a missing verifier.
 */
const CROSS_DEVICE = /code verifier|pkce/i;

export const CROSS_DEVICE_MESSAGE =
  "This link was opened on a different device or browser from the one it was requested on. " +
  "Request a new link below and open it on the device you want to use.";

/** True for the provider's "missing PKCE verifier" failure, i.e. a link opened on another device or browser. */
export function isCrossDeviceLinkError(message: string | null | undefined): boolean {
  return !!message && CROSS_DEVICE.test(message);
}

/** Plain-language text for the screen; anything unrecognised passes through unchanged. */
export function friendlyLinkError(message: string | null | undefined, fallback: string): string {
  if (!message) return fallback;
  return CROSS_DEVICE.test(message) ? CROSS_DEVICE_MESSAGE : message;
}

export interface LinkCredentials {
  readonly code: string | null;
  readonly tokenHash: string | null;
  readonly type: string | null;
  readonly accessToken: string | null;
  readonly refreshToken: string | null;
  readonly errorCode: string | null;
  readonly errorDescription: string | null;
}

/**
 * Reads every shape from the query and the fragment. The fragment is only visible in the browser, so the caller
 * passes `window.location.hash` from an effect, never during render.
 */
export function readLinkCredentials(query: URLSearchParams, fragment: string): LinkCredentials {
  const hash = new URLSearchParams(fragment.replace(/^#/, ""));
  const pick = (name: string) => query.get(name) ?? hash.get(name);
  return {
    code: query.get("code"),
    tokenHash: query.get("token_hash"),
    type: pick("type"),
    accessToken: hash.get("access_token"),
    refreshToken: hash.get("refresh_token"),
    errorCode: pick("error_code"),
    errorDescription: pick("error_description"),
  };
}

/** Removes credentials from the address bar once they have been consumed (they are single-use secrets). */
export function stripLinkCredentials(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  for (const key of ["code", "token_hash", "type", "error", "error_code", "error_description"]) {
    url.searchParams.delete(key);
  }
  url.hash = "";
  window.history.replaceState(window.history.state, "", url.pathname + url.search);
}
