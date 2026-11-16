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

    // Overview (export artboard 01): the three queues, families' reports and publication status per programme.
    await expect(page.getByRole("heading", { level: 1, name: "Overview" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Review queues" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Reported by families" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Publication status" })).toBeVisible();

    // Sidebar: the library is its own page; the rest are in-page views.
    await expect(page.getByRole("link", { name: /Question library/i }).first()).toHaveAttribute("href", "/admin/questions");
    await expect(page.getByRole("button", { name: /Paper review/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Publication/ }).first()).toBeVisible();

    // Verify specialized legacy tools are accessible
    await expect(page.getByRole("link", { name: /Draft review/i }).first()).toHaveAttribute("href", "/admin/review");
    await expect(page.getByRole("link", { name: /Analytics/i }).first()).toHaveAttribute("href", "/admin/analytics");

    // Question library: real bank, filterable through the URL.
    await page.getByRole("link", { name: /Question library/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/questions$/);
    await expect(page.getByRole("heading", { level: 1, name: "Question library" })).toBeVisible();
    await expect(page.getByRole("status")).toContainText(/questions/);
    await page.getByLabel("Review status").selectOption("awaiting");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page).toHaveURL(/status=awaiting/);
    await expect(page.getByRole("link", { name: "Remove filter Awaiting human approval" })).toBeVisible();
    await page.getByRole("link", { name: /^Open g?[a-z0-9-]+/i }).first().click();
    await expect(page.getByRole("heading", { name: "What a child sees" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Answer key and explanation" })).toBeVisible();

    // Publication: the existing ledger view.
    await page.goto("/admin");
    await page.getByRole("button", { name: /^Publication/ }).first().click();
    await expect(page.getByRole("heading", { name: /Publication Status & Tamper-Evident Ledger/i })).toBeVisible();

    // The design-review aids (artboard switcher, state-board gallery) belong to the synthetic preview only.
    await expect(page.getByRole("button", { name: /State boards/i })).toHaveCount(0);
    await expect(page.getByText(/^Artboards:$/)).toHaveCount(0);

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
