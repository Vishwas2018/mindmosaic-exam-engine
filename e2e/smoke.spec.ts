import { expect, test } from "@playwright/test";

test("home page presents the exam setup panel", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: "MindMosaic home" })).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, name: /Practice with purpose/i }),
  ).toBeVisible();

  await expect(page.getByRole("heading", { name: "Set up an exam" })).toBeVisible();
  await expect(page.getByTestId("eligible-count")).toBeVisible();
  await expect(page.getByTestId("start-exam")).toBeEnabled();

  /* Visiting the exam page without a session shows a friendly empty state. */
  await page.goto("/exam");
  await expect(page.getByRole("heading", { name: "No exam in progress" })).toBeVisible();

  /* Same for results. */
  await page.goto("/results");
  await expect(
    page.getByRole("heading", { name: "No results to show yet" }),
  ).toBeVisible();
});

test("every route has a distinct, non-revealing page title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("MindMosaic | Thoughtful practice, real progress");

  await page.goto("/exam");
  await expect(page).toHaveTitle("Exam in progress | MindMosaic");

  await page.goto("/results");
  await expect(page).toHaveTitle("Your results | MindMosaic");

  await page.goto("/showcase");
  await expect(page).toHaveTitle("Renderer showcase | MindMosaic");

  const titles = new Set([
    "MindMosaic | Thoughtful practice, real progress",
    "Exam in progress | MindMosaic",
    "Your results | MindMosaic",
    "Renderer showcase | MindMosaic",
  ]);
  expect(titles.size).toBe(4);
});
