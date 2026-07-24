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
      await page.goto("/parent");
      await expect(
        page.getByRole("heading", { level: 2, name: "No children linked to your account yet" }),
      ).toBeVisible();

      const childName = `E2E Add Child ${Date.now()}`;
      await page.getByLabel("Child's name").fill(childName);
      await page.getByLabel("Year level (optional)").selectOption("5");

      const createResponse = page.waitForResponse(
        (response) =>
          response.url().endsWith("/api/parent/children") && response.request().method() === "POST",
      );
      await page.getByRole("button", { name: "Create login" }).click();
      const response = await createResponse;
      expect(response.ok()).toBe(true);
      const body = (await response.json()) as { ok: boolean; loginCode?: string; pin?: string };
      expect(body.ok).toBe(true);
      expect(body.loginCode).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      expect(body.pin).toMatch(/^\d{6}$/);
      createdChildEmail = aliasEmailForDisplayedCode(body.loginCode!);

      /* Code+PIN reveal panel: shown once, never persisted client-side. */
      const revealPanel = page.getByRole("status");
      await expect(revealPanel).toContainText(
        "Account created. These are shown once — save them now and give them to your child.",
      );
      await expect(revealPanel.getByText("Login code")).toBeVisible();
      await expect(revealPanel.getByText(body.loginCode!)).toBeVisible();
      await expect(revealPanel.getByText("PIN")).toBeVisible();
      await expect(revealPanel.getByText(body.pin!)).toBeVisible();

      /* Copy button copies the formatted code+PIN and reports success. */
      const copyButton = page.getByRole("button", { name: "Copy" });
      await copyButton.click();
      await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      /* Chromium's clipboard round-trip in this automated context pads a
         couple of lines with trailing whitespace; trim per line rather than
         asserting exact bytes, since the correctness that matters here is
         the code+PIN content, not incidental trailing spaces. */
      const normalized = clipboardText
        .split("\n")
        .map((line) => line.trimEnd())
        .join("\n");
      expect(normalized).toBe(
        `MindMosaic login\nLogin code: ${body.loginCode}\nPIN: ${body.pin}`,
      );

      /* "Done" calls router.refresh(); the new child now renders. */
      await page.getByRole("button", { name: "Done — show on dashboard" }).click();
      await expect(
        page.getByRole("heading", { level: 1, name: `How ${childName} is doing` }),
      ).toBeVisible();
      /* Plain "Grade 5" also matches the still-present <option> in the
         AddChildCard form below (kept around for a second child), so match
         the dashboard's specific "Grade {n} · Read-only view..." line. */
      await expect(page.getByText(/Grade 5 · Read-only view/)).toBeVisible();
      await expect(
        page.getByRole("heading", { level: 2, name: "No children linked to your account yet" }),
      ).toHaveCount(0);

      /* A hard refresh re-fetches server-side (the page is force-dynamic)
         and still shows the child — this is real, persisted data. */
      await page.reload();
      await expect(
        page.getByRole("heading", { level: 1, name: `How ${childName} is doing` }),
      ).toBeVisible();

      /* The "Add a child" card is always still reachable for a second child. */
      await expect(page.getByRole("heading", { name: "Add a child" })).toBeVisible();
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
