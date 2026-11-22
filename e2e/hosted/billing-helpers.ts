/**
 * Helpers for the hosted billing specs (s1/s2/s3). Stripe SANDBOX and DEV Supabase only.
 *
 * Secrets arrive through the launcher's process environment (scripts/billing-readiness/run.mjs):
 *   BILLING_STRIPE_KEY      sandbox secret key (sk_test_/rk_test_); the helper refuses anything else
 *   BILLING_WEBHOOK_SECRET  signing secret of the Preview's webhook endpoint
 * Neither is logged. Real Stripe webhook deliveries reach the Preview; signed synthetic events are posted
 * with the same secret for the duplicate / out-of-order / replay cases.
 */
import Stripe from "stripe";

import { HOSTED_URL, STRONG_PASSWORD, devAdmin, expect, seededEmail } from "./fixtures";

export const SANDBOX_ACCOUNT = "acct_1StznKDtPH5dvWkm";

export type PlanKey = "family_monthly" | "family_annual" | "individual_monthly" | "individual_annual";
export const LOOKUP: Record<PlanKey, string> = {
  family_monthly: "mindmosaic_family_monthly",
  family_annual: "mindmosaic_family_annual",
  individual_monthly: "mindmosaic_individual_monthly",
  individual_annual: "mindmosaic_individual_annual",
};

let stripeSingleton: Stripe | null = null;
export function stripeClient(): Stripe {
  if (!stripeSingleton) {
    const key = process.env.BILLING_STRIPE_KEY ?? "";
    if (!/^(sk|rk)_test_/.test(key)) throw new Error("BILLING_STRIPE_KEY must be a Stripe TEST key");
    stripeSingleton = new Stripe(key);
  }
  return stripeSingleton;
}

export function webhookSecret(): string {
  const s = process.env.BILLING_WEBHOOK_SECRET ?? "";
  if (!s.startsWith("whsec_")) throw new Error("BILLING_WEBHOOK_SECRET is not set");
  return s;
}

const priceCache = new Map<PlanKey, string>();
export async function priceId(plan: PlanKey): Promise<string> {
  const hit = priceCache.get(plan);
  if (hit) return hit;
  const list = await stripeClient().prices.list({ lookup_keys: [LOOKUP[plan]], active: true });
  const id = list.data[0]?.id;
  if (!id) throw new Error(`no sandbox price for ${plan}`);
  priceCache.set(plan, id);
  return id;
}

/** Fails fast if the key is not the sandbox account, so a wrong key can never drive a run. */
export async function assertSandbox(): Promise<void> {
  const account = await stripeClient().accounts.retrieve(SANDBOX_ACCOUNT);
  expect(account.id).toBe(SANDBOX_ACCOUNT);
}

export interface SeededParent {
  id: string;
  email: string;
  password: string;
}

export async function seedParent(label: string): Promise<SeededParent> {
  const email = seededEmail(`bill-${label}`);
  let id = "";
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 4 && !id; attempt++) {
    const { data, error } = await devAdmin().auth.admin.createUser({
      email,
      password: STRONG_PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: `Billing ${label}`, role: "parent" },
    });
    if (data?.user) id = data.user.id;
    else {
      lastError = error;
      // A reset mid-request may still have created the user; look before retrying.
      const { findUserByEmail } = await import("./fixtures");
      const existing = await findUserByEmail(email);
      if (existing) id = existing.id;
      else await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
  expect(id, `seed parent ${label}: ${String(lastError)}`).not.toBe("");
  // The signup trigger creates the trial row; wait for it rather than assuming.
  await expect.poll(async () => (await subRow(id)) !== null, { timeout: 20_000 }).toBe(true);
  return { id, email, password: STRONG_PASSWORD };
}

export interface SubRow {
  id: string;
  parent_id: string;
  status: string;
  plan: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  trial_end: string | null;
}

export async function subRow(parentId: string): Promise<SubRow | null> {
  const { data } = await devAdmin()
    .from("subscriptions")
    .select("id,parent_id,status,plan,stripe_customer_id,stripe_subscription_id,current_period_end,trial_end")
    .eq("parent_id", parentId)
    .maybeSingle();
  return (data as SubRow | null) ?? null;
}

export async function hasAccess(parentId: string): Promise<boolean> {
  const { data, error } = await devAdmin().rpc("has_active_access", { p: parentId });
  expect(error).toBeNull();
  return data === true;
}

/** Polls the DB until the webhook (or the app) has produced the expected state. */
export async function waitForRow(
  parentId: string,
  predicate: (row: SubRow) => boolean,
  description: string,
  timeoutMs = 150_000,
): Promise<SubRow> {
  let last: SubRow | null = null;
  await expect
    .poll(
      async () => {
        last = await subRow(parentId);
        return last !== null && predicate(last);
      },
      { message: `waiting for ${description}`, timeout: timeoutMs, intervals: [1500, 2500, 4000] },
    )
    .toBe(true);
  return last!;
}

export async function linkCustomer(parentId: string, customerId: string): Promise<void> {
  const { error } = await devAdmin().from("subscriptions").update({ stripe_customer_id: customerId }).eq("parent_id", parentId);
  expect(error, "link stripe customer (what the checkout route does)").toBeNull();
}

export interface Clocked {
  clockId: string;
  customerId: string;
}

/** A customer on its own test clock with a good default card, linked to the parent's row. */
export async function clockedCustomer(parent: SeededParent, card = "pm_card_visa"): Promise<Clocked> {
  const stripe = stripeClient();
  const clock = await stripe.testHelpers.testClocks.create({
    frozen_time: Math.floor(Date.now() / 1000),
    name: `mm-billing-${parent.id.slice(0, 8)}`,
  });
  const customer = await stripe.customers.create({
    test_clock: clock.id,
    email: parent.email,
    metadata: { parent_id: parent.id, mindmosaic_test: "billing-readiness" },
    payment_method: card,
    invoice_settings: { default_payment_method: card },
  });
  await linkCustomer(parent.id, customer.id);
  return { clockId: clock.id, customerId: customer.id };
}

export async function subscribe(c: Clocked, plan: PlanKey): Promise<Stripe.Subscription> {
  return stripeClient().subscriptions.create({
    customer: c.customerId,
    items: [{ price: await priceId(plan) }],
    metadata: { plan },
  });
}

/** Advances the clock to just past the subscription's current period end (the next renewal attempt). */
export async function advanceToRenewal(clockId: string, subscriptionId: string, extraDays = 1): Promise<void> {
  const stripe = stripeClient();
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const end = sub.items.data[0]!.current_period_end;
  const clock = await stripe.testHelpers.testClocks.retrieve(clockId);
  await advanceClock(clockId, Math.max(1, Math.ceil((end - clock.frozen_time) / 86_400) + extraDays));
}

export async function advanceClock(clockId: string, days: number): Promise<void> {
  const stripe = stripeClient();
  const clock = await stripe.testHelpers.testClocks.retrieve(clockId);
  await stripe.testHelpers.testClocks.advance(clockId, { frozen_time: clock.frozen_time + days * 86_400 });
  await expect
    .poll(async () => (await stripe.testHelpers.testClocks.retrieve(clockId)).status, {
      message: "test clock advancing",
      timeout: 180_000,
      intervals: [2000, 3000, 5000],
    })
    .toBe("ready");
}

/** A signed synthetic event, exactly as Stripe would sign it. */
export function signedEvent(
  event: Record<string, unknown>,
  opts: { secret?: string; timestamp?: number } = {},
): { body: string; header: string } {
  const body = JSON.stringify(event);
  const header = stripeClient().webhooks.generateTestHeaderString({
    payload: body,
    secret: opts.secret ?? webhookSecret(),
    ...(opts.timestamp ? { timestamp: opts.timestamp } : {}),
  });
  return { body, header };
}

export async function postWebhook(body: string, signature: string | undefined): Promise<{ status: number; json: unknown }> {
  const res = await fetch(`${HOSTED_URL}/api/stripe/webhook`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "content-type": "application/json",
      "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? "",
      ...(signature ? { "stripe-signature": signature } : {}),
    },
    body,
  });
  if (res.status >= 300 && res.status < 400) throw new Error(`webhook POST redirected (${res.status}): bypass failed`);
  const text = await res.text();
  let json: unknown = text;
  try {
    json = JSON.parse(text);
  } catch {
    /* non-JSON body */
  }
  return { status: res.status, json };
}

export function syntheticEventId(): string {
  return `evt_mmtest_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

const created: { users: string[]; clocks: string[]; customers: string[] } = { users: [], clocks: [], customers: [] };
export function track(kind: "users" | "clocks" | "customers", id: string): void {
  created[kind].push(id);
}

/** Best-effort teardown of everything the run created (test clocks delete their customers and subscriptions). */
export async function cleanupBilling(): Promise<void> {
  const stripe = stripeClient();
  for (const id of created.clocks) await stripe.testHelpers.testClocks.del(id).catch(() => undefined);
  for (const id of created.customers) await stripe.customers.del(id).catch(() => undefined);
  for (const id of created.users) await devAdmin().auth.admin.deleteUser(id).catch(() => undefined);
}
