import { expect, test } from "@playwright/test";

/*
 * The landing page was rebuilt from the approved design-canvas file
 * "MindMosaic Landing.dc.html" (see src/features/landing/content.ts). The
 * header now carries seven real destinations rather than same-page
 * anchors, so these cases check the routes resolve, the three interactive
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
  ["Resources", "/help"],
  ["About", "/about"],
];

test.describe("landing page", () => {
  test("every header link reaches a real page, not a 404", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary" });
    for (const [label, href] of HEADER_LINKS) {
      const link = nav.getByRole("link", { name: label, exact: true });
      await expect(link).toHaveAttribute("href", href);
      const response = await page.request.get(href);
      expect(response.ok(), `${href} should resolve, not 404`).toBeTruthy();
    }
  });

  /*
   * The design's CTA points at /signup. Public sign-up is closed, so
   * "Start free" has to mean guest practice — the one thing this product
   * offers without an account.
   */
  test("the header CTA reads 'Start free' and links to guest practice", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByRole("banner").getByRole("link", { name: "Start free", exact: true });
    await expect(cta).toHaveAttribute("href", "/practice");
  });

  test("the hero states the three-line promise and both CTAs", async ({ page }) => {
    await page.goto("/");
    const hero = page.getByRole("heading", { level: 1 });
    await expect(hero).toContainText("Learn with purpose.");
    await expect(hero).toContainText("Be ready for every challenge.");
    await expect(page.getByRole("link", { name: "Explore practice" }).first()).toBeVisible();
  });

  test("the independence disclaimer is on the page, near the top", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/MindMosaic is an independent learning platform/).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Assessment Disclaimer" }).first()).toHaveAttribute(
      "href",
      "/assessment-disclaimer",
    );
  });

  test("programme coverage is honest: an uncovered year says so in words", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Year 1", exact: true }).click();

    const tablist = page.getByRole("tablist", { name: "Programmes" });
    const naplan = tablist.getByRole("tab", { name: /NAPLAN-style/ });
    await expect(naplan).toContainText("Unavailable");

    await naplan.click();
    await expect(page.getByText(/Not available for Year 1/)).toBeVisible();
  });

  test("the selective-entry programme asks which state, because the format varies", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("tablist", { name: "Programmes" })
      .getByRole("tab", { name: /Selective school entry-style/ })
      .click();
    await expect(page.getByRole("group", { name: "State or territory" })).toBeVisible();
  });

  test("the showcase switches between the nine illustrative views", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Good afternoon, Mia." })).toBeVisible();
    await page.getByRole("tab", { name: "Exam simulation" }).click();
    await expect(page.getByText(/Exam simulation · NAPLAN-style numeracy/)).toBeVisible();
    await page.getByRole("tab", { name: "Parent view" }).click();
    await expect(page.getByRole("heading", { name: "Your family this fortnight" })).toBeVisible();
  });

  test("every figure in the showcase is labelled illustrative", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/All names, scores and dates shown are illustrative/)).toBeVisible();
  });

  test("the question-type tabs swap the worked example", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/the numbers that are multiples of 6\./).first()).toBeVisible();
    await page.getByRole("tab", { name: "Enter", exact: true }).click();
    await expect(page.getByText(/A netball club sells 148 tickets/)).toBeVisible();
  });

  test("the FAQ opens and closes on activation", async ({ page }) => {
    await page.goto("/");
    const first = page.getByText("Which year levels are supported?");
    await first.click();
    await expect(page.getByText(/built for Years 1 to 12/)).toBeVisible();
    await first.click();
    await expect(page.getByText(/built for Years 1 to 12/)).toBeHidden();
  });

  /*
   * Was "plans show the real Family price, not a placeholder", asserting a
   * Subscribe link to /billing. FAMILY_PLAN_AVAILABILITY is now "roadmap"
   * (audit finding C-02: the amounts are placeholders not linked to a live
   * Stripe price, and the legal pages are unsigned drafts), so that
   * assertion had become the exact opposite of what the product
   * deliberately does. Inverted rather than deleted, so the plans section
   * still has a guard.
   *
   * The full no-checkout-anywhere assertion lives in e2e/billing.spec.ts;
   * this keeps the landing page's own plans section honest.
   */
  test("plans offer no checkout while the Family plan is on the roadmap", async ({ page }) => {
    await page.goto("/");
    const plans = page.locator("#plans");
    await expect(plans.getByRole("link", { name: "Subscribe to Family" })).toHaveCount(0);
    await expect(plans.getByRole("link", { name: "Choose the yearly plan" })).toHaveCount(0);
    await expect(plans.locator('a[href="/billing"]')).toHaveCount(0);
    await expect(plans.getByRole("link", { name: "Register interest" }).first()).toHaveAttribute(
      "href",
      "/contact",
    );
  });

  /*
   * The page has no testimonials, ratings or usage figures because none
   * are verified yet. These panels say exactly that — if one is ever
   * replaced with invented social proof, this fails.
   */
  test("evidence stays a labelled placeholder, never invented social proof", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Placeholder — family feedback")).toBeVisible();
    await expect(page.getByText("Placeholder — platform figures")).toBeVisible();
    await expect(page.getByText(/We will publish evidence when we have it/)).toBeVisible();
  });

  test("tutorial frames stay empty slots until the videos exist", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Videos to be supplied/)).toBeVisible();
    await expect(page.getByText("Placeholder — full platform tour")).toBeVisible();
  });

  test("the footer wires every column to a real route", async ({ page }) => {
    await page.goto("/");
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

  test("nothing on the page invites account creation while sign-up is closed", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('a[href="/sign-up"]')).toHaveCount(0);
  });
});
