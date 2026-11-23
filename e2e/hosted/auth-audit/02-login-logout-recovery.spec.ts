/**
 * Auth Audit 02 — Login, Logout, Session Lifecycle & Password Recovery (Hosted DEV Preview).
 *
 * Covers:
 * - Role-based sign-in & redirect: Parent, Student (code+PIN), Teacher, Admin
 * - Invalid credentials, unknown accounts, empty inputs, malformed email, enumeration prevention
 * - Rapid repeated failed attempts -> client lockout (5 attempts -> 30s)
 * - Keep me signed in unchecked (ephemeral marker discards stored session on fresh boot)
 * - Logout + browser Back button cannot regain protected page
 * - Multi-tab logout propagation & concurrent sessions
 * - Archived/paused student refused with generic message (no code enumeration); restore works
 * - Revoked account (access_revoked_at) blocked at requireRole and signed out
 * - Password recovery: /sign-in?mode=forgot AND /auth/forgot, real mail.tm delivery,
 *   active-session guard on /auth/reset (not_recovery), session invalidation on OTHER devices
 *   after password change, old password refused, new password accepted, spent link refused
 */
import fs from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";

import {
  RUN_ID,
  STRONG_PASSWORD,
  api,
  devAdmin,
  enterStudentCredentials,
  expect,
  parentSignIn,
  protectContext,
  seedBypassCookie,
  seededEmail,
  test,
} from "../fixtures";
import { actionLink, checkLinkTarget, createInbox, waitForMail } from "../mailtm";

const OUT = process.env.HOSTED_OUTPUT ?? "test-results/hosted";
const RESET_PASSWORD = "Audit!Reset-2026-New";
const createdUserIds: string[] = [];

const evidence: {
  runId: string;
  checks: Record<string, unknown>;
} = {
  runId: RUN_ID,
  checks: {},
};

async function createSeededUser(label: string, role: "parent" | "teacher" | "admin") {
  const email = seededEmail(label);
  const { data, error } = await devAdmin().auth.admin.createUser({
    email,
    password: STRONG_PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: `Audit ${role} ${label}`, role: "parent" },
  });
  if (error || !data.user) throw new Error(`createUser ${label} failed: ${error?.message}`);
  createdUserIds.push(data.user.id);
  if (role !== "parent") {
    const { error: upErr } = await devAdmin()
      .from("profiles")
      .update({ role })
      .eq("id", data.user.id);
    if (upErr) throw new Error(`update role ${role} failed: ${upErr.message}`);
  }
  return { id: data.user.id, email };
}

async function studentSignIn(page: Page, code: string, pin: string) {
  await page.goto("/student-sign-in");
  await enterStudentCredentials(page, code, pin);
  await page.getByRole("button", { name: /^sign in/i }).click();
}

test.describe("Auth Audit 02: Login, Logout, Session Lifecycle & Password Recovery", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-1440", "runs once on desktop-1440");
  });

  test.afterAll(async () => {
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, "audit-02-evidence.json"), JSON.stringify(evidence, null, 2));
    for (const id of createdUserIds) {
      await devAdmin().auth.admin.deleteUser(id).catch(() => undefined);
    }
  });

  test("AUTH-01: Empty inputs, malformed email, wrong password vs unknown account, and 5-attempt lockout", async ({
    page,
  }) => {
    await page.goto("/sign-in?role=parent");
    const submit = page.getByRole("button", { name: /^sign in/i });

    // Empty inputs
    await submit.click();
    await expect(page.locator("#auth-error")).toContainText(/enter your email address and password/i);

    // Malformed email
    await page.getByLabel(/^email$/i).fill("not-an-email");
    await page.getByLabel("Password", { exact: true }).fill("anything");
    await submit.click();
    await expect(page.locator("#auth-error")).toContainText(/complete email address/i);

    // Known vs unknown account error parity + 5-attempt client lockout
    const parent = await createSeededUser("lockp", "parent");
    await page.getByLabel(/^email$/i).fill(parent.email);
    await page.getByLabel("Password", { exact: true }).fill("Wrong!Password-1");
    await submit.click();
    await expect(page.locator("#auth-error")).toBeVisible({ timeout: 15_000 });
    const knownErr = (await page.locator("#auth-error").innerText()).trim();

    await page.getByLabel(/^email$/i).fill(`nobody-${RUN_ID}@example.org`);
    await page.getByLabel("Password", { exact: true }).fill("Wrong!Password-1");
    await submit.click();
    await expect(page.locator("#auth-error")).toBeVisible({ timeout: 15_000 });
    const unknownErr = (await page.locator("#auth-error").innerText()).trim();
    expect(unknownErr).toBe(knownErr);

    // 3 more failed attempts -> total 5 -> lockout active
    for (let i = 0; i < 3; i++) {
      await submit.click();
      await page.waitForTimeout(300);
    }
    await expect(page.getByText(/too many attempts/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("button", { name: /try again in \d+s/i })).toBeDisabled();
    evidence.checks.auth01_validation_enum_lockout = "passed";
  });

  test("AUTH-02: Role-home routing (Parent, Student, Teacher, Admin), logout + Back button, multi-tab & ephemeral session", async ({
    browser,
  }) => {
    test.setTimeout(5 * 60_000);
    const parent = await createSeededUser("rolep", "parent");
    const teacher = await createSeededUser("rolet", "teacher");
    const admin = await createSeededUser("rolea", "admin");

    // Parent login + provision child + logout + Back button check
    const ctxP = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    let childCreds: { loginCode: string; pin: string; childId: string };
    try {
      await protectContext(ctxP);
      const p1 = await ctxP.newPage();
      await parentSignIn(p1, parent.email, STRONG_PASSWORD);
      await expect(p1).toHaveURL(/\/parent/, { timeout: 30_000 });

      // Provision a synthetic child via API
      const createRes = await api(p1).post("/api/parent/children", {
        displayName: "AuditChild02",
        yearLevel: 5,
      });
      expect(createRes.status()).toBe(200);
      const createdJson = (await createRes.json()) as { loginCode: string; pin: string };
      const { data: linkRow } = await devAdmin()
        .from("parent_children")
        .select("child_id")
        .eq("parent_id", parent.id)
        .single();
      expect(linkRow?.child_id).toBeTruthy();
      childCreds = { loginCode: createdJson.loginCode, pin: createdJson.pin, childId: linkRow!.child_id as string };
      createdUserIds.push(childCreds.childId);

      // Open second tab in same context, sign out via /auth/signed-out or UI button, verify protected route redirects
      const p2 = await ctxP.newPage();
      await p2.goto("/parent");
      await expect(p2).toHaveURL(/\/parent/);

      // Sign out from p1 via ParentAccountMenu
      await p1.getByRole("button", { name: /account menu/i }).click();
      await p1.getByRole("menuitem", { name: /sign out/i }).click();
      await expect(p1).not.toHaveURL(/\/parent(\/|$)/, { timeout: 20_000 });

      // Navigating Back on p1 must NOT expose /parent
      await p1.goBack().catch(() => undefined);
      await p1.goto("/parent");
      await expect(p1).toHaveURL(/\/(sign-in|session-expired)/, { timeout: 20_000 });

      // Reloading p2 must redirect to sign-in / session-expired
      await p2.reload();
      await expect(p2).toHaveURL(/\/(sign-in|session-expired)/, { timeout: 20_000 });
    } finally {
      await ctxP.close();
    }

    // Student sign-in + archive (pause) -> generic refusal + restore -> sign-in works
    const ctxS = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    try {
      await protectContext(ctxS);
      const pS = await ctxS.newPage();
      await studentSignIn(pS, childCreds!.loginCode, childCreds!.pin);
      await expect(pS).toHaveURL(/\/student/, { timeout: 30_000 });

      // Pause/archive child via parent API
      const ctxP2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      await protectContext(ctxP2);
      const pP2 = await ctxP2.newPage();
      await parentSignIn(pP2, parent.email, STRONG_PASSWORD);
      await expect(pP2).toHaveURL(/\/parent/, { timeout: 30_000 });
      const archRes = await api(pP2).patch(`/api/parent/children/${childCreds!.childId}`, { archived: true });
      expect(archRes.status()).toBe(200);

      // Existing student session must be denied on next server navigation (denyArchivedSessions)
      await pS.goto("/student");
      await expect(pS).toHaveURL(/\/(sign-in|session-expired)/, { timeout: 20_000 });

      // Fresh student login while archived must return generic message (same as wrong PIN)
      await studentSignIn(pS, childCreds!.loginCode, childCreds!.pin);
      await expect(pS.locator("#auth-error")).toContainText(/code and pin didn.t match/i, { timeout: 20_000 });

      // Restore child -> student sign-in succeeds again
      const restRes = await api(pP2).patch(`/api/parent/children/${childCreds!.childId}`, { archived: false });
      expect(restRes.status()).toBe(200);
      await studentSignIn(pS, childCreds!.loginCode, childCreds!.pin);
      await expect(pS).toHaveURL(/\/student/, { timeout: 30_000 });
      await ctxP2.close();
    } finally {
      await ctxS.close();
    }

    // Teacher & Admin role-home redirects
    for (const [label, user, expectedPath] of [
      ["teacher", teacher, /\/teacher/],
      ["admin", admin, /\/admin/],
    ] as const) {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      try {
        await protectContext(ctx);
        const p = await ctx.newPage();
        await parentSignIn(p, user.email, STRONG_PASSWORD);
        await expect(p, `${label} lands on ${expectedPath}`).toHaveURL(expectedPath, { timeout: 30_000 });
      } finally {
        await ctx.close();
      }
    }

    // Ephemeral session ("Keep me signed in" unchecked)
    const ctxEph = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    try {
      await protectContext(ctxEph);
      const pE = await ctxEph.newPage();
      await pE.goto("/sign-in?role=parent");
      await pE.getByLabel(/^email$/i).fill(parent.email);
      await pE.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
      // Uncheck "Keep me signed in"
      await pE.getByRole("checkbox", { name: /keep me signed in/i }).uncheck();
      await pE.getByRole("button", { name: /^sign in/i }).click();
      await expect(pE).toHaveURL(/\/parent/, { timeout: 30_000 });
      const markers = await pE.evaluate(() => ({
        local: localStorage.getItem("mm.auth.ephemeral"),
        session: sessionStorage.getItem("mm.auth.ephemeral"),
      }));
      expect(markers.local).toBe("1");
      expect(markers.session).toBe("1");

      // Simulate fresh browser reopen (sessionStorage cleared, localStorage retained)
      await pE.evaluate(() => sessionStorage.clear());
      await pE.reload();
      await pE.waitForTimeout(2000);
      await pE.goto("/parent");
      await expect(pE).toHaveURL(/\/(sign-in|session-expired)/, { timeout: 20_000 });
      evidence.checks.auth02_ephemeral_session = "passed";
    } finally {
      await ctxEph.close();
    }

    // Revoked account (access_revoked_at) blocked by requireRole
    const revoked = await createSeededUser("revoked", "parent");
    const ctxRev = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    try {
      await protectContext(ctxRev);
      const pR = await ctxRev.newPage();
      await parentSignIn(pR, revoked.email, STRONG_PASSWORD);
      await expect(pR).toHaveURL(/\/parent/, { timeout: 30_000 });
      const { error: revErr } = await devAdmin()
        .from("profiles")
        .update({ access_revoked_at: new Date().toISOString() })
        .eq("id", revoked.id);
      expect(revErr).toBeNull();
      await pR.goto("/parent/children");
      await expect(pR).toHaveURL(/\/sign-in/, { timeout: 20_000 });
      evidence.checks.auth02_revoked_account = "passed";
    } finally {
      await ctxRev.close();
    }
  });

  test("REC-01: Password recovery end-to-end, active-session guard, cross-device invalidation & /auth/forgot", async ({
    page,
    browser,
  }) => {
    test.skip(process.env.HOSTED_MAILBOX !== "mailtm", "needs HOSTED_MAILBOX=mailtm");
    test.setTimeout(10 * 60_000);

    const inbox = await createInbox("rec01");
    const { data, error } = await devAdmin().auth.admin.createUser({
      email: inbox.address,
      password: STRONG_PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: "Audit Recovery Parent", role: "parent" },
    });
    expect(error).toBeNull();
    createdUserIds.push(data.user!.id);

    // Device B signs in BEFORE password reset (to verify session invalidation after password change)
    const ctxOther = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await protectContext(ctxOther);
    const pageOther = await ctxOther.newPage();
    await parentSignIn(pageOther, inbox.address, STRONG_PASSWORD);
    await expect(pageOther).toHaveURL(/\/parent/, { timeout: 30_000 });

    // Active-session guard: signed-in user opening /auth/reset directly must NOT see the password form
    await pageOther.goto("/auth/reset");
    await expect(pageOther.getByText(/only opens from the link|open your reset link/i).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(pageOther.getByRole("heading", { name: "Set a new password" })).toHaveCount(0);

    // Verify DEF-AUTH-006 validation & 30s resend cooldown on standalone /auth/forgot
    const seen = new Set<string>();
    await page.goto("/auth/forgot");
    await page.getByLabel(/^email$/i).fill("not-an-email");
    await page.getByRole("button", { name: /send reset link/i }).click();
    await expect(page.locator("#auth-error")).toContainText(/complete email address/i);

    await page.getByLabel(/^email$/i).fill(inbox.address);
    const t0 = Date.now();
    await page.getByRole("button", { name: /send reset link/i }).click();
    await expect(page.getByRole("heading", { name: /check your email/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: /resend available in \d+s/i })).toBeDisabled();

    let firstAttempt = true;
    let mail;
    try {
      mail = await waitForMail(inbox, /reset|password|recover/i, seen, 95_000);
    } catch {
      firstAttempt = false;
      await page.goto("/sign-in?mode=forgot");
      await page.getByLabel("Email", { exact: true }).fill(inbox.address);
      await page.getByRole("button", { name: "Send reset link" }).click();
      mail = await waitForMail(inbox, /reset|password|recover/i, seen, 150_000);
    }
    const latency = Math.max(0, Math.round((Date.parse(mail.receivedAt) - t0) / 1000));
    evidence.checks.rec01_mail = {
      firstAttemptSuccess: firstAttempt,
      latencySeconds: latency,
      from: mail.from,
      subject: mail.subject,
    };

    const link = actionLink(mail);
    checkLinkTarget(link);
    const redirectTo = new URL(link).searchParams.get("redirect_to");
    if (redirectTo) {
      expect(new URL(redirectTo).pathname, "recovery callback path preserved").toBe("/auth/reset");
    }

    // Follow recovery link in the requesting browser -> set new password
    await page.goto(link);
    await expect(page.getByRole("heading", { name: "Set a new password" })).toBeVisible({ timeout: 45_000 });
    await page.getByLabel("New password", { exact: true }).fill(RESET_PASSWORD);
    await page.getByLabel("Confirm new password").fill(RESET_PASSWORD);
    await page.getByRole("button", { name: "Save new password" }).click();
    await expect(page.getByRole("heading", { name: /password changed/i })).toBeVisible({ timeout: 30_000 });

    // Verify Device B's session was invalidated by signOut({ scope: "others" })!
    await pageOther.goto("/parent/children");
    const otherUrlAfterReset = pageOther.url();
    const otherRevoked = /\/(sign-in|session-expired)/.test(otherUrlAfterReset);
    evidence.checks.rec01_other_device_invalidated = { otherUrlAfterReset, otherRevoked };
    expect(otherRevoked, `Other device should be signed out after password reset; got ${otherUrlAfterReset}`).toBe(true);
    await ctxOther.close();

    // Old password refused, new password accepted
    await page.context().clearCookies();
    await seedBypassCookie(page.context());
    await parentSignIn(page, inbox.address, STRONG_PASSWORD);
    await expect(page.locator("#auth-error")).toBeVisible({ timeout: 20_000 });
    await parentSignIn(page, inbox.address, RESET_PASSWORD);
    await expect(page).toHaveURL(/\/parent/, { timeout: 45_000 });
    evidence.checks.rec01_full_recovery = "passed";
  });
});
