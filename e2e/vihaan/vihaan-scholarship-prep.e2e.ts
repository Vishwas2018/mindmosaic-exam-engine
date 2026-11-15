import { expect, test } from "@playwright/test";

test.describe("Vihaan Scholarship Prep route gates", () => {
  test("redirects away from /student/vihaan when unauthenticated or blocked", async ({ page }) => {
    await page.goto("/student/vihaan");
    await expect(page).toHaveURL(/\/(sign-in|student)(\?|$)/);
  });

  test("redirects away from /student/vihaan/diagnostic when unauthenticated or blocked", async ({
    page,
  }) => {
    await page.goto("/student/vihaan/diagnostic");
    await expect(page).toHaveURL(/\/(sign-in|student)(\?|$)/);
  });

  test("redirects away from /parent/vihaan when unauthenticated or blocked", async ({ page }) => {
    await page.goto("/parent/vihaan");
    await expect(page).toHaveURL(/\/(sign-in|parent)(\?|$)/);
  });
});

if (
  process.env.VIHAAN_E2E_STUDENT_EMAIL &&
  process.env.VIHAAN_E2E_STUDENT_PASSWORD &&
  process.env.VIHAAN_E2E_PARENT_EMAIL &&
  process.env.VIHAAN_E2E_PARENT_PASSWORD
) {
  const studentEmail = process.env.VIHAAN_E2E_STUDENT_EMAIL;
  const studentPassword = process.env.VIHAAN_E2E_STUDENT_PASSWORD;
  const parentEmail = process.env.VIHAAN_E2E_PARENT_EMAIL;
  const parentPassword = process.env.VIHAAN_E2E_PARENT_PASSWORD;

  test.describe("Vihaan Scholarship Prep authenticated flows", () => {
    test("allowlisted student can open /student/vihaan and /student/vihaan/diagnostic without React errors", async ({
      page,
    }) => {
      const pageErrors: string[] = [];
      page.on("pageerror", (error) => {
        pageErrors.push(error.message);
      });

      await page.goto("/sign-in?next=/student/vihaan");
      await page.getByLabel(/email/i).fill(studentEmail);
      await page.getByLabel(/password/i).fill(studentPassword);
      await page.getByRole("button", { name: /sign in/i }).click();

      await page.waitForURL(/\/student\/vihaan$/);
      await expect(page.getByRole("heading", { name: "Vihaan Scholarship Prep" })).toBeVisible();
      await expect(page.getByText("Content is being reviewed")).toBeVisible();
      await expect(page.getByText("Suggested study routine")).toBeVisible();

      await page.getByRole("link", { name: "Open diagnostic assessment" }).click();
      await page.waitForURL(/\/student\/vihaan\/diagnostic$/);
      await expect(page.getByTestId("diagnostic-empty-state")).toBeVisible();
      await expect(page.getByText("No approved diagnostic questions available yet")).toBeVisible();
      expect(pageErrors).toEqual([]);
    });

    test("linked allowlisted parent can open /parent/vihaan and cannot open /student/vihaan", async ({
      page,
    }) => {
      await page.goto("/sign-in?next=/parent/vihaan");
      await page.getByLabel(/email/i).fill(parentEmail);
      await page.getByLabel(/password/i).fill(parentPassword);
      await page.getByRole("button", { name: /sign in/i }).click();

      await page.waitForURL(/\/parent\/vihaan$/);
      await expect(page.getByTestId("vihaan-parent-dashboard")).toBeVisible();
      await expect(page.getByText("Weekly progress")).toBeVisible();
      await expect(page.getByText("Subject performance")).toBeVisible();

      await page.goto("/student/vihaan");
      await expect(page).not.toHaveURL(/\/student\/vihaan/);
    });
  });
}
