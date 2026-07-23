import { expect, test } from "@playwright/test";

import { assertNoSeriousAccessibilityViolations } from "./accessibility";
import {
  A11Y_VIEWPORTS,
  expectMinimumTouchTargets,
  expectNoHorizontalOverflow,
  setViewport,
  startExamSession,
  walkTabOrderAndAssertVisibleFocus,
} from "./helpers/screen-helpers";

async function reachFlaggedResults(page: import("@playwright/test").Page): Promise<void> {
  await startExamSession(page, {
    path: "/practice/mixed-practice?seed=a11y-results-review",
    yearLevel: "3",
    examStyle: "naplan_style",
    subject: "numeracy",
    questionCount: "10",
    timing: "untimed",
  });
  await expect(page.getByRole("heading", { name: /^Question 1 of/ })).toBeVisible();
  await page.getByTestId("flag-toggle").click();
  await page.getByTestId("open-submit-dialog").click();
  await page.getByTestId("confirm-submit").click();
  await expect(page).toHaveURL(/\/results/);
}

test.describe("results and question review: accessibility and responsive layout", () => {
  test("results page has no serious/critical axe violations at every viewport", async ({
    page,
  }) => {
    // A full exam session plus 3 viewport-scoped axe scans of a dense
    // results page exceeds the default 30s test timeout even without host
    // contention.
    test.setTimeout(90_000);
    await reachFlaggedResults(page);

    for (const viewport of A11Y_VIEWPORTS) {
      await setViewport(page, viewport);
      await expect(page.getByRole("heading", { level: 1, name: "Your results" })).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await expectMinimumTouchTargets(page, "main button, main a[href]");
      await assertNoSeriousAccessibilityViolations(page, `results page (${viewport.name})`);
    }
  });

  test("flagged-only question review has no serious/critical axe violations at every viewport", async ({
    page,
  }) => {
    await reachFlaggedResults(page);
    await page.getByTestId("toggle-flagged-only").click();
    await expect(page.getByTestId("review-question-1")).toBeVisible();

    for (const viewport of A11Y_VIEWPORTS) {
      await setViewport(page, viewport);
      await expectNoHorizontalOverflow(page);
      await expectMinimumTouchTargets(page, "main button, main a[href]");
      await assertNoSeriousAccessibilityViolations(page, `question review (${viewport.name})`);
    }
  });

  test("wide breakdown tables scroll within their own container, not the page", async ({
    page,
  }) => {
    await reachFlaggedResults(page);
    await setViewport(page, A11Y_VIEWPORTS[0]);
    await expect(page.getByRole("heading", { name: "Where your marks came from" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("keyboard walkthrough of the results page has visible focus throughout, in order", async ({
    page,
  }) => {
    await reachFlaggedResults(page);
    await setViewport(page, A11Y_VIEWPORTS[0]);

    const sequence = await walkTabOrderAndAssertVisibleFocus(page, { maxSteps: 100 });
    const toggleIndex = sequence.indexOf("toggle-flagged-only");
    const printIndex = sequence.findIndex((key) => key.includes("Print results"));

    expect(toggleIndex).toBeGreaterThanOrEqual(0);
    expect(printIndex).toBeGreaterThan(toggleIndex);
  });
});
