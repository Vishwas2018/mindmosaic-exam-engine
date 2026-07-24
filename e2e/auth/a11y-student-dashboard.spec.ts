import { expect, test } from "../fixtures/auth.fixture";
import { assertNoSeriousAccessibilityViolations } from "../accessibility";
import {
  A11Y_VIEWPORTS,
  expectMinimumTouchTargets,
  expectNoHorizontalOverflow,
  setViewport,
  visitAndStabilize,
  walkTabOrderAndAssertVisibleFocus,
} from "../helpers/screen-helpers";

const STUDENT_PAGES = [
  { path: "/student", heading: /do you want to study today\?/i },
  { path: "/student/learn", heading: /Learning hub/i },
  { path: "/student/assignments", heading: null },
  { path: "/student/engagement", heading: null },
] as const;

test.describe("student dashboard: accessibility and responsive layout", () => {
  for (const { path, heading } of STUDENT_PAGES) {
    test(`${path} (no attempts yet) has no violations at every viewport`, async ({
      contextAs,
    }) => {
      const context = await contextAs("student-no-attempts");
      const page = await context.newPage();

      for (const viewport of A11Y_VIEWPORTS) {
        await setViewport(page, viewport);
        await visitAndStabilize(page, path, { readyLocator: "main" });
        if (heading) {
          await expect(page.getByRole("heading", { name: heading })).toBeVisible();
        }
        await expectNoHorizontalOverflow(page);
        await expectMinimumTouchTargets(page, "main button, main a[href], main input, main select");
        await assertNoSeriousAccessibilityViolations(page, `${path}, no attempts (${viewport.name})`);
      }
    });

    test(`${path} (completed attempt) has no violations at every viewport`, async ({
      contextAs,
    }) => {
      const context = await contextAs("student-completed-attempt");
      const page = await context.newPage();

      for (const viewport of A11Y_VIEWPORTS) {
        await setViewport(page, viewport);
        await visitAndStabilize(page, path, { readyLocator: "main" });
        await expectNoHorizontalOverflow(page);
        await expectMinimumTouchTargets(page, "main button, main a[href], main input, main select");
        await assertNoSeriousAccessibilityViolations(
          page,
          `${path}, completed attempt (${viewport.name})`,
        );
      }
    });
  }

  test("student home shows recent sessions and the nav for a student with a completed attempt", async ({
    contextAs,
  }) => {
    const context = await contextAs("student-completed-attempt");
    const page = await context.newPage();
    await setViewport(page, A11Y_VIEWPORTS[0]);
    await visitAndStabilize(page, "/student", { readyLocator: "main" });
    await expect(page.getByText("Recent sessions")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("assignments tabs remain accessible after switching tabs", async ({ contextAs }) => {
    const context = await contextAs("student-no-attempts");
    const page = await context.newPage();
    await setViewport(page, A11Y_VIEWPORTS[0]);
    await visitAndStabilize(page, "/student/assignments", { readyLocator: "main" });

    const tabs = page.getByRole("tab");
    const tabCount = await tabs.count();
    if (tabCount > 0) {
      await tabs.nth(1).click();
      await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
      await expectNoHorizontalOverflow(page);
      await assertNoSeriousAccessibilityViolations(page, "student assignments, after tab switch");
      await expectMinimumTouchTargets(page, '[role="tab"]');
    }
  });

  test("mobile nav disclosure reaches every destination with visible focus, in order", async ({
    contextAs,
  }) => {
    const context = await contextAs("student-completed-attempt");
    const page = await context.newPage();
    await setViewport(page, A11Y_VIEWPORTS[0]);
    await visitAndStabilize(page, "/student", { readyLocator: "main" });

    // StudentShell's full nav is `hidden md:flex` — below md it lives behind
    // this disclosure, so a mobile keyboard user must be able to reach it.
    const toggle = page.getByRole("button", { name: "Open menu" });
    await expect(toggle).toBeVisible();
    await expectMinimumTouchTargets(page, "header button");
    await toggle.focus();
    await page.keyboard.press("Enter");
    const panel = page.getByRole("navigation", { name: "Student navigation" });
    await expect(panel).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await assertNoSeriousAccessibilityViolations(page, "student home, mobile nav open");

    const sequence = await walkTabOrderAndAssertVisibleFocus(page);
    const dashboardIndex = sequence.findIndex((key) => key.includes("Dashboard"));
    const learnIndex = sequence.findIndex((key) => key.includes("Learn"));
    const assignmentsIndex = sequence.findIndex((key) => key.includes("Assignments"));
    const progressIndex = sequence.findIndex((key) => key.includes("Progress"));

    expect(dashboardIndex).toBeGreaterThanOrEqual(0);
    expect(learnIndex).toBeGreaterThan(dashboardIndex);
    expect(assignmentsIndex).toBeGreaterThan(learnIndex);
    expect(progressIndex).toBeGreaterThan(assignmentsIndex);
  });

  test("keyboard walkthrough of the student nav and home page has visible focus throughout, in order (desktop)", async ({
    contextAs,
  }) => {
    const context = await contextAs("student-completed-attempt");
    const page = await context.newPage();
    await setViewport(page, A11Y_VIEWPORTS[2]);
    await visitAndStabilize(page, "/student", { readyLocator: "main" });

    const sequence = await walkTabOrderAndAssertVisibleFocus(page);
    const dashboardIndex = sequence.findIndex((key) => key.includes("Dashboard"));
    const learnIndex = sequence.findIndex((key) => key.includes("Learn"));
    const assignmentsIndex = sequence.findIndex((key) => key.includes("Assignments"));
    const progressIndex = sequence.findIndex((key) => key.includes("Progress"));

    expect(dashboardIndex).toBeGreaterThanOrEqual(0);
    expect(learnIndex).toBeGreaterThan(dashboardIndex);
    expect(assignmentsIndex).toBeGreaterThan(learnIndex);
    expect(progressIndex).toBeGreaterThan(assignmentsIndex);
  });
});
