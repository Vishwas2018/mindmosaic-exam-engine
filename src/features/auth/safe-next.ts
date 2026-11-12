/**
 * Return-to-screen safety. A `next` value arrives from a URL anyone can craft
 * (`/sign-in?next=...`), so it is only ever used when it is a same-origin
 * *path*. Anything that could leave the site — an absolute URL, a
 * protocol-relative `//host`, a backslash that browsers normalise to a slash,
 * a control character — is refused and the caller falls back to the signed-in
 * role's home.
 *
 * Pure and framework-free: used by the client SignInPanel and the server
 * `/auth/callback` route alike.
 */
const MAX_LENGTH = 2048;
const PROBE_ORIGIN = "http://next-probe.invalid";

export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw || raw.length > MAX_LENGTH) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  // Backslashes are treated as slashes by browsers (`/\evil.test`); control
  // characters are used to smuggle a scheme past naive prefix checks.
  // eslint-disable-next-line no-control-regex
  if (raw.includes("\\") || /[\u0000-\u001f\u007f]/.test(raw)) return null;
  try {
    const parsed = new URL(raw, PROBE_ORIGIN);
    if (parsed.origin !== PROBE_ORIGIN) return null;
  } catch {
    return null;
  }
  return raw;
}
