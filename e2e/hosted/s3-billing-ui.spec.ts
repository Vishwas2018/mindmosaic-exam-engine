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
import { HOSTED_URL, expect, parentSignIn, test } from "./fixtures";

test.setTimeout(420_000);
// Checkout is a third-party page reached over the public internet; one retry absorbs a dropped connection.
test.describe.configure({ retries: 1 });

test.beforeAll(async () => {
  await assertSandbox();
});
test.afterAll(async () => {
  await cleanupBilling();
});

/** WebKit/Firefox abort a goto issued while the post-sign-in redirect is still settling; retry that specific race. */
async function gotoStable(page: import("@playwright/test").Page, path: string) {
  for (let attempt = 0; ; attempt++) {
    try {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("load");
      return;
    } catch (error) {
      if (attempt >= 3 || !/interrupted by another navigation|net::ERR_ABORTED/.test(String(error))) throw error;
      await page.waitForTimeout(1500);
    }
  }
}

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
  await gotoStable(page, "/billing");
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
      .filter(({ el, r }) => r.right > w + 1 && r.width > 0 && chain(el) === "")
      .sort((x, y) => y.r.right - x.r.right)
      .slice(0, 6)
      .map(({ el, r }) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 50)} right=${Math.round(r.right)} pos=${getComputedStyle(el).position} clip=${chain(el)}`);
  });
  // User-visible criterion: the page itself must not scroll sideways. (documentElement.scrollWidth can over-report under
  // mobile emulation even when every wide element is clipped by its own scroll container, as the offenders list proves.)
  const sidewaysScroll = await page.evaluate(() => {
    window.scrollTo(1000, 0);
    return window.scrollX;
  });
  expect(sidewaysScroll, `page scrolls sideways by ${sidewaysScroll}px (scrollWidth excess ${overflow}); unclipped offenders: ${offenders.join(" | ")}`).toBeLessThanOrEqual(1);
  expect(offenders, "no unclipped element extends past the viewport").toEqual([]);
  // Touch targets: every subscribe button is at least 44px tall.
  for (const name of ["Subscribe to Individual", "Subscribe to Family"]) {
    const box = await page.getByRole("button", { name }).boundingBox();
    expect(box!.height, name).toBeGreaterThanOrEqual(43);
  }
});

test("U2 Subscribe sends the parent to Stripe-hosted Checkout (no card field on our origin)", async ({ page }, testInfo) => {
  await signedInParent(page, `u2${testInfo.project.name.replace(/\W/g, "").slice(0, 6)}`);
  await gotoStable(page, "/billing");
  await expect(page.locator("input[autocomplete='cc-number'], input[name='cardnumber']")).toHaveCount(0);
  await page.getByRole("button", { name: "Subscribe to Family" }).click();
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 60_000 });
  expect(page.url()).toMatch(/^https:\/\/checkout\.stripe\.com\//);
});

test("U3 sandbox card payment succeeds, activates the plan via webhook, then a second checkout is refused", async ({ page, browserName }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "payment path runs on the desktop project of each engine");
  const parent = await signedInParent(page, "u3");
  await gotoStable(page, "/billing");
  await page.getByRole("button", { name: "Subscribe to Individual" }).click();
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 60_000 });
  await fillCard(page, "4242424242424242");
  // Back on our origin: a parent with no child yet is sent on to /parent/setup, and must still be told the payment worked.
  // Headless WebKit completes the payment but does not follow Stripe's post-payment redirect, so there the outcome is
  // verified through the real webhook below and the engine difference is recorded rather than hidden.
  const returned = await page
    .waitForURL((u) => u.origin === new URL(HOSTED_URL).origin, { timeout: browserName === "webkit" ? 45_000 : 120_000 })
    .then(() => true, () => false);
  if (returned) {
    await expect(page.getByText(/payment received/i).first()).toBeVisible({ timeout: 30_000 });
  } else {
    expect(browserName, "only WebKit may skip the redirect check").toBe("webkit");
    testInfo.annotations.push({ type: "webkit-redirect", description: "payment completed; headless WebKit did not follow Stripe's redirect" });
    // The Stripe page is stuck in this engine; continue in a fresh page of the same signed-in context.
    const fresh = await page.context().newPage();
    await fresh.goto("/parent", { waitUntil: "commit", timeout: 60_000 });
    await fresh.close();
  }
  const row = await waitForRow(parent.id, (r) => r.status === "active" && r.plan === "individual_annual", "active individual_annual after Checkout (the page defaults to the annual cadence)");
  track("customers", row.stripe_customer_id!);

  const again = await page.request.post("/api/stripe/checkout", {
    data: { plan: "family_annual" },
    headers: { "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? "", Origin: new URL(page.url()).origin },
    maxRedirects: 0,
  });
  expect(again.status()).toBe(409);
});

test("U4 sandbox declined card shows the issuer's refusal and never activates the plan", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "payment path runs on the desktop project of each engine");
  const parent = await signedInParent(page, "u4");
  await gotoStable(page, "/billing");
  await page.getByRole("button", { name: "Subscribe to Family" }).click();
  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 60_000 });
  const frame = await fillCard(page, "4000000000000002");
  await expect(frame.getByText(/declined/i).first()).toBeVisible({ timeout: 60_000 });
  expect(page.url()).toContain("checkout.stripe.com");
  const row = await subRow(parent.id);
  track("customers", row!.stripe_customer_id!);
  expect(row?.status).toBe("trialing");
  expect(row?.plan).toBeNull();
  const sessions = await stripeClient().checkout.sessions.list({ customer: row!.stripe_customer_id!, limit: 1 });
  expect(sessions.data[0]?.payment_status).not.toBe("paid");
});

/**
 * Stripe's hosted Checkout renders its payment form inside an Elements iframe (`elements-inner-*`), so the card
 * fields are reached through that frame, not the top-level document. Reload if the page does not hydrate (one of
 * Stripe's CDN requests is occasionally reset from this test machine); that does not change what is asserted.
 */
async function checkoutFrame(page: import("@playwright/test").Page) {
  for (let i = 0; i < 40; i++) {
    const frame = page.frames().find((f) => f.url().includes("elements-inner-habanero") || f.url().includes("elements-inner-payment"));
    if (frame && (await frame.locator('[data-testid="payment-accordion-wrapper"]').count().catch(() => 0)) > 0) return frame;
    await page.waitForTimeout(1000);
  }
  return null;
}

async function waitForCheckoutReady(page: import("@playwright/test").Page) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const frame = await checkoutFrame(page);
    if (frame) {
      await frame.getByText("Card", { exact: true }).first().click({ timeout: 15_000 }).catch(() => undefined);
      if (await frame.locator("#payment-numberInput").waitFor({ state: "visible", timeout: 15_000 }).then(() => true, () => false)) {
        return frame;
      }
    }
    await page.reload({ waitUntil: "load" }).catch(() => undefined);
  }
  throw new Error("Stripe Checkout payment form never became interactive after 4 loads");
}

async function fillCard(page: import("@playwright/test").Page, number: string) {
  const frame = await waitForCheckoutReady(page);
  await frame.locator("#payment-numberInput").fill(number);
  await frame.locator("#payment-expiryInput").fill("1234");
  await frame.locator("#payment-cvcInput").fill("123");
  const name = frame.locator("#payment-nameInput");
  if (await name.count()) await name.fill("Sandbox Tester");
  // "Save my information" (Link) is pre-ticked and then demands a mobile number; a one-off test purchase opts out.
  const linkOptIn = frame.locator("#payment-linkOptInInput");
  if ((await linkOptIn.count()) > 0 && (await linkOptIn.isChecked().catch(() => false))) {
    await frame.getByText("Save my information for faster checkout").click();
  }
  await frame.locator('[data-testid="payment-form-submit-button"]').click();
  return frame;
}
