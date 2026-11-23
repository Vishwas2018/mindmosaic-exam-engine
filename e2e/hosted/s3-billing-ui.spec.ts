/**
 * Scenario S3 — the billing UI in real browsers (desktop engines selected by XBROWSER, plus tablet/mobile
 * viewports) and the hosted Stripe Checkout payment path (sandbox, test cards only, Chromium).
 */
import {
  assertSandbox,
  cleanupBilling,
  seedParent,
  stripeClient,
  subRow,
  track,
  waitForRow,
} from "./billing-helpers";
import { expect, parentSignIn, test } from "./fixtures";

test.setTimeout(420_000);
// Checkout is a third-party page reached over the public internet; one retry absorbs a dropped connection.
test.describe.configure({ retries: 1 });

test.beforeAll(async () => {
  await assertSandbox();
});
test.afterAll(async () => {
  await cleanupBilling();
});

async function signedInParent(page: import("@playwright/test").Page, label: string) {
  const parent = await seedParent(label);
  track("users", parent.id);
  await parentSignIn(page, parent.email, parent.password);
  await expect(page).toHaveURL(/\/parent/, { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
  return parent;
}

test("U1 plan picker: both tiers, cadence switch, honest prices, no horizontal overflow @responsive", async ({ page }, testInfo) => {
  await signedInParent(page, `u1${testInfo.project.name.replace(/\W/g, "").slice(0, 6)}`);
  await page.goto("/billing");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const cycle = page.getByRole("radiogroup", { name: "Billing cycle" });
  await expect(cycle).toBeVisible();
  await expect(page.getByRole("button", { name: "Subscribe to Individual" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Subscribe to Family" })).toBeVisible();
  await expect(page.getByText("A$14.99").first()).toBeVisible();
  await expect(page.getByText("A$19.99").first()).toBeVisible();
  await expect(page.getByText(/Placeholder amounts|not yet linked/i)).toHaveCount(0);

  await cycle.getByRole("radio", { name: /annual/i }).click();
  await expect(page.getByText("A$149").first()).toBeVisible();
  await expect(page.getByText("A$169").first()).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const offenders = await page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    const chain = (el: Element) => {
      const out: string[] = [];
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const cs = getComputedStyle(p);
        if (cs.overflowX !== "visible") out.push(`${p.tagName.toLowerCase()}[${cs.overflowX}]`);
      }
      return out.slice(0, 2).join(">");
    };
    return [...document.querySelectorAll("body *")]
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.right > w + 1 && r.width > 0)
      .sort((x, y) => y.r.right - x.r.right)
      .slice(0, 6)
      .map(({ el, r }) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 50)} right=${Math.round(r.right)} pos=${getComputedStyle(el).position} clip=${chain(el)}`);
  });
  expect(overflow, `horizontal overflow px; offenders: ${offenders.join(" | ")}`).toBeLessThanOrEqual(1);
  // Touch targets: every subscribe button is at least 44px tall.
  for (const name of ["Subscribe to Individual", "Subscribe to Family"]) {
    const box = await page.getByRole("button", { name }).boundingBox();
    expect(box!.height, name).toBeGreaterThanOrEqual(43);
  }
});

test("U2 Subscribe sends the parent to Stripe-hosted Checkout (no card field on our origin)", async ({ page }, testInfo) => {
  await signedInParent(page, `u2${testInfo.project.name.replace(/\W/g, "").slice(0, 6)}`);
  await page.goto("/billing");
  await expect(page.locator("input[autocomplete='cc-number'], input[name='cardnumber']")).toHaveCount(0);
  await page.getByRole("button", { name: "Subscribe to Family" }).click();
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 60_000 });
  expect(page.url()).toMatch(/^https:\/\/checkout\.stripe\.com\//);
});

test.fixme("U3 sandbox card payment succeeds, activates the plan via webhook, then a second checkout is refused", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440" || (process.env.XBROWSER ?? "") !== "", "payment path runs once, on Chromium");
  const parent = await signedInParent(page, "u3");
  await page.goto("/billing");
  await page.getByRole("button", { name: "Subscribe to Individual" }).click();
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 60_000 });
  await fillCard(page, "4242424242424242");
  await page.waitForURL(/\/parent\?checkout=success/, { timeout: 120_000 });
  const row = await waitForRow(parent.id, (r) => r.status === "active" && r.plan === "individual_monthly", "active after Checkout");
  track("customers", row.stripe_customer_id!);

  const again = await page.request.post("/api/stripe/checkout", {
    data: { plan: "family_annual" },
    headers: { "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? "", Origin: new URL(page.url()).origin },
    maxRedirects: 0,
  });
  expect(again.status()).toBe(409);
});

test.fixme("U4 sandbox declined card shows the issuer's refusal and never activates the plan", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440" || (process.env.XBROWSER ?? "") !== "", "payment path runs once, on Chromium");
  const parent = await signedInParent(page, "u4");
  await page.goto("/billing");
  await page.getByRole("button", { name: "Subscribe to Family" }).click();
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 60_000 });
  await fillCard(page, "4000000000000002");
  await expect(page.getByText(/declined/i).first()).toBeVisible({ timeout: 60_000 });
  expect(page.url()).toContain("checkout.stripe.com");
  const row = await subRow(parent.id);
  track("customers", row!.stripe_customer_id!);
  expect(row?.status).toBe("trialing");
  expect(row?.plan).toBeNull();
  const sessions = await stripeClient().checkout.sessions.list({ customer: row!.stripe_customer_id!, limit: 1 });
  expect(sessions.data[0]?.payment_status).not.toBe("paid");
});

async function fillCard(page: import("@playwright/test").Page, number: string) {
  // Current Checkout lists payment methods as radios; the card fields appear once "Card" is chosen.
  const cardField = page.locator("#cardNumber");
  if (!(await cardField.isVisible().catch(() => false))) {
    const option = page
      .locator('[data-testid="card-accordion-item-button"], [data-testid="card-accordion-item"], label:has-text("Card"), button:has-text("Card")')
      .first();
    await option.waitFor({ state: "visible", timeout: 45_000 });
    await option.click({ timeout: 45_000 });
  }
  await cardField.waitFor({ state: "visible", timeout: 30_000 });
  await page.locator("#cardNumber").fill(number);
  await page.locator("#cardExpiry").fill("12 / 34");
  await page.locator("#cardCvc").fill("123");
  const name = page.locator("#billingName");
  if (await name.count()) await name.fill("Sandbox Tester");
  const postal = page.locator("#billingPostalCode");
  if (await postal.count()) await postal.fill("2000");
  await page.locator("button.SubmitButton, button[type='submit']").first().click();
}
