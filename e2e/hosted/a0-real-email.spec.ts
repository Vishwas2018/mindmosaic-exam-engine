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
  RUN_ID,
  STRONG_PASSWORD,
  expect,
  findUserByEmail,
  parentSignIn,
  protectContext,
  seedBypassCookie,
  test,
} from "./fixtures";

const NEW_PASSWORD = "Accept!Beta-2026-reset";
const OUT = process.env.HOSTED_OUTPUT ?? "test-results/hosted";

import { actionLink, checkLinkTarget, createInbox, waitForMail } from "./mailtm";


async function signOut(page: Page) {
  await page.context().clearCookies();
  await seedBypassCookie(page.context());
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
  await page.getByLabel("Email", { exact: true }).fill(inbox.address);
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
  await expect(page.getByRole("heading", { name: /password changed/i })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("link", { name: /go to sign[- ]in/i })).toBeVisible();
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
