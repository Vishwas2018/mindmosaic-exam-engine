import { test, expect } from "@playwright/test";

test.describe("Vihaan Scholarship Prep", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/student/vihaan");
  });

  test("feature flag blocks access when disabled", async ({ page }) => {
    await expect(page).toHaveURL("/student");
  });

  test("dashboard renders all sections when enabled", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Vihaan Scholarship Prep" })).toBeVisible();
    await expect(page.getByText("Your daily study plan")).toBeVisible();
    await expect(page.getByText("Concept learning")).toBeVisible();
    await expect(page.getByText("Casual practice")).toBeVisible();
    await expect(page.getByText("Sample papers")).toBeVisible();
    await expect(page.getByText("Mock examinations")).toBeVisible();
    await expect(page.getByText("Smart revision")).toBeVisible();
    await expect(page.getByText("Writing practice")).toBeVisible();
  });

  test("study plan shows 6 days with 60 minutes each", async ({ page }) => {
    for (let day = 1; day <= 6; day++) {
      await expect(page.getByText("Day " + day)).toBeVisible();
      await expect(page.getByText("60 min")).toBeVisible();
    }
  });

  test("sample papers are marked as unofficial Edutest-style", async ({ page }) => {
    await expect(page.getByText("Unofficial — Edutest-style")).toBeVisible();
    await expect(page.getByText("not official Edutest or ACER papers")).toBeVisible();
  });
});
