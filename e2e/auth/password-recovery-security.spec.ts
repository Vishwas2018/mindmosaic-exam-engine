/**
 * Password recovery against the REAL local Auth service, real emails and the production build (family-beta WP1).
 *
 * Nothing about GoTrue is mocked: the recovery token travels GoTrue -> Mailpit -> browser -> our route -> GoTrue.
 * Needs the local mail catcher (E2E_MAILPIT_URL) like the other mail tests in this directory.
 *
 * The links in the emails of the stack under test use the `?token_hash=` form (the template the stack was started
 * with). The current `supabase/templates/recovery.html` puts the token in the URL fragment instead; `asFragment()`
 * rewrites a captured link to that shape so the page's fragment handling is exercised too. A stack restarted with the
 * current template emits the fragment form itself.
 *
 * What this file does NOT claim: that the application can stop a session holder from calling Supabase Auth's
 * update-user API directly. The last test records that behaviour so nobody has to take it on trust.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { BrowserContext, Page } from "@playwright/test";

import { test, expect } from "../fixtures/auth.fixture";
import { e2eEnv } from "../fixtures/env";
import { clearMailbox, getLatestEmail } from "../fixtures/mailpit";
import { buildAuthCookies, signInWithPassword } from "../fixtures/session-cookie";
import { createAdminClient } from "../fixtures/supabase-admin";
import { AUTH_APP_ORIGIN } from "../../playwright.auth.config";

const ADMIN = createAdminClient();
const MAIL = Boolean(process.env.E2E_MAILPIT_URL);
const GRANT_COOKIE = "mm-recovery-grant";
const GRANT_PATH = "/api/auth/recovery";
const OLD_PASSWORD = "OldPassword123!";
const NEW_PASSWORD = "BrandNew-Password-456!";

const randomEmail = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@mindmosaic.local`;

/** A standalone SDK client with its own (in-memory) storage: a "device" that exists only in this Node process. */
function device(): SupabaseClient {
  const memory = new Map<string, string>();
  return createClient(e2eEnv.supabaseUrl, e2eEnv.supabaseAnonKey, {
    auth: {
      flowType: "pkce",
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: true,
      storage: { getItem: (k) => memory.get(k) ?? null, setItem: (k, v) => void memory.set(k, v), removeItem: (k) => void memory.delete(k) },
    },
  });
}

async function createUser(prefix: string, password = OLD_PASSWORD) {
  const email = randomEmail(prefix);
  const { data, error } = await ADMIN.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: "Recovery Test", role: "parent" },
  });
  expect(error).toBeNull();
  return { email, id: data.user!.id };
}

async function canSignIn(email: string, password: string): Promise<boolean> {
  const { error } = await device().auth.signInWithPassword({ email, password });
  return !error;
}

const hashOf = (link: string) => new URL(link.replace("#", "?")).searchParams.get("token_hash")!;
const asFragment = (link: string) => link.replace("?token_hash=", "#token_hash=");

/** Requests a reset email from a "device" (so the PKCE verifier lives with that device) and returns the emailed link. */
async function requestResetLink(email: string, requester = device()) {
  await clearMailbox();
  const { error } = await requester.auth.resetPasswordForEmail(email, { redirectTo: `${AUTH_APP_ORIGIN}/auth/reset` });
  expect(error).toBeNull();
  return (await getLatestEmail(email)).link;
}

/** The URL GoTrue's own default template would send: GET /verify, which redirects to the app with a PKCE `code`. */
const verifyUrl = (link: string) =>
  `${e2eEnv.supabaseUrl}/auth/v1/verify?token=${hashOf(link)}&type=recovery&redirect_to=${encodeURIComponent(`${AUTH_APP_ORIGIN}/auth/reset`)}`;

async function openRecoveryForm(context: BrowserContext, link: string) {
  const page = await context.newPage();
  await page.goto(asFragment(link));
  await expect(page.getByRole("heading", { name: "Choose a new password" })).toBeVisible({ timeout: 15000 });
  return page;
}

async function grantCookie(context: BrowserContext) {
  return (await context.cookies(AUTH_APP_ORIGIN + GRANT_PATH)).find((c) => c.name === GRANT_COOKIE);
}

/** Calls our password endpoint from the browser context, with whatever headers the test chooses. */
async function postPassword(
  context: BrowserContext,
  options: { password?: string; csrf?: string | null; origin?: string | null; contentType?: string },
) {
  const headers: Record<string, string> = { "content-type": options.contentType ?? "application/json" };
  if (options.origin !== null) headers.origin = options.origin ?? AUTH_APP_ORIGIN;
  if (options.csrf) headers["x-mm-recovery-csrf"] = options.csrf;
  return context.request.post(`${AUTH_APP_ORIGIN}${GRANT_PATH}/password`, {
    headers,
    data: options.contentType && options.contentType !== "application/json" ? `password=${options.password ?? NEW_PASSWORD}` : { password: options.password ?? NEW_PASSWORD },
  });
}

async function csrfOf(context: BrowserContext): Promise<string> {
  const response = await context.request.get(`${AUTH_APP_ORIGIN}${GRANT_PATH}/session`);
  const body = (await response.json()) as { valid: boolean; csrfToken?: string };
  expect(body.valid).toBe(true);
  return body.csrfToken!;
}

async function submitForm(page: Page, password = NEW_PASSWORD) {
  await page.getByLabel("New password", { exact: true }).fill(password);
  await page.getByLabel("Confirm new password").fill(password);
  await page.getByRole("button", { name: "Update password" }).click();
}

test.describe("password recovery against the real Auth service", () => {
  test.skip(!MAIL, "needs a local mail catcher: set E2E_MAILPIT_URL");
  /* Each test opens several fresh browser contexts, and on the Windows development host a document load can stall for
     tens of seconds (see playwright.config.ts). The assertions are unchanged; only the budget is larger. */
  test.describe.configure({ timeout: 150_000 });

  test("cross-browser recovery completes, spends the link, revokes the other session, and leaks no token", async ({ browser }) => {
    const { email } = await createUser("rec-xbrowser");

    // The parent is signed in on another device when the reset happens.
    const otherDevice = device();
    expect((await otherDevice.auth.signInWithPassword({ email, password: OLD_PASSWORD })).error).toBeNull();
    expect((await otherDevice.auth.getUser()).error).toBeNull();

    // The reset is requested on one device; the email is opened in a completely different browser.
    const link = await requestResetLink(email);
    const token = hashOf(link);
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const consoleText: string[] = [];
    const requested: Array<{ url: string; referer: string }> = [];
    context.on("page", (p) => p.on("console", (m) => consoleText.push(m.text())));
    context.on("request", (r) => requested.push({ url: r.url(), referer: r.headers().referer ?? "" }));

    const page = await openRecoveryForm(context, link);

    // The token is out of the address bar, out of every URL and Referer, out of the console, and out of storage.
    expect(page.url()).not.toContain(token);
    expect(requested.filter((r) => r.url.includes(token) && !r.url.endsWith(asFragment(link).split("#")[1]!))).toEqual([]);
    expect(requested.filter((r) => r.referer.includes(token))).toEqual([]);
    expect(consoleText.filter((t) => t.includes(token))).toEqual([]);
    const storage = await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }) + document.cookie);
    expect(storage).not.toContain(token);

    // The grant is a server-set, HttpOnly, SameSite=Strict cookie scoped to the recovery endpoints.
    const grant = await grantCookie(context);
    expect(grant).toBeTruthy();
    expect(grant).toMatchObject({ httpOnly: true, sameSite: "Strict", path: GRANT_PATH });
    expect(await page.evaluate(() => document.cookie)).not.toContain(GRANT_COOKIE);

    // A reload keeps the form: the server still holds a valid grant for this session.
    await page.reload();
    await expect(page.getByRole("heading", { name: "Choose a new password" })).toBeVisible({ timeout: 15000 });

    await submitForm(page);
    await page.waitForURL(/\/sign-in/, { timeout: 15000 });

    // The old password is dead, the new one works.
    expect(await canSignIn(email, OLD_PASSWORD)).toBe(false);
    expect(await canSignIn(email, NEW_PASSWORD)).toBe(true);

    // The other device's session is revoked: its token stops validating and it can no longer refresh.
    expect((await otherDevice.auth.getUser()).error).not.toBeNull();
    expect((await otherDevice.auth.refreshSession()).error).not.toBeNull();

    // The grant cookie is cleared, and a replay of the spent link is refused.
    expect(await grantCookie(context)).toBeUndefined();
    const replay = await context.newPage();
    await replay.goto(asFragment(link));
    await expect(replay.getByRole("heading", { name: /link expired or invalid/i })).toBeVisible({ timeout: 15000 });
    await expect(replay.getByLabel("New password", { exact: true })).not.toBeVisible();
    await context.close();
  });

  test("same-browser recovery from the forgot-password screen", async ({ browser }) => {
    const { email } = await createUser("rec-same");
    const context = await browser.newContext();
    const page = await context.newPage();
    await clearMailbox();
    await page.goto("/sign-in?mode=forgot");
    await page.getByLabel("Email address").fill(email);
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText(/reset link is on its way/i)).toBeVisible();
    const link = (await getLatestEmail(email)).link;

    await page.goto(link);
    await expect(page.getByRole("heading", { name: "Choose a new password" })).toBeVisible({ timeout: 15000 });
    await submitForm(page);
    await page.waitForURL(/\/sign-in/, { timeout: 15000 });
    expect(await canSignIn(email, NEW_PASSWORD)).toBe(true);
    expect(await canSignIn(email, OLD_PASSWORD)).toBe(false);
    await context.close();
  });

  test("a PKCE link opened in the SAME browser is exchanged exactly once and then verified by the server", async ({ browser }) => {
    const { email } = await createUser("rec-pkce-same");
    const context = await browser.newContext();
    const page = await context.newPage();
    await clearMailbox();
    await page.goto("/sign-in?mode=forgot"); // the browser SDK stores the PKCE verifier in THIS context
    await page.getByLabel("Email address").fill(email);
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText(/reset link is on its way/i)).toBeVisible();
    const link = (await getLatestEmail(email)).link;

    const exchanges: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("/auth/v1/token") && r.url().includes("grant_type=pkce")) exchanges.push(r.url());
    });
    await page.goto(verifyUrl(link)); // GoTrue verifies, then redirects to /auth/reset?code=…
    await expect(page.getByRole("heading", { name: "Choose a new password" })).toBeVisible({ timeout: 15000 });
    expect(exchanges).toHaveLength(1);
    expect(page.url()).not.toContain("code=");

    await submitForm(page);
    await page.waitForURL(/\/sign-in/, { timeout: 15000 });
    expect(await canSignIn(email, NEW_PASSWORD)).toBe(true);
    await context.close();
  });

  test("a PKCE link opened in a DIFFERENT browser is explained, not offered a form, and sets nothing", async ({ browser }) => {
    const { email } = await createUser("rec-pkce-cross");
    const link = await requestResetLink(email); // verifier lives in this Node "device", not in any browser
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(verifyUrl(link));
    const heading = page.getByRole("heading", { name: /link expired or invalid/i });
    await expect(heading).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/different device or browser/i)).toBeVisible();
    await expect(page.getByLabel("New password", { exact: true })).not.toBeVisible();
    expect(await grantCookie(context)).toBeUndefined();
    expect(await canSignIn(email, OLD_PASSWORD)).toBe(true);
    await context.close();
  });

  test("malformed, truncated and reused links show a problem screen and never a form", async ({ browser }) => {
    const { email } = await createUser("rec-malformed");
    const link = await requestResetLink(email);
    const context = await browser.newContext();
    for (const url of [
      "/auth/reset#token_hash=not-a-real-token-123456&type=recovery",
      "/auth/reset#token_hash=&type=recovery",
      "/auth/reset#token_hash=x&type=recovery",
      `/auth/reset#token_hash=${hashOf(link).slice(0, 10)}&type=recovery`,
      `/auth/reset#token_hash=${hashOf(link)}&type=signup`,
    ]) {
      const page = await context.newPage();
      await page.goto(url);
      await expect(page.getByLabel("New password", { exact: true })).not.toBeVisible({ timeout: 8000 });
      await expect(page.getByRole("heading", { name: /(link expired or invalid|open your reset link)/i })).toBeVisible({ timeout: 15000 });
      await page.close();
    }
    expect(await grantCookie(context)).toBeUndefined();

    // The real token still works after all of that (none of the above spent it), once...
    const good = await openRecoveryForm(context, link);
    await good.close();
    // ...and then it is spent.
    const fresh = await browser.newContext();
    const reused = await fresh.newPage();
    await reused.goto(asFragment(link));
    await expect(reused.getByRole("heading", { name: /link expired or invalid/i })).toBeVisible({ timeout: 15000 });
    await context.close();
    await fresh.close();
  });

  test("an ordinary signed-in session cannot change a password through the application's reset endpoint", async ({ contextAs }) => {
    const { email } = await createUser("rec-ordinary");
    const session = await signInWithPassword(email, OLD_PASSWORD);
    const context = await contextAs("unauthenticated");
    await context.addCookies(buildAuthCookies(AUTH_APP_ORIGIN, e2eEnv.supabaseUrl, session));

    // Not even a made-up CSRF token or a forged grant helps.
    const bare = await postPassword(context, { csrf: "made-up" });
    expect(bare.status()).toBe(403);
    expect(await bare.json()).toMatchObject({ error: "recovery_required", reason: "missing" });
    await context.addCookies([{ name: GRANT_COOKIE, value: "v1.e30.e30", url: AUTH_APP_ORIGIN + GRANT_PATH, httpOnly: true, sameSite: "Strict" }]);
    const forged = await postPassword(context, { csrf: "made-up" });
    expect(forged.status()).toBe(403);
    expect(await forged.json()).toMatchObject({ error: "recovery_required", reason: "bad_signature" });

    // The page does not open the form either.
    const page = await context.newPage();
    await page.goto("/auth/reset");
    await expect(page.getByRole("heading", { name: /open your reset link/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByLabel("New password", { exact: true })).not.toBeVisible();

    expect(await canSignIn(email, OLD_PASSWORD)).toBe(true);
    expect(await canSignIn(email, NEW_PASSWORD)).toBe(false);
  });

  test("the password endpoint refuses cross-site, token-less and mis-typed requests even with a valid grant", async ({ browser }) => {
    const { email } = await createUser("rec-csrf");
    const context = await browser.newContext();
    const page = await openRecoveryForm(context, await requestResetLink(email));
    const csrf = await csrfOf(context);

    const refused: Array<[string, number]> = [
      ["foreign origin", (await postPassword(context, { csrf, origin: "https://evil.example" })).status()],
      ["no origin", (await postPassword(context, { csrf, origin: null })).status()],
      ["no csrf token", (await postPassword(context, { csrf: null })).status()],
      ["wrong csrf token", (await postPassword(context, { csrf: "AAAA" + csrf.slice(4) })).status()],
      ["form-encoded body", (await postPassword(context, { csrf, contentType: "application/x-www-form-urlencoded" })).status()],
      ["weak password", (await postPassword(context, { csrf, password: "password" })).status()],
    ];
    expect(refused).toEqual([
      ["foreign origin", 403],
      ["no origin", 403],
      ["no csrf token", 403],
      ["wrong csrf token", 403],
      ["form-encoded body", 415],
      ["weak password", 400],
    ]);
    expect(await canSignIn(email, OLD_PASSWORD)).toBe(true);

    // The grant survived all of that and still works for the genuine request.
    expect((await postPassword(context, { csrf })).status()).toBe(200);
    expect(await canSignIn(email, NEW_PASSWORD)).toBe(true);
    await page.close();
    await context.close();
  });

  test("two simultaneous submissions with one grant: exactly one password change happens (server-side single use)", async ({ browser }) => {
    const { email } = await createUser("rec-race");
    const context = await browser.newContext();
    const page = await openRecoveryForm(context, await requestResetLink(email));
    const csrf = await csrfOf(context);
    const FIRST = "Race-First-Password-1!";
    const SECOND = "Race-Second-Password-2!";

    const [a, b] = await Promise.all([
      postPassword(context, { csrf, password: FIRST }),
      postPassword(context, { csrf, password: SECOND }),
    ]);
    const statuses = [a.status(), b.status()].sort((x, y) => x - y);
    /* One winner. The loser is refused as busy (409), as spent (403) or, if the winner's global sign-out already ended
       the session, as having no session (401): all three mean "this grant is used". It is never a second 200. */
    expect(statuses[0]).toBe(200);
    expect([401, 403, 409]).toContain(statuses[1]);

    const winner = a.status() === 200 ? FIRST : SECOND;
    const loser = winner === FIRST ? SECOND : FIRST;
    expect(await canSignIn(email, winner)).toBe(true);
    expect(await canSignIn(email, loser)).toBe(false);
    expect(await canSignIn(email, OLD_PASSWORD)).toBe(false);
    await page.close();
    await context.close();
  });

  test("a grant whose password change succeeded cannot be replayed from a copy of its cookie", async ({ browser }) => {
    const { email } = await createUser("rec-replay");
    const context = await browser.newContext();
    const page = await openRecoveryForm(context, await requestResetLink(email));
    const csrf = await csrfOf(context);
    const copied = await grantCookie(context);
    expect(copied).toBeDefined();
    expect((await postPassword(context, { csrf, password: NEW_PASSWORD })).status()).toBe(200);

    /* The attacker model: a copy of the (HttpOnly) cookie taken before the user finished. Put it back and replay it. */
    await context.addCookies([copied!]);
    const replay = await postPassword(context, { csrf, password: "Replay-Attacker-Password-3!" });
    expect([401, 403]).toContain(replay.status());
    expect(await canSignIn(email, NEW_PASSWORD)).toBe(true);
    expect(await canSignIn(email, "Replay-Attacker-Password-3!")).toBe(false);
    await page.close();
    await context.close();
  });

  test("a grant is useless after the browser's account changes, and cannot be moved to another browser's session", async ({ browser }) => {
    const victim = await createUser("rec-victim");
    const other = await createUser("rec-other", "OtherPassword789!");

    const recoveryContext = await browser.newContext();
    await openRecoveryForm(recoveryContext, await requestResetLink(victim.email));
    const grant = (await grantCookie(recoveryContext))!;
    const csrf = await csrfOf(recoveryContext);

    // Another user signs in in a different browser; the victim's grant cookie is carried over to it.
    const otherContext = await browser.newContext();
    await otherContext.addCookies(buildAuthCookies(AUTH_APP_ORIGIN, e2eEnv.supabaseUrl, await signInWithPassword(other.email, "OtherPassword789!")));
    await otherContext.addCookies([{ name: GRANT_COOKIE, value: grant.value, url: AUTH_APP_ORIGIN + GRANT_PATH, httpOnly: true, sameSite: "Strict" }]);
    const carried = await postPassword(otherContext, { csrf });
    expect(carried.status()).toBe(403);
    expect(await carried.json()).toMatchObject({ error: "recovery_required", reason: "mismatch" });

    // The same browser switching accounts (the other user's session replaces the victim's) fails the same way.
    await recoveryContext.addCookies(buildAuthCookies(AUTH_APP_ORIGIN, e2eEnv.supabaseUrl, await signInWithPassword(other.email, "OtherPassword789!")));
    expect((await postPassword(recoveryContext, { csrf })).status()).toBe(403);

    expect(await canSignIn(other.email, "OtherPassword789!")).toBe(true);
    expect(await canSignIn(other.email, NEW_PASSWORD)).toBe(false);
    expect(await canSignIn(victim.email, OLD_PASSWORD)).toBe(true);
    expect(await canSignIn(victim.email, NEW_PASSWORD)).toBe(false);
    await recoveryContext.close();
    await otherContext.close();
  });

  test("opening a recovery link while signed in as someone else recovers the link's account, not the signed-in one", async ({ browser }) => {
    const signedIn = await createUser("rec-signedin", "SignedIn-Password-1!");
    const target = await createUser("rec-target");
    const context = await browser.newContext();
    await context.addCookies(buildAuthCookies(AUTH_APP_ORIGIN, e2eEnv.supabaseUrl, await signInWithPassword(signedIn.email, "SignedIn-Password-1!")));
    const page = await openRecoveryForm(context, await requestResetLink(target.email));
    await submitForm(page);
    await page.waitForURL(/\/sign-in/, { timeout: 15000 });
    expect(await canSignIn(target.email, NEW_PASSWORD)).toBe(true);
    expect(await canSignIn(signedIn.email, "SignedIn-Password-1!")).toBe(true);
    expect(await canSignIn(signedIn.email, NEW_PASSWORD)).toBe(false);
    await context.close();
  });

  test("clearing the grant (sign-out) leaves no usable grant behind", async ({ browser }) => {
    const { email } = await createUser("rec-clear");
    const context = await browser.newContext();
    await openRecoveryForm(context, await requestResetLink(email));
    expect(await grantCookie(context)).toBeTruthy();
    const cleared = await context.request.delete(`${AUTH_APP_ORIGIN}${GRANT_PATH}/session`);
    expect(cleared.status()).toBe(200);
    expect(await grantCookie(context)).toBeUndefined();
    expect(await (await context.request.get(`${AUTH_APP_ORIGIN}${GRANT_PATH}/session`)).json()).toEqual({ valid: false });
    expect((await postPassword(context, { csrf: "anything" })).status()).toBe(403);
    expect(await canSignIn(email, OLD_PASSWORD)).toBe(true);
    await context.close();
  });

  /*
   * KNOWN LIMITATION, recorded rather than hidden. The application's reset path above is protected, but Supabase Auth
   * itself will change the password for any valid session that calls its update-user API directly with the public
   * anon key. The application cannot intercept a call that never reaches it. This test fails if Supabase's behaviour
   * changes (for example a project setting that requires reauthentication), which is the signal to update the
   * documentation. Mitigation lives in Supabase project settings and is an owner decision (see the runbook).
   */
  test("KNOWN LIMITATION: Supabase Auth accepts a direct password update from an ordinary session", async () => {
    const { email } = await createUser("rec-direct");
    const holder = device();
    expect((await holder.auth.signInWithPassword({ email, password: OLD_PASSWORD })).error).toBeNull();
    const { error } = await holder.auth.updateUser({ password: NEW_PASSWORD });
    expect(error, "Supabase Auth now blocks direct updates: update docs/runbooks and the grant's header comment").toBeNull();
    expect(await canSignIn(email, NEW_PASSWORD)).toBe(true);
  });
});
