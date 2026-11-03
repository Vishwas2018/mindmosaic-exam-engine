/**
 * Browser side of the recovery flow. Every call is same-origin and cookie-bearing; the server decides everything
 * (src/server/auth/recovery-grant.ts). Nothing here stores a token: the one-time `token_hash` goes to the server in a
 * POST body and is never written to storage, the console or a URL. The CSRF token for the password call is fetched
 * from the server when the form opens and held in memory only.
 */
const BASE = "/api/auth/recovery";

export type GrantResult =
  | { readonly ok: true; readonly csrfToken: string }
  | { readonly ok: false; readonly reason: "invalid_or_expired" | "not_recovery" | "no_session" | "unavailable" };

async function json(response: Response): Promise<Record<string, unknown>> {
  return (await response.json().catch(() => ({}))) as Record<string, unknown>;
}

function post(path: string, body?: unknown, headers: Record<string, string> = {}): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body ?? {}),
  });
}

/** The server verifies the emailed token itself, then issues the grant. Works on any device or browser. */
export async function verifyRecoveryLink(tokenHash: string): Promise<GrantResult> {
  try {
    const response = await post("/verify", { tokenHash });
    const data = await json(response);
    if (response.ok && typeof data.csrfToken === "string") return { ok: true, csrfToken: data.csrfToken };
    return { ok: false, reason: response.status === 400 ? "invalid_or_expired" : "unavailable" };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

/** For a session the Auth service already created from a recovery link (PKCE code / fragment tokens). */
export async function requestGrantForSession(): Promise<GrantResult> {
  try {
    const response = await post("/session");
    const data = await json(response);
    if (response.ok && typeof data.csrfToken === "string") return { ok: true, csrfToken: data.csrfToken };
    if (response.status === 401) return { ok: false, reason: "no_session" };
    if (response.status === 403) return { ok: false, reason: "not_recovery" };
    return { ok: false, reason: "unavailable" };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

/** Does the current browser hold a valid grant for the current session? (After a reload, for example.) */
export async function recoveryStatus(): Promise<GrantResult> {
  try {
    const response = await fetch(`${BASE}/session`, { credentials: "same-origin", cache: "no-store" });
    const data = await json(response);
    if (response.ok && data.valid === true && typeof data.csrfToken === "string") return { ok: true, csrfToken: data.csrfToken };
    return { ok: false, reason: "no_session" };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

export type PasswordResult =
  | { readonly ok: true; readonly otherSessionsRevoked: boolean }
  | { readonly ok: false; readonly reason: "recovery_required" | "uncertain" | "weak" | "rejected" | "unavailable" };

export async function submitNewPassword(password: string, csrfToken: string): Promise<PasswordResult> {
  try {
    const response = await post("/password", { password }, { "x-mm-recovery-csrf": csrfToken });
    const data = await json(response);
    if (response.ok) return { ok: true, otherSessionsRevoked: data.otherSessionsRevoked === true };
    if (data.error === "password_too_weak") return { ok: false, reason: "weak" };
    if (data.error === "password_rejected") return { ok: false, reason: "rejected" };
    /* An earlier attempt on this link may or may not have changed the password: the link is dead, a fresh one is needed. */
    if (data.error === "update_uncertain" || data.reason === "lapsed") return { ok: false, reason: "uncertain" };
    if (response.status === 401 || response.status === 403) return { ok: false, reason: "recovery_required" };
    return { ok: false, reason: "unavailable" };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

/** Drops the grant cookie (sign-out, abandon). Best effort: the grant is also bound to a session that is ending. */
export async function clearRecoveryGrant(): Promise<void> {
  try {
    await fetch(`${BASE}/session`, { method: "DELETE", credentials: "same-origin", cache: "no-store", keepalive: true });
  } catch {
    /* Offline: the grant expires on its own and dies with the session. */
  }
}
