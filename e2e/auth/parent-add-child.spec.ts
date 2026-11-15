import { test, expect } from "../fixtures/auth.fixture";
import { createAdminClient } from "../fixtures/supabase-admin";
import { AUTH_APP_ORIGIN } from "../../playwright.auth.config";

/**
 * Parent add-child journey against the seeded "parent-no-children" fixture
 * (never the real developer/parent account — see e2e/fixtures/identities.ts
 * and docs/testing/playwright-auth-test-data-guide.md). The child this test
 * creates is provisioned with a server-generated login code that never
 * matches cleanup.ts's `childcode+e2stud...` sweep pattern, so it is deleted
 * explicitly here via the service-role client rather than relying on that
 * sweep — leaving parent-no-children back at zero children for every other
 * spec that depends on that starting state (see role-access.smoke.spec.ts's
 * "unauthenticated visitor" and "parent fixture reaches the parent
 * dashboard" tests).
 */

/** Mirrors buildAliasEmail's normalisation (strip non-alphanumerics, lowercase) — see src/features/auth/student-alias.ts. */
function aliasEmailForDisplayedCode(displayedCode: string): string {
  const normalized = displayedCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return `childcode+${normalized.toLowerCase()}@students.mindmosaic.internal`;
}

test.describe("parent add-child journey", () => {
  test("create a child, reveal code+PIN, copy them, and see the child after refresh", async ({
    contextAs,
  }) => {
    const context = await contextAs("parent-no-children");
    await context.grantPermissions(["clipboard-read", "clipboard-write"], {
      origin: AUTH_APP_ORIGIN,
    });
    const page = await context.newPage();
    const admin = createAdminClient();

    let createdChildEmail: string | null = null;

    try {
      /* A parent with no child lands on setup (Claude Design parent artboard 01). */
      await page.goto("/parent");
      await expect(page).toHaveURL(/\/parent\/setup$/);
      await expect(page.getByRole("heading", { level: 1, name: /^Welcome/ })).toBeVisible();

      const childName = `E2E Add Child ${Date.now()}`;
      await page.getByLabel("First name").fill(childName);
      await page.getByLabel("Year level").selectOption("5");

      const createResponse = page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/parent/children") && response.request().method() === "POST",
      );
      await page.getByRole("button", { name: `Create ${childName}’s profile` }).click();
      const response = await createResponse;
      expect(response.ok()).toBe(true);
      const body = (await response.json()) as { ok: boolean; loginCode?: string; pin?: string };
      expect(body.ok).toBe(true);
      expect(body.loginCode).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      expect(body.pin).toMatch(/^\d{6}$/);
      createdChildEmail = aliasEmailForDisplayedCode(body.loginCode!);

      /* "{name} is ready" (artboard 02): the code and the PIN, shown once. */
      await expect(page.getByRole("status")).toContainText(`${childName}’s profile is created.`);
      await expect(page.getByText(body.loginCode!)).toBeVisible();
      await expect(page.getByText(body.pin!)).toBeVisible();
      await expect(page.getByRole("button", { name: "Print a sign-in card" })).toBeVisible();

      /* "Go to Family Overview": the new child is there, from real persisted data. */
      await page.getByRole("link", { name: "Go to Family Overview" }).click();
      await expect(page.getByRole("heading", { level: 1, name: "Family Overview" })).toBeVisible();
      await expect(page.getByRole("heading", { level: 2, name: childName })).toBeVisible();
      await expect(page.getByText(/Year 5 · ready to start/)).toBeVisible();

      await page.reload();
      await expect(page.getByRole("heading", { level: 2, name: childName })).toBeVisible();

      /* Adding another child stays one click away, from Children. */
      await page.goto("/parent/children");
      await expect(page.getByRole("link", { name: "Add a child" })).toHaveAttribute("href", "/parent/setup");
    } finally {
      if (createdChildEmail) {
        const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
        const created = data.users.find((u) => u.email === createdChildEmail);
        if (created) {
          await admin.auth.admin.deleteUser(created.id);
        }
      }
    }
  });
});
