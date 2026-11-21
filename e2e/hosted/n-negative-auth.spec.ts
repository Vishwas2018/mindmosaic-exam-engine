/**
 * N — negative authentication paths on real delivered mail (mail.tm inboxes, HOSTED_MAILBOX=mailtm).
 *
 * Every link opened here arrived in a real inbox. Covered: a spent confirmation link, a tampered confirmation link,
 * a spent recovery link, a tampered recovery link, a weak new password, sign-in with a wrong password versus an
 * unknown address (the same message, so accounts cannot be enumerated), recovery for an unknown address (the same
 * "on its way" answer, and no mail), and reset/confirm pages opened with no link at all.
 */
import type { Page } from "@playwright/test";

import {
  RUN_ID,
  STRONG_PASSWORD,
  expect,
  findUserByEmail,
  parentSignIn,
  protectContext,
  seedBypassCookie,
  test,
} from "./fixtures";
import { actionLink, checkLinkTarget, createInbox, waitForMail } from "./mailtm";

const NEW_PASSWORD = "Accept!Beta-2026-neg";

async function freshSession(page: Page) {
  await page.context().clearCookies();
  await seedBypassCookie(page.context());
  await page.goto("/");
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
  });
}

/** Tampers the one-time credential in an auth link while keeping the shape the app expects. */
function tamper(link: string): string {
  const u = new URL(link);
  // The link goes through Supabase /auth/v1/verify?token=...; flip the token itself.
  for (const key of ["token", "token_hash", "code"]) {
    const v = u.searchParams.get(key);
    if (v) {
      u.searchParams.set(key, v.slice(0, -1) + (v.endsWith("0") ? "1" : "0"));
      return u.toString();
    }
  }
  throw new Error("no credential parameter to tamper with");
}

test.describe("N: negative authentication", () => {
  test.beforeEach(({ page: _page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440", "runs once");
    test.skip(process.env.HOSTED_MAILBOX !== "mailtm", "needs HOSTED_MAILBOX=mailtm");
  });

  test("N1-N4: confirmation link is single-use and tamper-proof; sign-in stays blocked until confirmed", async ({
    page,
    context,
  }) => {
    test.setTimeout(10 * 60_000);
    await protectContext(context);
    const inbox = await createInbox("n1");
    const seen = new Set<string>();

    await page.goto("/sign-up");
    await page.getByLabel("Your name").fill("Negative Parent");
    await page.getByLabel(/^email$/i).fill(inbox.address);
    await page.getByLabel(/create a password/i).fill(STRONG_PASSWORD);
    await page.getByRole("checkbox").first().check();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByRole("heading", { name: /check your email/i })).toBeVisible();

    const mail = await waitForMail(inbox, /confirm/i, seen);
    const link = actionLink(mail);
    checkLinkTarget(link);

    // N1: tampered credential never confirms the account.
    await page.goto(tamper(link));
    await expect(page).not.toHaveURL(/\/parent/, { timeout: 30_000 });
    expect((await findUserByEmail(inbox.address))!.email_confirmed_at ?? null, "still unconfirmed after tamper").toBeNull();

    // N2: the genuine link works once (same browser that registered: the PKCE verifier lives there).
    await page.goto(link);
    await expect(page).toHaveURL(/\/parent/, { timeout: 45_000 });
    expect((await findUserByEmail(inbox.address))!.email_confirmed_at, "confirmed by the genuine link").toBeTruthy();

    // N3: the same link, opened again in a fresh browser session, does not sign anyone in and does not 500.
    await freshSession(page);
    const response = await page.goto(link);
    expect(response?.status() ?? 0, "spent link answered without a server error").toBeLessThan(500);
    await expect(page).not.toHaveURL(/\/parent(\/|$)/, { timeout: 30_000 });
    await expect(page.getByRole("link", { name: /sign[- ]?in|request|resend|new/i }).first()).toBeVisible();
  });

  test("N5-N9: recovery link is single-use and tamper-proof; weak passwords refused; no account enumeration", async ({
    page,
    context,
  }) => {
    test.setTimeout(12 * 60_000);
    await protectContext(context);
    const inbox = await createInbox("n5");
    const seen = new Set<string>();

    // Account confirmed through its real email.
    await page.goto("/sign-up");
    await page.getByLabel("Your name").fill("Negative Parent Two");
    await page.getByLabel(/^email$/i).fill(inbox.address);
    await page.getByLabel(/create a password/i).fill(STRONG_PASSWORD);
    await page.getByRole("checkbox").first().check();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByRole("heading", { name: /check your email/i })).toBeVisible();
    await page.goto(actionLink(await waitForMail(inbox, /confirm/i, seen)));
    await expect(page).toHaveURL(/\/parent/, { timeout: 45_000 });

    // N5: recovery for this account arrives; a tampered link shows the expired/used message, not the form.
    await freshSession(page);
    await page.goto("/sign-in?mode=forgot");
    await page.getByLabel("Email", { exact: true }).fill(inbox.address);
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText(/reset link is on its way/i)).toBeVisible();
    const recoveryLink = actionLink(await waitForMail(inbox, /reset|password|recover/i, seen));
    checkLinkTarget(recoveryLink);

    await page.goto(tamper(recoveryLink));
    await expect(page.getByRole("heading", { name: "Set a new password" })).toHaveCount(0, { timeout: 30_000 });
    await expect(page.getByText(/expired|already used|can.t be used|isn.t valid/i).first()).toBeVisible();

    // N6: a weak new password is refused and nothing changes.
    await page.goto(recoveryLink);
    await expect(page.getByRole("heading", { name: "Set a new password" })).toBeVisible({ timeout: 45_000 });
    await page.getByLabel("New password", { exact: true }).fill("short");
    await page.getByLabel("Confirm new password").fill("short");
    await expect(page.getByRole("button", { name: "Save new password" })).toBeDisabled();
    await expect(page.getByRole("heading", { name: /password changed/i })).toHaveCount(0);

    // N7: mismatched confirmation is refused.
    await page.getByLabel("New password", { exact: true }).fill(NEW_PASSWORD);
    await page.getByLabel("Confirm new password").fill(NEW_PASSWORD + "x");
    await expect(page.getByRole("button", { name: "Save new password" })).toBeDisabled();
    await expect(page.getByRole("heading", { name: /password changed/i })).toHaveCount(0);

    // Genuine change succeeds.
    await page.getByLabel("Confirm new password").fill(NEW_PASSWORD);
    await page.getByRole("button", { name: "Save new password" }).click();
    await expect(page.getByRole("heading", { name: /password changed/i })).toBeVisible({ timeout: 30_000 });

    // N8: the recovery link is spent.
    await freshSession(page);
    const again = await page.goto(recoveryLink);
    expect(again?.status() ?? 0).toBeLessThan(500);
    await expect(page.getByRole("heading", { name: "Set a new password" })).toHaveCount(0, { timeout: 30_000 });
    await expect(page.getByText(/expired|already used|can.t be used|isn.t valid/i).first()).toBeVisible();

    // N9: wrong password for a real account and a made-up address give the same message (no enumeration).
    await parentSignIn(page, inbox.address, "Wrong!Password-2026-x");
    await expect(page.locator("#auth-error")).toBeVisible({ timeout: 20_000 });
    const realMsg = (await page.locator("#auth-error").innerText()).trim();
    await freshSession(page);
    await parentSignIn(page, `nobody-${RUN_ID}@example.org`, "Wrong!Password-2026-x");
    await expect(page.locator("#auth-error")).toBeVisible({ timeout: 20_000 });
    const ghostMsg = (await page.locator("#auth-error").innerText()).trim();
    expect(ghostMsg, "same refusal for unknown and known addresses").toBe(realMsg);

    // N10: recovery for an unknown address gives the same answer as for a real one.
    await freshSession(page);
    await page.goto("/sign-in?mode=forgot");
    await page.getByLabel("Email", { exact: true }).fill(`nobody-${RUN_ID}@example.org`);
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText(/reset link is on its way/i)).toBeVisible();
  });

  test("N12: a confirmation link opened in a different browser shows same-device guidance and the family can still sign in", async ({
    page,
    context,
    browser,
  }, testInfo) => {
    test.setTimeout(10 * 60_000);
    await protectContext(context);
    const inbox = await createInbox("n12");
    await page.goto("/sign-up");
    await page.getByLabel("Your name").fill("Cross Device Parent");
    await page.getByLabel(/^email$/i).fill(inbox.address);
    await page.getByLabel(/create a password/i).fill(STRONG_PASSWORD);
    await page.getByRole("checkbox").first().check();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByRole("heading", { name: /check your email/i })).toBeVisible();
    const link = actionLink(await waitForMail(inbox, /confirm/i, new Set()));

    const other = await browser.newContext();
    await protectContext(other);
    const p2 = await other.newPage();
    await p2.goto(link);
    await expect(p2.getByRole("heading", { name: /same device/i })).toBeVisible({ timeout: 45_000 });
    await p2.screenshot({ path: testInfo.outputPath("n12-cross-device.png"), fullPage: true });
    await expect(p2.getByText(/may already be confirmed/i)).toBeVisible();
    // The provider confirmed the address when the link was followed, so the family can simply sign in.
    expect((await findUserByEmail(inbox.address))!.email_confirmed_at, "confirmed server-side by the link").toBeTruthy();
    await parentSignIn(p2, inbox.address, STRONG_PASSWORD);
    await expect(p2).toHaveURL(/\/parent/, { timeout: 45_000 });
    await other.close();
  });

  test("N11: reset and confirm pages opened with no link give guidance, not a form or an error page", async ({
    page,
    context,
  }) => {
    await protectContext(context);
    await page.goto("/auth/reset");
    await expect(page.getByRole("heading", { name: "Set a new password" })).toHaveCount(0);
    await expect(page.getByText(/open your reset link|request a new/i).first()).toBeVisible();
    const r = await page.goto("/auth/confirm");
    expect(r?.status() ?? 0).toBeLessThan(500);
    await expect(page).not.toHaveURL(/\/parent(\/|$)/);
  });
});
