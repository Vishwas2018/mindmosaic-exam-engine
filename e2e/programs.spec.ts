import { expect, test } from "@playwright/test";

/*
 * Public/Programs.dc.html, Public/Program Detail.dc.html and
 * Public/How It Works.dc.html — the three new Public routes this step
 * of the Home.dc.html rebuild adds, plus the /plans and /methodology
 * redirects that replaced their old interim destinations.
 */

test.describe("Programs", () => {
  test("/programs renders the year-picker catalogue", async ({ page }) => {
    await page.goto("/programs");
    await expect(page.getByRole("heading", { level: 1, name: "Programs" })).toBeVisible();
    await expect(page.getByRole("tablist", { name: "Programmes" })).toBeVisible();
  });

  test("/programs/naplan-style is a real, standalone page for one programme", async ({ page }) => {
    await page.goto("/programs/naplan-style");
    await expect(page.getByRole("heading", { level: 1, name: "NAPLAN-style" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Programs", exact: true })).toHaveAttribute("href", "/programs");
    const aside = page.getByRole("complementary", { name: "Get started" });
    await expect(aside.getByRole("link", { name: "Start free" })).toHaveAttribute("href", "/sign-up");
  });

  test("an unknown programme slug 404s", async ({ page }) => {
    const response = await page.goto("/programs/not-a-real-program");
    expect(response?.status()).toBe(404);
  });
});

test.describe("How It Works", () => {
  test("/how-it-works renders, and /methodology redirects to it permanently", async ({ page }) => {
    await page.goto("/how-it-works");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Three stages");

    const response = await page.request.get("/methodology", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers()["location"]).toContain("/how-it-works");
  });
});

test.describe("Plans redirect", () => {
  test("/plans redirects to /pricing permanently", async ({ page }) => {
    const response = await page.request.get("/plans", { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers()["location"]).toContain("/pricing");
  });
});
