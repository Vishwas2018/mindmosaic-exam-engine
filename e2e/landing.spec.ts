import { expect, test } from "@playwright/test";

/*
 * The header nav changed deliberately: it used to be three same-page anchors
 * plus /practice, so it could reach exactly one real route while About and
 * Help existed as footer-only links. It now carries About and Help as well.
 *
 * What that did to this list:
 *  - "Resources" was renamed "FAQ". Same #faq anchor, same section — label only.
 *  - "Insights" (#audiences) was dropped from the nav to make room. The
 *    section keeps its id so deep links still work, asserted in
 *    src/tests/components/landing-for-parents.test.tsx.
 *
 * The hrefs stay bare "#plans"/"#faq" here because content.ts stores them
 * root-relative ("/#plans") so they also work from /about and the legal
 * pages, and SiteNav collapses the prefix on the home page.
 */
const HASH_NAV_ANCHORS: ReadonlyArray<{ label: string; hash: string; sectionId: string }> = [
  { label: "Plans", hash: "#plans", sectionId: "plans" },
  { label: "FAQ", hash: "#faq", sectionId: "faq" },
];

/** The real routes the header gained — the point of the change above. */
const HEADER_PAGE_LINKS: ReadonlyArray<readonly [label: string, href: string]> = [
  ["Practice", "/practice"],
  ["About", "/about"],
  ["Help", "/help"],
];

test.describe("landing page", () => {
  test.describe("primary nav anchors", () => {
    for (const { label, hash, sectionId } of HASH_NAV_ANCHORS) {
      test(`"${label}" resolves to a real section, not a dead "#"`, async ({ page }) => {
        await page.goto("/");
        const nav = page.getByRole("navigation", { name: "Primary" });
        const link = nav.getByRole("link", { name: label });
        await expect(link).toHaveAttribute("href", hash);

        await link.click();
        await expect(page).toHaveURL(new RegExp(`${hash}$`));
        await expect(page.locator(`#${sectionId}`)).toBeInViewport();
      });
    }
  });

  test("the header reaches real pages, not only same-page anchors", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary" });
    for (const [label, href] of HEADER_PAGE_LINKS) {
      const link = nav.getByRole("link", { name: label, exact: true });
      await expect(link).toHaveAttribute("href", href);
      const response = await page.request.get(href);
      expect(response.ok(), `${href} should resolve, not 404`).toBeTruthy();
    }
  });

  test("the header CTA reads 'Start free' and links to real practice", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByRole("banner").getByRole("link", { name: "Start free", exact: false });
    await expect(cta).toHaveAttribute("href", "/practice");
  });

  test("hero shows the NAPLAN/ICAS/AMC non-affiliation disclaimer and labels floating stats illustrative", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByText("MindMosaic is not affiliated with or endorsed by NAPLAN, ICAS or AMC."),
    ).toBeVisible();
    await expect(page.getByText("Illustrative").first()).toBeVisible();
  });

  test("FAQ accordion opens and closes via keyboard (Enter and Space)", async ({ page }) => {
    await page.goto("/");
    const firstQuestion = page.getByRole("button", { name: "Is MindMosaic affiliated with NAPLAN or ICAS?" });

    await firstQuestion.focus();
    await expect(firstQuestion).toHaveAttribute("aria-expanded", "true");

    await page.keyboard.press("Enter");
    await expect(firstQuestion).toHaveAttribute("aria-expanded", "false");

    await page.keyboard.press("Space");
    await expect(firstQuestion).toHaveAttribute("aria-expanded", "true");
  });

  test("the AMC-style assessment card renders disabled and non-interactive, never a dead link", async ({ page }) => {
    await page.goto("/");
    const urlBefore = page.url();

    const label = page.getByText("AMC-style", { exact: true });
    await expect(label).toBeVisible();
    await expect(page.getByRole("link", { name: /^AMC-style/ })).toHaveCount(0);

    const card = page.locator('[aria-disabled="true"]').filter({ hasText: "AMC-style" });
    await card.click();
    expect(page.url()).toBe(urlBefore);
  });

  test("coming-soon subjects render as aria-disabled tiles, not fabricated live subjects", async ({ page }) => {
    await page.goto("/");

    for (const name of ["Writing", "Science", "Digital Technologies", "Spelling", "Critical & Creative Thinking"]) {
      const label = page.getByText(name, { exact: true });
      await expect(label).toBeVisible();
      const tile = page.locator('[aria-disabled="true"]').filter({ hasText: name });
      await expect(tile).toHaveCount(1);
      await expect(tile.getByText("Coming soon")).toBeVisible();
    }
  });

  test("pricing CTAs reflect real plan availability, priced from a single source of truth", async ({ page }) => {
    await page.goto("/");
    const pricing = page.locator("#plans");
    await expect(pricing.getByRole("link", { name: "Start free" })).toHaveAttribute("href", "/practice");
    // Family has a real, working checkout path (src/lib/billing/prices.ts's
    // FAMILY_PLAN_AVAILABILITY) — the landing CTA must not say "Join
    // waitlist" or "Coming soon" for it.
    await expect(pricing.getByRole("link", { name: "Subscribe to Family" })).toHaveAttribute("href", "/billing");
    await expect(pricing.getByText("Join waitlist")).toHaveCount(0);
    await expect(pricing.getByText("Coming soon")).toHaveCount(0);
    await expect(pricing.getByText("Cancel anytime. No lock-in contracts.")).toBeVisible();
  });

  test("header stays transparent at the top and only gains its translucent/blurred/bordered look once scrolled", async ({ page }) => {
    await page.goto("/");
    const header = page.getByRole("banner");
    await expect(header).toHaveClass(/bg-transparent/);
    await expect(header).not.toHaveClass(/backdrop-blur-\[14px\]/);

    await page.mouse.wheel(0, 400);
    await expect(header).toHaveClass(/backdrop-blur-\[14px\]/);
    await expect(header).not.toHaveClass(/bg-transparent/);
  });

  test("nav has no duplicate 'Courses' link (both pointed at /practice already)", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary" });
    await expect(nav.getByRole("link", { name: "Courses" })).toHaveCount(0);
  });

  test("the trust strip no longer repeats the hero trust row verbatim", async ({ page }) => {
    await page.goto("/");
    // Previously both rows said the same four things (two were
    // near-duplicates of each other reworded) — now genuinely different.
    await expect(page.getByText("Trusted by Australian learners")).toBeVisible();
    await expect(page.getByText("Worked explanations after every practice")).toBeVisible();
    await expect(page.getByText("Curriculum Aligned (AU)")).toBeVisible();
  });

  test("footer wires all 6 new supporting pages, zero dead links", async ({ page }) => {
    await page.goto("/");
    /*
     * Scoped to the footer landmark. This used to search the whole page,
     * which worked only while About and Help appeared nowhere else; once the
     * header gained them, "About" matched two links and Playwright's strict
     * mode failed. The page is right — a supporting page belongs in both
     * places — so the locator is what needed narrowing, and a test named
     * "footer wires..." should have been looking at the footer anyway.
     */
    const footer = page.getByRole("navigation", { name: "Footer" });
    for (const [label, href] of [
      ["About", "/about"],
      ["Contact", "/contact"],
      ["Help Centre", "/help"],
      ["Parent Guide", "/parent-guide"],
      ["Student Tips", "/student-tips"],
      ["Assessment Disclaimer", "/assessment-disclaimer"],
    ] as const) {
      const link = footer.getByRole("link", { name: label, exact: true });
      await expect(link).toHaveAttribute("href", href);
      const response = await page.request.get(href);
      expect(response.ok(), `${href} should resolve, not 404`).toBeTruthy();
    }
  });

  test("the stats band never contradicts Explore Subjects again — no bare 'Subjects' claim independent of the grid", async ({ page }) => {
    await page.goto("/");
    // The old copy said "8 Subjects" while the grid right below showed 5 of
    // 8 as "Coming soon" — a direct on-page contradiction. It must now read
    // as a live/total ratio instead.
    await expect(page.getByText("Subjects Live Today")).toBeVisible();
    await expect(page.getByText(/^\d+\/\d+$/)).toBeVisible();
  });

  test("the internal planning label 'TRUST & SOCIAL PROOF' never shipped as visible copy", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("TRUST & SOCIAL PROOF", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Why parents trust MindMosaic")).toBeVisible();
  });

  test("the merged Learning insights section has one CTA and no leftover 'Learning that fits every student' duplicate", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Learning that fits every student")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Insights that help every child grow" })).toBeVisible();
    const cta = page.getByRole("link", { name: "Create a free parent account" });
    await expect(cta).toHaveAttribute("href", "/sign-up");
    // The 3 illustrative mini-cards from the removed section survive here.
    await expect(page.getByText("Weekly Goal")).toBeVisible();
  });

  test("the footer newsletter form is gone (it never sent the typed email anywhere) — honest static copy instead", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByLabel("Email address")).toHaveCount(0);
    await expect(page.getByText("Email updates aren't live yet — check back soon.")).toBeVisible();
  });
});
