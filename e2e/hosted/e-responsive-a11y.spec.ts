/**
 * Scenario E — the critical parent and student screens at 1440, 834 and 390 px on the hosted DEV Preview:
 * no horizontal scroll, no serious or critical axe violations, 44 px touch targets on touch viewports, a
 * visible keyboard focus on the sign-in forms, and a screenshot of each for the record.
 * Uses the family from Scenarios A–C (FAMILY_FILE or family-a.json in this run).
 */
import fs from "node:fs";
import path from "node:path";

import type { Page, TestInfo } from "@playwright/test";

import { assertNoSeriousAccessibilityViolations } from "../accessibility";
import { expectMinimumTouchTargets, expectNoHorizontalOverflow } from "../helpers/screen-helpers";
import { enterStudentCredentials, expect, parentSignIn, test } from "./fixtures";

type Family = { email: string; password: string; childName: string; loginCode: string; pin: string; childUserId?: string; attemptId?: string };
const family = (): Family =>
  JSON.parse(
    fs.readFileSync(
      process.env.FAMILY_FILE ?? path.join(process.env.HOSTED_OUTPUT ?? "test-results/hosted", "family-a.json"),
      "utf8",
    ),
  ) as Family;

async function check(page: Page, testInfo: TestInfo, name: string) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true });
  await expectNoHorizontalOverflow(page);
  await assertNoSeriousAccessibilityViolations(page);
  if (testInfo.project.name !== "desktop-1440") {
    await expectMinimumTouchTargets(page, "main button:visible, main a[href]:visible, main select:visible, main input:visible");
  }
}

async function closeWelcome(page: Page) {
  const dialog = page.getByRole("dialog", { name: "Welcome to MindMosaic" });
  await dialog.waitFor({ state: "visible", timeout: 4_000 }).catch(() => {});
  if (await dialog.isVisible().catch(() => false)) await dialog.getByRole("button", { name: "Close" }).click();
}

test("E: student screens @responsive", async ({ page }, testInfo) => {
  const fam = family();
  await page.goto("/sign-in");
  await page.getByRole("button", { name: /I'm a student/i }).click();
  await check(page, testInfo, "e-student-signin");
  // PIN entry by keyboard only, with a visible focus ring on each cell
  await page.getByLabel("Login code").focus();
  await page.keyboard.type(fam.loginCode);
  await page.keyboard.press("Tab");
  const firstPin = page.getByLabel(/^Your PIN, number 1 of 6/);
  await expect(firstPin).toBeFocused();
  const ring = await firstPin.evaluate((el) => {
    const s = getComputedStyle(el);
    return s.outlineStyle !== "none" || s.boxShadow !== "none";
  });
  expect(ring, "PIN cell shows focus").toBe(true);
  await page.keyboard.type(fam.pin);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/student$/, { timeout: 30_000 });
  await closeWelcome(page);
  await check(page, testInfo, "e-my-space");
  for (const [route, name] of [
    ["/student/practice", "e-practice-studio"],
    ["/practice/naplan-g3-numeracy", "e-programme-setup"],
    ["/results", "e-results"],
    ["/student/engagement", "e-my-progress"],
    ["/student/learn", "e-learning-hub"],
  ] as const) {
    await page.goto(route);
    await check(page, testInfo, name);
  }
});

test("E: parent screens @responsive", async ({ page }, testInfo) => {
  const fam = family();
  await page.goto("/sign-in");
  await page.getByRole("button", { name: /I'm a parent/i }).click();
  await check(page, testInfo, "e-parent-signin");
  await parentSignIn(page, fam.email, fam.password);
  await expect(page).toHaveURL(/\/parent/, { timeout: 30_000 });
  await check(page, testInfo, "e-parent-home");
  const routes: Array<[string, string]> = [
    ["/parent/children", "e-parent-children"],
    ["/parent/account", "e-parent-account"],
    ["/parent/help", "e-parent-help"],
  ];
  if (fam.childUserId) routes.push([`/parent/children/${fam.childUserId}/progress`, "e-parent-child-progress"]);
  if (fam.attemptId) routes.push([`/parent/results/${fam.attemptId}`, "e-parent-result"]);
  for (const [route, name] of routes) {
    await page.goto(route);
    await check(page, testInfo, name);
  }
});

test("E: the exam runner and results review @responsive", async ({ page }, testInfo) => {
  const fam = family();
  await page.goto("/sign-in");
  await page.getByRole("button", { name: /I'm a student/i }).click();
  await enterStudentCredentials(page, fam.loginCode, fam.pin);
  await page.getByRole("button", { name: /sign in/i }).last().click();
  await expect(page).toHaveURL(/\/student$/, { timeout: 30_000 });
  await closeWelcome(page);
  await page.goto("/practice/naplan-g3-numeracy");
  await page.getByLabel("Number of questions").selectOption({ label: "10 questions" });
  await page.getByLabel("Timing").selectOption({ label: "Untimed" });
  await page.getByRole("button", { name: "Review instructions" }).click();
  await page.getByTestId("begin-exam").click();
  await expect(page.getByRole("heading", { name: "Question 1 of 10" })).toBeVisible();
  await check(page, testInfo, "e-exam-q1");
  await page.getByTestId("open-submit-dialog").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("submit-dialog")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("e-submit-dialog.png") });
  await page.getByTestId("confirm-submit").focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/results/, { timeout: 30_000 });
  await check(page, testInfo, "e-results-after-submit");
});
