import { expect, test } from "@playwright/test";

test("marketing home page (site root) presents the landing content", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: "MindMosaic home" })).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, name: /Know exactly what/i }),
  ).toBeVisible();

  /* Both real CTAs are wired off the marketing root, not the old "/". */
  await expect(page.getByRole("link", { name: "Sign in" }).first()).toHaveAttribute(
    "href",
    "/sign-in",
  );
  await expect(
    page.getByRole("link", { name: "Try a free session" }).first(),
  ).toHaveAttribute("href", "/practice");
});

test("guest can reach the practice setup panel unauthenticated", async ({ page }) => {
  await page.goto("/practice");

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
  await expect(page).toHaveTitle(
    "Original NAPLAN-style & ICAS-style practice for Grades 3 and 5",
  );

  await page.goto("/practice");
  await expect(page).toHaveTitle("Practice setup | MindMosaic");

  await page.goto("/exam");
  await expect(page).toHaveTitle("Exam in progress | MindMosaic");

  await page.goto("/results");
  await expect(page).toHaveTitle("Your results | MindMosaic");

  await page.goto("/showcase");
  await expect(page).toHaveTitle("Renderer showcase | MindMosaic");

  await page.goto("/sign-in");
  await expect(page).toHaveTitle("Sign in | MindMosaic");

  await page.goto("/sign-up");
  await expect(page).toHaveTitle("Sign up | MindMosaic");

  const titles = new Set([
    "Original NAPLAN-style & ICAS-style practice for Grades 3 and 5",
    "Practice setup | MindMosaic",
    "Exam in progress | MindMosaic",
    "Your results | MindMosaic",
    "Renderer showcase | MindMosaic",
    "Sign in | MindMosaic",
    "Sign up | MindMosaic",
  ]);
  expect(titles.size).toBe(7);
});
