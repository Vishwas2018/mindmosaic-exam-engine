/**
 * Scenario A — parent registration and onboarding on the hosted DEV Preview.
 *
 * Email delivery is real: the parent signs up with a plus-address on an inbox the operator can read
 * (HOSTED_MAIL_BASE), the operator copies the link from the email Supabase sent into the run directory, and the
 * test opens it in the same browser. No link is minted by the service role.
 */
import fs from "node:fs";
import path from "node:path";

import {
  HOSTED_URL,
  STRONG_PASSWORD,
  devAdmin,
  parentSignIn,
  seededEmail,
  expect,
  findUserByEmail,
  syntheticEmail,
  test,
  waitForMailedLink,
} from "./fixtures";

export const STATE_FILE = path.join(process.env.HOSTED_OUTPUT ?? "test-results/hosted", "family-a.json");

test.describe.configure({ mode: "serial" });

test("A1–A2: parent registers through the form and confirms with the mailed link", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "registration runs once");
  test.skip(!process.env.HOSTED_MAIL_BASE, "needs an inbox the operator can read (HOSTED_MAIL_BASE)");
  const email = syntheticEmail("pa");
  const shot = (name: string) => page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true });

  // A1 register
  await page.goto("/sign-up");
  await page.getByLabel(/first name/i).fill("Accept");
  await page.getByLabel(/last name/i).fill("ParentA");
  await page.getByLabel(/email address/i).fill(email);
  await page.getByLabel(/create a password/i).fill(STRONG_PASSWORD);
  await page.getByRole("checkbox").first().check();
  await shot("a1-signup-step1");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText(/step 2 of 3/i)).toBeVisible();
  await page.getByRole("button", { name: /skip for now/i }).click();
  await expect(page.getByText(/step 3 of 3/i)).toBeVisible();
  await page.getByRole("button", { name: "Create the account" }).click();
  await expect(page.getByRole("heading", { name: /check your email/i })).toBeVisible();
  await shot("a1-check-email");

  const user = await findUserByEmail(email);
  expect(user, "the account exists on DEV").toBeTruthy();
  expect(user!.email_confirmed_at ?? null, "not confirmed before the link is opened").toBeNull();

  // A1b: signing in before confirming is refused with a useful message
  await parentSignIn(page, email, STRONG_PASSWORD);
  await expect(page.getByText(/confirm|verify/i).first()).toBeVisible();
  await shot("a1b-unconfirmed-signin");

  // A2 verify email with the link Supabase actually mailed, opened in this browser
  const link = await waitForMailedLink("pa");
  expect(new URL(link).host, "mailed link points at Supabase or this Preview").toMatch(
    /mfglzabnayacssgertat\.supabase\.co|vercel\.app$/,
  );
  const redirectTo = new URL(link).searchParams.get("redirect_to");
  if (redirectTo) {
    expect(new URL(redirectTo).origin, "the email sends the parent back to this Preview, not another site").toBe(
      new URL(HOSTED_URL).origin,
    );
  }
  await page.goto(link);
  await expect(page).toHaveURL(/\/parent/, { timeout: 45_000 });
  await shot("a2-confirmed-landing");
  expect((await findUserByEmail(email))!.email_confirmed_at).toBeTruthy();
});

/**
 * A3–A11 on a parent seeded already confirmed by the DEV service role (same metadata the sign-up form sends, so
 * the on_auth_user_created trigger makes the same profile). Runs whether or not A1–A2 could send email, so a mail
 * outage does not hide defects in the rest of the journey.
 */
test("A3–A11: confirmed parent signs in, adds a child, prints a card, signs out and back in", async ({
  page,
  consoleErrors,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "the family is created once; other viewports reuse it");
  const email = seededEmail("pa");
  const shot = (name: string) => page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true });
  const { error: seedError } = await devAdmin().auth.admin.createUser({
    email,
    password: STRONG_PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: "Accept ParentA", role: "parent" },
  });
  expect(seedError, "seed confirmed parent").toBeNull();

  // A3 sign in
  await parentSignIn(page, email, STRONG_PASSWORD);
  await expect(page).toHaveURL(/\/parent/, { timeout: 30_000 });
  await shot("a3-parent-home");

  // A4 add a child
  const childName = `Ava ${testInfo.workerIndex}${Date.now().toString(36).slice(-4)}`;
  await page.goto("/parent/children");
  await shot("a4-children-before");
  // A5: the parent sets the PIN themselves (the optional field), rather than taking a generated one
  const chosenPin = "482917";
  await page.getByLabel("Child's name").fill(childName);
  await page.getByLabel("Year level (optional)").selectOption({ label: "Year 3" });
  await page.getByLabel("PIN (optional)").fill(chosenPin);
  const created = page.waitForResponse(
    (r) => r.url().endsWith("/api/parent/children") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Create login" }).click();
  const res = await created;
  expect(res.ok(), `create child ${res.status()}`).toBe(true);
  const body = (await res.json()) as { ok: boolean; loginCode?: string; pin?: string; childId?: string };
  expect(body.loginCode).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  expect(body.pin).toMatch(/^\d{6}$/);
  expect(body.pin, "the PIN the parent chose is the one issued").toBe(chosenPin);
  // A5/A6: code + PIN shown once
  await expect(page.getByText(body.loginCode!).first()).toBeVisible();
  await expect(page.getByText(body.pin!).first()).toBeVisible();
  await shot("a5-code-pin-reveal");

  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(
    STATE_FILE,
    JSON.stringify({ email, password: STRONG_PASSWORD, childName, loginCode: body.loginCode, pin: body.pin }, null, 2),
  );

  await page.getByRole("button", { name: /done/i }).first().click().catch(() => {});
  await page.reload();
  await expect(page.getByText(childName).first()).toBeVisible();

  // A7/A8 sign-in card: real code, real address, and printing produces the card alone
  await page.evaluate(() => { window.print = () => {}; });
  await page.getByRole("button", { name: `Print ${childName}’s sign-in card` }).click();
  const dialog = page.getByRole("dialog", { name: "Student sign-in card" });
  await expect(dialog).toBeVisible();
  const card = page.locator("#student-signin-card");
  await expect(card).toContainText(body.loginCode!);
  await expect(card).not.toContainText("CODE-SET");
  await expect(card).not.toContainText(body.pin!); // the PIN is never printed on the card
  await page.screenshot({ path: testInfo.outputPath("a7-signin-card-dialog.png") });
  await dialog.getByRole("button", { name: /print card/i }).click();
  await page.emulateMedia({ media: "print" });
  await expect(card).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Children" }), "page behind the card is not printed").toBeHidden();
  await expect(dialog.getByRole("button", { name: /print card/i }), "dialog buttons are not printed").toBeHidden();
  const pdf = await page.pdf({ format: "A4", printBackground: true });
  fs.writeFileSync(testInfo.outputPath("a8-signin-card.pdf"), pdf);
  await page.screenshot({ path: testInfo.outputPath("a8-signin-card-print-media.png") });
  await page.emulateMedia({ media: "screen" });
  await dialog.getByRole("button", { name: "Close" }).last().click();
  await expect(dialog).toBeHidden();

  // A9 sign out
  await page.goto("/parent");
  const signOut = page.getByRole("button", { name: /sign out|log out/i }).first();
  if (!(await signOut.isVisible().catch(() => false))) {
    await page.getByRole("button", { name: /account|menu|profile/i }).first().click();
  }
  await page.getByRole("button", { name: /sign out|log out/i }).first().click();
  await expect(page).not.toHaveURL(/\/parent/, { timeout: 20_000 });
  await page.goto("/parent");
  await expect(page).toHaveURL(/sign-in/, { timeout: 20_000 });
  await shot("a9-signed-out-guard");

  // A10/A11 sign back in; the child is still linked
  await parentSignIn(page, email, STRONG_PASSWORD);
  await expect(page).toHaveURL(/\/parent/, { timeout: 30_000 });
  await expect(page.getByText(childName).first()).toBeVisible();
  await shot("a11-child-still-linked");

  testInfo.annotations.push({ type: "console-errors", description: String(consoleErrors.length) });
  fs.writeFileSync(testInfo.outputPath("console-errors.json"), JSON.stringify(consoleErrors, null, 2));
});
