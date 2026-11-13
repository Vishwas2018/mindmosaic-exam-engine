import { test, expect } from "../fixtures/auth.fixture";
import { e2eEnv } from "../fixtures/env";

/**
 * Authentication Journey E2E Tests
 *
 * Covers the new Claude Design auth screens added in Phase 2:
 *   - /auth/forgot          (forgot password request)
 *   - /auth/session-expired (session expired)
 *   - /auth/signed-out      (signed out confirmation)
 *   - /student-sign-in/help (student login help)
 *
 * Plus regression coverage for existing auth flows:
 *   - Parent sign-in / sign-out
 *   - Student code/PIN authentication
 *   - Unauthorized route access
 *
 * Tests that require a real email (signup confirmation, reset link delivery)
 * declare `needsMail()` and skip when E2E_MAILPIT_URL is not set.
 *
 * All tests use synthetic fixture identities only. No real credentials or
 * recovery tokens are exposed in screenshots or logs.
 */

const MAIL = Boolean(process.env.E2E_MAILPIT_URL);
const needsMail = () => test.skip(!MAIL, "needs a local mail catcher: set E2E_MAILPIT_URL");

test.describe("New auth screens — rendered and accessible", () => {
  test("forgot password page renders with email field and send button", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/auth/forgot");
    await expect(page.getByRole("heading", { name: /forgot your password/i })).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /send reset link/i })).toBeVisible();
    await context.close();
  });

  test("forgot password page at mobile viewport", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto("/auth/forgot");
    await expect(page.getByRole("heading", { name: /forgot your password/i })).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await context.close();
  });

  test("session expired page renders with sign-in link", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/auth/session-expired");
    await expect(page.getByRole("heading", { name: /session expired/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /back to sign in/i })).toBeVisible();
    await context.close();
  });

  test("signed-out page renders with sign-in-again link", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/auth/signed-out");
    await expect(page.getByRole("heading", { name: /^Signed out$/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /sign in again/i })).toBeVisible();
    await context.close();
  });

  test("student help page renders with parent-directed guidance", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/student-sign-in/help");
    await expect(page.getByRole("heading", { level: 1, name: /can.t sign in/i })).toBeVisible();
    await expect(page.getByText(/looked after by a grown-up/i)).toBeVisible();
    await expect(page.getByText(/Can you reset my PIN/i)).toBeVisible();
    await context.close();
  });

  test("forgot password never reveals account existence", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/auth/forgot");
    await page.getByLabel(/email address/i).fill("nonexistent@example.com");
    await page.getByRole("button", { name: /send reset link/i }).click();
    await expect(
      page.getByText(/if that email has an account/i),
    ).toBeVisible({ timeout: 10000 });
    await context.close();
  });
});

test.describe("Parent sign-in and sign-out", () => {
  test("parent signs in and can sign out, reaching signed-out screen", async ({ browser }) => {
    needsMail();
    const context = await browser.newContext();
    const page = await context.newPage();

    // /sign-in opens on the "who is signing in?" chooser; ?entry=signin opens the form directly.
    await page.goto("/sign-in?entry=signin");
    await expect(page.getByRole("tab", { name: /parent/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await page.getByLabel(/email address/i).fill("parent-no-children@e2e.mindmosaic.local");
    await page.getByLabel("Password", { exact: true }).fill(e2eEnv.fixturePassword);
    await page.getByRole("button", { name: /sign in to parent account/i }).click();
    await expect(page).toHaveURL(/\/parent/, { timeout: 15000 });

    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page.getByRole("heading", { name: /signed out/i })).toBeVisible({
      timeout: 10000,
    });
    await context.close();
  });
});

test.describe("Student code/PIN authentication", () => {
  test("student sign-in page renders code and PIN fields", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/student-sign-in");
    const studentTab = page.getByRole("tab", { name: /student/i });
    await expect(studentTab).toBeVisible({ timeout: 15000 });
    await expect(studentTab).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByLabel(/login code/i)).toBeVisible();
    await expect(page.getByRole("group", { name: "Your PIN" })).toBeVisible();
    await expect(page.getByLabel(/^Your PIN, number \d of 6$/)).toHaveCount(6);
    await context.close();
  });

  test("student help links to parent view", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/student-sign-in");
    const studentTab = page.getByRole("tab", { name: /student/i });
    await expect(studentTab).toBeVisible({ timeout: 15000 });
    await studentTab.click();
    /* The student tab has one way to get help: the help page, which tells the child to ask a grown-up and gives
       the grown-up their own way in. */
    await page.getByRole("link", { name: /i can.t sign in/i }).click();
    await expect(page).toHaveURL(/\/student-sign-in\/help$/, { timeout: 15000 });
    await expect(page.getByRole("link", { name: /a grown-up signs in/i })).toHaveAttribute("href", "/sign-in");
    await context.close();
  });
});

test.describe("Unauthorized route access", () => {
  test("unauthenticated user on /parent is redirected to sign-in", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/parent");
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 10000 });
    await context.close();
  });

  test("unauthenticated user on /student is redirected to sign-in", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/student");
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 10000 });
    await context.close();
  });
});

test.describe("Forgot password request flow", () => {
  test("submitting forgot password shows delivery acknowledgement", async ({ browser }) => {
    needsMail();
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/auth/forgot");
    await page.getByLabel(/email address/i).fill("parent-no-children@e2e.mindmosaic.local");
    await page.getByRole("button", { name: /send reset link/i }).click();
    await expect(page.getByRole("heading", { name: /check your email/i })).toBeVisible({
      timeout: 10000,
    });
    await context.close();
  });
});

test.describe("Session expired reauthentication", () => {
  test("session expired page offers sign-in path", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/auth/session-expired");
    await expect(page.getByRole("link", { name: /back to sign in/i })).toBeVisible();
    await page.click("text=/back to sign in/i");
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 10000 });
    await context.close();
  });
});