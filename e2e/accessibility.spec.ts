import { expect, test } from "@playwright/test";

import { assertNoSeriousAccessibilityViolations } from "./accessibility";

async function configureExam(
  page: import("@playwright/test").Page,
  options: {
    yearLevel: string;
    examStyle: string;
    subject: string;
    questionCount: string;
    timing: string;
  },
) {
  await page.getByTestId("select-year-level").selectOption(options.yearLevel);
  await page.getByTestId("select-exam-style").selectOption(options.examStyle);
  await page.getByTestId("select-subject").selectOption(options.subject);
  await page.getByTestId("select-question-count").selectOption(options.questionCount);
  await page.getByTestId("select-timing").selectOption(options.timing);
}

test.describe("automated accessibility scans", () => {
  test("setup / home page has no serious or critical violations", async ({ page }) => {
    await page.goto("/?seed=e2e-a11y-scan");
    await expect(page.getByTestId("start-exam")).toBeVisible();
    await assertNoSeriousAccessibilityViolations(page, "setup/home page");
  });

  test("in-progress exam page has no serious or critical violations", async ({ page }) => {
    await page.goto("/?seed=e2e-a11y-scan");
    await configureExam(page, {
      yearLevel: "3",
      examStyle: "naplan_style",
      subject: "numeracy",
      questionCount: "10",
      timing: "untimed",
    });
    await page.getByTestId("start-exam").click();
    await expect(page).toHaveURL(/\/exam/);
    /*
     * Client-side navigation to /exam is retried in the background for up
     * to ~2.4s after the URL updates (see use-bounded-navigation.ts) as a
     * guard against a router-push flake on this host. Scanning immediately
     * on URL match can race one of those retries and tear down the frame
     * mid-injection, hanging the Axe scan for the rest of the test timeout.
     * Waiting for the question heading — the same exam-ready signal every
     * other e2e spec waits on before interacting — guarantees the retry
     * loop has already stopped (the setup page has unmounted) and the DOM
     * is stable before Axe runs.
     */
    await expect(page.getByRole("heading", { name: /^Question 1 of/ })).toBeVisible();
    await assertNoSeriousAccessibilityViolations(page, "in-progress exam page");
  });

  test("the open submission dialog has no serious or critical violations", async ({
    page,
  }) => {
    await page.goto("/?seed=e2e-a11y-scan");
    await configureExam(page, {
      yearLevel: "3",
      examStyle: "naplan_style",
      subject: "numeracy",
      questionCount: "10",
      timing: "untimed",
    });
    await page.getByTestId("start-exam").click();
    await expect(page).toHaveURL(/\/exam/);
    await page.getByTestId("open-submit-dialog").click();
    await expect(page.getByTestId("submit-dialog")).toBeVisible();
    await assertNoSeriousAccessibilityViolations(page, "open submission dialog");
  });

  test("results and question-review pages have no serious or critical violations", async ({
    page,
  }) => {
    await page.goto("/?seed=e2e-a11y-scan");
    await configureExam(page, {
      yearLevel: "3",
      examStyle: "naplan_style",
      subject: "numeracy",
      questionCount: "10",
      timing: "untimed",
    });
    await page.getByTestId("start-exam").click();
    await expect(page).toHaveURL(/\/exam/);
    await page.getByTestId("flag-toggle").click();
    await page.getByTestId("open-submit-dialog").click();
    await page.getByTestId("confirm-submit").click();
    await expect(page).toHaveURL(/\/results/);
    await assertNoSeriousAccessibilityViolations(page, "results page");

    /* The question-review section (flagged-only view) renders additional
       content — correct answers, explanations — worth scanning in its
       own right. */
    await page.getByTestId("toggle-flagged-only").click();
    await expect(page.getByTestId("review-question-1")).toBeVisible();
    await assertNoSeriousAccessibilityViolations(page, "question review section");
  });
});
