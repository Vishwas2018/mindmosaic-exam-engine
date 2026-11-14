/**
 * Content governance on the hosted DEV Preview: a deployed build serves approved items only (exam-bank
 * deployedGateFallback). Programmes approved content cannot fill are withdrawn, not shown with "0 questions".
 * The expected counts come from the repository's own approval records (36 + 41 NAPLAN numeracy).
 */
import { expect, test } from "./fixtures";

test("G: only approved programmes are offered, with approved counts", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  await page.goto("/practice");
  const main = page.getByRole("main");
  await expect(main.getByRole("heading", { level: 3, name: /NAPLAN-style Numeracy — Grade 3/ })).toBeVisible();
  await expect(main.getByRole("heading", { level: 3, name: /NAPLAN-style Numeracy — Grade 5/ })).toBeVisible();
  for (const withdrawn of [/Reading — Grade/, /Language Conventions — Grade/, /ICAS-style/]) {
    await expect(main.getByRole("heading", { level: 3, name: withdrawn }), `${withdrawn} withdrawn`).toHaveCount(0);
  }
  await page.screenshot({ path: testInfo.outputPath("g-practice-catalogue.png"), fullPage: true });

  await page.goto("/practice/naplan-g3-numeracy");
  await expect(main).toContainText(/36 matching questions available/);
  await page.goto("/practice/naplan-g5-numeracy");
  await expect(main).toContainText(/41 matching questions available/);

  const withdrawn = await page.goto("/practice/naplan-g3-reading");
  expect(withdrawn?.status(), "a withdrawn programme is not served").toBe(404);
});
