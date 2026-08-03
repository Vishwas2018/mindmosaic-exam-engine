import { expect, test } from "@playwright/test";

test("marketing home page (site root) presents the landing content", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: "MindMosaic home" })).toBeVisible();
  /* The hero headline and the page title below both moved away from the
     mockup's "Smart Practice, Bright Futures" to a descriptive claim, as a
     deliberate honesty fix — see src/features/landing/content.ts, which
     records the mockup wording as a *reference* entry, not shipped copy. */
  await expect(
    page.getByRole("heading", { level: 1, name: /Original NAPLAN & ICAS-style practice/i }),
  ).toBeVisible();

  /* Both real CTAs are wired off the marketing root, not the old "/". */
  await expect(page.getByRole("link", { name: "Log in" }).first()).toHaveAttribute(
    "href",
    "/sign-in",
  );
  await expect(
    page.getByRole("link", { name: "Start free" }).first(),
  ).toHaveAttribute("href", "/practice");
});

test("guest can browse the practice catalogue and open a program unauthenticated", async ({
  page,
}) => {
  await page.goto("/practice");

  await expect(page.getByRole("link", { name: "MindMosaic home" })).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, name: /Choose the right practice for today/i }),
  ).toBeVisible();

  /* A live program card is a real link, a planned card is not. */
  await expect(
    page.getByRole("link", { name: /NAPLAN-style Numeracy — Grade 3/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Australian Maths Competition/i }),
  ).toHaveCount(0);
  await expect(page.getByText("Australian Maths Competition")).toBeVisible();

  /* Follows the unscoped "Build your own practice" pathway: it is the one
     program that renders the configurator with nothing pinned. Every setup
     page is titled after its own program (see
     src/app/practice/[program]/page.tsx), which is what this asserts —
     "Set up an exam" used to be asserted here and is a link label on /exam
     and /results, never a heading on this route. */
  await page.getByTestId("build-your-own-cta").click();
  await expect(page).toHaveURL("/practice/mixed-practice");
  await expect(
    page.getByRole("heading", { level: 1, name: "Build your own practice" }),
  ).toBeVisible();
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
  await expect(page).toHaveTitle("Original NAPLAN & ICAS-style Practice | MindMosaic");

  await page.goto("/practice");
  await expect(page).toHaveTitle("Practice programs | MindMosaic");

  await page.goto("/practice/mixed-practice");
  await expect(page).toHaveTitle("Build your own practice | MindMosaic");

  await page.goto("/exam");
  await expect(page).toHaveTitle("Exam in progress | MindMosaic");

  await page.goto("/results");
  await expect(page).toHaveTitle("Your results | MindMosaic");

  await page.goto("/showcase");
  await expect(page).toHaveTitle("Renderer showcase | MindMosaic");

  await page.goto("/sign-in");
  await expect(page).toHaveTitle("Sign in | MindMosaic");

  /* Public sign-up is closed (src/features/auth/signup-policy.ts), so this
     route is a closed-state page rather than a form — its title says so. */
  await page.goto("/sign-up");
  await expect(page).toHaveTitle("Sign-up closed | MindMosaic");

  const titles = new Set([
    "Original NAPLAN & ICAS-style Practice | MindMosaic",
    "Practice programs | MindMosaic",
    "Build your own practice | MindMosaic",
    "Exam in progress | MindMosaic",
    "Your results | MindMosaic",
    "Renderer showcase | MindMosaic",
    "Sign in | MindMosaic",
    "Sign-up closed | MindMosaic",
  ]);
  expect(titles.size).toBe(8);
});
