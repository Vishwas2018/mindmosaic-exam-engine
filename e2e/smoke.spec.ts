import { expect, test } from "@playwright/test";

test("student can move from the home page through the sample exam to results", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: "MindMosaic home" })).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, name: /Practice with purpose/i }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Start sample exam" }).click();
  await expect(page).toHaveURL(/\/exam$/);
  await expect(page.getByText("Question 1 of 3", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("group", { name: "Which garden bed grew 8 bean plants?" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Submit exam" }).click();
  await expect(page).toHaveURL(/\/results$/);
  await expect(
    page.getByRole("heading", { level: 1, name: /Your results/i }),
  ).toBeVisible();
});
