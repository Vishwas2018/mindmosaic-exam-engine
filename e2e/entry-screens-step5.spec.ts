import { expect, test } from "@playwright/test";
import { PUBLIC_SIGNUP_ENABLED } from "../src/features/auth/signup-policy";

import { assertNoSeriousAccessibilityViolations } from "./accessibility";
import {
  A11Y_VIEWPORTS,
  expectNoHorizontalOverflow,
  setViewport,
  visitAndStabilize,
  walkTabOrderAndAssertVisibleFocus,
} from "./helpers/screen-helpers";

/*
 * Entry reskin (public-pages Step 5): sign-in (parent + student),
 * sign-up/onboarding, email verification, account recovery. Restyle and
 * motion only — e2e/a11y-auth-pages.spec.ts already covers /sign-in and
 * /student-sign-in's own viewport/axe/keyboard bar; this file covers what
 * that one doesn't: the skip link, the sign-up wizard's later steps, email
 * verification, both halves of account recovery, and the new shake motion.
 */

test.describe("skip link", () => {
  test("is the first focusable element, and is hidden until focused", async ({ page }) => {
    await visitAndStabilize(page, "/sign-in", { readyLocator: "main" });

    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toHaveText("Skip to main content");
    await expect(skipLink).toHaveAttribute("href", "#main-content");

    // Hidden (0×0, clipped) before focus.
    const hiddenBox = await skipLink.boundingBox();
    expect(hiddenBox?.width ?? 0).toBeLessThanOrEqual(1);
    expect(hiddenBox?.height ?? 0).toBeLessThanOrEqual(1);

    // First Tab from the top of the page reaches it.
    await page.keyboard.press("Tab");
    await expect(skipLink).toBeFocused();

    // Visible and full-size once focused.
    const visibleBox = await skipLink.boundingBox();
    expect(visibleBox?.width ?? 0).toBeGreaterThan(50);
    expect(visibleBox?.height ?? 0).toBeGreaterThan(20);
  });
});

if (PUBLIC_SIGNUP_ENABLED) {
  /* Create a family account is one card, one step (Claude Design auth artboards 05 / 09). */
  async function fillSignUp(page: import("@playwright/test").Page, email: string) {
    await page.getByLabel("Your name").fill("Priya Raman");
    await page.getByLabel(/^email$/i).fill(email);
    await page.getByLabel(/create a password/i).fill("Str0ng!pass123");
    await page.getByRole("checkbox").click();
  }

  test.describe("create a family account", () => {
    test("has no horizontal overflow at every viewport", async ({ page }) => {
      for (const viewport of A11Y_VIEWPORTS) {
        await setViewport(page, viewport);
        await visitAndStabilize(page, "/sign-up", { readyLocator: "main" });
        await expectNoHorizontalOverflow(page);
        await fillSignUp(page, `priya+${viewport.name}@example.com`);
        await expectNoHorizontalOverflow(page);
      }
    });

    test("has no serious/critical axe violations, empty or filled", async ({ page }) => {
      await visitAndStabilize(page, "/sign-up", { readyLocator: "main" });
      await assertNoSeriousAccessibilityViolations(page, "sign-up empty");
      await fillSignUp(page, "priya@example.com");
      await assertNoSeriousAccessibilityViolations(page, "sign-up filled");
    });

    test("is keyboard-reachable in order, with a visible focus ring throughout", async ({ page }) => {
      await setViewport(page, A11Y_VIEWPORTS[0]);
      await visitAndStabilize(page, "/sign-up", { readyLocator: "main" });
      await page.locator(".skip-link").focus();
      const sequence = await walkTabOrderAndAssertVisibleFocus(page);
      const name = sequence.findIndex((key) => key.includes("su-name"));
      const email = sequence.findIndex((key) => key.includes("su-email"));
      const password = sequence.findIndex((key) => key.includes("su-password"));
      const create = sequence.findIndex((key) => key.includes("Create account"));
      expect(name).toBeGreaterThanOrEqual(0);
      expect(email).toBeGreaterThan(name);
      expect(password).toBeGreaterThan(email);
      expect(create).toBeGreaterThan(password);
    });

    test("keeps name, email and consent after a trip to the Terms and back", async ({ page }) => {
      await visitAndStabilize(page, "/sign-up", { readyLocator: "main" });
      await fillSignUp(page, "priya@example.com");
      await expect(page.getByRole("link", { name: /^terms/i })).toHaveAttribute("target", "_blank");
      await page.goto("/terms");
      await page.goBack();
      await expect(page.getByLabel("Your name")).toHaveValue("Priya Raman");
      await expect(page.getByLabel(/^email$/i)).toHaveValue("priya@example.com");
      await expect(page.getByRole("checkbox")).toBeChecked();
    });

    test("an invalid submit shakes the form", async ({ page }) => {
      /* Not visitAndStabilize(): it disables animation globally, which would make this check meaningless. */
      await page.goto("/sign-up", { waitUntil: "domcontentloaded" });
      await page.locator("main").first().waitFor({ state: "visible" });
      await page.getByRole("button", { name: "Create account" }).click();
      const errorPanel = page.getByRole("alert").first();
      await expect(errorPanel).toBeVisible();
      const animationName = await errorPanel.locator("..").evaluate((el) => getComputedStyle(el).animationName);
      expect(animationName).toBe("mm-shake");
    });

    test("the shake animation is near-instant under prefers-reduced-motion", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/sign-up", { waitUntil: "domcontentloaded" });
      await page.locator("main").first().waitFor({ state: "visible" });
      await page.getByRole("button", { name: "Create account" }).click();
      const errorPanel = page.getByRole("alert").first();
      await expect(errorPanel).toBeVisible();
      const durationMs = await errorPanel.locator("..").evaluate((el) => {
        const duration = getComputedStyle(el).animationDuration;
        return parseFloat(duration) * (duration.includes("ms") ? 1 : 1000);
      });
      expect(durationMs).toBeLessThanOrEqual(1);
    });
  });
}

test.describe("email verification (/auth/confirm)", () => {
  test("includes the resend form in the initial response before client JavaScript", async ({request}) => {
    const response = await request.get("/auth/confirm");
    expect(response.ok()).toBe(true);
    expect(await response.text()).toContain('id="verify-resend-email"');
  });

  test("an invalid/expired link has no horizontal overflow at every viewport and offers resend", async ({
    page,
  }) => {
    for (const viewport of A11Y_VIEWPORTS) {
      await setViewport(page, viewport);
      await visitAndStabilize(page, "/auth/confirm", { readyLocator: "main" });
      await expect(
        page.getByRole("heading", { level: 1, name: /this link (has expired|can’t be used)/i }),
      ).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
  });

  test("has no serious/critical axe violations", async ({ page }) => {
    await visitAndStabilize(page, "/auth/confirm", { readyLocator: "main" });
    await assertNoSeriousAccessibilityViolations(page, "email verification (expired link)");
  });

  test("the resend form is keyboard-reachable with a visible focus ring", async ({ page }) => {
    await setViewport(page, A11Y_VIEWPORTS[0]);
    await visitAndStabilize(page, "/auth/confirm", { readyLocator: "main" });
    const sequence = await walkTabOrderAndAssertVisibleFocus(page);
    expect(sequence.some((key) => key.includes("verify-resend-email"))).toBe(true);
  });
});

test.describe("account recovery", () => {
  test("the forgot-password screen has no horizontal overflow at every viewport", async ({
    page,
  }) => {
    for (const viewport of A11Y_VIEWPORTS) {
      await setViewport(page, viewport);
      await visitAndStabilize(page, "/sign-in?mode=forgot", { readyLocator: "main" });
      await expect(
        page.getByRole("heading", { level: 1, name: "Reset your password" }),
      ).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
  });

  test("an empty submit shakes the forgot-password form", async ({ page }) => {
    /* Deliberately not visitAndStabilize(): see the sign-up shake test. */
    await page.goto("/sign-in?mode=forgot", { waitUntil: "domcontentloaded" });
    await page.locator("main").first().waitFor({ state: "visible" });
    await page.getByRole("button", { name: "Send reset link" }).click();
    const form = page.locator("form").filter({ hasText: "Send reset link" });
    /* .first(): Next.js's own hidden route-announcer also carries
       role="alert", unrelated to this page's validation message. */
    await expect(page.getByRole("alert").first()).toBeVisible();
    expect(await form.evaluate((el) => getComputedStyle(el).animationName)).toBe("mm-shake");
  });

  test("/auth/reset (expired link) has no horizontal overflow at every viewport", async ({
    page,
  }) => {
    for (const viewport of A11Y_VIEWPORTS) {
      await setViewport(page, viewport);
      await visitAndStabilize(page, "/auth/reset?error_code=otp_expired", {
        readyLocator: "main",
      });
      await expect(
        page.getByRole("heading", { level: 1, name: /this reset link has expired/i }),
      ).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
  });

  test("/auth/reset (expired link) has no serious/critical axe violations", async ({ page }) => {
    await visitAndStabilize(page, "/auth/reset?error_code=otp_expired", { readyLocator: "main" });
    await assertNoSeriousAccessibilityViolations(page, "account recovery (expired link)");
  });

  test("/auth/reset (normal form) has no horizontal overflow and is keyboard-reachable", async ({
    page,
  }) => {
    await setViewport(page, A11Y_VIEWPORTS[0]);
    await visitAndStabilize(page, "/auth/reset", { readyLocator: "main" });
    await expect(
      page.getByRole("heading", { level: 1, name: "Set a new password" }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await assertNoSeriousAccessibilityViolations(page, "account recovery (set new password)");

    const sequence = await walkTabOrderAndAssertVisibleFocus(page);
    const newPassword = sequence.findIndex((key) => key.includes("new-password"));
    const confirmPassword = sequence.findIndex((key) => key.includes("confirm-password"));
    expect(newPassword).toBeGreaterThanOrEqual(0);
    expect(confirmPassword).toBeGreaterThan(newPassword);
  });
});
