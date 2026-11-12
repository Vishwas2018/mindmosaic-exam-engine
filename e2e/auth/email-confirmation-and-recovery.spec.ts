import { test, expect } from "../fixtures/auth.fixture";
import { clearMailbox, getLatestEmail } from "../fixtures/mailpit";
import { createAdminClient } from "../fixtures/supabase-admin";

const ADMIN_CLIENT = createAdminClient();

function randomEmail(prefix = "e2e-auth"): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@mindmosaic.local`;
}

test.describe("Authentication resilience: confirmation, recovery, and access guards", () => {
  /*
   * The tests that read a real email need a local mail catcher (Mailpit) and, for confirmation, a stack with email
   * confirmations on. CI's stack has neither, so they declare it and skip there; the mail-free tests (cold access,
   * ordinary session, invalid links) always run. See docs/testing for the isolated stack used locally.
   */
  const MAIL = Boolean(process.env.E2E_MAILPIT_URL);
  const needsMail = () => test.skip(!MAIL, "needs a local mail catcher: set E2E_MAILPIT_URL");

  test.beforeEach(async () => {
    if (MAIL) await clearMailbox();
  });

  test("same-browser email confirmation using original email link", async ({ browser }) => {
    needsMail();
    const context = await browser.newContext();
    const page = await context.newPage();
    const email = randomEmail("parent-confirm");

    // 1. Visit sign-up and complete parent registration wizard
    await page.goto("/sign-up");
    await page.getByLabel(/first name/i).fill("Same");
    await page.getByLabel(/last name/i).fill("BrowserParent");
    await page.getByLabel(/email address/i).fill(email);
    await page.getByLabel(/create a password/i).fill("Str0ng!ParentPass1");
    await page.getByRole("checkbox").click();

    // Step 1 -> Step 2
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText(/step 2 of 3/i)).toBeVisible();

    // Step 2 -> Step 3: Skip student for now
    await page.getByRole("button", { name: /skip for now/i }).click();
    await expect(page.getByText(/step 3 of 3/i)).toBeVisible();

    // Step 3: Create parent account
    await page.getByRole("button", { name: "Create the account" }).click();

    // Lands on confirmation pending screen
    await expect(page.getByRole("heading", { name: /check your email/i })).toBeVisible({ timeout: 10000 });

    // 2. Capture original email from Mailpit
    const emailData = await getLatestEmail(email);
    expect(emailData.subject).toMatch(/confirm your email/i);
    expect(emailData.link).toBeTruthy();

    // 3. Follow original email link in SAME browser context
    await page.goto(emailData.link);

    // Should verify and redirect to /parent
    await expect(page.getByText(/email confirmed/i)).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/\/parent/, { timeout: 15000 });
    await expect(page).toHaveTitle(/Parent dashboard|Family Overview/);

    // The session this link created is a signup session, not a recovery session: the reset form stays closed.
    await page.goto("/auth/reset");
    await expect(page.getByRole("heading", { name: /open your reset link/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel("New password", { exact: true })).not.toBeVisible();

    await context.close();
  });

  test("cross-browser email confirmation via original link", async ({ browser }) => {
    needsMail();
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const email = randomEmail("cross-browser-parent");

    // Sign up in Context A
    await pageA.goto("/sign-up");
    await pageA.getByLabel(/first name/i).fill("Cross");
    await pageA.getByLabel(/last name/i).fill("DeviceParent");
    await pageA.getByLabel(/email address/i).fill(email);
    await pageA.getByLabel(/create a password/i).fill("Str0ng!ParentPass1");
    await pageA.getByRole("checkbox").click();

    await pageA.getByRole("button", { name: "Continue" }).click();
    await expect(pageA.getByText(/step 2 of 3/i)).toBeVisible();

    await pageA.getByRole("button", { name: /skip for now/i }).click();
    await expect(pageA.getByText(/step 3 of 3/i)).toBeVisible();

    await pageA.getByRole("button", { name: "Create the account" }).click();

    await expect(pageA.getByRole("heading", { name: /check your email/i })).toBeVisible({ timeout: 10000 });

    // Capture email from Mailpit
    const emailData = await getLatestEmail(email);
    expect(emailData.link).toBeTruthy();

    // Open in Context B (different browser context with clean storage)
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await pageB.goto(emailData.link);

    if (process.env.E2E_TOKEN_HASH_TEMPLATES === "1") {
      // token_hash template: device-independent confirmation succeeds and redirects to /parent
      await expect(pageB.getByText(/email confirmed/i)).toBeVisible({ timeout: 10000 });
      await expect(pageB).toHaveURL(/\/parent/, { timeout: 15000 });
      await expect(pageB).toHaveTitle(/Parent dashboard|Family Overview/);
    } else {
      // Default PKCE template: the link is bound to context A. B must be told so, focused and offered a resend,
      // and must not end up signed in.
      const heading = pageB.getByRole("heading", { name: /link expired or invalid/i });
      await expect(heading).toBeVisible({ timeout: 10000 });
      await expect(heading).toBeFocused();
      await expect(pageB.getByText(/opened on a different device or browser/i)).toBeVisible();
      expect(pageB.url()).not.toMatch(/\/parent/);
    }

    await contextA.close();
    await contextB.close();
  });

  test("cross-device PKCE failure displays actionable message and supports resend", async ({ browser }) => {
    needsMail();
    const context = await browser.newContext();
    const page = await context.newPage();
    const email = randomEmail("pkce-resend");

    // Visit /auth/confirm with a simulated foreign PKCE code in a fresh browser
    await page.goto(`/auth/confirm?code=foreign-unmatched-pkce-code&email=${encodeURIComponent(email)}`);

    // Must show clear cross-device problem message and focus the heading
    const heading = page.getByRole("heading", { name: /link expired or invalid/i });
    await expect(heading).toBeVisible({ timeout: 5000 });
    await expect(heading).toBeFocused();
    await expect(page.getByText(/opened on a different device or browser/i)).toBeVisible();

    // Resend form is prefilled with email
    const emailInput = page.getByLabel(/email address/i);
    await expect(emailInput).toHaveValue(email);

    // First ensure the user exists so resend can trigger
    await ADMIN_CLIENT.auth.admin.createUser({
      email,
      password: "TempPassword123!",
      email_confirm: false,
      user_metadata: { display_name: "PKCE Resend User", role: "parent" },
    });

    // Submit resend
    await clearMailbox();
    await page.getByRole("button", { name: /resend verification email/i }).click();

    await expect(page.getByText(/confirmation email resent/i)).toBeVisible({ timeout: 8000 });

    // Verify fresh email arrived in Mailpit
    const resentEmail = await getLatestEmail(email);
    expect(resentEmail.subject).toMatch(/confirm your email/i);
    expect(resentEmail.link).toBeTruthy();

    await context.close();
  });

  test("successful password recovery and login with the new password", async ({ browser }) => {
    needsMail();
    const email = randomEmail("recovery-parent");
    const initialPassword = "OldPassword123!";
    const newPassword = "NewStrongPassword456!";

    // Create and confirm user in Supabase
    const { data: created, error: createError } = await ADMIN_CLIENT.auth.admin.createUser({
      email,
      password: initialPassword,
      email_confirm: true,
      user_metadata: { display_name: "Recovery Parent", role: "parent" },
    });
    expect(createError).toBeNull();
    expect(created.user).toBeTruthy();

    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Visit forgot password screen and request reset
    await page.goto("/sign-in?mode=forgot");
    await page.getByLabel("Email address").fill(email);
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText(/reset link is on its way/i)).toBeVisible();

    // 2. Capture reset email from Mailpit
    const resetEmail = await getLatestEmail(email);
    expect(resetEmail.subject).toMatch(/reset your password/i);
    expect(resetEmail.link).toBeTruthy();

    // 3. Open reset link
    await page.goto(resetEmail.link);

    // Form appears
    await expect(page.getByRole("heading", { name: "Choose a new password" })).toBeVisible({ timeout: 10000 });

    // Reload the page: the recovery session remains verified and form stays available
    await page.reload();
    await expect(page.getByRole("heading", { name: "Choose a new password" })).toBeVisible({ timeout: 10000 });

    // 4. Submit new password
    await page.getByLabel("New password", { exact: true }).fill(newPassword);
    await page.getByLabel("Confirm new password").fill(newPassword);
    await page.getByRole("button", { name: "Update password" }).click();

    await page.waitForURL(/\/sign-in/, { timeout: 15000 });

    // 5. Sign in with the NEW password
    await page.getByLabel(/email address/i).fill(email);
    await page.getByLabel(/password/i).fill(newPassword);
    await page.getByRole("button", { name: /sign in to parent account/i }).click();

    // Successfully reaches parent dashboard
    await expect(page).toHaveURL(/\/parent/, { timeout: 15000 });
    await expect(page).toHaveTitle(/Parent dashboard|Family Overview/);

    // 6. Navigating back to /auth/reset is now an ordinary session (recovery state was cleaned up)
    await page.goto("/auth/reset");
    await expect(page.getByRole("heading", { name: /open your reset link/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByLabel("New password", { exact: true })).not.toBeVisible();

    await context.close();
  });

  test("cold /auth/reset access displays lockout and does not render form", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Anonymous direct navigation to /auth/reset
    await page.goto("/auth/reset");

    const heading = page.getByRole("heading", { name: /open your reset link/i });
    await expect(heading).toBeVisible({ timeout: 15000 });
    await expect(heading).toBeFocused();
    await expect(page.getByLabel("New password", { exact: true })).not.toBeVisible();
    await expect(page.getByRole("link", { name: /request a new reset link/i })).toBeVisible();

    await context.close();
  });

  test("ordinary authenticated session cannot bypass recovery requirements", async ({ contextAs }) => {
    // Context signed in as normal parent
    const context = await contextAs("parent-no-children");
    const page = await context.newPage();

    // Navigate cold to /auth/reset while logged in
    await page.goto("/auth/reset");

    const heading = page.getByRole("heading", { name: /open your reset link/i });
    await expect(heading).toBeVisible({ timeout: 15000 });
    await expect(heading).toBeFocused();
    await expect(page.getByLabel("New password", { exact: true })).not.toBeVisible();
    await expect(page.getByRole("link", { name: /request a new reset link/i })).toBeVisible();
  });

  test("authenticated ordinary session opening an invalid PKCE link cannot access reset form", async ({ contextAs }) => {
    // Context signed in as normal parent
    const context = await contextAs("parent-no-children");
    const page = await context.newPage();

    await page.goto("/auth/reset?code=invalid-foreign-pkce-code");

    // The form is never shown
    await expect(page.getByLabel("New password", { exact: true })).not.toBeVisible();
    // After timeout, problem state is shown with error focus
    const heading = page.getByRole("heading", { name: /link expired or invalid/i });
    await expect(heading).toBeVisible({ timeout: 15000 });
    await expect(heading).toBeFocused();
    await expect(page.getByLabel("New password", { exact: true })).not.toBeVisible();
  });

  test("invalid, expired, and reused recovery links display clear problem states with error focus", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Explicit expired param
    await page.goto("/auth/reset?error_code=otp_expired");
    const headingExpired = page.getByRole("heading", { name: /link expired or invalid/i });
    await expect(headingExpired).toBeVisible({ timeout: 15000 });
    await expect(headingExpired).toBeFocused();
    await expect(page.getByText(/this password reset link has expired/i)).toBeVisible();
    await expect(page.getByLabel("New password", { exact: true })).not.toBeVisible();

    // 2. Invalid recovery token_hash
    await page.goto("/auth/reset?token_hash=invalid-token-12345&type=recovery");
    const headingInvalid = page.getByRole("heading", { name: /link expired or invalid/i });
    await expect(headingInvalid).toBeVisible({ timeout: 15000 });
    await expect(headingInvalid).toBeFocused();
    await expect(page.getByLabel("New password", { exact: true })).not.toBeVisible();

    await context.close();
  });

  test("a recovery link cannot be used twice", async ({ browser }) => {
    needsMail();
    const email = randomEmail("recovery-reuse");
    await ADMIN_CLIENT.auth.admin.createUser({
      email,
      password: "OldPassword123!",
      email_confirm: true,
      user_metadata: { display_name: "Reuse Parent", role: "parent" },
    });

    const requester = await browser.newContext();
    const requesterPage = await requester.newPage();
    await requesterPage.goto("/sign-in?mode=forgot");
    await requesterPage.getByLabel("Email address").fill(email);
    await requesterPage.getByRole("button", { name: "Send reset link" }).click();
    await expect(requesterPage.getByText(/reset link is on its way/i)).toBeVisible();
    const resetEmail = await getLatestEmail(email);

    // First use, same browser: succeeds and opens the form.
    await requesterPage.goto(resetEmail.link);
    await expect(requesterPage.getByRole("heading", { name: "Choose a new password" })).toBeVisible({ timeout: 10000 });
    await requester.close();

    // Second use, fresh browser: the link is spent. The page must not offer a form.
    const fresh = await browser.newContext();
    const freshPage = await fresh.newPage();
    await freshPage.goto(resetEmail.link);
    const heading = freshPage.getByRole("heading", { name: /link expired or invalid/i });
    await expect(heading).toBeVisible({ timeout: 10000 });
    await expect(heading).toBeFocused();
    await expect(freshPage.getByLabel("New password", { exact: true })).not.toBeVisible();
    await fresh.close();
  });

  // Needs a stack whose recovery email template links to /auth/reset?token_hash=…&type=recovery (the DEV target
  // configuration). With the default PKCE template the same scenario is the "different device" message tested above.
  test("recovery opened on a DIFFERENT device completes when the email carries a token_hash", async ({ browser }) => {
    needsMail();
    test.skip(process.env.E2E_TOKEN_HASH_TEMPLATES !== "1", "requires token_hash email templates");
    const email = randomEmail("recovery-xdevice");
    const newPassword = "CrossDevice-New-789!";
    await ADMIN_CLIENT.auth.admin.createUser({
      email,
      password: "OldPassword123!",
      email_confirm: true,
      user_metadata: { display_name: "Cross Device Parent", role: "parent" },
    });

    const laptop = await browser.newContext();
    const laptopPage = await laptop.newPage();
    await laptopPage.goto("/sign-in?mode=forgot");
    await laptopPage.getByLabel("Email address").fill(email);
    await laptopPage.getByRole("button", { name: "Send reset link" }).click();
    await expect(laptopPage.getByText(/reset link is on its way/i)).toBeVisible();
    const resetEmail = await getLatestEmail(email);
    expect(resetEmail.link).toContain("token_hash=");
    await laptop.close();

    // A completely separate browser context: no cookies, no storage, no code verifier.
    const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const phonePage = await phone.newPage();
    await phonePage.goto(resetEmail.link);
    await expect(phonePage.getByRole("heading", { name: "Choose a new password" })).toBeVisible({ timeout: 15000 });
    // The single-use credential is gone from the address bar.
    expect(phonePage.url()).not.toContain("token_hash");

    await phonePage.getByLabel("New password", { exact: true }).fill(newPassword);
    await phonePage.getByLabel("Confirm new password").fill(newPassword);
    await phonePage.getByRole("button", { name: "Update password" }).click();
    await phonePage.waitForURL(/\/sign-in/, { timeout: 10000 });

    await phonePage.getByLabel(/email address/i).fill(email);
    await phonePage.getByLabel(/password/i).fill(newPassword);
    await phonePage.getByRole("button", { name: /sign in to parent account/i }).click();
    await expect(phonePage).toHaveURL(/\/parent/, { timeout: 15000 });
    await phone.close();
  });

  test("signup confirmation opened on a DIFFERENT device completes when the email carries a token_hash", async ({ browser }) => {
    needsMail();
    test.skip(process.env.E2E_TOKEN_HASH_TEMPLATES !== "1", "requires token_hash email templates");
    const email = randomEmail("confirm-xdevice");
    const laptop = await browser.newContext();
    const laptopPage = await laptop.newPage();
    await laptopPage.goto("/sign-up");
    await laptopPage.getByLabel(/first name/i).fill("Cross");
    await laptopPage.getByLabel(/last name/i).fill("Device");
    await laptopPage.getByLabel(/email address/i).fill(email);
    await laptopPage.getByLabel(/create a password/i).fill("Str0ng!ParentPass1");
    await laptopPage.getByRole("checkbox").click();
    await laptopPage.getByRole("button", { name: "Continue" }).click();
    await laptopPage.getByRole("button", { name: /skip for now/i }).click();
    await laptopPage.getByRole("button", { name: "Create the account" }).click();
    await expect(laptopPage.getByRole("heading", { name: /check your email/i })).toBeVisible({ timeout: 10000 });
    const mail = await getLatestEmail(email);
    expect(mail.link).toContain("token_hash=");
    await laptop.close();

    const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const phonePage = await phone.newPage();
    await phonePage.goto(mail.link);
    await expect(phonePage.getByText(/email confirmed/i)).toBeVisible({ timeout: 15000 });
    await expect(phonePage).toHaveURL(/\/parent/, { timeout: 15000 });
    expect(phonePage.url()).not.toContain("token_hash");
    await phone.close();
  });
});
