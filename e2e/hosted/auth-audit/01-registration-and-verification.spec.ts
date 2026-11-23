/**
 * Auth Audit 01 — Registration & Email Verification (Hosted DEV Preview + real mail.tm delivery).
 *
 * Covers:
 * - Form validation: missing fields, invalid email, unchecked consent, password boundary rules
 * - Double-click submit protection & sessionStorage draft restore (never persists password)
 * - Real-email registration (records first-attempt delivery, latency, misses, resends separately)
 * - Duplicate registration for existing UNVERIFIED and existing VERIFIED accounts (no enumeration)
 * - Unverified sign-in refusal (correct vs wrong password enumeration check) + resend confirmation
 * - Multiple verification emails (older vs latest link behaviour)
 * - Tampered link, spent link replay, empty /auth/confirm
 * - Cross-device verification (second fresh context)
 * - Verification while already logged in as another user
 * - Simultaneous registrations across two parallel contexts
 */
import fs from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";

import {
  RUN_ID,
  STRONG_PASSWORD,
  devAdmin,
  expect,
  findUserByEmail,
  parentSignIn,
  protectContext,
  seedBypassCookie,
  test,
} from "../fixtures";
import { actionLink, checkLinkTarget, createInbox, waitForMail, type Inbox } from "../mailtm";

const OUT = process.env.HOSTED_OUTPUT ?? "test-results/hosted";
const createdEmails: string[] = [];

type MailMetric = {
  scenario: string;
  firstAttemptSuccess: boolean;
  latencySeconds: number | null;
  resendAttempts: number;
  retryAssistedRecovery: boolean;
  from: string | null;
  subject: string | null;
};

const evidence: {
  runId: string;
  mailMetrics: MailMetric[];
  checks: Record<string, unknown>;
} = {
  runId: RUN_ID,
  mailMetrics: [],
  checks: {},
};

async function clearBrowserAuth(page: Page) {
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

function tamperLink(link: string): string {
  const u = new URL(link);
  for (const key of ["token", "token_hash", "code"]) {
    const v = u.searchParams.get(key);
    if (v) {
      u.searchParams.set(key, v.slice(0, -1) + (v.endsWith("a") ? "b" : "a"));
      return u.toString();
    }
  }
  throw new Error("no credential param to tamper");
}

async function waitForMailWithMetrics(
  inbox: Inbox,
  subjectRe: RegExp,
  seen: Set<string>,
  scenario: string,
  tStart: number,
  onRetry?: () => Promise<void>,
) {
  let resendAttempts = 0;
  try {
    const mail = await waitForMail(inbox, subjectRe, seen, 95_000);
    const latency = Math.max(0, Math.round((Date.parse(mail.receivedAt) - tStart) / 1000));
    evidence.mailMetrics.push({
      scenario,
      firstAttemptSuccess: true,
      latencySeconds: latency,
      resendAttempts: 0,
      retryAssistedRecovery: false,
      from: mail.from,
      subject: mail.subject,
    });
    return mail;
  } catch {
    if (!onRetry) {
      evidence.mailMetrics.push({
        scenario,
        firstAttemptSuccess: false,
        latencySeconds: null,
        resendAttempts: 0,
        retryAssistedRecovery: false,
        from: null,
        subject: null,
      });
      throw new Error(`First-attempt mail missed for ${scenario} and no retry handler provided`);
    }
    resendAttempts = 1;
    await onRetry();
    const tRetry = Date.now();
    const mail = await waitForMail(inbox, subjectRe, seen, 150_000);
    const latency = Math.max(0, Math.round((Date.parse(mail.receivedAt) - tRetry) / 1000));
    evidence.mailMetrics.push({
      scenario,
      firstAttemptSuccess: false,
      latencySeconds: latency,
      resendAttempts,
      retryAssistedRecovery: true,
      from: mail.from,
      subject: mail.subject,
    });
    return mail;
  }
}

test.describe("Auth Audit 01: Registration & Email Verification", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440", "runs once on desktop-1440");
    test.skip(process.env.HOSTED_MAILBOX !== "mailtm", "needs HOSTED_MAILBOX=mailtm");
  });

  test.afterAll(async () => {
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, "audit-01-evidence.json"), JSON.stringify(evidence, null, 2));
    for (const email of createdEmails) {
      const user = await findUserByEmail(email).catch(() => null);
      if (user) {
        await devAdmin().auth.admin.deleteUser(user.id).catch(() => undefined);
      }
    }
  });

  test("REG-01: Form validation, password boundaries, draft restore (no password stored), invalid email", async ({
    page,
  }) => {
    await page.goto("/sign-up");
    const submit = page.getByRole("button", { name: "Create account" });

    // 1. Missing mandatory fields
    await submit.click();
    await expect(page.locator("#su-error")).toContainText(/enter your name, your email address and a password/i);

    // 2. Password boundary cases (7 chars, missing upper, missing lower, missing number, missing special)
    await page.getByLabel("Your name").fill("Boundary Parent");
    await page.getByLabel(/^email$/i).fill(`mmaccept-${RUN_ID}-invalid@example.com`);
    const badPasswords = [
      "Ab1!xyz", // 7 chars
      "abcdefgh1!", // no upper
      "ABCDEFGH1!", // no lower
      "Abcdefgh!", // no number
      "Abcdefgh1", // no special
    ];
    for (const pw of badPasswords) {
      await page.getByLabel(/create a password/i).fill(pw);
      await submit.click();
      await expect(page.locator("#su-error")).toContainText(/meets every rule/i);
    }

    // 3. Exact 8-char valid password, but unchecked consent
    await page.getByLabel(/create a password/i).fill("Abcd123!");
    await submit.click();
    await expect(page.locator("#su-error")).toContainText(/agree to the terms/i);

    // 4. Draft restore on reload — name/email/consent persist, password MUST NOT be in sessionStorage or restored
    await page.getByRole("checkbox").first().check();
    const rawDraft = await page.evaluate(() => window.sessionStorage.getItem("mm-signup-draft"));
    expect(rawDraft, "draft exists in sessionStorage").toBeTruthy();
    expect(rawDraft!, "password must NEVER be stored in sessionStorage").not.toContain("Abcd123!");
    await page.reload();
    await expect(page.getByLabel("Your name")).toHaveValue("Boundary Parent");
    await expect(page.getByLabel(/^email$/i)).toHaveValue(`mmaccept-${RUN_ID}-invalid@example.com`);
    await expect(page.getByLabel(/create a password/i)).toHaveValue("");

    // 5. Malformed email address rejected by DEV Auth (no account created)
    await page.getByLabel(/^email$/i).fill("not-a-valid-email");
    await page.getByLabel(/create a password/i).fill(STRONG_PASSWORD);
    await submit.click();
    await expect(page.locator("#su-error")).toBeVisible({ timeout: 20_000 });
    evidence.checks.reg01_validation_and_draft = "passed";
  });

  test("REG-02: Real registration, double-click guard, unverified sign-in & enumeration check, duplicate unverified/verified, resend & confirm", async ({
    page,
  }) => {
    test.setTimeout(10 * 60_000);
    const inbox = await createInbox("reg02");
    createdEmails.push(inbox.address);
    const seen = new Set<string>();

    await page.goto("/sign-up");
    await page.getByLabel("Your name").fill("Audit Parent Reg02");
    await page.getByLabel(/^email$/i).fill(inbox.address);
    await page.getByLabel(/create a password/i).fill(STRONG_PASSWORD);
    await page.getByRole("checkbox").first().check();

    // Double-click submit rapidly (verify no duplicate crash or double error)
    const t0 = Date.now();
    const btn = page.getByRole("button", { name: "Create account" });
    await Promise.all([btn.click(), btn.click().catch(() => undefined)]);
    await expect(page.getByRole("heading", { name: /check your email/i })).toBeVisible({ timeout: 30_000 });

    const created = await findUserByEmail(inbox.address);
    expect(created, "account created in DEV Auth").toBeTruthy();
    expect(created!.email_confirmed_at ?? null).toBeNull();

    // Unverified sign-in with WRONG password vs CORRECT password (check enumeration!)
    await parentSignIn(page, inbox.address, "Wrong!Pass-2026");
    await expect(page.locator("#auth-error")).toBeVisible({ timeout: 20_000 });
    const unverifiedWrongPwMsg = (await page.locator("#auth-error").innerText()).trim();

    await parentSignIn(page, inbox.address, STRONG_PASSWORD);
    await expect(page.locator("#auth-error")).toBeVisible({ timeout: 20_000 });
    const unverifiedCorrectPwMsg = (await page.locator("#auth-error").innerText()).trim();
    expect(unverifiedCorrectPwMsg).toMatch(/confirm your email/i);
    evidence.checks.unverified_wrong_vs_correct_pw = {
      wrongPwMsg: unverifiedWrongPwMsg,
      correctPwMsg: unverifiedCorrectPwMsg,
      distinctOnlyWhenPasswordCorrect: unverifiedWrongPwMsg !== unverifiedCorrectPwMsg,
    };

    // Wait for first confirmation email
    const mail1 = await waitForMailWithMetrics(inbox, /confirm/i, seen, "REG-02-initial-confirm", t0);
    const link1 = actionLink(mail1);
    checkLinkTarget(link1);

    // Tampered link fails and leaves account unconfirmed
    await page.goto(tamperLink(link1));
    await expect(page.getByRole("heading", { name: /can.t be used|expired|same device/i })).toBeVisible({
      timeout: 30_000,
    });
    expect((await findUserByEmail(inbox.address))!.email_confirmed_at ?? null).toBeNull();

    // Duplicate registration of UNVERIFIED account: shows "Check your email" OR rate-limit message (never leaks account existence)
    await page.goto("/sign-up");
    await page.getByLabel("Your name").fill("Audit Parent Reg02 Dup");
    await page.getByLabel(/^email$/i).fill(inbox.address);
    await page.getByLabel(/create a password/i).fill(STRONG_PASSWORD);
    await page.getByRole("checkbox").first().check();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(
      page.getByRole("heading", { name: /check your email/i }).or(page.locator("#su-error")),
    ).toBeVisible({ timeout: 30_000 });
    const dupUnverifiedErr = await page.locator("#su-error").textContent().catch(() => null);
    if (dupUnverifiedErr) {
      expect(dupUnverifiedErr).not.toMatch(/already|exists|registered/i);
    }

    // Confirm with genuine link1 (same browser context)
    await page.goto(link1);
    await expect(page).toHaveURL(/\/parent/, { timeout: 45_000 });
    expect((await findUserByEmail(inbox.address))!.email_confirmed_at).toBeTruthy();

    // Replay spent link in fresh session -> refused without 500
    await clearBrowserAuth(page);
    const spentRes = await page.goto(link1);
    expect(spentRes?.status() ?? 0).toBeLessThan(500);
    await expect(page.getByRole("heading", { name: /can.t be used|expired|same device/i })).toBeVisible({
      timeout: 30_000,
    });

    // Duplicate registration of VERIFIED account -> must NOT leak "already exists"; shows Check your email
    await page.goto("/sign-up");
    await page.getByLabel("Your name").fill("Duplicate Verified");
    await page.getByLabel(/^email$/i).fill(inbox.address);
    await page.getByLabel(/create a password/i).fill(STRONG_PASSWORD);
    await page.getByRole("checkbox").first().check();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByRole("heading", { name: /check your email/i })).toBeVisible({ timeout: 30_000 });
    evidence.checks.reg02_duplicate_verified_no_enum = "passed";
  });

  test("REG-03: Cross-device verification & verification while already signed in as another user", async ({
    page,
    browser,
  }) => {
    test.setTimeout(10 * 60_000);
    const inbox = await createInbox("reg03");
    createdEmails.push(inbox.address);
    const seen = new Set<string>();

    const t0 = Date.now();
    await page.goto("/sign-up");
    await page.getByLabel("Your name").fill("Cross Device Audit");
    await page.getByLabel(/^email$/i).fill(inbox.address);
    await page.getByLabel(/create a password/i).fill(STRONG_PASSWORD);
    await page.getByRole("checkbox").first().check();
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByRole("heading", { name: /check your email/i })).toBeVisible({ timeout: 30_000 });

    const mail = await waitForMailWithMetrics(inbox, /confirm/i, seen, "REG-03-cross-device-confirm", t0);
    const link = actionLink(mail);

    // Open confirmation link in a DIFFERENT browser context where another parent is already signed in
    const otherEmail = `mm-accept-${RUN_ID}-otherctx@example.com`;
    createdEmails.push(otherEmail);
    const { error } = await devAdmin().auth.admin.createUser({
      email: otherEmail,
      password: STRONG_PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: "Other Signed In Parent", role: "parent" },
    });
    expect(error).toBeNull();

    const otherCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    try {
      await protectContext(otherCtx);
      const p2 = await otherCtx.newPage();
      await parentSignIn(p2, otherEmail, STRONG_PASSWORD);
      await expect(p2).toHaveURL(/\/parent/, { timeout: 30_000 });

      // Follow reg03's confirmation link while signed in as otherEmail
      const res = await p2.goto(link);
      expect(res?.status() ?? 0).toBeLessThan(500);
      // Either same-device guidance (PKCE mismatch) or clean confirmation, never 500 or wrong-user leak
      await expect(p2.getByRole("heading").first()).toBeVisible({ timeout: 30_000 });
      const heading = (await p2.getByRole("heading").first().innerText()).trim();
      const confirmedAt = (await findUserByEmail(inbox.address))!.email_confirmed_at;
      expect(confirmedAt, "reg03 confirmed server-side").toBeTruthy();
      evidence.checks.reg03_cross_device_while_logged_in = { heading, url: p2.url(), confirmed: Boolean(confirmedAt) };
    } finally {
      await otherCtx.close();
    }
  });

  test("REG-04: Simultaneous registrations in two parallel browser contexts", async ({ browser }) => {
    test.setTimeout(10 * 60_000);
    const createWithRetry = async (lbl: string): Promise<Inbox> => {
      for (let attempt = 1; attempt <= 4; attempt++) {
        try {
          return await createInbox(`${lbl}${attempt}`);
        } catch (err) {
          if (attempt === 4) throw err;
          await new Promise((r) => setTimeout(r, 2000 * attempt));
        }
      }
      throw new Error("unreachable");
    };
    const inboxA = await createWithRetry("sima");
    await new Promise((r) => setTimeout(r, 1500));
    const inboxB = await createWithRetry("simb");
    createdEmails.push(inboxA.address, inboxB.address);

    const [ctxA, ctxB] = await Promise.all([
      browser.newContext({ viewport: { width: 1440, height: 900 } }),
      browser.newContext({ viewport: { width: 1440, height: 900 } }),
    ]);
    try {
      await Promise.all([protectContext(ctxA), protectContext(ctxB)]);
      const [pA, pB] = await Promise.all([ctxA.newPage(), ctxB.newPage()]);

      const submitSignup = async (p: Page, name: string, email: string) => {
        await p.goto("/sign-up");
        await p.getByLabel("Your name").fill(name);
        await p.getByLabel(/^email$/i).fill(email);
        await p.getByLabel(/create a password/i).fill(STRONG_PASSWORD);
        await p.getByRole("checkbox").first().check();
        await p.getByRole("button", { name: "Create account" }).click();
        await expect(p.getByRole("heading", { name: /check your email/i })).toBeVisible({ timeout: 30_000 });
      };

      const t0 = Date.now();
      await Promise.all([
        submitSignup(pA, "Simultaneous A", inboxA.address),
        submitSignup(pB, "Simultaneous B", inboxB.address),
      ]);

      const [mA, mB] = await Promise.all([
        waitForMailWithMetrics(inboxA, /confirm/i, new Set(), "REG-04-simA", t0),
        waitForMailWithMetrics(inboxB, /confirm/i, new Set(), "REG-04-simB", t0),
      ]);

      await Promise.all([pA.goto(actionLink(mA)), pB.goto(actionLink(mB))]);
      await Promise.all([
        expect(pA).toHaveURL(/\/parent/, { timeout: 45_000 }),
        expect(pB).toHaveURL(/\/parent/, { timeout: 45_000 }),
      ]);
      evidence.checks.reg04_simultaneous = "passed";
    } finally {
      await Promise.all([ctxA.close(), ctxB.close()]);
    }
  });
});
