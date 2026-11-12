import { test, expect } from "../fixtures/auth.fixture";

test.describe("Admin Workspace Authorization & Navigation", () => {
  test("access to /admin is denied to unauthenticated guests and non-admin roles", async ({
    contextAs,
  }) => {
    for (const key of [
      "unauthenticated",
      "student-no-attempts",
      "parent-no-children",
      "teacher-no-students",
    ] as const) {
      const page = await (await contextAs(key)).newPage();
      await page.goto("/admin");
      await expect(page).not.toHaveURL(/\/admin$/);
      await page.close();
    }
  });

  test("authenticated admin loads the redesigned Admin Workspace with operational views", async ({
    contextAs,
  }) => {
    test.setTimeout(120_000);
    const page = await (await contextAs("admin")).newPage();
    await page.goto("/admin");

    // Overview renders with heading and governance metrics
    await expect(page.getByRole("heading", { name: /Editorial & Governance Overview/i })).toBeVisible();

    // Verify sections in sidebar
    await expect(page.getByRole("button", { name: /Question library/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Human approval/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Paper review/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Publication status/i })).toBeVisible();

    // Verify specialized legacy tools are accessible
    await expect(page.getByRole("link", { name: /Draft review/i }).first()).toHaveAttribute("href", "/admin/review");
    await expect(page.getByRole("link", { name: /Analytics/i }).first()).toHaveAttribute("href", "/admin/analytics");

    // Navigate to Question Library
    await page.getByRole("button", { name: /Question library/i }).click();
    await expect(page.getByRole("heading", { name: /Question Library/i })).toBeVisible();

    // Navigate to Publication Status & verify ledger hash
    await page.getByRole("button", { name: /Publication status/i }).click();
    await expect(page.getByRole("heading", { name: /Publication Status & Tamper-Evident Ledger/i })).toBeVisible();
    await expect(page.getByText(/Tamper-Evident Ledger Root Hash/i)).toBeVisible();

    // Navigate to State Boards
    await page.getByRole("button", { name: /State boards/i }).click();
    await expect(page.getByRole("heading", { name: /Approved State Boards & Edge Cases/i })).toBeVisible();

    await page.close();
  });

  test("responsive viewport reflow on mobile (390px)", async ({
    contextAs,
  }) => {
    test.setTimeout(120_000);
    const context = await contextAs("admin");
    const page = await context.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/admin");

    // On mobile, the hamburger menu is visible
    const menuBtn = page.getByRole("button", { name: /Toggle navigation menu/i });
    await expect(menuBtn).toBeVisible();

    // Open mobile menu drawer
    await menuBtn.click();
    await expect(page.getByText("Admin Workspace Sections")).toBeVisible();

    // Navigate via mobile drawer
    await page.getByRole("button", { name: /Paper review/i }).click();
    await expect(page.getByRole("heading", { name: /Paper Review & Staging/i })).toBeVisible();

    await page.close();
  });
});
