import {expect, test} from "@playwright/test";

import {
  createQualityMonitor,
  expectDialogWithinViewport,
  expectNoHorizontalOverflow,
  expectWithinViewport,
  setViewport,
  startExamSession,
  visitAndStabilize,
} from "./helpers/screen-helpers";

const VIEWPORTS = [
  {name: "desktop", width: 1440, height: 900},
  {name: "tablet", width: 768, height: 1024},
  {name: "mobile", width: 390, height: 844},
] as const;

test.describe("public screen validation", () => {
  test("landing shell stays stable across desktop, tablet and mobile viewports", async ({
    page,
  }) => {
    const qualityMonitor = createQualityMonitor(page);

    for (const viewport of VIEWPORTS) {
      await setViewport(page, viewport);
      await visitAndStabilize(page, "/", {readyLocator: "main"});
      await expect(page.locator("main")).toBeVisible();
      await expect(
        page.getByRole("heading", {level: 1, name: /Smart Practice/i}),
      ).toBeVisible();
      await expect(
        page.getByRole("link", {name: "Log in"}).first(),
      ).toBeVisible();
      await expect(
        page.getByRole("link", {name: "Start Free Practice"}).first(),
      ).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await expectWithinViewport(page, "main h1");
      await expect(
        page.getByRole("link", {name: "Log in"}).first(),
      ).toBeVisible();
    }

    qualityMonitor.assertClean();
  });

  test("practice catalogue and setup shells remain stable without duplicating core flows", async ({
    page,
  }) => {
    const qualityMonitor = createQualityMonitor(page);

    for (const viewport of [VIEWPORTS[0], VIEWPORTS[2]]) {
      await setViewport(page, viewport);
      await visitAndStabilize(page, "/practice", {readyLocator: "main"});
      await expect(
        page.getByRole("heading", {level: 1, name: /Practice with purpose/i}),
      ).toBeVisible();
      await expect(
        page.getByRole("link", {name: /Mixed practice/i}),
      ).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await expectWithinViewport(page, "main h1");
      await expectWithinViewport(page, 'main a[href^="/practice/"]');
    }

    await setViewport(page, VIEWPORTS[0]);
    await visitAndStabilize(
      page,
      "/practice/mixed-practice?seed=screen-validation",
      {
        readyLocator: "main",
      },
    );
    await expect(
      page.getByRole("heading", {name: "Set up an exam"}),
    ).toBeVisible();
    await expect(page.getByTestId("start-exam")).toBeVisible();
    await expect(page.getByTestId("select-year-level")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectWithinViewport(page, "main h1");
    await expectWithinViewport(page, '[data-testid="start-exam"]');

    qualityMonitor.assertClean();
  });

  test("legal and showcase screens expose a stable shell", async ({page}) => {
    const qualityMonitor = createQualityMonitor(page);

    await setViewport(page, VIEWPORTS[0]);
    await visitAndStabilize(page, "/privacy", {readyLocator: "main"});
    await expect(
      page.getByRole("heading", {level: 1, name: "Privacy Policy"}),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await visitAndStabilize(page, "/showcase", {readyLocator: "main"});
    await expect(
      page.getByRole("heading", {level: 2, name: "Question renderers"}),
    ).toBeVisible();
    await expect(page.locator("[data-question-type]").first()).toBeVisible();
    await expectNoHorizontalOverflow(page);

    qualityMonitor.assertClean();
  });

  test("exam, submission dialog and results shells remain stable", async ({
    page,
  }) => {
    const qualityMonitor = createQualityMonitor(page);

    await setViewport(page, VIEWPORTS[0]);
    await startExamSession(page, {
      path: "/practice/mixed-practice?seed=screen-validation",
      yearLevel: "3",
      examStyle: "naplan_style",
      subject: "numeracy",
      questionCount: "10",
      timing: "untimed",
    });
    await expect(
      page.getByRole("heading", {name: /^Question 1 of/}),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.getByTestId("open-submit-dialog").click();
    await expectDialogWithinViewport(page, "submit-dialog");
    await page.getByTestId("return-to-exam").click();
    await page.getByTestId("open-submit-dialog").click();
    await page.getByTestId("confirm-submit").click();
    await expect(page).toHaveURL(/\/results/);
    await expect(
      page.getByRole("heading", {level: 1, name: "Your results"}),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);

    qualityMonitor.assertClean();
  });
});
