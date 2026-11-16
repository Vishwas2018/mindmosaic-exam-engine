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
    for (const [name, href] of [
      ["Paper review", "/admin/papers"],
      ["Publication", "/admin/publication"],
      ["Writing review", "/admin/writing"],
      ["Support", "/admin/support"],
      ["Activity history", "/admin/activity"],
    ] as const) {
      await expect(page.getByRole("navigation", { name: "Admin sections" }).getByRole("link", { name })).toHaveAttribute("href", href);
    }

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

    // The remaining screens are real pages with their own URLs.
    await page.goto("/admin/papers");
    await expect(page.getByRole("heading", { level: 1, name: "Paper review" })).toBeVisible();
    await page.getByRole("link", { name: /^Open NAPLAN-style Year 3 Numeracy/ }).first().click();
    await expect(page.getByRole("heading", { name: "What each part draws on" })).toBeVisible();

    await page.goto("/admin/publication");
    await expect(page.getByRole("heading", { level: 1, name: "Publication" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Programme gates" })).toBeVisible();
    await page.getByLabel("Question id").fill("no-such-question");
    await page.getByRole("button", { name: "Check" }).click();
    await expect(page.getByRole("status").filter({ hasText: "No authored question has the id" })).toBeVisible();

    await page.goto("/admin/writing");
    await expect(page.getByRole("heading", { level: 1, name: "Writing review" })).toBeVisible();
    await expect(page.getByText(/Awaiting migration: admin_redacted_writing_queue/)).toBeVisible();

    await page.goto("/admin/support");
    await expect(page.getByRole("heading", { level: 1, name: "Support" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Privacy boundary" })).toBeVisible();

    await page.goto("/admin/activity");
    await expect(page.getByRole("heading", { level: 1, name: "Activity history" })).toBeVisible();
    await page.getByLabel("Action").selectOption("published");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page).toHaveURL(/action=published/);

    await page.goto("/admin/questions/no-such-question/approval");
    await expect(page.getByRole("heading", { name: "Question not found" })).toBeVisible();

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
    await expect(page).toHaveURL(/\/admin\/papers$/);
    await expect(page.getByRole("heading", { level: 1, name: "Paper review" })).toBeVisible();
    // The page itself must not scroll sideways at 390px.
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    await page.close();
  });
});
