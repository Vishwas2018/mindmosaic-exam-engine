import { expect, test } from "./fixtures/auth.fixture";

test.describe("/parent/curriculum-explorer route access and smoke", () => {
  test("unauthenticated visitor is redirected to sign-in with return URL", async ({ page }) => {
    await page.goto("/parent/curriculum-explorer");
    await expect(page).toHaveURL(/\/sign-in\?next=%2Fparent/);
  });

  test("signed-in parent can browse the Victorian Curriculum explorer", async ({ contextAs }) => {
    const context = await contextAs("parent-one-child");
    const page = await context.newPage();

    await page.goto("/parent/curriculum-explorer");

    // Check header and core page elements
    await expect(
      page.getByRole("heading", { level: 1, name: /What your child learns in Year/i }),
    ).toBeVisible();

    // Check term sequencing notice
    await expect(
      page.getByText(/Schools set their own term-by-term sequencing/i),
    ).toBeVisible();

    // Check Level and Subject controls
    await expect(page.getByRole("radio", { name: /Year 3 \(Level 3\)/i })).toBeVisible();
    await expect(page.getByRole("radio", { name: /Year 5 \(Level 5\)/i })).toBeVisible();
    await expect(page.getByRole("radio", { name: /Maths/i })).toBeVisible();
    await expect(page.getByRole("radio", { name: /English/i })).toBeVisible();

    // Check that curriculum skill cards render
    const cards = page.locator(".group.relative");
    await expect(cards.first()).toBeVisible();

    // Check honest coverage badge
    await expect(page.getByText(/Coming soon/i).first()).toBeVisible();
  });
});
