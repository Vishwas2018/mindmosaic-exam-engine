/**
 * Single source of truth for the Family plan's display prices.
 *
 * These are GST-inclusive AUD placeholder amounts — not yet wired to real
 * Stripe price IDs (that lands in a later batch). Every surface that shows
 * a price (the /billing page today; Stripe checkout wiring later) should
 * import from here rather than hardcoding a number, so a real pricing
 * decision only has to change in one place.
 */

export type BillingPlan =
  | "family_monthly"
  | "family_annual"
  | "individual_monthly"
  | "individual_annual";

/** Human label for a stored plan value, for account screens. */
export const PLAN_LABELS: Record<BillingPlan, string> = {
  family_monthly: "Family (monthly)",
  family_annual: "Family (annual)",
  individual_monthly: "Individual (monthly)",
  individual_annual: "Individual (annual)",
};

/**
 * How many child profiles an account may hold. Individual is one learner;
 * Family — and a trial or any account with no paid plan yet — keeps the
 * original three, so nobody who signed up before Individual existed loses a
 * profile they already created.
 */
export function maxChildrenForPlan(plan: BillingPlan | null | undefined): number {
  return plan === "individual_monthly" || plan === "individual_annual"
    ? INDIVIDUAL_PLAN.maxChildren
    : FAMILY_PLAN.maxChildren;
}

export const CURRENCY = "AUD" as const;

export const FAMILY_PLAN = {
  name: "Family",
  maxChildren: 3,
  monthly: {
    plan: "family_monthly" as const,
    amount: 19.99,
    display: "A$19.99",
    period: "/mo",
  },
  annual: {
    plan: "family_annual" as const,
    amount: 169,
    display: "A$169",
    period: "/yr",
  },
} as const;

/** Single-learner plan: one child profile. */
export const INDIVIDUAL_PLAN = {
  name: "Individual",
  maxChildren: 1,
  monthly: {
    plan: "individual_monthly" as const,
    amount: 14.99,
    display: "A$14.99",
    period: "/mo",
  },
  annual: {
    plan: "individual_annual" as const,
    amount: 149,
    display: "A$149",
    period: "/yr",
  },
} as const;

/** The free tier: a taste of every programme, not unlimited practice. */
export const FREE_PLAN = {
  name: "Free",
  sampleQuestionsPerProgramme: 5,
} as const;

/** Whole-number percentage saved by paying annually instead of 12 months. */
export function annualSavingsPercent(plan: {
  monthly: { amount: number };
  annual: { amount: number };
}): number {
  return Math.round((1 - plan.annual.amount / (plan.monthly.amount * 12)) * 100);
}

/** Annual price spread over 12 months, formatted for display (e.g. "A$12.42"). */
export function annualPerMonthDisplay(plan: { annual: { amount: number } }): string {
  return `A$${(plan.annual.amount / 12).toFixed(2)}`;
}

/** Small print shown next to any displayed price — these are not final, Stripe-linked prices yet. */
export const PRICE_DISCLAIMER =
  "Prices are in AUD and include GST. Cancel any time from this page.";

/**
 * Whether a paid plan has a working checkout code path. Both do:
 * src/app/api/stripe/checkout/route.ts creates a real Stripe customer and
 * Checkout Session for any plan in BILLING_PLANS.
 *
 * Deliberately a maintained literal, not computed from process.env: this
 * file is imported by client components and must never pull in
 * src/lib/stripe/config.ts's `import "server-only"` guard. Whether Stripe
 * Price IDs are actually set in a given deployment is a separate, runtime
 * question answered server-side by `purchasablePlans()` in
 * src/lib/stripe/config.ts; /billing passes that result down, so a
 * deployment without prices shows "Register interest" instead of a Subscribe
 * button that would 503.
 */
export type PlanAvailability = "purchasable" | "roadmap";
export const FAMILY_PLAN_AVAILABILITY: PlanAvailability = "purchasable";
export const INDIVIDUAL_PLAN_AVAILABILITY: PlanAvailability = "purchasable";
