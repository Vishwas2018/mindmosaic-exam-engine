import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

/**
 * THE RECOVERY GRANT (family-beta WP1).
 *
 * A short-lived, signed, HttpOnly cookie that says: "the server verified a password-recovery token for THIS user and
 * THIS session a moment ago". The application's own password-reset endpoint accepts a new password only with a valid
 * grant, so an ordinary signed-in session (an unlocked parent device, a child's session) cannot use the application's
 * reset screen to change a password.
 *
 * WHAT THIS PROTECTS, AND WHAT IT DOES NOT. It protects the APPLICATION'S reset path. It is not a control on Supabase
 * Auth: any holder of a valid session can still call Supabase's own `PUT /auth/v1/user` directly with the public
 * anon key and the session's bearer token, and GoTrue will accept it (unless the project's own settings, such as
 * "secure password change", intervene). Nothing in this application can block an API call that goes to Supabase and
 * never reaches us. This grant narrows the product's attack surface; it does not close that one, and no document or
 * UI string may say it does. (tests/e2e/auth records the direct-API behaviour so the claim stays honest.)
 *
 * WHAT A GRANT IS BOUND TO
 *   uid  the user the recovery token belonged to
 *   sid  the Auth session that token created (the `session_id` claim; stable across token refreshes)
 *   iat/exp  issue time and expiry (15 minutes)
 *   jti  unique per grant; also the seed of the CSRF token
 * It is signed with HMAC-SHA256 under RECOVERY_GRANT_SECRET, compared in constant time, and carries no secret.
 *
 * SINGLE USE is enforced SERVER-SIDE, in the database (src/server/auth/recovery-claim.ts, migration 20261102090000, fail-closed by 20261103090000):
 * the password endpoint claims the grant's `jti` atomically before changing the password and marks it spent after, so
 * two concurrent requests cannot both proceed, a replay after success is refused whatever session presents it, and a
 * failed global sign-out no longer leaves the grant reusable. Clearing the browser cookie is hygiene, never the
 * control. The grant is ALSO bound to a live Auth session, so a successful sign-out kills it a second way. Binding to
 * the user's `updated_at` was rejected because the Auth service moves it on every token refresh.
 *
 * CSRF. The cookie is SameSite=Strict and scoped to /api/auth/recovery. The password endpoint additionally requires
 * a same-origin `Origin`, a JSON body, and a per-grant token in a custom header (only readable by a same-origin GET
 * that itself needs the cookie). A cross-site page can do none of those.
 *
 * FAIL CLOSED. If RECOVERY_GRANT_SECRET is unset or short, nothing is issued and nothing validates.
 * The secret is named in this file only (src/tests/unit/recovery-grant.test.ts asserts that).
 */

export const RECOVERY_GRANT_COOKIE = "mm-recovery-grant";
export const RECOVERY_CSRF_HEADER = "x-mm-recovery-csrf";
export const RECOVERY_GRANT_TTL_SECONDS = 15 * 60;
/** The cookie is sent only to the recovery endpoints. */
export const RECOVERY_GRANT_PATH = "/api/auth/recovery";

const MIN_SECRET_LENGTH = 32;

export interface RecoveryBinding {
  readonly userId: string;
  readonly sessionId: string;
}

interface Payload {
  readonly v: 1;
  readonly uid: string;
  readonly sid: string;
  readonly jti: string;
  readonly iat: number; // epoch seconds
  readonly exp: number;
}

export type GrantRejection =
  | "not_configured"
  | "missing"
  | "malformed"
  | "bad_signature"
  | "expired"
  | "mismatch";

export type IssuedGrant =
  | { readonly ok: true; readonly cookieValue: string; readonly csrfToken: string; readonly expiresAt: number }
  | { readonly ok: false; readonly reason: "not_configured" };

export type GrantCheck =
  | { readonly ok: true; readonly csrfToken: string; readonly expiresAt: number; readonly jti: string }
  | { readonly ok: false; readonly reason: GrantRejection };

function secret(): string | null {
  const value = process.env.RECOVERY_GRANT_SECRET;
  return value && value.length >= MIN_SECRET_LENGTH ? value : null;
}

/** Lets a route refuse BEFORE it spends a one-time token on a request that could then issue no grant. */
export function recoveryGrantConfigured(): boolean {
  return secret() !== null;
}

const b64 = (input: Buffer | string) => Buffer.from(input).toString("base64url");
const mac = (key: string, data: string) => createHmac("sha256", key).update(data).digest();

function safeEqual(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}

function csrfFor(key: string, jti: string): string {
  return b64(mac(key, `csrf|${jti}`));
}

export function issueRecoveryGrant(binding: RecoveryBinding, nowMs = Date.now()): IssuedGrant {
  const key = secret();
  if (!key) return { ok: false, reason: "not_configured" };
  const iat = Math.floor(nowMs / 1000);
  const payload: Payload = {
    v: 1,
    uid: binding.userId,
    sid: binding.sessionId,
    jti: randomUUID(),
    iat,
    exp: iat + RECOVERY_GRANT_TTL_SECONDS,
  };
  const body = b64(JSON.stringify(payload));
  const cookieValue = `v1.${body}.${b64(mac(key, `v1.${body}`))}`;
  return { ok: true, cookieValue, csrfToken: csrfFor(key, payload.jti), expiresAt: payload.exp };
}

/**
 * Validates a cookie value against the binding the SERVER just established from the live Auth session (never from
 * the request body). Returns the CSRF token for the grant when valid.
 */
export function inspectRecoveryGrant(
  cookieValue: string | undefined,
  current: RecoveryBinding,
  nowMs = Date.now(),
): GrantCheck {
  const key = secret();
  if (!key) return { ok: false, reason: "not_configured" };
  if (!cookieValue) return { ok: false, reason: "missing" };

  const parts = cookieValue.split(".");
  if (parts.length !== 3 || parts[0] !== "v1" || !parts[1] || !parts[2]) return { ok: false, reason: "malformed" };

  const given = Buffer.from(parts[2], "base64url");
  if (!safeEqual(given, mac(key, `v1.${parts[1]}`))) return { ok: false, reason: "bad_signature" };

  let payload: Partial<Payload>;
  try {
    payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as Partial<Payload>;
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (
    payload.v !== 1 ||
    typeof payload.uid !== "string" ||
    typeof payload.sid !== "string" ||
    typeof payload.jti !== "string" ||
    typeof payload.exp !== "number"
  ) {
    return { ok: false, reason: "malformed" };
  }
  if (Math.floor(nowMs / 1000) >= payload.exp) return { ok: false, reason: "expired" };
  if (payload.uid !== current.userId || payload.sid !== current.sessionId) {
    return { ok: false, reason: "mismatch" };
  }
  return { ok: true, csrfToken: csrfFor(key, payload.jti), expiresAt: payload.exp, jti: payload.jti };
}

/** Constant-time comparison of the header value with the grant's CSRF token. */
export function csrfMatches(header: string | null | undefined, expected: string): boolean {
  if (!header) return false;
  return safeEqual(Buffer.from(header), Buffer.from(expected));
}
