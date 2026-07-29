import { expect, test } from "@playwright/test";

const HASH_NAV_ANCHORS: ReadonlyArray<{ label: string; hash: string; sectionId: string }> = [
  { label: "Plans", hash: "#plans", sectionId: "plans" },
  { label: "Resources", hash: "#faq", sectionId: "faq" },
  { label: "Insights", hash: "#audiences", sectionId: "audiences" },
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
      await expect(tile.getByText("Coming Soon")).toBeVisible();
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
});
