import { expect, test } from "@playwright/test";

import { assertNoSeriousAccessibilityViolations } from "./accessibility";
import {
  A11Y_VIEWPORTS,
  expectMinimumTouchTargets,
  expectNoHorizontalOverflow,
  setViewport,
  visitAndStabilize,
  walkTabOrderAndAssertVisibleFocus,
} from "./helpers/screen-helpers";

const PAGES = [
  { path: "/sign-in", heading: "Welcome back" },
  { path: "/sign-up", heading: "Create your account" },
  { path: "/student-sign-in", heading: "Student sign in" },
] as const;

test.describe("auth pages: accessibility and responsive layout", () => {
  for (const { path, heading } of PAGES) {
    test(`${path} has no serious/critical axe violations at every viewport`, async ({
      page,
    }) => {
      for (const viewport of A11Y_VIEWPORTS) {
        await setViewport(page, viewport);
        await visitAndStabilize(page, path, { readyLocator: "main" });
        await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
        await expectNoHorizontalOverflow(page);
        await expectMinimumTouchTargets(page, "main button, main a[href], main input, main select");
        await assertNoSeriousAccessibilityViolations(page, `${path} (${viewport.name})`);
      }
    });
  }

  test("sign-in keyboard walkthrough reaches every control with visible focus, in order", async ({
    page,
  }) => {
    await setViewport(page, A11Y_VIEWPORTS[0]);
    await visitAndStabilize(page, "/sign-in", { readyLocator: "main" });
    const sequence = await walkTabOrderAndAssertVisibleFocus(page);

    const emailIndex = sequence.indexOf("auth-email");
    const passwordIndex = sequence.indexOf("auth-password");
    const submitIndex = sequence.findIndex((key) => key.includes("Sign in"));

    expect(emailIndex).toBeGreaterThanOrEqual(0);
    expect(passwordIndex).toBeGreaterThan(emailIndex);
    expect(submitIndex).toBeGreaterThan(passwordIndex);
  });

  test("student sign-in keyboard walkthrough reaches every control with visible focus, in order", async ({
    page,
  }) => {
    await setViewport(page, A11Y_VIEWPORTS[0]);
    await visitAndStabilize(page, "/student-sign-in", { readyLocator: "main" });
    const sequence = await walkTabOrderAndAssertVisibleFocus(page);

    const codeIndex = sequence.indexOf("student-login-code");
    const pinIndex = sequence.indexOf("student-pin");

    expect(codeIndex).toBeGreaterThanOrEqual(0);
    expect(pinIndex).toBeGreaterThan(codeIndex);
  });

  test("switching between sign-in, sign-up and forgot-password modes stays accessible", async ({
    page,
  }) => {
    await setViewport(page, A11Y_VIEWPORTS[0]);
    await visitAndStabilize(page, "/sign-in", { readyLocator: "main" });

    await page.getByRole("button", { name: "Create an account" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Create your account" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await assertNoSeriousAccessibilityViolations(page, "sign-in card in signup mode");

    await page.getByRole("button", { name: "Sign in" }).click();
    await page.getByRole("button", { name: "Forgot password?" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Reset your password" }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await assertNoSeriousAccessibilityViolations(page, "sign-in card in forgot-password mode");
  });
});
