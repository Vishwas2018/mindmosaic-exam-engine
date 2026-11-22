/**
 * Scenario S2 — webhook integrity, authorisation, RLS and entitlement bypass attempts on the DEV Preview.
 * Every denial is the deployed app or DEV PostgREST refusing; nothing is mocked.
 */
import type { BrowserContext } from "@playwright/test";

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
import { DEV_REF, HOSTED_URL, api, devAdmin, devSupabaseUrl, enterStudentCredentials, expect, parentSignIn, protectContext, test } from "./fixtures";

test.describe.configure({ mode: "serial" });
test.setTimeout(600_000);

test.beforeAll(async () => {
  await assertSandbox();
});
test.afterAll(async () => {
  await cleanupBilling();
});

async function accessToken(context: BrowserContext): Promise<string> {
  const name = `sb-${DEV_REF}-auth-token`;
  const parts = (await context.cookies())
    .filter((c) => c.name === name || c.name.startsWith(`${name}.`))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  let raw = decodeURIComponent(parts.map((c) => c.value).join(""));
  if (raw.startsWith("base64-")) raw = Buffer.from(raw.slice(7), "base64url").toString("utf8");
  const token = (JSON.parse(raw) as { access_token?: string }).access_token;
  if (!token) throw new Error("no access token in auth cookie");
  return token;
}

function eventFor(sub: Record<string, unknown>, type: string, created = Math.floor(Date.now() / 1000)) {
  return { id: syntheticEventId(), object: "event", api_version: "2025-01-01", created, type, data: { object: sub }, livemode: false };
}

test("W1 webhook signature: missing, malformed, wrong secret, tampered body and replayed timestamp are all rejected", async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  const evt = eventFor({ id: "sub_none", object: "subscription", customer: "cus_none", status: "active", items: { data: [] } }, "customer.subscription.updated");
  const good = signedEvent(evt);

  expect((await postWebhook(good.body, undefined)).status, "no signature header").toBe(400);
  expect((await postWebhook(good.body, "t=1,v1=deadbeef")).status, "malformed signature").toBe(400);
  const wrongSecret = signedEvent(evt, { secret: "whsec_wrong_secret_value" });
  expect((await postWebhook(wrongSecret.body, wrongSecret.header)).status, "signed with another secret").toBe(400);
  expect((await postWebhook(good.body.replace("sub_none", "sub_evil"), good.header)).status, "body altered after signing").toBe(400);
  const stale = signedEvent(evt, { timestamp: Math.floor(Date.now() / 1000) - 3600 });
  expect((await postWebhook(stale.body, stale.header)).status, "valid signature, timestamp an hour old (replay)").toBe(400);

  // A rejected delivery must leave no trace in the idempotency ledger.
  const { count } = await devAdmin().from("subscription_events").select("*", { count: "exact", head: true }).eq("stripe_event_id", evt.id);
  expect(count).toBe(0);

  // A correctly signed event for an unknown customer is accepted and changes nothing.
  const ok = await postWebhook(good.body, good.header);
  expect(ok.status).toBe(200);
});

test("W2 duplicate delivery is acknowledged once and applied once", async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  const parent = await seedParent("w2");
  track("users", parent.id);
  const c = await clockedCustomer(parent);
  track("clocks", c.clockId);
  const sub = await subscribe(c, "family_monthly");
  await waitForRow(parent.id, (r) => r.status === "active", "active before replay");

  const evt = eventFor(JSON.parse(JSON.stringify(sub)), "customer.subscription.updated");
  const signed = signedEvent(evt);
  const first = await postWebhook(signed.body, signed.header);
  const second = await postWebhook(signed.body, signed.header);
  expect(first.status).toBe(200);
  expect(second.status).toBe(200);
  expect((second.json as { duplicate?: boolean }).duplicate).toBe(true);
  const { count } = await devAdmin().from("subscription_events").select("*", { count: "exact", head: true }).eq("stripe_event_id", evt.id);
  expect(count, "one ledger row for two deliveries").toBe(1);
});

test("W3 out-of-order and delayed events cannot resurrect a cancelled subscription", async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  const stripe = stripeClient();
  const parent = await seedParent("w3");
  track("users", parent.id);
  const c = await clockedCustomer(parent);
  track("clocks", c.clockId);
  const sub = await subscribe(c, "individual_monthly");
  await waitForRow(parent.id, (r) => r.status === "active", "active");
  const staleActivePayload = JSON.parse(JSON.stringify(sub)) as Record<string, unknown>;

  await stripe.subscriptions.cancel(sub.id);
  await waitForRow(parent.id, (r) => r.status === "canceled", "canceled");
  expect(await hasAccess(parent.id)).toBe(false);

  // Deliver the OLD "active" update after the cancellation, validly signed, with a plausible older timestamp.
  const late = eventFor(staleActivePayload, "customer.subscription.updated", Math.floor(Date.now() / 1000) - 120);
  const signed = signedEvent(late);
  const res = await postWebhook(signed.body, signed.header);
  expect(res.status).toBe(200);
  const after = await subRow(parent.id);
  expect(after?.status, "stale active event must not reopen the subscription").toBe("canceled");
  expect(await hasAccess(parent.id)).toBe(false);

  // A stale payment_failed after the subscription is gone must not create access or a past_due state either.
  const failed = eventFor(
    { id: "in_stale", object: "invoice", customer: c.customerId, parent: { subscription_details: { subscription: sub.id } } },
    "invoice.payment_failed",
  );
  const sf = signedEvent(failed);
  expect((await postWebhook(sf.body, sf.header)).status).toBe(200);
  expect((await subRow(parent.id))?.status).toBe("canceled");
});

test("S1 unauthenticated and cross-site callers are refused on every billing route", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  const a = api(page);
  for (const [path, method] of [
    ["/api/stripe/checkout", "post"],
    ["/api/stripe/portal", "post"],
    ["/api/stripe/cancel", "post"],
    ["/api/stripe/resume", "post"],
    ["/api/stripe/status", "get"],
    ["/api/stripe/invoices", "get"],
    ["/api/stripe/payment-method", "get"],
  ] as const) {
    const res = method === "post" ? await a.post(path, { plan: "family_monthly" }) : await a.get(path);
    expect(res.status(), `${method.toUpperCase()} ${path} anonymous`).toBe(401);
  }

  const parent = await seedParent("s1");
  track("users", parent.id);
  await parentSignIn(page, parent.email, parent.password);
  await expect(page).toHaveURL(/\/parent/, { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
  const token = await accessToken(page.context());
  const cross = await fetch(`${HOSTED_URL}/api/stripe/checkout`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "content-type": "application/json",
      origin: "https://evil.example",
      authorization: `Bearer ${token}`,
      "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? "",
    },
    body: JSON.stringify({ plan: "family_monthly" }),
  });
  expect(cross.status, "cross-site POST").toBeGreaterThanOrEqual(400);
  expect(cross.status).toBeLessThan(500);

  expect((await a.post("/api/stripe/checkout", { plan: "enterprise" })).status(), "unknown plan").toBe(400);
  expect((await a.post("/api/stripe/checkout", {})).status(), "missing plan").toBe(400);
  expect((await a.post("/api/stripe/portal", {})).status(), "portal with no Stripe customer").toBe(404);
  expect((await a.post("/api/stripe/cancel", {})).status(), "cancel with no subscription").toBe(404);
});

test("S2 checkout is refused with 409 while a paid subscription is in period", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  const parent = await seedParent("s2");
  track("users", parent.id);
  const c = await clockedCustomer(parent);
  track("clocks", c.clockId);
  await subscribe(c, "family_monthly");
  await waitForRow(parent.id, (r) => r.status === "active" && r.plan === "family_monthly", "active");
  await parentSignIn(page, parent.email, parent.password);
  await expect(page).toHaveURL(/\/parent/, { timeout: 30_000 });
  await page.waitForLoadState("networkidle");

  for (const plan of ["family_monthly", "family_annual", "individual_annual"]) {
    const res = await api(page).post("/api/stripe/checkout", { plan });
    expect(res.status(), plan).toBe(409);
    expect(await res.json()).toEqual({ error: "already_subscribed" });
  }
  const subs = await stripeClient().subscriptions.list({ customer: c.customerId, status: "all" });
  expect(subs.data.length, "no second Stripe subscription was created").toBe(1);
});

test("S3 a trial parent gets a real Stripe Checkout session bound to their own customer and plan price", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  const parent = await seedParent("s3");
  track("users", parent.id);
  await parentSignIn(page, parent.email, parent.password);
  await expect(page).toHaveURL(/\/parent/, { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
  const res = await api(page).post("/api/stripe/checkout", { plan: "individual_annual" });
  expect(res.status()).toBe(200);
  const { url } = (await res.json()) as { url: string };
  expect(url).toMatch(/^https:\/\/checkout\.stripe\.com\//);

  const row = await subRow(parent.id);
  expect(row?.stripe_customer_id, "customer linked by the route").toMatch(/^cus_/);
  track("customers", row!.stripe_customer_id!);
  const sessions = await stripeClient().checkout.sessions.list({ customer: row!.stripe_customer_id!, limit: 3 });
  const s = sessions.data[0]!;
  expect(s.client_reference_id).toBe(parent.id);
  expect(s.metadata?.parent_id).toBe(parent.id);
  expect(s.mode).toBe("subscription");
  const items = await stripeClient().checkout.sessions.listLineItems(s.id);
  expect(items.data[0]?.price?.id).toBe(await priceId("individual_annual"));
  expect(s.success_url).toContain(new URL(HOSTED_URL).host);
});

test("S4 RLS: a parent token cannot read, forge or call the billing write paths, and sees only its own row", async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  const A = await seedParent("s4a");
  const B = await seedParent("s4b");
  track("users", A.id);
  track("users", B.id);
  const cB = await clockedCustomer(B);
  track("clocks", cB.clockId);
  await subscribe(cB, "family_monthly");
  await waitForRow(B.id, (r) => r.status === "active", "B active");

  await parentSignIn(page, A.email, A.password);
  await expect(page).toHaveURL(/\/parent/, { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
  const token = await accessToken(context);
  const SB = devSupabaseUrl();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const h = { apikey: anon, Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const own = await fetch(`${SB}/rest/v1/subscriptions?select=parent_id,status`, { headers: h });
  const ownRows = (await own.json()) as { parent_id: string }[];
  expect(ownRows.map((r) => r.parent_id), "only the caller's row is visible").toEqual([A.id]);

  const other = await fetch(`${SB}/rest/v1/subscriptions?select=id&parent_id=eq.${B.id}`, { headers: h });
  expect(((await other.json()) as unknown[]).length, "family B's row").toBe(0);

  // Forge entitlement on one's own row.
  const forge = await fetch(`${SB}/rest/v1/subscriptions?parent_id=eq.${A.id}`, {
    method: "PATCH",
    headers: { ...h, Prefer: "return=representation" },
    body: JSON.stringify({ status: "active", plan: "family_annual", current_period_end: "2099-01-01T00:00:00Z" }),
  });
  const forged = forge.ok ? ((await forge.json()) as unknown[]).length : 0;
  expect(forged, `forged PATCH (status ${forge.status})`).toBe(0);
  const insertRow = await fetch(`${SB}/rest/v1/subscriptions`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({ parent_id: A.id, status: "active", plan: "family_annual" }),
  });
  expect(insertRow.ok, "forged INSERT").toBe(false);
  const rowAfter = await subRow(A.id);
  expect(rowAfter?.status).toBe("trialing");
  expect(await hasAccess(A.id)).toBe(true); // an unexpired trial is legitimate; the point is it is not paid
  expect(rowAfter?.plan).toBeNull();

  // The webhook RPC and the idempotency ledger are service-role only.
  const rpc = await fetch(`${SB}/rest/v1/rpc/apply_stripe_subscription_event`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({
      p_stripe_event_id: syntheticEventId(),
      p_type: "customer.subscription.updated",
      p_payload: {},
      p_customer_id: null,
      p_subscription_id: null,
      p_patch: { status: "active" },
    }),
  });
  expect(rpc.ok, "authenticated caller invoking the webhook RPC").toBe(false);
  const ledger = await fetch(`${SB}/rest/v1/subscription_events?select=stripe_event_id&limit=1`, { headers: h });
  const ledgerRows = ledger.ok ? ((await ledger.json()) as unknown[]).length : 0;
  expect(ledgerRows, "subscription_events visible to a parent").toBe(0);

  // Family isolation through the app: A's cancel/portal never reach B's customer or subscription.
  expect((await api(page).post("/api/stripe/cancel", {})).status()).toBe(404);
  expect((await api(page).post("/api/stripe/portal", {})).status()).toBe(404);
  expect((await subRow(B.id))?.status).toBe("active");
  const bSubs = await stripeClient().subscriptions.list({ customer: cB.customerId });
  expect(bSubs.data[0]?.cancel_at_period_end).toBe(false);
});

test("S5 entitlement: a student of a parent without access is held to the free sample, a paid family is not", async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  const free = await seedParent("s5free");
  track("users", free.id);
  // Expire the trial so the parent has no access at all.
  await devAdmin().from("subscriptions").update({ trial_end: new Date(Date.now() - 86_400_000).toISOString() }).eq("parent_id", free.id);
  expect(await hasAccess(free.id)).toBe(false);

  await parentSignIn(page, free.email, free.password);
  await expect(page).toHaveURL(/\/parent/, { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
  const made = await api(page).post("/api/parent/children", { displayName: "Fiona", yearLevel: 5 });
  expect(made.status(), "create child").toBeLessThan(300);
  const child = (await made.json()) as { loginCode: string; pin: string };

  const studentCtx = await context.browser()!.newContext({ viewport: { width: 1440, height: 900 } });
  await protectContext(studentCtx);
  const sp = await studentCtx.newPage();
  await sp.goto("/sign-in");
  await sp.getByRole("button", { name: /I'm a student/i }).click();
  await enterStudentCredentials(sp, child.loginCode, child.pin);
  await sp.getByRole("button", { name: /sign in/i }).last().click();
  await expect(sp).toHaveURL(/\/student$/, { timeout: 30_000 });
  await sp.waitForLoadState("networkidle");

  // Full-length paper: a paid-plan feature, refused with 402 before any question is selected.
  const paper = await api(sp).post("/api/exam/session", { patternId: "naplan-y5-numeracy" });
  expect(paper.status(), "pattern paper without access").toBe(402);
  expect(((await paper.json()) as { error: string }).error).toBe("upgrade_required");

  // A custom draw is clamped to the sample: never more than 5 questions per programme.
  const draw = await api(sp).post("/api/exam/session", {
    config: { examStyle: "naplan_style", yearLevel: 5, subject: "numeracy", questionCount: 40, timing: "untimed" },
  });
  if (draw.status() === 200) {
    const body = (await draw.json()) as { questions: unknown[] };
    expect(body.questions.length, "free student served more than the sample").toBeLessThanOrEqual(5);
  } else {
    expect([402, 422], `custom draw status ${draw.status()}`).toContain(draw.status());
    expect(draw.status(), "a refused draw must not be a server error").toBeLessThan(500);
  }
  await studentCtx.close();

  // Paying parent: the same pattern request is no longer refused for entitlement reasons.
  const paid = await seedParent("s5paid");
  track("users", paid.id);
  const cp = await clockedCustomer(paid);
  track("clocks", cp.clockId);
  await subscribe(cp, "family_monthly");
  await waitForRow(paid.id, (r) => r.status === "active", "paid active");
  const p2 = await context.browser()!.newContext({ viewport: { width: 1440, height: 900 } });
  await protectContext(p2);
  const pp = await p2.newPage();
  await parentSignIn(pp, paid.email, paid.password);
  await expect(pp).toHaveURL(/\/parent/, { timeout: 30_000 });
  await pp.waitForLoadState("networkidle");
  const made2 = await api(pp).post("/api/parent/children", { displayName: "Paula", yearLevel: 5 });
  const child2 = (await made2.json()) as { loginCode: string; pin: string };
  const sc2 = await context.browser()!.newContext({ viewport: { width: 1440, height: 900 } });
  await protectContext(sc2);
  const sp2 = await sc2.newPage();
  await sp2.goto("/sign-in");
  await sp2.getByRole("button", { name: /I'm a student/i }).click();
  await enterStudentCredentials(sp2, child2.loginCode, child2.pin);
  await sp2.getByRole("button", { name: /sign in/i }).last().click();
  await expect(sp2).toHaveURL(/\/student$/, { timeout: 30_000 });
  await sp2.waitForLoadState("networkidle");
  const paperPaid = await api(sp2).post("/api/exam/session", { patternId: "naplan-y5-numeracy" });
  expect(paperPaid.status(), "paying family must not be refused for entitlement").not.toBe(402);
  await p2.close();
  await sc2.close();
});

test("S6 Individual plan caps the account at one child; Family allows three and refuses a fourth", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440");
  const ind = await seedParent("s6i");
  track("users", ind.id);
  const ci = await clockedCustomer(ind);
  track("clocks", ci.clockId);
  await subscribe(ci, "individual_monthly");
  await waitForRow(ind.id, (r) => r.plan === "individual_monthly" && r.status === "active", "individual active");
  await parentSignIn(page, ind.email, ind.password);
  await expect(page).toHaveURL(/\/parent/, { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
  expect((await api(page).post("/api/parent/children", { displayName: "One", yearLevel: 4 })).status()).toBeLessThan(300);
  const second = await api(page).post("/api/parent/children", { displayName: "Two", yearLevel: 4 });
  expect(second.status(), "second child on Individual").toBeGreaterThanOrEqual(400);
  expect(JSON.stringify(await second.json())).toMatch(/Individual plan covers one child/);

  const fam = await seedParent("s6f");
  track("users", fam.id);
  const cf = await clockedCustomer(fam);
  track("clocks", cf.clockId);
  await subscribe(cf, "family_monthly");
  await waitForRow(fam.id, (r) => r.plan === "family_monthly" && r.status === "active", "family active");
  const ctx2 = await page.context().browser()!.newContext({ viewport: { width: 1440, height: 900 } });
  await protectContext(ctx2);
  const p2 = await ctx2.newPage();
  await parentSignIn(p2, fam.email, fam.password);
  await expect(p2).toHaveURL(/\/parent/, { timeout: 30_000 });
  await p2.waitForLoadState("networkidle");
  for (const name of ["Ann", "Bea", "Cal"]) {
    expect((await api(p2).post("/api/parent/children", { displayName: name, yearLevel: 4 })).status(), name).toBeLessThan(300);
  }
  const fourth = await api(p2).post("/api/parent/children", { displayName: "Dee", yearLevel: 4 });
  expect(fourth.status(), "fourth child on Family").toBeGreaterThanOrEqual(400);
  await ctx2.close();
});
