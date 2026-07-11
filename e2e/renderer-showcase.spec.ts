import { expect, test } from "@playwright/test";

test.describe("renderer showcase", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/showcase");
    await expect(
      page.getByRole("heading", { level: 2, name: "Question renderers" }),
    ).toBeVisible();
  });

  test("shows every question and visual renderer", async ({ page }) => {
    await expect(page.locator("[data-question-type]")).toHaveCount(14);
    await expect(page.locator("[data-visual-type]")).toHaveCount(10);
  });

  test("supports the matching interaction", async ({ page }) => {
    await page.getByLabel("Frog").selectOption({ label: "Amphibian" });
    await expect(page.getByLabel("Frog")).toHaveValue("amphibian");
  });

  test("supports keyboard reordering", async ({ page }) => {
    const orderingCard = page.locator('[data-question-type="ordering"]');
    const firstItem = orderingCard.locator("ol > li").first();
    /* The deterministic initial order rotates the authored item order by
       one (7, 88, 19, 42) — never the correct answer order (7, 19, 42, 88)
       — so a learner who never touches the question never sees it already
       correct. */
    await expect(firstItem).toContainText("7");
    await orderingCard.getByRole("button", { name: "Move 88 up" }).click();
    await expect(orderingCard.locator("ol > li").first()).toContainText("88");
  });

  test("accepts an essay response and counts words", async ({ page }) => {
    const essayCard = page.locator('[data-question-type="essay"]');
    await essayCard.getByRole("textbox").fill("The best day ever happened suddenly");
    await expect(essayCard.getByText("6 words")).toBeVisible();
  });

  test("selects a hotspot region", async ({ page }) => {
    const region = page.getByRole("checkbox", { name: "Large circle" });
    await region.click();
    await expect(region).toHaveAttribute("aria-checked", "true");
  });

  test("uses the accessible drag-and-drop fallback", async ({ page }) => {
    const dragCard = page.locator('[data-question-type="drag_drop"]');
    await dragCard.getByLabel("4", { exact: true }).selectOption({ label: "Even numbers" });
    await expect(dragCard.getByLabel("4", { exact: true })).toHaveValue("even");
  });
});
