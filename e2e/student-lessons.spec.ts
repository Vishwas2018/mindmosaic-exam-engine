import { expect, test } from "@playwright/test";

test.describe("/student/learn and /student/learn/lessons/[code] route access and guards", () => {
  test("unauthenticated visitor to /student/learn is redirected to sign-in", async ({ page }) => {
    await page.goto("/student/learn");
    await expect(page).toHaveURL(/\/student-sign-in|\/sign-in|\//);
  });

  test("unauthenticated visitor to /student/learn/lessons/VC2M3N01 is redirected to sign-in", async ({
    page,
  }) => {
    await page.goto("/student/learn/lessons/VC2M3N01");
    await expect(page).toHaveURL(/\/student-sign-in|\/sign-in|\//);
  });

  test("unauthenticated visitor to unknown lesson code is redirected to sign-in", async ({
    page,
  }) => {
    await page.goto("/student/learn/lessons/VC2M3N99");
    await expect(page).toHaveURL(/\/student-sign-in|\/sign-in|\//);
  });
});
