/**
 * Proof, kept for the life of one browser tab, that THIS tab turned a password-recovery link into the current session.
 *
 * Why it exists: a session made by `verifyOtp({ token_hash, type: "recovery" })` carries the authentication method
 * `otp`, the same as any other OTP sign-in, so the session's own claims cannot tell the two apart. What does tell them
 * apart is that GoTrue only returns that session when the token matches a stored RECOVERY token, and the SDK then
 * emits PASSWORD_RECOVERY. We record that moment, bound to the session's `session_id`, and the reset page accepts the
 * marker only while the same session is current, only for a short window, and only after the server has accepted the
 * access token. A sign-in made any other way never gets a marker.
 *
 * sessionStorage is per tab and is not readable by other origins. Anything able to write it can already run script in
 * the page, which is a larger problem than this check.
 */
const KEY = "mm-recovery-session";

/** The recovery link's own lifetime (GoTrue: one hour). */
export const RECOVERY_WINDOW_SECONDS = 3600;

interface Marker {
  readonly sid: string;
  readonly at: number; // epoch seconds
}

/** Reads `session_id` from an access token. Used only to compare with a marker, never to trust the token. */
export function sessionIdOf(accessToken: string | null | undefined): string | null {
  if (!accessToken) return null;
  try {
    const payload = accessToken.split(".")[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const sid = (JSON.parse(json) as { session_id?: unknown }).session_id;
    return typeof sid === "string" && sid.length > 0 ? sid : null;
  } catch {
    return null;
  }
}

export function rememberRecovery(accessToken: string | null | undefined, nowSeconds = Math.floor(Date.now() / 1000)): void {
  const sid = sessionIdOf(accessToken);
  if (!sid || typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify({ sid, at: nowSeconds } satisfies Marker));
  } catch {
    /* Storage unavailable (private mode): the amr path below still covers PKCE links. */
  }
}

export function forgetRecovery(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}

/** True only for the exact session the marker was made for, inside the window. */
export function recoveryMarkerMatches(
  accessToken: string | null | undefined,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  if (typeof window === "undefined") return false;
  const sid = sessionIdOf(accessToken);
  if (!sid) return false;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return false;
    const marker = JSON.parse(raw) as Partial<Marker>;
    return marker.sid === sid && typeof marker.at === "number" && nowSeconds - marker.at <= RECOVERY_WINDOW_SECONDS;
  } catch {
    return false;
  }
}
