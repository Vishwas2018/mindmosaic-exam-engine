import "server-only";

import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  RECOVERY_GRANT_COOKIE,
  RECOVERY_GRANT_PATH,
  RECOVERY_GRANT_TTL_SECONDS,
  type RecoveryBinding,
} from "./recovery-grant";

/**
 * How recently GoTrue must have recorded a `recovery` authentication method on the session for the session-based
 * path (PKCE `?code=` and implicit links, which the Auth service itself turns into a session) to count as proof.
 */
export const RECOVERY_PROOF_WINDOW_SECONDS = 10 * 60;

interface AuthMethodClaim {
  readonly method?: unknown;
  readonly timestamp?: unknown;
}

export interface LiveSession {
  readonly binding: RecoveryBinding;
  /** `amr` entries from the SERVER-ACCEPTED access token. */
  readonly methods: ReadonlyArray<{ readonly method: string; readonly timestamp: number }>;
}

function claimsOf(accessToken: string): { sid?: unknown; sub?: unknown; amr?: unknown } | null {
  try {
    const payload = accessToken.split(".")[1];
    if (!payload) return null;
    const json = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      session_id?: unknown;
      sub?: unknown;
      amr?: unknown;
    };
    return { sid: json.session_id, sub: json.sub, amr: json.amr };
  } catch {
    return null;
  }
}

/**
 * The session the server can vouch for right now. `getUser()` sends the token to the Auth service, which validates
 * it (signature, expiry AND that the session still exists); only then are the token's claims read, so they are
 * not trusted on their own. Returns null for no session, an invalid one, or an archived account.
 */
export async function resolveLiveSession(supabase: SupabaseClient): Promise<LiveSession | null> {
  const { data: verified, error } = await supabase.auth.getUser();
  if (error || !verified.user) return null;
  const { data: current } = await supabase.auth.getSession();
  const token = current.session?.access_token;
  if (!token) return null;
  const claims = claimsOf(token);
  if (!claims || typeof claims.sid !== "string" || claims.sid.length === 0 || claims.sub !== verified.user.id) {
    return null;
  }
  const methods = Array.isArray(claims.amr)
    ? (claims.amr as AuthMethodClaim[]).flatMap((entry) =>
        entry && typeof entry.method === "string" && typeof entry.timestamp === "number"
          ? [{ method: entry.method, timestamp: entry.timestamp }]
          : [],
      )
    : [];
  return { binding: { userId: verified.user.id, sessionId: claims.sid }, methods };
}

/** True when GoTrue recorded a recent `recovery` method on this session. `otp` is deliberately NOT accepted. */
export function hasRecentRecoveryMethod(live: LiveSession, nowMs = Date.now()): boolean {
  const now = Math.floor(nowMs / 1000);
  return live.methods.some((entry) => entry.method === "recovery" && now - entry.timestamp <= RECOVERY_PROOF_WINDOW_SECONDS);
}

export function noStore<T>(body: T, status = 200): NextResponse {
  const response = NextResponse.json(body, { status });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export function setGrantCookie(response: NextResponse, request: Request, value: string): void {
  response.cookies.set(RECOVERY_GRANT_COOKIE, value, {
    httpOnly: true,
    sameSite: "strict",
    secure: new URL(request.url).protocol === "https:",
    path: RECOVERY_GRANT_PATH,
    maxAge: RECOVERY_GRANT_TTL_SECONDS,
  });
}

export function clearGrantCookie(response: NextResponse, request: Request): void {
  response.cookies.set(RECOVERY_GRANT_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: new URL(request.url).protocol === "https:",
    path: RECOVERY_GRANT_PATH,
    maxAge: 0,
  });
}
