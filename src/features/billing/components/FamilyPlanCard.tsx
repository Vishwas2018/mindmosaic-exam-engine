"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { redirectTo } from "@/lib/browser-redirect";
import { FAMILY_PLAN, FAMILY_PLAN_AVAILABILITY, PRICE_DISCLAIMER, type BillingPlan } from "@/lib/billing/prices";

/*
 * What the Family plan actually includes — the same real claims already
 * made in the /billing page's own intro copy and PlanComparisonTable's
 * feature rows, repeated here as a compact in-card checklist (04-billing.html's
 * plan-card feature list). No invented features: every line matches an
 * existing "family: true" row in PlanComparisonTable.tsx.
 */
const FAMILY_PLAN_HIGHLIGHTS = [
  `Up to ${FAMILY_PLAN.maxChildren} children on one account`,
  "Full question bank, every subject",
  "Subject-level skill breakdowns",
  "Learning observations & recommendations",
  "Exam history & re-attempts",
] as const;

/**
 * Real percentage saved by paying annually vs. 12x the monthly price —
 * derived from FAMILY_PLAN's own numbers (04-billing.html's "Save 25%"
 * pill, but computed rather than a placeholder figure since this plan's
 * two prices don't happen to work out to 25%).
 */
const ANNUAL_SAVINGS_PERCENT = Math.round(
  (1 - FAMILY_PLAN.annual.amount / (FAMILY_PLAN.monthly.amount * 12)) * 100,
);

/**
 * The Family plan subscribe/upgrade card. Posts to /api/stripe/checkout
 * (Batch 2's job to build — this only calls it) and redirects the browser
 * to the returned Stripe Checkout URL. If the endpoint isn't there yet or
 * returns a non-OK response, this shows an inline error instead of
 * crashing — per docs/PRIVACY_AND_BILLING_GUARDRAILS.md, nothing here
 * should ever block guest practice; this page is purely opt-in.
 */

type BillingCycle = "monthly" | "annual";

const CYCLE_OPTIONS: { cycle: BillingCycle; label: string }[] = [
  { cycle: "monthly", label: "Monthly" },
  { cycle: "annual", label: "Annual" },
];

function cyclePrice(cycle: BillingCycle) {
  return cycle === "monthly" ? FAMILY_PLAN.monthly : FAMILY_PLAN.annual;
}

function cyclePlan(cycle: BillingCycle): BillingPlan {
  return cyclePrice(cycle).plan;
}

/**
 * Roadmap fallback — not reachable today (FAMILY_PLAN_AVAILABILITY is
 * "purchasable"), but keeps this card honest if a future plan ships
 * without its checkout code path yet, instead of always showing a live
 * Subscribe button regardless of prices.ts's availability flag.
 */
function FamilyPlanRoadmapCard() {
  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <CardTitle>{FAMILY_PLAN.name} plan</CardTitle>
        <Badge variant="purple">Coming soon</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted">
          {FAMILY_PLAN.name} isn&apos;t open for subscriptions yet. Join the waitlist and we&apos;ll let you know
          the moment it launches.
        </p>
      </CardContent>
    </Card>
  );
}

export function FamilyPlanCard() {
  // Hooks always run (Rules of Hooks) even though this branch is static —
  // the early return below happens after every hook has been called.
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (FAMILY_PLAN_AVAILABILITY !== "purchasable") {
    return <FamilyPlanRoadmapCard />;
  }

  const price = cyclePrice(cycle);

  async function handleSubscribe() {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: cyclePlan(cycle) }),
      });
      if (!response.ok) {
        setError("Checkout isn't available yet. Please try again soon.");
        return;
      }
      const body = (await response.json().catch(() => null)) as { url?: string } | null;
      if (!body?.url) {
        setError("Checkout isn't available yet. Please try again soon.");
        return;
      }
      redirectTo(body.url);
    } catch {
      setError("Checkout isn't available yet. Please try again soon.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>{FAMILY_PLAN.name} plan</CardTitle>
          <p className="mt-1 text-sm leading-6 text-muted">
            Up to {FAMILY_PLAN.maxChildren} children on one account.
          </p>
        </div>
        <Badge variant="purple">Most families</Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <div
            role="radiogroup"
            aria-label="Billing cycle"
            className="grid grid-cols-2 gap-2 rounded-2xl border border-royal/10 bg-page/60 p-1.5"
          >
            {CYCLE_OPTIONS.map((option) => {
              const active = option.cycle === cycle;
              return (
                <button
                  key={option.cycle}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setCycle(option.cycle)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20 ${
                    active ? "bg-royal text-white" : "text-royal hover:bg-royal/8"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {cycle === "annual" && ANNUAL_SAVINGS_PERCENT > 0 && (
            <Badge variant="success">Save ~{ANNUAL_SAVINGS_PERCENT}%</Badge>
          )}
        </div>

        <div>
          <p>
            <span className="text-4xl font-black tracking-[-0.03em] text-royal">
              {price.display}
            </span>
            <span className="ml-1 text-base font-bold text-muted">{price.period}</span>
          </p>
          <p className="mt-2 text-xs leading-5 text-muted">{PRICE_DISCLAIMER}</p>
        </div>

        <ul className="space-y-2.5 border-t border-royal/8 pt-5">
          {FAMILY_PLAN_HIGHLIGHTS.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm font-semibold text-ink">
              <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              {item}
            </li>
          ))}
        </ul>

        {error && (
          <p role="alert" className="text-sm font-semibold text-error">
            {error}
          </p>
        )}

        <Button
          type="button"
          className="w-full"
          isLoading={isSubmitting}
          loadingLabel="Starting checkout"
          onClick={handleSubscribe}
        >
          Subscribe to {FAMILY_PLAN.name}
        </Button>
      </CardContent>
    </Card>
  );
}
