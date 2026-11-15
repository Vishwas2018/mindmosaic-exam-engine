/**
 * A0 — two genuine parent registrations with real email delivery (D-025 verification).
 *
 * Each parent gets its own throwaway inbox on the public mail.tm API (HOSTED_MAILBOX=mailtm). Every link this test
 * opens is taken from an email that actually arrived in that inbox: nothing is minted by the service role. The service
 * role is used only to read state back (account exists, confirmed or not).
 *
 * Per parent: register through the form → sign-in refused before confirming → confirmation email arrives (sender
 * recorded) → its link lands signed in on /parent → sign out → password sign-in → "forgot password" → recovery email
 * arrives → its link opens /auth/reset → new password saved → old password refused, new one accepted.
 * The two registrations run back to back, which is what the built-in mail limit used to refuse.
 */
import fs from "node:fs";
import path from "node:path";
import type { Page, TestInfo } from "@playwright/test";

import {
  HOSTED_URL,
  RUN_ID,
  STRONG_PASSWORD,
  expect,
  findUserByEmail,
  parentSignIn,
  protectContext,
  test,
} from "./fixtures";

const MAILTM = "https://api.mail.tm";
const NEW_PASSWORD = "Accept!Beta-2026-reset";
const OUT = process.env.HOSTED_OUTPUT ?? "test-results/hosted";

type Inbox = { address: string; token: string };
type Mail = { id: string; from: string; subject: string; receivedAt: string; html: string; text: string };

async function mailtm(pathname: string, init: RequestInit = {}, token?: string) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const r = await fetch(`${MAILTM}${pathname}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers ?? {}),
      },
    });
    if (r.status === 429) {
      await new Promise((res) => setTimeout(res, 2000 * (attempt + 1)));
      continue;
    }
    if (!r.ok) throw new Error(`mail.tm ${pathname} -> ${r.status}`);
    return r.status === 204 ? null : r.json();
  }
  throw new Error(`mail.tm ${pathname} rate-limited`);
}

async function createInbox(label: string): Promise<Inbox> {
  const domains = await mailtm("/domains");
  const domain = domains["hydra:member"].find((d: { isActive: boolean }) => d.isActive).domain;
  const address = `mmaccept-${RUN_ID}-${label}@${domain}`;
  const password = `Inbox-${RUN_ID}-${label}-pw`;
  await mailtm("/accounts", { method: "POST", body: JSON.stringify({ address, password }) });
  const { token } = await mailtm("/token", { method: "POST", body: JSON.stringify({ address, password }) });
  return { address, token };
}

/** Waits for a new message whose subject matches, ignoring ids already seen. */
async function waitForMail(inbox: Inbox, subject: RegExp, seen: Set<string>, timeoutMs = 5 * 60_000): Promise<Mail> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const list = await mailtm("/messages", {}, inbox.token);
    for (const m of list["hydra:member"]) {
      if (seen.has(m.id) || !subject.test(m.subject)) continue;
      seen.add(m.id);
      const full = await mailtm(`/messages/${m.id}`, {}, inbox.token);
      return {
        id: m.id,
        from: full.from?.address ?? "",
        subject: full.subject,
        receivedAt: full.createdAt,
        html: (full.html ?? []).join("\n"),
        text: full.text ?? "",
      };
    }
    await new Promise((res) => setTimeout(res, 5000));
  }
  throw new Error(`no email matching ${subject} reached ${inbox.address} within ${timeoutMs / 1000}s`);
}

/** The action link in a Supabase auth email (confirmation or recovery), &amp; decoded. */
function actionLink(mail: Mail): string {
  const hrefs = [...mail.html.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));
  const fromText = [...mail.text.matchAll(/https?:\/\/\S+/g)].map((m) => m[0].replace(/[)\]>.,]+$/, ""));
  const link = [...hrefs, ...fromText].find((h) => /token_hash=|\/auth\/v1\/verify|[?&]token=/.test(h));
  if (!link) throw new Error(`no action link in "${mail.subject}"`);
  return link;
}

function checkLinkTarget(link: string) {
  const u = new URL(link);
  expect(u.host, "link points at DEV Supabase or this Preview").toMatch(
    /^(mfglzabnayacssgertat\.supabase\.co|[a-z0-9-]+\.vercel\.app)$/,
  );
  const redirectTo = u.searchParams.get("redirect_to");
  if (redirectTo) expect(new URL(redirectTo).origin, "redirect stays on this Preview").toBe(new URL(HOSTED_URL).origin);
}

async function signOut(page: Page) {
  await page.context().clearCookies();
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
  });
}

async function journey(page: Page, testInfo: TestInfo, label: string) {
  const shot = (name: string) =>
    page.screenshot({ path: testInfo.outputPath(`${label}-${name}.png`), fullPage: true });
  const evidence: Record<string, unknown> = { label };
  const seen = new Set<string>();
  const inbox = await createInbox(label);
  evidence.inboxDomain = inbox.address.split("@")[1];

  // Register through the form
  const t0 = Date.now();
  await page.goto("/sign-up");
  await page.getByLabel("Your name").fill(`Accept Parent${label.toUpperCase()}`);
  await page.getByLabel(/^email$/i).fill(inbox.address);
  await page.getByLabel(/create a password/i).fill(STRONG_PASSWORD);
  await page.getByRole("checkbox").first().check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: /check your email/i })).toBeVisible();
  await shot("1-check-email");

  const user = await findUserByEmail(inbox.address);
  expect(user, "account exists on DEV").toBeTruthy();
  expect(user!.email_confirmed_at ?? null, "not confirmed before the link is opened").toBeNull();

  // Sign-in before confirming is refused
  await parentSignIn(page, inbox.address, STRONG_PASSWORD);
  await expect(page.getByText(/confirm|verify/i).first()).toBeVisible();
  await expect(page).not.toHaveURL(/\/parent/);

  // Confirmation email, delivered
  const confirm = await waitForMail(inbox, /confirm/i, seen);
  evidence.confirmation = {
    from: confirm.from,
    subject: confirm.subject,
    secondsToArrive: Math.round((Date.parse(confirm.receivedAt) - t0) / 1000),
  };
  expect(confirm.from, "sent by the custom SMTP sender, not Supabase's built-in one").not.toMatch(
    /supabase\.io$|supabase\.co$/,
  );
  const confirmLink = actionLink(confirm);
  checkLinkTarget(confirmLink);
  await page.goto(confirmLink);
  await expect(page).toHaveURL(/\/parent/, { timeout: 45_000 });
  await shot("2-confirmed");
  expect((await findUserByEmail(inbox.address))!.email_confirmed_at, "confirmed on DEV").toBeTruthy();

  // Sign out, sign in with the password
  await signOut(page);
  await parentSignIn(page, inbox.address, STRONG_PASSWORD);
  await expect(page).toHaveURL(/\/parent/, { timeout: 45_000 });
  await shot("3-signed-in");

  // Password recovery, delivered
  await signOut(page);
  await page.goto("/sign-in?mode=forgot");
  await page.getByLabel("Email address").fill(inbox.address);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByText(/reset link is on its way/i)).toBeVisible();
  const t1 = Date.now();
  const recovery = await waitForMail(inbox, /reset|password|recover/i, seen);
  evidence.recovery = {
    from: recovery.from,
    subject: recovery.subject,
    secondsToArrive: Math.round((Date.parse(recovery.receivedAt) - t1) / 1000),
  };
  const recoveryLink = actionLink(recovery);
  checkLinkTarget(recoveryLink);
  await page.goto(recoveryLink);
  await expect(page.getByRole("heading", { name: "Set a new password" })).toBeVisible({ timeout: 45_000 });
  await page.getByLabel("New password", { exact: true }).fill(NEW_PASSWORD);
  await page.getByLabel("Confirm new password").fill(NEW_PASSWORD);
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page.getByRole("link", { name: /sign in/i }).first()).toBeVisible({ timeout: 30_000 });
  await shot("4-password-saved");

  // Old password refused, new one accepted
  await signOut(page);
  await parentSignIn(page, inbox.address, STRONG_PASSWORD);
  await expect(page.locator("#auth-error")).toBeVisible({ timeout: 20_000 });
  await expect(page).not.toHaveURL(/\/parent/);
  await signOut(page);
  await parentSignIn(page, inbox.address, NEW_PASSWORD);
  await expect(page).toHaveURL(/\/parent/, { timeout: 45_000 });
  await shot("5-new-password-signed-in");

  evidence.result = "passed";
  return evidence;
}

test("A0: two parents register with real email; confirm, sign in, recover and change the password", async ({
  page,
  browser,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "registration runs once");
  test.skip(process.env.HOSTED_MAILBOX !== "mailtm", "needs HOSTED_MAILBOX=mailtm");
  test.setTimeout(30 * 60_000);

  const a = await journey(page, testInfo, "pa");
  const ctxB = await browser.newContext({ viewport: page.viewportSize() ?? undefined });
  await protectContext(ctxB);
  const b = await journey(await ctxB.newPage(), testInfo, "pb");
  await ctxB.close();

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, "real-email-evidence.json"), JSON.stringify({ runId: RUN_ID, a, b }, null, 2));
});
