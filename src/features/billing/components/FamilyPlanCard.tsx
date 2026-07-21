"use client";

import { useState } from "react";

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { redirectTo } from "@/lib/browser-redirect";
import { FAMILY_PLAN, PRICE_DISCLAIMER, type BillingPlan } from "@/lib/billing/prices";

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

export function FamilyPlanCard() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

        <div>
          <p>
            <span className="font-display text-4xl font-black tracking-[-0.03em] text-royal">
              {price.display}
            </span>
            <span className="ml-1 text-base font-bold text-muted">{price.period}</span>
          </p>
          <p className="mt-2 text-xs leading-5 text-muted">{PRICE_DISCLAIMER}</p>
        </div>

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
