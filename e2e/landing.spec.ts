import { expect, test } from "@playwright/test";

const NAV_ANCHORS: ReadonlyArray<{ label: string; hash: string; sectionId: string }> = [
  { label: "How It Works", hash: "#how-it-works", sectionId: "how-it-works" },
  { label: "Subjects", hash: "#subjects", sectionId: "subjects" },
  { label: "For Parents", hash: "#audiences", sectionId: "audiences" },
  { label: "Pricing", hash: "#pricing", sectionId: "pricing" },
  { label: "Resources", hash: "#faq", sectionId: "faq" },
];

test.describe("landing page rebuild", () => {
  test.describe("primary nav anchors", () => {
    for (const { label, hash, sectionId } of NAV_ANCHORS) {
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

  test("FAQ accordion opens and closes via keyboard (Enter and Space)", async ({ page }) => {
    await page.goto("/");
    const firstItem = page
      .locator("details")
      .filter({ has: page.getByText("Is MindMosaic an official NAPLAN or ICAS product?") });
    const summary = firstItem.locator("summary");
    const answer = firstItem.locator("p");

    await expect(answer).not.toBeVisible();

    await summary.focus();
    await page.keyboard.press("Enter");
    await expect(answer).toBeVisible();

    await page.keyboard.press("Enter");
    await expect(answer).not.toBeVisible();

    await page.keyboard.press("Space");
    await expect(answer).toBeVisible();
  });

  test("coming-soon subjects render as disabled, non-interactive cards", async ({ page }) => {
    await page.goto("/");
    const urlBefore = page.url();

    for (const name of [
      "ICAS-style Science",
      "ICAS-style Digital Technologies",
      "NAPLAN-style Writing",
    ]) {
      const label = page.getByText(name, { exact: true });
      await expect(label).toBeVisible();
      await expect(page.getByRole("link", { name })).toHaveCount(0);
      await expect(page.getByRole("button", { name })).toHaveCount(0);

      const card = page.locator('[aria-disabled="true"]').filter({ hasText: name });
      await expect(card).toHaveAttribute("aria-disabled", "true");
      await expect(card.getByText("Coming soon")).toBeVisible();

      await card.click();
      expect(page.url()).toBe(urlBefore);
    }
  });
});
