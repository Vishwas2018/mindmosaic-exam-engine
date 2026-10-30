import { test, expect } from "../fixtures/auth.fixture";
import { createAdminClient } from "../fixtures/supabase-admin";
import { AUTH_APP_ORIGIN } from "../../playwright.auth.config";

/**
 * QA-003: archiving a child pauses their login and keeps everything else.
 *
 * Runs against the seeded "parent-no-children" fixture and cleans up the child it creates, so that account
 * is back at zero children for the specs that depend on that (see parent-add-child.spec.ts).
 */

async function childSignsIn(page: import("@playwright/test").Page, code: string, pin: string) {
  await page.goto("/student-sign-in");
  await page.locator("input").nth(0).fill(code);
  await page.locator('input[type="password"]').fill(pin);
  await page.locator("form button[type=submit]").first().click();
}

test.describe("parent archive / restore lifecycle", () => {
  test("an archived child cannot sign in or keep using an issued session, keeps their results, and returns on restore", async ({
    contextAs,
    browser,
  }) => {
    const parentContext = await contextAs("parent-no-children");
    const parent = await parentContext.newPage();
    const admin = createAdminClient();
    const childName = `E2E Archive ${Date.now()}`;
    let childId: string | null = null;
    const childContext = await browser.newContext({ baseURL: AUTH_APP_ORIGIN });

    try {
      /* 1. The parent creates a child and the child signs in. */
      await parent.goto("/parent");
      await parent.getByLabel("Child's name").fill(childName);
      const created = parent.waitForResponse(
        (response) => response.url().endsWith("/api/parent/children") && response.request().method() === "POST",
      );
      await parent.getByRole("button", { name: "Create login" }).click();
      const body = (await (await created).json()) as { ok: boolean; loginCode: string; pin: string };
      expect(body.ok).toBe(true);

      const { data: profile } = await admin.from("profiles").select("id").eq("display_name", childName).single();
      childId = profile!.id as string;

      const child = await childContext.newPage();
      await childSignsIn(child, body.loginCode, body.pin);
      await expect(child).toHaveURL(/\/student(\/|$)/);

      /* 2. The parent archives the child. */
      await parent.goto("/parent/children");
      await parent.getByRole("button", { name: "Archive" }).click();
      await parent.getByRole("button", { name: "Yes, archive" }).click();
      const archivedSection = parent.getByRole("region", { name: "Archived children" });
      await expect(archivedSection).toContainText(childName);
      await expect(archivedSection.getByRole("button", { name: `Restore ${childName}` })).toBeVisible();

      /* 3. Nothing was deleted: the link is still there and the account still exists. */
      const { data: links } = await admin.from("parent_children").select("child_id").eq("child_id", childId);
      expect(links).toHaveLength(1);
      const { data: stillThere } = await admin.auth.admin.getUserById(childId);
      expect(stillThere.user).not.toBeNull();

      /* 4. The session the child already had no longer works. */
      await child.goto("/student");
      await expect(child).toHaveURL(/sign-in/);

      /* 5. The same code and PIN no longer sign in, and the message is the generic one. */
      const fresh = await (await browser.newContext({ baseURL: AUTH_APP_ORIGIN })).newPage();
      await childSignsIn(fresh, body.loginCode, body.pin);
      await expect(fresh.getByText(/That login code and PIN do not match/)).toBeVisible();
      await expect(fresh).toHaveURL(/student-sign-in/);

      /* 6. The parent still sees the child on their dashboard, marked archived. */
      await parent.goto("/parent");
      await expect(parent.getByRole("status")).toContainText(/login is archived/i);

      /* 7. Restore, and the same code and PIN work again. */
      await parent.goto("/parent/children");
      await parent.getByRole("button", { name: `Restore ${childName}` }).click();
      await expect(parent.getByRole("button", { name: "Archive" })).toBeVisible();
      await expect(parent.getByRole("region", { name: "Archived children" })).toHaveCount(0);

      const back = await (await browser.newContext({ baseURL: AUTH_APP_ORIGIN })).newPage();
      await childSignsIn(back, body.loginCode, body.pin);
      await expect(back).toHaveURL(/\/student(\/|$)/);
    } finally {
      await childContext.close();
      if (childId) {
        await admin.from("parent_children").delete().eq("child_id", childId);
        await admin.auth.admin.deleteUser(childId);
      }
    }
  });
});
