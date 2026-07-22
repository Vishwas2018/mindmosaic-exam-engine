import "server-only";

/**
 * Stripe configuration, read from server-only env vars. Mirrors the
 * isConfigured pattern in src/lib/supabase/config.ts: when these are unset
 * on a dev machine, routes that need them fail closed with a friendly
 * "not configured" response (503) instead of throwing.
 *
 * STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET must never be prefixed with
 * NEXT_PUBLIC_ and must never be imported into client code — the
 * `import "server-only"` above turns an accidental client import into a
 * build failure (docs/PRIVACY_AND_BILLING_GUARDRAILS.md: "Payment-provider
 * secret keys and webhook signing secrets live only in server-side
 * environment variables").
 */
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? "";
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

export const isStripeConfigured = STRIPE_SECRET_KEY.trim().length > 0;
export const isStripeWebhookConfigured = STRIPE_WEBHOOK_SECRET.trim().length > 0;

export const STRIPE_NOT_CONFIGURED_MESSAGE =
  "Billing isn't set up on this server yet.";

/** Mirrors the `plan` check constraint on public.subscriptions. */
export const BILLING_PLANS = ["family_monthly", "family_annual"] as const;
export type BillingPlan = (typeof BILLING_PLANS)[number];

export function isBillingPlan(value: unknown): value is BillingPlan {
  return typeof value === "string" && (BILLING_PLANS as readonly string[]).includes(value);
}

/**
 * Plan -> Stripe Price ID mapping.
 *
 * Deviation from the batch contract: the contract named three required env
 * vars (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
 * NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) but a Checkout Session cannot be
 * created without a Stripe Price ID per plan, and none existed anywhere in
 * .env.local / .env.local.example / docs. Two more server-only vars were
 * added to .env.local.example to cover this: STRIPE_PRICE_FAMILY_MONTHLY
 * and STRIPE_PRICE_FAMILY_ANNUAL. Both must be set to real Stripe Price IDs
 * (Stripe Dashboard -> Product catalogue -> the recurring price for the
 * Family plan) for checkout to work; left empty, /api/stripe/checkout fails
 * clean with `plan_not_configured` rather than calling Stripe with a blank
 * price.
 */
const PRICE_ID_BY_PLAN: Record<BillingPlan, string> = {
  family_monthly: process.env.STRIPE_PRICE_FAMILY_MONTHLY ?? "",
  family_annual: process.env.STRIPE_PRICE_FAMILY_ANNUAL ?? "",
};

export function priceIdForPlan(plan: BillingPlan): string | null {
  const id = PRICE_ID_BY_PLAN[plan]?.trim();
  return id && id.length > 0 ? id : null;
}

/** Reverse lookup used by the webhook to translate a Stripe price back to our plan enum. */
export function planForPriceId(priceId: string | null | undefined): BillingPlan | null {
  if (!priceId) return null;
  for (const plan of BILLING_PLANS) {
    if (PRICE_ID_BY_PLAN[plan] && PRICE_ID_BY_PLAN[plan] === priceId) return plan;
  }
  return null;
}
