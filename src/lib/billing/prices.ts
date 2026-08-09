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

/**
 * Whether the Family plan can actually be subscribed to today — the single
 * source of truth for "purchasable vs. roadmap" copy across every surface
 * that talks about the Family plan.
 *
 * "purchasable" means the Family plan has a real, working checkout code
 * path (src/app/api/stripe/checkout/route.ts creates a real Stripe
 * customer + Checkout Session; src/lib/stripe/config.ts resolves a real
 * price ID per billing cycle) — not that STRIPE_PRICE_FAMILY_MONTHLY /
 * STRIPE_PRICE_FAMILY_ANNUAL happen to be set in any given environment.
 * That's a deployment concern the checkout route already fails closed on
 * (503 "plan_not_configured") independent of this flag.
 *
 * Deliberately a maintained literal, not something computed from
 * process.env here: this file is imported by client components
 * (FamilyPlanCard) and must never pull in src/lib/stripe/config.ts's
 * `import "server-only"` guard. Same pattern as
 * src/features/catalogue/catalogue.ts's `ProgramStatus` ("live" |
 * "coming_soon") — flip it by hand when the checkout code path itself
 * changes (e.g. a second paid tier ships without checkout wiring yet),
 * not when env vars change.
 *
 * Every surface that shows Family-plan availability copy — the landing
 * pricing preview (src/features/landing/content.ts) and both /billing
 * components (FamilyPlanCard, PlanComparisonTable) — reads this export
 * rather than hardcoding its own "Coming soon" / "Join waitlist" string,
 * so they can't disagree about whether Family is purchasable again.
 *
 * Currently "roadmap" — external audit finding C-02. The checkout CODE
 * path is complete and works; what is not ready is the commercial and
 * legal side of charging for it:
 *
 *   - the displayed amounts are still PRICE_DISCLAIMER's own "placeholder
 *     amounts, not yet linked to a live Stripe price", so a parent could
 *     be charged something other than the advertised figure;
 *   - /privacy, /terms and /accessibility all still render
 *     features/legal/DraftBanner ("not final legal text… do not treat it
 *     as binding"), and /privacy states no retention or deletion policy
 *     has been published;
 *   - plans.faq's own footnote says billing and refund terms are pending
 *     legal sign-off.
 *
 * This flag is therefore doing exactly what its "flip it by hand" note
 * above describes: describing readiness, not env wiring. Flip back to
 * "purchasable" only once real Stripe Price IDs are wired, the displayed
 * price is derived from them, and the legal documents are signed off.
 */
export type PlanAvailability = "purchasable" | "roadmap";
export const FAMILY_PLAN_AVAILABILITY: PlanAvailability = "roadmap";
