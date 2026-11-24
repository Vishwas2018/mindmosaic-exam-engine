/**
 * Fixtures for hosted DEV acceptance. See playwright.hosted.config.ts.
 *
 * Secrets: VERCEL_AUTOMATION_BYPASS_SECRET and SUPABASE_SERVICE_ROLE_KEY come from the launcher's process
 * environment. The bypass secret is attached only to requests whose origin is the Preview host; Supabase and
 * every other origin never see it. Neither value is logged.
 */
import { test as base, expect, type BrowserContext, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const DEV_REF = "mfglzabnayacssgertat";
const PROD_REF = "uermhsptduikehuyceiz";

export const HOSTED_URL = process.env.HOSTED_URL ?? "";
const HOSTED_ORIGIN = new URL(HOSTED_URL).origin;
export const RUN_ID = process.env.HOSTED_RUN_ID ?? `r${Date.now().toString(36)}`;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set (use scripts/hosted-acceptance/run.mjs)`);
  return v;
}

export function devSupabaseUrl(): string {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  if (url.includes(PROD_REF) || new URL(url).hostname !== `${DEV_REF}.supabase.co`) {
    throw new Error("Refusing to run: Supabase URL is not the DEV project");
  }
  return url;
}

let adminSingleton: SupabaseClient | null = null;
/** Service-role client, DEV only. Used for seeding confirmation links and cleanup, never as evidence of access. */
export function devAdmin(): SupabaseClient {
  if (!adminSingleton) {
    adminSingleton = createClient(devSupabaseUrl(), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return adminSingleton;
}

/**
 * Header injection (protectContext) does not reach redirect hops (an emailed link goes Supabase /auth/v1/verify →
 * Preview), so Vercel answers those with its SSO wall. Seeds Vercel's bypass cookie on the context; it is scoped to the
 * Preview host and the secret is sent only to that host. Call again after anything that clears cookies.
 */
export async function seedBypassCookie(context: BrowserContext): Promise<void> {
  await context.request.get(`${HOSTED_ORIGIN}/`, {
    headers: {
      "x-vercel-protection-bypass": requireEnv("VERCEL_AUTOMATION_BYPASS_SECRET"),
      "x-vercel-set-bypass-cookie": "true",
    },
    maxRedirects: 0,
    failOnStatusCode: false,
  });
}

/** Adds the bypass header to requests for the Preview host only. */
export async function protectContext(context: BrowserContext): Promise<void> {
  const secret = requireEnv("VERCEL_AUTOMATION_BYPASS_SECRET");
  await seedBypassCookie(context);
  // Playwright's Windows WebKit hangs a navigation when route.fulfill hands it a 3xx (every protected-route
  // redirect). WebKit therefore relies on the bypass cookie alone; the secret still only reaches this origin.
  if (context.browser()?.browserType().name() === "webkit") {
    // Specs clear cookies to sign out; put the bypass cookie straight back so the next page is not Vercel SSO.
    const clear = context.clearCookies.bind(context);
    context.clearCookies = async (options?: Parameters<BrowserContext["clearCookies"]>[0]) => {
      await clear(options);
      await seedBypassCookie(context);
    };
    return;
  }
  await context.route(
    (url) => url.origin === HOSTED_ORIGIN,
    async (route) => {
      // fetch + fulfill with maxRedirects: 0 so the secret is sent to this origin only; a redirect (even off-origin)
      // is handed back to the browser, which follows it without the header.
      try {
        const response = await route.fetch({
          headers: { ...route.request().headers(), "x-vercel-protection-bypass": secret },
          maxRedirects: 0,
        });
        await route.fulfill({ response });
      } catch {
        // The page navigated away or the context closed while this request was in flight: nothing to deliver.
        await route.abort().catch(() => undefined);
      }
    },
  );
}

/**
 * Synthetic identities created by this suite. DEV Auth rejects reserved domains (example.com), so sign-up through
 * the UI needs a deliverable mailbox: HOSTED_MAIL_BASE (an inbox the operator can read) is plus-addressed per run.
 * The address is never committed. Accounts seeded by the service role keep the undeliverable example.com form.
 */
export function syntheticEmail(label: string): string {
  const base = process.env.HOSTED_MAIL_BASE;
  if (!base) throw new Error("HOSTED_MAIL_BASE is not set");
  const [user, domain] = base.split("@");
  return `${user}+mmaccept-${RUN_ID}-${label}@${domain}`;
}
export function seededEmail(label: string): string {
  return `mm-accept-${RUN_ID}-${label}@example.com`;
}

/**
 * Waits for the operator to drop the confirmation link from the real email into <output>/confirm-<label>.txt.
 * Nothing is minted: this is the link Supabase actually mailed.
 */
export async function waitForMailedLink(label: string, timeoutMs = 15 * 60_000): Promise<string> {
  // Unattended mode: HOSTED_MAILTM_ADDRESS/HOSTED_MAILTM_PASSWORD name a mail.tm inbox that HOSTED_MAIL_BASE points at
  // (plus-addressed per run and label). The link is read from the message that actually arrived.
  if (process.env.HOSTED_MAILTM_ADDRESS && process.env.HOSTED_MAILTM_PASSWORD) {
    return waitForMailtmLink(label, timeoutMs);
  }
  const fs = await import("node:fs");
  const path = await import("node:path");
  const file = path.join(process.env.HOSTED_OUTPUT ?? "test-results/hosted", `confirm-${label}.txt`);
  fs.writeFileSync(file + ".waiting", new Date().toISOString());
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    if (fs.existsSync(file)) return fs.readFileSync(file, "utf8").trim();
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(`no mailed link for ${label} within ${timeoutMs / 1000}s`);
}
async function waitForMailtmLink(label: string, timeoutMs: number): Promise<string> {
  const api = "https://api.mail.tm";
  const tag = `mmaccept-${RUN_ID}-${label}`;
  const call = async (path: string, init: RequestInit = {}, token?: string) => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const r = await fetch(api + path, {
        ...init,
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (r.status === 429) {
        await new Promise((res) => setTimeout(res, 2000 * (attempt + 1)));
        continue;
      }
      if (!r.ok) throw new Error(`mail.tm ${path} -> ${r.status}`);
      return r.json();
    }
    throw new Error(`mail.tm ${path} rate-limited`);
  };
  const { token } = await call("/token", {
    method: "POST",
    body: JSON.stringify({ address: process.env.HOSTED_MAILTM_ADDRESS, password: process.env.HOSTED_MAILTM_PASSWORD }),
  });
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    const list = await call("/messages", {}, token);
    for (const m of list["hydra:member"] as { id: string; to: { address: string }[]; subject: string }[]) {
      if (!/confirm/i.test(m.subject) || !m.to.some((t) => t.address.includes(tag))) continue;
      const full = await call(`/messages/${m.id}`, {}, token);
      const text = [...(full.html ?? []), full.text ?? ""].join(" ").replace(/&amp;/g, "&");
      const link = [...text.matchAll(/https?:\/\/[^\s"'<>)]+/g)].map((x) => x[0]).find((h) => /\/auth\/v1\/verify|token_hash=|[?&]token=/.test(h));
      if (link) return link;
    }
    await new Promise((res) => setTimeout(res, 4000));
  }
  throw new Error(`no mailed link for ${label} within ${timeoutMs / 1000}s`);
}

export const STRONG_PASSWORD = "Accept!Beta-2026-pass";

type Fixtures = { consoleErrors: string[] };

export const test = base.extend<Fixtures>({
  context: async ({ context }, use) => {
    await protectContext(context);
    await use(context);
  },
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text().slice(0, 300));
    });
    page.on("pageerror", (e) => errors.push(`pageerror: ${String(e.message).slice(0, 300)}`));
    await use(errors);
  },
});

export { expect };

/** A fresh, protected context + page (for second identities in the same test). */
/**
 * page.goto that tolerates the app's own navigation winning the race: Firefox reports NS_BINDING_ABORTED and
 * WebKit "interrupted by another navigation" when a client redirect (sign-out, auth guard) is in flight. The page
 * is left settled wherever the app sent it; callers keep asserting the final URL.
 */
export async function gotoSettled(page: Page, path: string): Promise<void> {
  try {
    await page.goto(path);
  } catch (error) {
    if (!/NS_BINDING_ABORTED|interrupted by another navigation|net::ERR_ABORTED/.test(String(error))) throw error;
  }
  await page.waitForLoadState("load").catch(() => undefined);
}

export async function newProtectedPage(context: BrowserContext): Promise<Page> {
  const browser = context.browser();
  if (!browser) throw new Error("no browser");
  const ctx = await browser.newContext({ viewport: context.pages()[0]?.viewportSize() ?? undefined });
  await protectContext(ctx);
  return ctx.newPage();
}

/** Device-independent signup confirmation link for an existing unconfirmed user, minted by the DEV service role. */
export async function confirmationPath(email: string): Promise<string> {
  const { data, error } = await devAdmin().auth.admin.generateLink({ type: "magiclink", email });
  if (error || !data?.properties?.hashed_token) throw new Error(`generateLink failed: ${error?.message}`);
  return `/auth/confirm?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=email`;
}

export async function findUserByEmail(email: string) {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await devAdmin().auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email === email);
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

/** PIN pad entry used by /student-sign-in. */
export async function enterStudentCredentials(page: Page, loginCode: string, pin: string) {
  await page.getByLabel("Login code").fill(loginCode);
  // Wait for one settled form: during hydration the streamed panel can briefly appear twice.
  await expect(page.getByLabel(/^Your PIN, number \d of 6$/)).toHaveCount(6);
  await page.getByLabel(/^Your PIN, number 1 of 6/).click();
  await page.keyboard.type(pin);
}

/** Parent sign-in through the real chooser: /sign-in -> "I'm a parent" -> email + password. */
export async function parentSignIn(page: Page, email: string, password: string) {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: /I'm a parent/i }).click();
  await page.getByLabel(/^email$/i).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: /^sign in/i }).click();
}

/**
 * Direct API calls from a page's browser context. page.request does not pass through context.route, so the
 * bypass header is added here (Preview host only) and redirects are never followed: a 3xx from Vercel's login wall
 * must fail a check, not turn into the 200 of a login page.
 */
export function api(page: Page) {
  const secret = requireEnv("VERCEL_AUTOMATION_BYPASS_SECRET");
  const origin = HOSTED_ORIGIN;
  const headers = { "x-vercel-protection-bypass": secret, Origin: origin };
  const req = page.request;
  const guard = async (r: import("@playwright/test").APIResponse) => {
    if (r.status() >= 300 && r.status() < 400) throw new Error(`unexpected redirect ${r.status()} from ${r.url()}`);
    if (/Protected by Vercel Authentication/.test(await r.text())) throw new Error("hit Vercel protection, not the app");
    return r;
  };
  return {
    get: async (url: string) => guard(await req.get(url, { headers, maxRedirects: 0 })),
    post: async (url: string, data: unknown) => guard(await req.post(url, { headers, data, maxRedirects: 0 })),
    patch: async (url: string, data: unknown) => guard(await req.patch(url, { headers, data, maxRedirects: 0 })),
    put: async (url: string, data: unknown) => guard(await req.put(url, { headers, data, maxRedirects: 0 })),
  };
}
