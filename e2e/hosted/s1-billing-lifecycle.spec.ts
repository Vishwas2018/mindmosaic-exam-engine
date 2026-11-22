/**
 * Scenario S1 — subscription lifecycle against the Stripe SANDBOX and the DEV Preview.
 *
 * Real Stripe objects (test clocks, customers, subscriptions, invoices) drive real webhook deliveries to the
 * Preview, which write DEV Supabase. Nothing here mocks Stripe or the database. Time-dependent behaviour uses
 * Stripe test clocks; no real payment is ever made (test card tokens only).
 */
import {
  advanceToRenewal,
  assertSandbox,
  cleanupBilling,
  clockedCustomer,
  hasAccess,
  seedParent,
  stripeClient,
  subRow,
  subscribe,
  track,
  waitForRow,
  priceId,
} from "./billing-helpers";
import { api, expect, parentSignIn, test } from "./fixtures";

test.describe.configure({ mode: "serial" });
test.setTimeout(900_000);

test.beforeAll(async () => {
  await assertSandbox();
});
test.afterAll(async () => {
  await cleanupBilling();
});

const DAY = 86_400_000;

test("L1 Family monthly: pay, renew, cancel at period end, resume, expire", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  const parent = await seedParent("l1");
  track("users", parent.id);
  const c = await clockedCustomer(parent);
  track("clocks", c.clockId);

  // Trial parent: no paid plan yet.
  expect((await subRow(parent.id))?.status).toBe("trialing");

  // Successful payment -> webhook -> active, plan mapped from the price, access granted.
  const sub = await subscribe(c, "family_monthly");
  expect(sub.status).toBe("active");
  const active = await waitForRow(parent.id, (r) => r.status === "active" && r.plan === "family_monthly", "active family_monthly");
  expect(active.stripe_subscription_id).toBe(sub.id);
  expect(await hasAccess(parent.id)).toBe(true);
  const firstEnd = Date.parse(active.current_period_end!);

  // Renewal: advance one period; the new period end must land ~1 month later.
  await advanceToRenewal(c.clockId, sub.id, 1);
  const renewed = await waitForRow(
    parent.id,
    (r) => r.status === "active" && Date.parse(r.current_period_end!) > firstEnd + 25 * DAY,
    "renewal advanced current_period_end",
  );
  expect(renewed.plan).toBe("family_monthly");

  // Cancellation through the app (cancel at period end keeps access until then).
  await parentSignIn(page, parent.email, parent.password);
  await expect(page).toHaveURL(/\/parent/, { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
  const cancel = await api(page).post("/api/stripe/cancel", {});
  expect(cancel.status()).toBe(200);
  expect((await cancel.json()).cancelAtPeriodEnd).toBe(true);
  expect((await subRow(parent.id))?.status, "still active until the period ends").toBe("active");
  expect(await hasAccess(parent.id)).toBe(true);

  // Resume then cancel again, to prove both routes act on the caller's own subscription.
  const resume = await api(page).post("/api/stripe/resume", {});
  expect(resume.status()).toBe(200);
  expect((await api(page).post("/api/stripe/cancel", {})).status()).toBe(200);

  // Expiry: advance past the period end; Stripe deletes the subscription -> canceled, no access.
  await advanceToRenewal(c.clockId, sub.id, 1);
  await waitForRow(parent.id, (r) => r.status === "canceled", "canceled after period end");
  expect(await hasAccess(parent.id)).toBe(false);
});

test("L1b failed renewal: access follows Stripe's dunning outcome, and a paid invoice recovers a past_due subscription", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  const stripe = stripeClient();
  const parent = await seedParent("l1b");
  track("users", parent.id);
  const c = await clockedCustomer(parent);
  track("clocks", c.clockId);
  const sub = await subscribe(c, "family_monthly");
  await waitForRow(parent.id, (r) => r.status === "active", "active before the failing renewal");

  const bad = await stripe.paymentMethods.attach("pm_card_chargeCustomerFail", { customer: c.customerId });
  await stripe.customers.update(c.customerId, { invoice_settings: { default_payment_method: bad.id } });
  await advanceToRenewal(c.clockId, sub.id, 1);

  // The sandbox's dunning settings decide whether this lands on past_due (retrying) or canceled (retries exhausted).
  // Either is a legitimate Stripe outcome; the app must mirror it and never leave a failed payer "active".
  const row = await waitForRow(parent.id, (r) => r.status === "past_due" || r.status === "canceled", "past_due or canceled after failed renewal");
  const live = await stripe.subscriptions.retrieve(sub.id);
  expect(row.status === "past_due" ? "past_due" : "canceled", "DB mirrors Stripe").toBe(live.status === "past_due" ? "past_due" : "canceled");

  if (row.status === "canceled") {
    expect(await hasAccess(parent.id), "canceled after failed payment has no access").toBe(false);
    // The parent can start over: checkout is no longer blocked by the 409 guard.
    await parentSignIn(page, parent.email, parent.password);
    await expect(page).toHaveURL(/\/parent/, { timeout: 30_000 });
    await page.waitForLoadState("networkidle");
    const retry = await api(page).post("/api/stripe/checkout", { plan: "family_monthly" });
    expect(retry.status(), "a canceled payer may check out again").toBe(200);
    return;
  }

  expect(await hasAccess(parent.id), "past_due keeps access only until the paid period ends").toBe(true);
  const good = await stripe.paymentMethods.attach("pm_card_visa", { customer: c.customerId });
  await stripe.customers.update(c.customerId, { invoice_settings: { default_payment_method: good.id } });
  const open = await stripe.invoices.list({ customer: c.customerId, status: "open", limit: 5 });
  expect(open.data.length).toBeGreaterThan(0);
  for (const inv of open.data) await stripe.invoices.pay(inv.id, { payment_method: good.id });
  await waitForRow(parent.id, (r) => r.status === "active", "active after failed-payment recovery");
});

test("L2 plans: annual and Individual cadences map to the right plan and period", async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  const cases = [
    { key: "family_annual", label: "l2fa", minDays: 360 },
    { key: "individual_monthly", label: "l2im", minDays: 27 },
    { key: "individual_annual", label: "l2ia", minDays: 360 },
  ] as const;
  for (const k of cases) {
    const parent = await seedParent(k.label);
    track("users", parent.id);
    const c = await clockedCustomer(parent);
    track("clocks", c.clockId);
    await subscribe(c, k.key);
    const row = await waitForRow(parent.id, (r) => r.status === "active" && r.plan === k.key, `active ${k.key}`);
    expect(Date.parse(row.current_period_end!) - Date.now()).toBeGreaterThan(k.minDays * DAY - 2 * DAY);
    expect(await hasAccess(parent.id), k.key).toBe(true);
  }
});

test("L3 declined payments never grant access", async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  const stripe = stripeClient();

  // (a) Card declines at creation -> Stripe refuses the subscription outright.
  const a = await seedParent("l3a");
  track("users", a.id);
  const ca = await clockedCustomer(a, "pm_card_chargeCustomerFail");
  track("clocks", ca.clockId);
  await expect(
    stripe.subscriptions.create({
      customer: ca.customerId,
      items: [{ price: await priceId("family_monthly") }],
      payment_behavior: "error_if_incomplete",
    }),
  ).rejects.toMatchObject({ type: "StripeCardError" });
  expect((await subRow(a.id))?.plan).toBeNull();
  expect(await hasAccess(a.id)).toBe(false);
  expect((await subRow(a.id))?.status).not.toBe("active");

  // (b) Incomplete subscription (payment failed, left open) -> row never becomes active.
  const b = await seedParent("l3b");
  track("users", b.id);
  const cb = await clockedCustomer(b, "pm_card_chargeCustomerFail");
  track("clocks", cb.clockId);
  const incomplete = await stripe.subscriptions.create({
    customer: cb.customerId,
    items: [{ price: await priceId("individual_monthly") }],
    payment_behavior: "default_incomplete",
  });
  expect(incomplete.status).toBe("incomplete");
  await waitForRow(b.id, (r) => r.stripe_subscription_id === incomplete.id, "incomplete subscription synced");
  const rowB = await subRow(b.id);
  expect(rowB?.status).toBe("incomplete");
  expect(await hasAccess(b.id)).toBe(false);
});
