import { expect, test } from "@playwright/test";
import { PUBLIC_SIGNUP_ENABLED } from "../src/features/auth/signup-policy";

/*
 * The landing page was rebuilt from the approved design-canvas file
 * "MindMosaic Landing.dc.html" (see src/features/landing/content.ts). The
 * header now carries seven real destinations rather than same-page
 * anchors, so these cases check the routes resolve, the interactive
 * sections work in a real browser, and the honesty guarantees that must
 * survive every redesign still hold.
 */

/** Every header link, and the route it must reach. */
const HEADER_LINKS: ReadonlyArray<readonly [label: string, href: string]> = [
  ["Learn", "/learn"],
  ["Practice", "/assessments"],
  ["Exam Preparation", "/exam-preparation"],
  ["How It Works", "/methodology"],
  ["Plans", "/pricing"],
  ["Resources", "/resources"],
  ["About", "/about"],
];

test.describe("landing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("every header link reaches a real page, not a 404", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Primary" });
    for (const [label, href] of HEADER_LINKS) {
      const link = nav.getByRole("link", { name: label, exact: true });
      await expect(link).toHaveAttribute("href", href);
      const response = await page.request.get(href);
      expect(response.ok(), `${href} should resolve, not 404`).toBeTruthy();
    }
  });

  test("the header CTA reads 'Start free' and links to the primary entry route", async ({ page }) => {
    const cta = page.getByRole("banner").getByRole("link", { name: "Start free", exact: true });
    await expect(cta).toHaveAttribute("href", PUBLIC_SIGNUP_ENABLED ? "/sign-up" : "/practice");
  });

  test("the hero states the three-line promise and both CTAs", async ({ page }) => {
    const hero = page.getByRole("heading", { level: 1 });
    await expect(hero).toContainText("Learn with purpose.");
    await expect(hero).toContainText("Be ready for every challenge.");
    await expect(page.getByRole("link", { name: "Explore practice" }).first()).toBeVisible();
  });

  test("the independence disclaimer is on the page, near the top", async ({ page }) => {
    await expect(page.getByText(/MindMosaic is an independent learning platform/).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Assessment Disclaimer" }).first()).toHaveAttribute(
      "href",
      "/assessment-disclaimer",
    );
  });

  test("programme coverage is honest: an uncovered year says so in words", async ({ page }) => {
    await page.getByRole("button", { name: "Year 1", exact: true }).click();

    const tablist = page.getByRole("tablist", { name: "Programmes" });
    const naplan = tablist.getByRole("tab", { name: /NAPLAN-style/ });
    await expect(naplan).toContainText("Unavailable");

    await naplan.click();
    await expect(page.getByText(/Not available for Year 1/)).toBeVisible();
  });

  test("the selective-entry programme asks which state, because the format varies", async ({ page }) => {
    await page
      .getByRole("tablist", { name: "Programmes" })
      .getByRole("tab", { name: /Selective school entry-style/ })
      .click();
    await expect(page.getByRole("group", { name: "State or territory" })).toBeVisible();
  });

  test("the showcase switches between the four real views", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Good afternoon, Mia." })).toBeVisible();
    await page.getByRole("tab", { name: "Concept Lesson" }).click();
    await expect(page.getByRole("heading", { name: "Fractions on a Number Line" })).toBeVisible();
    await page.getByRole("tab", { name: "Practice & Feedback" }).click();
    await expect(page.getByText("Which fraction is equivalent to 3/4?")).toBeVisible();
    await page.getByRole("tab", { name: "Parent Insights" }).click();
    await expect(page.getByRole("heading", { name: "Parent Insights" })).toBeVisible();
  });

  test("every figure in the showcase is labelled illustrative", async ({ page }) => {
    await expect(page.getByText(/All names, scores and dates shown are illustrative/)).toBeVisible();
  });

  test("the question-type tabs swap the worked example", async ({ page }) => {
    await expect(page.getByText(/the numbers that are multiples of 6\./).first()).toBeVisible();
    await page.getByRole("tab", { name: "Enter", exact: true }).click();
    await expect(page.getByText(/A netball club sells 148 tickets/)).toBeVisible();
  });

  test("the FAQ opens and closes on activation", async ({ page }) => {
    const first = page.getByText("Which year levels are supported?");
    await first.click();
    await expect(page.getByText(/built for Years 1 to 12/)).toBeVisible();
    await first.click();
    await expect(page.getByText(/built for Years 1 to 12/)).toBeHidden();
  });

  test("plans offer no checkout while the Family plan is on the roadmap", async ({ page }) => {
    const plans = page.locator("#plans");
    await expect(plans.getByRole("link", { name: "Subscribe to Family" })).toHaveCount(0);
    await expect(plans.getByRole("link", { name: "Choose the yearly plan" })).toHaveCount(0);
    await expect(plans.locator('a[href="/billing"]')).toHaveCount(0);
    await expect(plans.getByRole("link", { name: "Register interest" }).first()).toHaveAttribute(
      "href",
      "/contact",
    );
  });

  test("evidence stays a labelled placeholder, never invented social proof", async ({ page }) => {
    await expect(page.getByText("Placeholder — family feedback")).toBeVisible();
    await expect(page.getByText("Placeholder — platform figures")).toBeVisible();
    await expect(page.getByText(/We will publish evidence when we have it/)).toBeVisible();
  });

  test("four quality pillars are visible and accurately framed", async ({ page }) => {
    await expect(page.getByText("Mapped to the Victorian Curriculum (Levels 3 & 5)")).toBeVisible();
    await expect(page.getByText("Checked before children see it")).toBeVisible();
    await expect(page.getByText("A worked explanation for every question").first()).toBeVisible();
    await expect(page.getByText("Calm & accessible by design")).toBeVisible();
  });

  test("the footer wires every column to a real route", async ({ page }) => {
    for (const [column, label, href] of [
      ["Platform", "Learn", "/learn"],
      ["Programmes", "NAPLAN-style", "/exam-preparation"],
      ["Resources", "Help Centre", "/help"],
      ["Company and legal", "Assessment Disclaimer", "/assessment-disclaimer"],
    ] as const) {
      const nav = page.getByRole("navigation", { name: column });
      const link = nav.getByRole("link", { name: label, exact: true });
      await expect(link).toHaveAttribute("href", href);
      const response = await page.request.get(href);
      expect(response.ok(), `${href} should resolve, not 404`).toBeTruthy();
    }
  });

  test("sign-up affordances match the current public signup policy", async ({ page }) => {
    const count = await page.locator('a[href="/sign-up"]').count();
    if (PUBLIC_SIGNUP_ENABLED) {
      expect(count).toBeGreaterThan(0);
    } else {
      expect(count).toBe(0);
    }
  });
});
