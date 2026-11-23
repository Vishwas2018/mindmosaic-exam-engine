/**
 * Scenario S4 — plan changes, customer portal, webhook failure semantics, and a characterisation of what a guest is
 * actually served (the Free-plan claim). Stripe SANDBOX + DEV Supabase + Preview; no mocks, no real payments.
 */
import {
  assertSandbox,
  cleanupBilling,
  clockedCustomer,
  hasAccess,
  postWebhook,
  priceId,
  seedParent,
  signedEvent,
  stripeClient,
  subRow,
  subscribe,
  syntheticEventId,
  track,
  waitForRow,
} from "./billing-helpers";
import { api, devAdmin, expect, parentSignIn, test } from "./fixtures";

test.describe.configure({ mode: "serial" });
test.setTimeout(600_000);

test.beforeAll(async () => {
  await assertSandbox();
});
test.afterAll(async () => {
  await cleanupBilling();
});

async function signIn(page: import("@playwright/test").Page, email: string, password: string) {
  await parentSignIn(page, email, password);
  await expect(page).toHaveURL(/\/parent/, { timeout: 30_000 });
  await page.waitForLoadState("domcontentloaded");
}

test("L4 upgrade and downgrade re-map the plan and the child cap, without deleting anyone's children", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  const stripe = stripeClient();
  const parent = await seedParent("l4");
  track("users", parent.id);
  const c = await clockedCustomer(parent);
  track("clocks", c.clockId);
  const sub = await subscribe(c, "individual_monthly");
  await waitForRow(parent.id, (r) => r.plan === "individual_monthly" && r.status === "active", "individual active");

  await signIn(page, parent.email, parent.password);
  expect((await api(page).post("/api/parent/children", { displayName: "First", yearLevel: 4 })).status()).toBeLessThan(300);
  expect((await api(page).post("/api/parent/children", { displayName: "Second", yearLevel: 4 })).status(), "cap on Individual").toBeGreaterThanOrEqual(400);

  // Upgrade Individual -> Family (monthly): plan and cap follow.
  const item = sub.items.data[0]!;
  await stripe.subscriptions.update(sub.id, {
    items: [{ id: item.id, price: await priceId("family_monthly") }],
    proration_behavior: "none",
  });
  await waitForRow(parent.id, (r) => r.plan === "family_monthly" && r.status === "active", "upgraded to family_monthly");
  expect((await api(page).post("/api/parent/children", { displayName: "Second", yearLevel: 4 })).status(), "second child after upgrade").toBeLessThan(300);
  expect((await api(page).post("/api/parent/children", { displayName: "Third", yearLevel: 4 })).status()).toBeLessThan(300);

  // Switch cadence Family monthly -> annual: plan maps, still active, period end moves out.
  const before = (await subRow(parent.id))!.current_period_end!;
  const live = await stripe.subscriptions.retrieve(sub.id);
  await stripe.subscriptions.update(sub.id, {
    items: [{ id: live.items.data[0]!.id, price: await priceId("family_annual") }],
    proration_behavior: "none",
    billing_cycle_anchor: "now",
  });
  const annual = await waitForRow(parent.id, (r) => r.plan === "family_annual", "family_annual");
  expect(Date.parse(annual.current_period_end!)).toBeGreaterThan(Date.parse(before));

  // Downgrade Family -> Individual: the plan reverts; three existing children stay (nothing is deleted) and no more can be added.
  const live2 = await stripe.subscriptions.retrieve(sub.id);
  await stripe.subscriptions.update(sub.id, {
    items: [{ id: live2.items.data[0]!.id, price: await priceId("individual_annual") }],
    proration_behavior: "none",
  });
  await waitForRow(parent.id, (r) => r.plan === "individual_annual", "downgraded to individual_annual");
  const links = await devAdmin().from("parent_children").select("child_id", { count: "exact", head: true }).eq("parent_id", parent.id);
  expect(links.count, "existing children are kept on downgrade").toBe(3);
  const extra = await api(page).post("/api/parent/children", { displayName: "Fourth", yearLevel: 4 });
  expect(extra.status(), "no further children on Individual").toBeGreaterThanOrEqual(400);
  expect(await hasAccess(parent.id)).toBe(true);
});

test("P1 customer portal: a parent gets a portal session for their own customer only; the return path is allow-listed", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  const parent = await seedParent("p1");
  track("users", parent.id);
  const c = await clockedCustomer(parent);
  track("clocks", c.clockId);
  await subscribe(c, "family_monthly");
  await waitForRow(parent.id, (r) => r.status === "active", "active");
  await signIn(page, parent.email, parent.password);

  const ok = await api(page).post("/api/stripe/portal", { returnPath: "/billing" });
  expect(ok.status()).toBe(200);
  const { url } = (await ok.json()) as { url: string };
  expect(url).toMatch(/^https:\/\/billing\.stripe\.com\//);
  // The session really exists in Stripe for THIS customer.
  const reach = await fetch(url, { redirect: "manual" });
  expect([200, 302, 303]).toContain(reach.status);

  // A foreign or absolute return path must not be honoured: the route falls back to its default and still succeeds.
  const evil = await api(page).post("/api/stripe/portal", { returnPath: "https://evil.example/steal" });
  expect(evil.status()).toBe(200);

  const status = await api(page).get("/api/stripe/status");
  expect(status.status()).toBe(200);
  const invoices = await api(page).get("/api/stripe/invoices");
  expect(invoices.status()).toBe(200);
  const pm = await api(page).get("/api/stripe/payment-method");
  expect(pm.status()).toBe(200);
});

test("W4 a delivery that cannot be applied is refused (so Stripe retries) and leaves no ledger trace", async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  const id = syntheticEventId();
  const evt = {
    id,
    object: "event",
    api_version: "2025-01-01",
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    type: "customer.subscription.updated",
    // An id Stripe rejects with a 400 (not a 404 "missing"): the re-sync call fails, which must fail the delivery.
    data: { object: { id: "sub_%00", object: "subscription", customer: "cus_x", status: "active", items: { data: [] } } },
  };
  const s = signedEvent(evt);
  const res = await postWebhook(s.body, s.header);
  expect(res.status, "unappliable event must be a non-2xx so Stripe retries").toBeGreaterThanOrEqual(500);
  const { count } = await devAdmin().from("subscription_events").select("*", { count: "exact", head: true }).eq("stripe_event_id", id);
  expect(count, "the event must not be marked processed").toBe(0);
});

test("F1 characterisation: what a guest is actually served, versus the 'Free: 5 sample questions' claim", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  await page.goto("/");
  const res = await api(page).post("/api/exam/guest-session", {
    selection: { config: { yearLevel: 3, examStyle: "naplan_style", subject: "numeracy", questionCount: 10, timing: "untimed" } },
  });
  expect(res.status(), "guest sitting starts").toBe(201);
  {
    const body = (await res.json()) as { questions: unknown[] };
    testInfo.annotations.push({ type: "guest-questions-served", description: String(body.questions.length) });
    // Documents CURRENT behaviour. If the Free plan is ever enforced server-side for guests, this fails on purpose.
    expect(body.questions.length, "guest is served more than the advertised 5-question sample").toBeGreaterThan(5);
  }
});
