import { expect, test } from "@playwright/test";

test.describe("Admin draft review fail-closed security boundary (unconfigured auth)", () => {
  test("fails closed and exposes zero draft questions across both banks when Supabase auth is unconfigured", async ({
    page,
  }) => {
    for (const url of [
      "/admin/review",
      "/admin/review?bank=vihaan-scholarship-500",
      "/admin/review?bank=../../etc/passwd",
    ]) {
      await page.goto(url);
      await expect(
        page.getByText(
          /Sign-in is unavailable until Supabase is configured\. No draft content has been loaded\./,
        ),
      ).toBeVisible();
      await expect(page.getByRole("status")).toHaveText(
        "0 drafts match your filters",
      );
      // Confirm zero leaked stems or answer keys from either Scholarship bank.
      await expect(page.getByText("SOLAR is to SUN")).toHaveCount(0);
      await expect(page.getByText("vihaan-e500-m001")).toHaveCount(0);
      await expect(page.getByText("vihaan-p01-m01")).toHaveCount(0);
    }
  });

  test("preserves mobile responsive layout with no horizontal overflow on /admin/review", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/admin/review?bank=vihaan-scholarship-500");
    await expect(
      page.getByRole("heading", { name: "Draft review" }),
    ).toBeVisible();
    const fits = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
    expect(fits).toBe(true);
  });
});
