/**
 * Builds a Playwright storageState cookie that @supabase/ssr will recognise
 * as a signed-in session — without ever driving a browser through the
 * sign-in UI. This is the "API or database-level fixture preparation"
 * approach called for by the mission over UI-driven login.
 *
 * The format below (cookie name, base64 envelope, chunk size) is read
 * directly out of the installed @supabase/ssr and @supabase/auth-js
 * packages (see node_modules/@supabase/ssr/dist/main/cookies.js and
 * node_modules/@supabase/supabase-js/dist/.../SupabaseClient — the
 * `sb-${hostname-first-label}-auth-token` key), not guessed or reverse
 * engineered from observed traffic. If either package's cookie
 * implementation changes, this is the file to update.
 */
import { e2eEnv } from "./env";

const MAX_CHUNK_SIZE = 3180;

export interface FixtureSession {
  readonly access_token: string;
  readonly refresh_token: string;
  readonly expires_in: number;
  readonly expires_at?: number;
  readonly token_type: string;
  readonly user: unknown;
}

/**
 * Calls GoTrue's password grant directly over HTTP — the same request
 * `supabase.auth.signInWithPassword` makes, just without a browser or the
 * supabase-js client. Never used against anything but the local instance:
 * callers must already have passed the environment guard.
 */
export async function signInWithPassword(
  email: string,
  password: string,
): Promise<FixtureSession> {
  const response = await fetch(
    `${e2eEnv.supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: e2eEnv.supabaseAnonKey,
      },
      body: JSON.stringify({ email, password }),
    },
  );
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`signInWithPassword failed for ${email}: ${response.status} ${body}`);
  }
  return (await response.json()) as FixtureSession;
}

export function authCookieName(supabaseUrl: string): string {
  const hostname = new URL(supabaseUrl).hostname;
  return `sb-${hostname.split(".")[0]}-auth-token`;
}

export interface StorageStateCookie {
  readonly name: string;
  readonly value: string;
  readonly domain: string;
  readonly path: string;
  readonly expires: number;
  readonly httpOnly: boolean;
  readonly secure: boolean;
  readonly sameSite: "Lax" | "Strict" | "None";
}

/**
 * Encodes a session the same way auth-js's `_saveSession` + @supabase/ssr's
 * cookie storage adapter do: JSON-stringify, then base64url with a
 * `base64-` prefix. Chunking (`.0`, `.1`, ...) kicks in past 3180
 * URI-encoded characters — fixture sessions (short local JWTs, minimal
 * user_metadata) stay well under that, so only the single-cookie path is
 * implemented; this throws rather than silently truncate if that ever
 * stops being true.
 */
export function buildAuthCookies(
  appOrigin: string,
  supabaseUrl: string,
  session: FixtureSession,
): StorageStateCookie[] {
  const json = JSON.stringify(session);
  const encoded = "base64-" + Buffer.from(json, "utf8").toString("base64url");
  const uriLength = encodeURIComponent(encoded).length;
  if (uriLength > MAX_CHUNK_SIZE) {
    throw new Error(
      `Fixture session cookie needs chunking (${uriLength} chars encoded) — ` +
        `this helper only implements the single-cookie path. See @supabase/ssr's ` +
        `createChunks in node_modules/@supabase/ssr/dist/main/utils/chunker.js.`,
    );
  }

  const url = new URL(appOrigin);
  const expires = Math.floor(Date.now() / 1000) + 400 * 24 * 60 * 60; // matches DEFAULT_COOKIE_OPTIONS.maxAge

  return [
    {
      name: authCookieName(supabaseUrl),
      value: encoded,
      domain: url.hostname,
      path: "/",
      expires,
      httpOnly: false,
      secure: url.protocol === "https:",
      sameSite: "Lax",
    },
  ];
}
