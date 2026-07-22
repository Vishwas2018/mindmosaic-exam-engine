/**
 * Single source of truth for the Family plan's display prices.
 *
 * These are GST-inclusive AUD placeholder amounts — not yet wired to real
 * Stripe price IDs (that lands in a later batch). Every surface that shows
 * a price (the /billing page today; Stripe checkout wiring later) should
 * import from here rather than hardcoding a number, so a real pricing
 * decision only has to change in one place.
 */

export type BillingPlan = "family_monthly" | "family_annual";

export const CURRENCY = "AUD" as const;

export const FAMILY_PLAN = {
  name: "Family",
  maxChildren: 3,
  monthly: {
    plan: "family_monthly" as const,
    amount: 14.99,
    display: "A$14.99",
    period: "/mo",
  },
  annual: {
    plan: "family_annual" as const,
    amount: 149,
    display: "A$149",
    period: "/yr",
  },
} as const;

/** Small print shown next to any displayed price — these are not final, Stripe-linked prices yet. */
export const PRICE_DISCLAIMER =
  "GST-inclusive AUD — pricing subject to change. Placeholder amounts, not yet linked to a live Stripe price.";
