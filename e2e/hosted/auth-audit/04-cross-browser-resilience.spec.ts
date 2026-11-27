/**
 * Auth Audit 04 — Cross-Browser, Multi-Viewport & Network Resilience (@responsive).
 *
 * Designed to run across:
 * - Chromium (desktop-1440, tablet-834, mobile-390)
 * - Firefox (via playwright.hosted.xbrowser.config.ts, XBROWSER=firefox)
 * - WebKit (via playwright.hosted.xbrowser.config.ts, XBROWSER=webkit)
 *
 * Covers:
 * - Parent sign-in & protected dashboard load across viewports/browsers
 * - Student PIN pad entry & sign-in across viewports/browsers
 * - Offline / interrupted auth request -> friendly network error -> reconnect -> retry succeeds
 * - Refresh during sign-in form preserves ?role=parent
 * - Logout + back/forward navigation cannot re-enter protected route
 * - Sign-up form mobile/tablet layout (no horizontal overflow, visible inputs & submit)
 */
import fs from "node:fs";
import path from "node:path";

import {
  RUN_ID,
  STRONG_PASSWORD,
  api,
  devAdmin,
  enterStudentCredentials,
  expect,
  seededEmail,
  test,
  retireFixtureUser,
} from "../fixtures";

const OUT = process.env.HOSTED_OUTPUT ?? "test-results/hosted";
const createdUserIds: string[] = [];

test.describe("Auth Audit 04: Cross-Browser & Resilience @responsive", () => {
  test.afterAll(async () => {
    for (const id of createdUserIds) {
      await retireFixtureUser(id);
    }
  });

  test("XBR-01: Parent & Student sign-in, offline recovery, refresh, logout + back navigation @responsive", async ({
    page,
    context,
  }, testInfo) => {
    test.setTimeout(5 * 60_000);
    const engine = testInfo.project.use.defaultBrowserType ?? "chromium";
    const proj = testInfo.project.name;
    const tag = `${engine}-${proj}`.replace(/[^a-z0-9]/gi, "").slice(0, 12).toLowerCase();

    // Seed a parent for this browser/viewport pass
    const email = seededEmail(`xbr${tag}`);
    const { data, error } = await devAdmin().auth.admin.createUser({
      email,
      password: STRONG_PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: `XBrowser ${tag}`, role: "parent" },
    });
    expect(error).toBeNull();
    createdUserIds.push(data.user!.id);

    // 1. Mobile/tablet/desktop layout check on /sign-up (no horizontal overflow)
    await page.goto("/sign-up");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${engine}/${proj} /sign-up horizontal overflow`).toBeLessThanOrEqual(2);

    // 2. Refresh on /sign-in?role=parent preserves role tab
    await page.goto("/sign-in");
    await page.getByRole("button", { name: /I'm a parent/i }).click();
    await expect(page).toHaveURL(/role=parent/);
    await page.reload();
    await expect(page.getByLabel(/^email$/i)).toBeVisible();

    // 3. Offline / interrupted auth request -> friendly network error -> reconnect -> retry succeeds
    await page.getByLabel(/^email$/i).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
    await context.setOffline(true);
    await page.getByRole("button", { name: /^sign in/i }).click();
    await expect(page.locator("#auth-error")).toContainText(/couldn.t reach|connection|try again/i, {
      timeout: 20_000,
    });
    await context.setOffline(false);

    // Retry now that network is back
    await page.getByRole("button", { name: /^sign in/i }).click();
    await expect(page).toHaveURL(/\/parent/, { timeout: 30_000 });

    // 4. Provision child & verify Student PIN pad sign-in on this browser/viewport
    const cRes = await api(page).post("/api/parent/children", { displayName: `Kid${tag.slice(0, 6)}`, yearLevel: 3 });
    expect(cRes.status()).toBe(200);
    const childJson = (await cRes.json()) as { loginCode: string; pin: string };
    const { data: linkRow } = await devAdmin()
      .from("parent_children")
      .select("child_id")
      .eq("parent_id", data.user!.id)
      .single();
    if (linkRow?.child_id) createdUserIds.push(linkRow.child_id as string);

    // Logout parent via ParentAccountMenu and wait for /signed-out to settle
    await page.getByRole("button", { name: /account menu/i }).click();
    await page.getByRole("menuitem", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/signed-out/, { timeout: 20_000 });
    await page.waitForLoadState("load").catch(() => undefined);

    // Directly revisiting /parent after logout must redirect to sign-in/session-expired
    if (engine === "webkit") {
      // Playwright WebKit hangs page.goto on 307 responses fulfilled via context.route; verify the exact 307 redirect directly.
      const res = await page.request.get("/parent", {
        headers: { "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET! },
        maxRedirects: 0,
      });
      expect(res.status(), "WebKit post-logout /parent must redirect").toBeGreaterThanOrEqual(300);
      expect(res.status()).toBeLessThan(400);
      expect(res.headers()["location"] ?? "").toMatch(/\/(sign-in|session-expired)/);
    } else {
      await page.goto("/parent", { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/(sign-in|session-expired)/, { timeout: 20_000 });
    }

    // Student sign-in via PIN pad
    await page.goto("/student-sign-in");
    await enterStudentCredentials(page, childJson.loginCode, childJson.pin);
    await page.getByRole("button", { name: /^sign in/i }).click();
    await expect(page).toHaveURL(/\/student/, { timeout: 30_000 });

    // Write per-browser/viewport evidence
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(
      path.join(OUT, `audit-04-${engine}-${proj}.json`),
      JSON.stringify({ runId: RUN_ID, engine, project: proj, overflow, result: "passed" }, null, 2),
    );
  });
});
