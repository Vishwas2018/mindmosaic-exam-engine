import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The recovery endpoints, decision by decision. Signing, origin checking, cookies and `NextResponse` are all real; only
 * the Auth service is scripted (the live behaviour against GoTrue is e2e/auth/email-confirmation-and-recovery.spec.ts).
 */
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: true }));

const cookieJar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name)! } : undefined) }),
}));

interface FakeUser {
  id: string;
}
const auth = {
  user: null as FakeUser | null,
  token: null as string | null,
  verifyOtp: vi.fn(),
  updateUser: vi.fn(),
  signOut: vi.fn(),
};
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => (auth.user ? { data: { user: auth.user }, error: null } : { data: { user: null }, error: { message: "no session" } }),
      getSession: async () => ({ data: { session: auth.token ? { access_token: auth.token } : null } }),
      verifyOtp: auth.verifyOtp,
      updateUser: auth.updateUser,
      signOut: auth.signOut,
    },
  }),
}));

import { POST as verifyPost } from "@/app/api/auth/recovery/verify/route";
import { DELETE as sessionDelete, GET as sessionGet, POST as sessionPost } from "@/app/api/auth/recovery/session/route";
import { POST as passwordPost } from "@/app/api/auth/recovery/password/route";
import { RECOVERY_CSRF_HEADER, RECOVERY_GRANT_COOKIE, issueRecoveryGrant } from "@/server/auth/recovery-grant";

const ORIGIN = "http://127.0.0.1:3101";
const USER_A: FakeUser = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" };
const USER_B: FakeUser = { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" };
const STRONG = "Str0ng!NewPassword";
const TOKEN_HASH = "pkce_super_secret_token_hash_value_123456";

const jwt = (claims: object) => `h.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.s`;
const nowS = () => Math.floor(Date.now() / 1000);

function signIn(user: FakeUser, sessionId: string, methods: Array<{ method: string; timestamp: number }>) {
  auth.user = user;
  auth.token = jwt({ sub: user.id, session_id: sessionId, amr: methods });
}

function request(path: string, init: { method?: string; headers?: Record<string, string | null>; body?: unknown } = {}) {
  const headers: Record<string, string> = { host: "127.0.0.1:3101", origin: ORIGIN, "content-type": "application/json" };
  for (const [name, value] of Object.entries(init.headers ?? {})) {
    if (value === null) delete headers[name];
    else headers[name] = value;
  }
  return new Request(`${ORIGIN}${path}`, {
    method: init.method ?? "POST",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

const setCookies = (response: Response) => response.headers.getSetCookie();

let logSpies: ReturnType<typeof vi.spyOn>[];
beforeEach(() => {
  process.env.RECOVERY_GRANT_SECRET = "route-test-recovery-secret-0123456789abcdef";
  cookieJar.clear();
  auth.user = null;
  auth.token = null;
  auth.verifyOtp.mockReset();
  auth.updateUser.mockReset().mockResolvedValue({ data: {}, error: null });
  auth.signOut.mockReset().mockResolvedValue({ error: null });
  logSpies = (["log", "info", "warn", "error", "debug"] as const).map((level) => vi.spyOn(console, level).mockImplementation(() => undefined));
});
afterEach(() => {
  delete process.env.RECOVERY_GRANT_SECRET;
  /* Nothing in the recovery path may log, and the one-time token must appear in no log line. */
  for (const spy of logSpies) {
    expect(JSON.stringify(spy.mock.calls)).not.toContain(TOKEN_HASH);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  }
});

/** Issues a grant the way the verify route would, for the session currently signed in, and puts it in the cookie jar. */
function holdGrant(user = auth.user!, sessionId = "sess-1") {
  const grant = issueRecoveryGrant({ userId: user.id, sessionId });
  if (!grant.ok) throw new Error("no grant");
  cookieJar.set(RECOVERY_GRANT_COOKIE, grant.cookieValue);
  return grant;
}

describe("POST /api/auth/recovery/verify", () => {
  it("rejects a cross-site or origin-less request before touching the token", async () => {
    for (const origin of ["https://evil.example", null]) {
      const response = await verifyPost(request("/api/auth/recovery/verify", { headers: { origin }, body: { tokenHash: TOKEN_HASH } }));
      expect(response.status).toBe(403);
    }
    expect(auth.verifyOtp).not.toHaveBeenCalled();
  });

  it("does not spend the one-time token when the grant secret is missing", async () => {
    delete process.env.RECOVERY_GRANT_SECRET;
    const response = await verifyPost(request("/api/auth/recovery/verify", { body: { tokenHash: TOKEN_HASH } }));
    expect(response.status).toBe(503);
    expect(auth.verifyOtp).not.toHaveBeenCalled();
  });

  it("rejects a malformed body without calling the Auth service", async () => {
    for (const body of [{}, { tokenHash: "x" }, { tokenHash: TOKEN_HASH, extra: 1 }, { tokenHash: 5 }]) {
      const response = await verifyPost(request("/api/auth/recovery/verify", { body }));
      expect(response.status).toBe(400);
    }
    expect(auth.verifyOtp).not.toHaveBeenCalled();
  });

  it("reports an expired, reused or invalid token generically, issues no grant, and never echoes the token or the Auth message", async () => {
    auth.verifyOtp.mockResolvedValue({ data: {}, error: { message: `Email link is invalid or has expired ${TOKEN_HASH}` } });
    const response = await verifyPost(request("/api/auth/recovery/verify", { body: { tokenHash: TOKEN_HASH } }));
    expect(response.status).toBe(400);
    const text = await response.text();
    expect(text).toBe(JSON.stringify({ error: "invalid_or_expired_link" }));
    expect(text).not.toContain(TOKEN_HASH);
    expect(setCookies(response)).toEqual([]);
  });

  it("verifies the token itself, then issues a grant bound to the session it created", async () => {
    auth.verifyOtp.mockImplementation(async () => {
      signIn(USER_A, "sess-recovery", [{ method: "otp", timestamp: nowS() }]);
      return { data: {}, error: null };
    });
    const response = await verifyPost(request("/api/auth/recovery/verify", { body: { tokenHash: TOKEN_HASH } }));
    expect(response.status).toBe(200);
    expect(auth.verifyOtp).toHaveBeenCalledWith({ token_hash: TOKEN_HASH, type: "recovery" });
    const body = (await response.json()) as { csrfToken: string };
    expect(body.csrfToken).toBeTruthy();
    expect(response.headers.get("cache-control")).toBe("no-store");

    const [cookie] = setCookies(response);
    expect(cookie).toMatch(new RegExp(`^${RECOVERY_GRANT_COOKIE}=`));
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=strict/i);
    expect(cookie).toMatch(/Path=\/api\/auth\/recovery/);
    expect(cookie).toMatch(/Max-Age=900/);
    expect(cookie).not.toContain(TOKEN_HASH);
    expect(JSON.stringify(Object.fromEntries(response.headers))).not.toContain(TOKEN_HASH);
  });

  it("refuses to issue a grant when the session cannot be read back from the Auth service", async () => {
    auth.verifyOtp.mockResolvedValue({ data: {}, error: null }); // verified, but no live session afterwards
    const response = await verifyPost(request("/api/auth/recovery/verify", { body: { tokenHash: TOKEN_HASH } }));
    expect(response.status).toBe(400);
    expect(setCookies(response)).toEqual([]);
  });
});

describe("POST /api/auth/recovery/session (a session the Auth service made from a recovery link)", () => {
  it("is refused with no session", async () => {
    expect((await sessionPost(request("/api/auth/recovery/session"))).status).toBe(401);
  });

  it.each([
    ["password sign-in", [{ method: "password", timestamp: nowS() }]],
    ["signup confirmation", [{ method: "email/signup", timestamp: nowS() }]],
    ["verifyOtp / magic link (otp)", [{ method: "otp", timestamp: nowS() }]],
    ["an old recovery", [{ method: "recovery", timestamp: nowS() - 3600 }]],
    ["no methods at all", []],
  ])("is refused for an ordinary session: %s", async (_name, methods) => {
    signIn(USER_A, "sess-1", methods);
    const response = await sessionPost(request("/api/auth/recovery/session"));
    expect(response.status).toBe(403);
    expect(setCookies(response)).toEqual([]);
  });

  it("issues a grant for a session with a recent recovery method", async () => {
    signIn(USER_A, "sess-1", [{ method: "recovery", timestamp: nowS() - 30 }]);
    const response = await sessionPost(request("/api/auth/recovery/session"));
    expect(response.status).toBe(200);
    expect(setCookies(response)[0]).toMatch(/HttpOnly/i);
  });

  it("is refused from another origin", async () => {
    signIn(USER_A, "sess-1", [{ method: "recovery", timestamp: nowS() }]);
    expect((await sessionPost(request("/api/auth/recovery/session", { headers: { origin: "https://evil.example" } }))).status).toBe(403);
  });

  it("GET reports a grant valid only for the session it was issued for", async () => {
    signIn(USER_A, "sess-1", []);
    const grant = holdGrant();
    expect(await (await sessionGet()).json()).toEqual({ valid: true, csrfToken: grant.csrfToken, expiresAt: grant.expiresAt });
    signIn(USER_A, "sess-other", []);
    expect(await (await sessionGet()).json()).toEqual({ valid: false });
    signIn(USER_B, "sess-1", []);
    expect(await (await sessionGet()).json()).toEqual({ valid: false });
    auth.user = null;
    expect(await (await sessionGet()).json()).toEqual({ valid: false });
  });

  it("DELETE clears the grant cookie", async () => {
    const response = await sessionDelete(request("/api/auth/recovery/session", { method: "DELETE" }));
    expect(setCookies(response)[0]).toMatch(new RegExp(`^${RECOVERY_GRANT_COOKIE}=;`));
    expect(setCookies(response)[0]).toMatch(/Max-Age=0/);
  });
});

describe("POST /api/auth/recovery/password", () => {
  const send = (over: { headers?: Record<string, string | null>; body?: unknown } = {}, csrf?: string) =>
    passwordPost(
      request("/api/auth/recovery/password", {
        headers: { ...(csrf ? { [RECOVERY_CSRF_HEADER]: csrf } : {}), ...(over.headers ?? {}) },
        body: over.body === undefined ? { password: STRONG } : over.body,
      }),
    );

  it("changes the password with a valid grant + CSRF token, revokes every session, clears the grant, and cannot be replayed", async () => {
    signIn(USER_A, "sess-1", []);
    const grant = holdGrant();
    const response = await send({}, grant.csrfToken);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, otherSessionsRevoked: true });
    expect(auth.updateUser).toHaveBeenCalledExactlyOnceWith({ password: STRONG });
    expect(auth.signOut).toHaveBeenCalledExactlyOnceWith({ scope: "global" });
    expect(setCookies(response)[0]).toMatch(/Max-Age=0/);

    /* Replay with the same cookie. The global sign-out ended the session the grant was bound to; the Auth service
       now refuses its token (measured against the local Auth service in e2e), so there is no live session to match. */
    auth.user = null;
    auth.token = null;
    const replay = await send({}, grant.csrfToken);
    expect(replay.status).toBe(401);
    /* ...and a NEW session for the same user is a different binding, so a copied cookie does not carry over. */
    signIn(USER_A, "sess-new-after-sign-in", []);
    expect((await send({}, grant.csrfToken)).status).toBe(403);
    expect(auth.updateUser).toHaveBeenCalledTimes(1);
  });

  it("retries the global sign-out once, and reports honestly when sessions still could not be revoked", async () => {
    signIn(USER_A, "sess-1", []);
    const grant = holdGrant();
    auth.signOut.mockResolvedValueOnce({ error: { message: "blip" } }).mockResolvedValueOnce({ error: null });
    expect(await (await send({}, grant.csrfToken)).json()).toEqual({ ok: true, otherSessionsRevoked: true });
    expect(auth.signOut).toHaveBeenCalledTimes(2);

    auth.signOut.mockReset().mockResolvedValue({ error: { message: "boom" } });
    expect(await (await send({}, grant.csrfToken)).json()).toEqual({ ok: true, otherSessionsRevoked: false });
    expect(auth.signOut).toHaveBeenCalledTimes(2);
  });

  it("refuses an ordinary signed-in session that holds no grant", async () => {
    signIn(USER_A, "sess-1", [{ method: "password", timestamp: nowS() }]);
    const response = await send({}, "anything");
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "recovery_required", reason: "missing" });
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("refuses with no session at all", async () => {
    expect((await send({}, "x")).status).toBe(401);
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("refuses a forged grant", async () => {
    signIn(USER_A, "sess-1", []);
    const grant = holdGrant();
    cookieJar.set(RECOVERY_GRANT_COOKIE, grant.cookieValue.replace(/.$/, (c) => (c === "A" ? "B" : "A")));
    const response = await send({}, grant.csrfToken);
    expect(response.status).toBe(403);
    expect((await response.json()) as { reason: string }).toMatchObject({ reason: "bad_signature" });
    cookieJar.set(RECOVERY_GRANT_COOKIE, "v1.e30.e30");
    expect((await send({}, grant.csrfToken)).status).toBe(403);
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("refuses an expired grant", async () => {
    signIn(USER_A, "sess-1", []);
    const grant = issueRecoveryGrant({ userId: USER_A.id, sessionId: "sess-1" }, Date.now() - 16 * 60 * 1000);
    if (!grant.ok) throw new Error("no grant");
    cookieJar.set(RECOVERY_GRANT_COOKIE, grant.cookieValue);
    const response = await send({}, grant.csrfToken);
    expect(response.status).toBe(403);
    expect((await response.json()) as { reason: string }).toMatchObject({ reason: "expired" });
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("refuses a grant after the browser's account switched (other user, or other session of the same user)", async () => {
    signIn(USER_A, "sess-1", []);
    const grant = holdGrant();
    signIn(USER_B, "sess-1", []);
    expect((await send({}, grant.csrfToken)).status).toBe(403);
    signIn(USER_A, "sess-signed-in-again", []);
    expect((await send({}, grant.csrfToken)).status).toBe(403);
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("is protected against CSRF: no origin, a foreign origin, a missing or wrong token, or a non-JSON body", async () => {
    signIn(USER_A, "sess-1", []);
    const grant = holdGrant();
    expect((await send({ headers: { origin: "https://evil.example" } }, grant.csrfToken)).status).toBe(403);
    expect((await send({ headers: { origin: null } }, grant.csrfToken)).status).toBe(403);
    expect((await send({}, undefined)).status).toBe(403);
    expect((await send({}, "not-the-token")).status).toBe(403);
    expect((await send({ headers: { "content-type": "text/plain" } }, grant.csrfToken)).status).toBe(415);
    expect((await send({ headers: { "content-type": "application/x-www-form-urlencoded" } }, grant.csrfToken)).status).toBe(415);
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("rejects an invalid body and a policy-failing password before calling the Auth service", async () => {
    signIn(USER_A, "sess-1", []);
    const grant = holdGrant();
    expect((await send({ body: {} }, grant.csrfToken)).status).toBe(400);
    expect((await send({ body: { password: STRONG, extra: true } }, grant.csrfToken)).status).toBe(400);
    const weak = await send({ body: { password: "password" } }, grant.csrfToken);
    expect(weak.status).toBe(400);
    expect(await weak.json()).toEqual({ error: "password_too_weak" });
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("keeps the grant usable when the Auth service rejects the password (for example, the same password)", async () => {
    signIn(USER_A, "sess-1", []);
    const grant = holdGrant();
    auth.updateUser.mockResolvedValueOnce({ data: {}, error: { status: 422, message: "same_password" } });
    const rejected = await send({}, grant.csrfToken);
    expect(rejected.status).toBe(400);
    expect(await rejected.json()).toEqual({ error: "password_rejected" });
    expect(auth.signOut).not.toHaveBeenCalled();
    expect(setCookies(rejected)).toEqual([]);
    expect((await send({}, grant.csrfToken)).status).toBe(200);
  });

  it("fails closed when the grant secret is missing", async () => {
    signIn(USER_A, "sess-1", []);
    const grant = holdGrant();
    delete process.env.RECOVERY_GRANT_SECRET;
    expect((await send({}, grant.csrfToken)).status).toBe(503);
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
});
