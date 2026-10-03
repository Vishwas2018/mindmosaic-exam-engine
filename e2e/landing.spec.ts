import { expect, test } from "@playwright/test";
import { PUBLIC_SIGNUP_ENABLED } from "../src/features/auth/signup-policy";

/*
 * The home page was rebuilt from the approved design-canvas file
 * Public/Home.dc.html (claude.ai/design project "Phase 1 Home page
 * review" — see src/features/landing/content.ts's header comment). Its
 * six sections replace the previous, much longer landing page; the
 * header carries five real destinations — /programs and /how-it-works
 * landed in public-pages Step 4, replacing their former interim routes.
 */

/** Every header link, and the route it must reach. */
const HEADER_LINKS: ReadonlyArray<readonly [label: string, href: string]> = [
  ["Programs", "/programs"],
  ["How It Works", "/how-it-works"],
  ["Plans", "/pricing"],
  ["Resources", "/resources"],
  ["About", "/about"],
];

test.describe("home page", () => {
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

  test("the header CTA reads 'Start free' and links to the primary entry route", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByRole("banner").getByRole("link", { name: "Start free", exact: true });
    await expect(cta).toHaveAttribute("href", PUBLIC_SIGNUP_ENABLED ? "/sign-up" : "/practice");
  });

  test("the hero states the two-line promise, both CTAs and the availability line", async ({ page }) => {
    await page.goto("/");
    const hero = page.getByRole("heading", { level: 1 });
    await expect(hero).toContainText("Learn with purpose.");
    await expect(hero).toContainText("Practise with confidence.");
    await expect(page.getByRole("link", { name: "Explore programs" }).first()).toBeVisible();
    await expect(page.getByText(/Available now: NAPLAN-style and ICAS-style/)).toBeVisible();
  });

  test("the hero carousel advances to the next scene and stops autoplay", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Next scene" }).click();
    await expect(page.getByRole("button", { name: "Play scene rotation" })).toBeVisible();
  });

  test("the learning demo switches between Learn, Practise and Prepare", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("article", { name: "Sample lesson" })).toBeVisible();

    await page.getByRole("tab", { name: "Practise" }).click();
    const practice = page.getByRole("article", { name: "Sample practice question" });
    await expect(practice).toBeVisible();
    await practice.getByRole("radio", { name: /^B/ }).click();
    await practice.getByRole("button", { name: "Check answer" }).click();
    await expect(practice.getByRole("status")).toContainText("Correct");

    await page.getByRole("tab", { name: "Prepare" }).click();
    await expect(page.getByRole("article", { name: "Sample test sitting" })).toBeVisible();
  });

  test("find the right program lists real status, not invented availability", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("section", { has: page.getByRole("heading", { name: "Find the right program." }) });
    const naplan = section.getByRole("link", { name: /NAPLAN-style/ });
    await expect(naplan).toContainText("Available");
    const planned = section.getByRole("link", { name: /Singapore Maths and competition pathways/ });
    await expect(planned).toContainText("Planned");
  });

  test("the parent section shows the illustrative weekly summary, labelled as such", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Aisha · Year 3")).toBeVisible();
    await expect(page.getByText("Sample", { exact: true })).toBeVisible();
  });

  test("the quality section makes no claim of educator review", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Automated publication checks")).toBeVisible();
    await expect(page.getByText(/educator review|reviewed by teachers/i)).toHaveCount(0);
  });

  test("the FAQ opens and closes on activation, and never shows a real Family price", async ({ page }) => {
    await page.goto("/");
    const first = page.getByRole("button", { name: "What can my child use today?" });
    await first.click();
    await expect(page.getByText(/Curriculum lessons are limited and open to signed-in students/)).toBeVisible();
    await first.click();
    await expect(page.getByText(/Curriculum lessons are limited and open to signed-in students/)).toBeHidden();

    await expect(page.getByText("$14.99")).toHaveCount(0);
    await expect(page.getByText("$149")).toHaveCount(0);
  });

  test("the footer wires every column to a real route", async ({ page }) => {
    await page.goto("/");
    for (const [column, label, href] of [
      ["Product", "Plans", "/pricing"],
      ["Programs", "All programs", "/programs"],
      ["Support", "Help and contact", "/help"],
    ] as const) {
      const nav = page.getByRole("navigation", { name: column });
      const link = nav.getByRole("link", { name: label, exact: true });
      await expect(link).toHaveAttribute("href", href);
      const response = await page.request.get(href);
      expect(response.ok(), `${href} should resolve, not 404`).toBeTruthy();
    }
    await expect(page.getByRole("link", { name: "Privacy", exact: true })).toHaveAttribute("href", "/privacy");
  });

  test("sign-up affordances match the current public signup policy", async ({ page }) => {
    await page.goto("/");
    const count = await page.locator('a[href="/sign-up"]').count();
    if (PUBLIC_SIGNUP_ENABLED) {
      expect(count).toBeGreaterThan(0);
    } else {
      expect(count).toBe(0);
    }
  });

  /*
   * Acceptance bar for this rebuild (handoff/MOTION_SPEC.md /
   * FACT_LOG.md): no horizontal scroll at any of the three reference
   * widths. A single stray full-bleed element (the footer's mosaic
   * strip is the obvious risk, being deliberately edge-to-edge) is
   * enough to introduce one.
   */
  for (const width of [375, 768, 1440] as const) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const [scrollWidth, clientWidth] = await page.evaluate(() => [
        document.documentElement.scrollWidth,
        document.documentElement.clientWidth,
      ]);
      expect(scrollWidth, `scrollWidth (${scrollWidth}) should not exceed clientWidth (${clientWidth})`).toBeLessThanOrEqual(
        clientWidth,
      );
    });
  }
});
