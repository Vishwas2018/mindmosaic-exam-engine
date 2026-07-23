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

test.describe("parent dashboard: accessibility and responsive layout", () => {
  test("empty state (parent with no children) has no violations at every viewport", async ({
    contextAs,
  }) => {
    const context = await contextAs("parent-no-children");
    const page = await context.newPage();

    for (const viewport of A11Y_VIEWPORTS) {
      await setViewport(page, viewport);
      await visitAndStabilize(page, "/parent", { readyLocator: "main" });
      await expect(
        page.getByRole("heading", { name: "No children linked to your account yet" }),
      ).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await expectMinimumTouchTargets(page, "main button, main a[href], main input, main select");
      await assertNoSeriousAccessibilityViolations(page, `parent dashboard, no children (${viewport.name})`);
    }
  });

  test("single-child dashboard has no violations at every viewport", async ({ contextAs }) => {
    const context = await contextAs("parent-one-child");
    const page = await context.newPage();

    for (const viewport of A11Y_VIEWPORTS) {
      await setViewport(page, viewport);
      await visitAndStabilize(page, "/parent", { readyLocator: "main" });
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      // Single child: the child-switcher tablist must not render.
      await expect(page.getByRole("tablist", { name: "Choose a child" })).toHaveCount(0);
      await expectNoHorizontalOverflow(page);
      await expectMinimumTouchTargets(page, "main button, main a[href], main input, main select");
      await assertNoSeriousAccessibilityViolations(page, `parent dashboard, one child (${viewport.name})`);
    }
  });

  test("multi-child dashboard (with child switcher) has no violations at every viewport", async ({
    contextAs,
  }) => {
    const context = await contextAs("parent-multi-children");
    const page = await context.newPage();

    for (const viewport of A11Y_VIEWPORTS) {
      await setViewport(page, viewport);
      await visitAndStabilize(page, "/parent", { readyLocator: "main" });
      const tabs = page.getByRole("tablist", { name: "Choose a child" });
      await expect(tabs).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await expectMinimumTouchTargets(page, 'main [role="tab"], main button, main a[href], main input, main select');
      await assertNoSeriousAccessibilityViolations(page, `parent dashboard, multi child (${viewport.name})`);
    }

    // Switching the active child must not introduce new violations.
    await setViewport(page, A11Y_VIEWPORTS[0]);
    const secondTab = page.getByRole("tab").nth(1);
    await secondTab.click();
    await expect(secondTab).toHaveAttribute("aria-selected", "true");
    await expectNoHorizontalOverflow(page);
    await assertNoSeriousAccessibilityViolations(page, "parent dashboard, after switching child");
  });

  test("keyboard walkthrough reaches the child switcher and add-child form in order, with visible focus", async ({
    contextAs,
  }) => {
    const context = await contextAs("parent-multi-children");
    const page = await context.newPage();
    await setViewport(page, A11Y_VIEWPORTS[0]);
    await visitAndStabilize(page, "/parent", { readyLocator: "main" });
    await expect(page.getByRole("tablist", { name: "Choose a child" })).toBeVisible();

    const sequence = await walkTabOrderAndAssertVisibleFocus(page);
    const firstTabIndex = sequence.findIndex((key) => key.includes("BUTTON"));
    const nameFieldIndex = sequence.indexOf("add-child-name");

    expect(firstTabIndex).toBeGreaterThanOrEqual(0);
    expect(nameFieldIndex).toBeGreaterThan(firstTabIndex);
  });

  test("add-child form is accessible at every viewport", async ({ contextAs }) => {
    const context = await contextAs("parent-one-child");
    const page = await context.newPage();

    for (const viewport of A11Y_VIEWPORTS) {
      await setViewport(page, viewport);
      await visitAndStabilize(page, "/parent", { readyLocator: "main" });
      await expect(page.getByRole("heading", { name: "Add a child" })).toBeVisible();
      await expect(page.getByLabel("Child's name")).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await expectMinimumTouchTargets(page, "main button, main a[href], main input, main select");
    }
  });
});
