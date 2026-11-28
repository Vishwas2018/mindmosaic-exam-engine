/**
 * Seeds ONE persistent family on DEV for the owner's manual testing. Not part of the acceptance run: it only runs
 * with HOSTED_SEED_MANUAL=1, and is idempotent (an existing parent is reused, children are added only if missing).
 *
 * The parent is created confirmed by the DEV service role (no email involved); the children are created through
 * the deployed app's own "add a child" form, so the login codes and PINs are real ones issued by the app.
 * The `mm-manual-` prefix is outside cleanup.mjs's synthetic patterns, so the family survives suite cleanups.
 *
 * Output: <HOSTED_OUTPUT>/manual-family.json (credentials for DEV only; never commit it).
 */
import fs from "node:fs";
import path from "node:path";

import { devAdmin, expect, findUserByEmail, parentSignIn, test } from "./fixtures";

/**
 * A DEDICATED synthetic identity (never the owner's personal account). Credentials come from
 * scripts/hosted-acceptance/prepare-manual-credentials.mjs, stored outside the repo and passed via the environment.
 */
const EMAIL = (process.env.MANUAL_PARENT_EMAIL ?? "mm-manual-beta-parent@example.com").toLowerCase();
const OUT = path.join(process.env.HOSTED_OUTPUT ?? "test-results/hosted", "manual-family.json");
const CHILDREN = [
  { name: "Maya", year: "Year 3", pin: process.env.MANUAL_PIN_1 ?? "" },
  { name: "Leo", year: "Year 5", pin: process.env.MANUAL_PIN_2 ?? "" },
];

test("seed the owner's manual-testing family", async ({ page }, testInfo) => {
  test.skip(process.env.HOSTED_SEED_MANUAL !== "1", "manual seed only");
  test.skip(testInfo.project.name !== "desktop-1440", "seed once");
  const password = process.env.MANUAL_PARENT_PASSWORD;
  expect(password, "MANUAL_PARENT_PASSWORD").toBeTruthy();
  expect(EMAIL, "manual parent must be a synthetic mm-manual-*@example.com identity").toMatch(/^mm-manual-[a-z0-9-]+@example\.com$/);

  const existing = await findUserByEmail(EMAIL);
  if (existing) {
    // Never change an existing account's password as a side effect; rotation is an explicit decision.
    expect(
      process.env.MANUAL_ALLOW_PASSWORD_RESET,
      "account already exists: set MANUAL_ALLOW_PASSWORD_RESET=1 to rotate its password on purpose",
    ).toBe("1");
    const { error } = await devAdmin().auth.admin.updateUserById(existing.id, { password: password! });
    expect(error).toBeNull();
  } else {
    const { error } = await devAdmin().auth.admin.createUser({
      email: EMAIL,
      password: password!,
      email_confirm: true,
      user_metadata: { display_name: "Manual Tester", role: "parent" },
    });
    expect(error).toBeNull();
  }

  await parentSignIn(page, EMAIL, password!);
  await expect(page).toHaveURL(/\/parent/, { timeout: 30_000 });

  const issued: Array<{ name: string; year: string; loginCode: string; pin: string }> = [];
  for (const child of CHILDREN) {
    await page.goto("/parent/children");
    await page.waitForLoadState("networkidle");
    if (await page.getByRole("link", { name: `Manage ${child.name}` }).isVisible().catch(() => false)) {
      issued.push({ name: child.name, year: child.year, loginCode: "(already existed: see Children page)", pin: "(reset from Children page)" });
      continue;
    }
    await page.goto("/parent/setup");
    await page.getByLabel("First name").fill(child.name);
    await page.getByLabel("Year level").selectOption({ label: child.year });
    if (child.pin) {
      await page.getByLabel("I’ll choose it").check();
      await page.getByLabel("PIN", { exact: true }).fill(child.pin);
    }
    const created = page.waitForResponse(
      (r) => r.url().endsWith("/api/parent/children") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: /^Create .*profile$/ }).click();
    const res = await created;
    expect(res.ok(), `create ${child.name}: ${res.status()}`).toBe(true);
    const body = (await res.json()) as { loginCode?: string; pin?: string };
    issued.push({ name: child.name, year: child.year, loginCode: body.loginCode!, pin: body.pin! });
    await page.getByRole("button", { name: /done/i }).first().click().catch(() => {});
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ email: EMAIL, children: issued }, null, 2));
});
