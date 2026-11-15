import { expect, test } from "../fixtures/auth.fixture";
import { assertNoSeriousAccessibilityViolations } from "../accessibility";
import {
  A11Y_VIEWPORTS,
  expectMinimumTouchTargets,
  expectNoHorizontalOverflow,
  setViewport,
  visitAndStabilize,
} from "../helpers/screen-helpers";

/*
 * First visit to My Space (Claude Design student artboards 04–05). The design has no first-run modal: a new
 * student lands straight on their own page, which says nothing is marked yet and points at one practice set.
 */
test.describe("student first visit", () => {
  test("a fresh student lands on the first-visit My Space with no blocking dialog", async ({ contextAs }) => {
    const context = await contextAs("student-second-child");
    const page = await context.newPage();
    for (const viewport of A11Y_VIEWPORTS) {
      await setViewport(page, viewport);
      await visitAndStabilize(page, "/student", { readyLocator: "main" });
      await expect(page.locator("dialog[open]")).toHaveCount(0);
      await expect(page.getByText("First visit")).toBeVisible();
      await expect(page.getByRole("heading", { level: 1, name: /^Welcome/ })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Your first practice set" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Start practice" })).toHaveAttribute("href", "/student/practice");
      await expectNoHorizontalOverflow(page);
      await expectMinimumTouchTargets(page, "main a[href], main button");
    }
    await assertNoSeriousAccessibilityViolations(page, "student first visit");
  });

  test("a returning student sees their results, not the first-visit welcome", async ({ contextAs }) => {
    const context = await contextAs("student-completed-attempt");
    const page = await context.newPage();
    await setViewport(page, A11Y_VIEWPORTS[0]);
    await visitAndStabilize(page, "/student", { readyLocator: "main" });
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1, name: /Welcome back/i })).toBeVisible();
    await expect(page.getByText("First visit")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Recent results" })).toBeVisible();
  });
});
