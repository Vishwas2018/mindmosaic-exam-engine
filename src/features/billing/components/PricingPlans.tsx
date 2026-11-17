"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";

import { Button, buttonClasses } from "@/components/ui";
import { cn } from "@/lib/cn";
import { redirectTo } from "@/lib/browser-redirect";
import {
  annualPerMonthDisplay,
  annualSavingsPercent,
  FAMILY_PLAN,
  FAMILY_PLAN_AVAILABILITY,
  FREE_PLAN,
  INDIVIDUAL_PLAN,
  INDIVIDUAL_PLAN_AVAILABILITY,
  PRICE_DISCLAIMER,
  type BillingPlan,
  type PlanAvailability,
} from "@/lib/billing/prices";

type BillingCycle = "monthly" | "annual";

const CYCLE_OPTIONS: { cycle: BillingCycle; label: string }[] = [
  { cycle: "monthly", label: "Monthly" },
  { cycle: "annual", label: "Annual" },
];

const FREE_FEATURES = [
  `${FREE_PLAN.sampleQuestionsPerProgramme} sample questions in every programme`,
  "A worked explanation after each question",
  "No credit card required",
] as const;

const INDIVIDUAL_FEATURES = [
  `${INDIVIDUAL_PLAN.maxChildren} child profile`,
  "Full question bank, every programme",
  "Full-length practice exam papers",
  "Progress dashboard & skill breakdowns",
] as const;

const FAMILY_FEATURES = [
  `Up to ${FAMILY_PLAN.maxChildren} children on one account`,
  "Everything in Individual",
  "Learning observations & recommendations",
  "Exam history & re-attempts",
  "One parent dashboard across every child",
] as const;

const SAVINGS_BADGE = Math.max(
  annualSavingsPercent(INDIVIDUAL_PLAN),
  annualSavingsPercent(FAMILY_PLAN),
);

function FeatureList({ items, inverse = false }: { items: readonly string[]; inverse?: boolean }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item}
          className={cn(
            "flex items-start gap-3 text-sm font-semibold leading-6",
            inverse ? "text-white/92" : "text-mm-ink-soft",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
              inverse ? "bg-white/18 text-white" : "bg-mm-positive-soft text-mm-positive",
            )}
          >
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function PriceBlock({
  plan,
  cycle,
  inverse = false,
}: {
  plan: typeof INDIVIDUAL_PLAN | typeof FAMILY_PLAN;
  cycle: BillingCycle;
  inverse?: boolean;
}) {
  const price = cycle === "monthly" ? plan.monthly : plan.annual;
  return (
    <div>
      <p className="flex items-baseline gap-1">
        <span
          className={cn(
            "text-5xl font-black tracking-[-0.04em]",
            inverse ? "text-white" : "text-mm-ink",
          )}
        >
          {price.display}
        </span>
        <span className={cn("text-base font-bold", inverse ? "text-white/75" : "text-mm-muted")}>
          {price.period}
        </span>
      </p>
      <p className={cn("mt-1.5 min-h-5 text-sm font-semibold", inverse ? "text-white/80" : "text-mm-muted")}>
        {cycle === "annual"
          ? `${annualPerMonthDisplay(plan)}/mo, billed yearly · save ${annualSavingsPercent(plan)}%`
          : "Billed monthly · cancel any time"}
      </p>
    </div>
  );
}

function RegisterInterest({ inverse = false }: { inverse?: boolean }) {
  return (
    <>
      <Link
        href="/help#contact"
        className={buttonClasses({
          variant: inverse ? "secondary" : "primary",
          size: "lg",
          className: cn("w-full", inverse && "border-white/0 text-mm-brand-deep hover:bg-white"),
        })}
      >
        Register interest
      </Link>
      <p className={cn("text-center text-xs font-semibold", inverse ? "text-white/75" : "text-mm-muted")}>
        Not open for subscriptions yet
      </p>
    </>
  );
}

function SubscribeAction({
  label,
  loading,
  error,
  onClick,
  inverse = false,
}: {
  label: string;
  loading: boolean;
  error: string | null;
  onClick: () => void;
  inverse?: boolean;
}) {
  return (
    <>
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-mm-coral-deep ring-1 ring-mm-coral/30"
        >
          {error}
        </p>
      )}
      <Button
        type="button"
        size="lg"
        className={cn(
          "w-full",
          inverse
            ? "bg-white text-mm-brand-deep shadow-none hover:bg-white"
            : "bg-[linear-gradient(135deg,var(--mm-brand-deep),var(--mm-brand))] text-white",
        )}
        isLoading={loading}
        loadingLabel="Starting checkout"
        onClick={onClick}
      >
        {label}
      </Button>
    </>
  );
}

/**
 * The three-tier plan picker on /billing: Free, Individual and Family, with a
 * monthly/annual toggle.
 *
 * `availability` says, per paid tier, whether this deployment can take a
 * payment (the server checks Stripe is configured and the tier's prices are
 * set). A tier that can't shows "Register interest" and never a checkout
 * button. Defaults to the code-level flags so a bare render stays honest.
 */
export function PricingPlans({
  availability = { individual: INDIVIDUAL_PLAN_AVAILABILITY, family: FAMILY_PLAN_AVAILABILITY },
}: {
  availability?: { individual: PlanAvailability; family: PlanAvailability };
}) {
  const [cycle, setCycle] = useState<BillingCycle>("annual");
  const [submitting, setSubmitting] = useState<"individual" | "family" | null>(null);
  const [error, setError] = useState<{ tier: "individual" | "family"; message: string } | null>(null);

  const familyPurchasable = availability.family === "purchasable";
  const individualPurchasable = availability.individual === "purchasable";

  async function handleSubscribe(tier: "individual" | "family") {
    const planDef = tier === "family" ? FAMILY_PLAN : INDIVIDUAL_PLAN;
    const plan: BillingPlan = cycle === "monthly" ? planDef.monthly.plan : planDef.annual.plan;
    const failure = { tier, message: "Checkout isn't available yet. Please try again soon." };
    setError(null);
    setSubmitting(tier);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (response.status === 401) {
        setError({ tier, message: "Sign in with your parent account to subscribe." });
        return;
      }
      if (response.status === 403) {
        setError({ tier, message: "Only a parent account can subscribe." });
        return;
      }
      const body = response.ok
        ? ((await response.json().catch(() => null)) as { url?: string } | null)
        : null;
      if (!body?.url) {
        setError(failure);
        return;
      }
      redirectTo(body.url);
    } catch {
      setError(failure);
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <section aria-labelledby="plans-heading">
      <div className="flex flex-col items-center gap-4 text-center">
        <h2 id="plans-heading" className="sr-only">
          Plans
        </h2>
        <div
          role="radiogroup"
          aria-label="Billing cycle"
          className="inline-grid grid-cols-2 gap-1 rounded-full border border-mm-line bg-white p-1 shadow-[0_8px_24px_-12px_rgba(89,37,168,0.25)]"
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
                className={cn(
                  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/25",
                  active
                    ? "bg-[linear-gradient(135deg,var(--mm-brand-deep),var(--mm-brand))] text-white shadow-[0_6px_16px_-6px_rgba(89,37,168,0.6)]"
                    : "text-mm-ink-soft hover:bg-mm-wash",
                )}
              >
                {option.label}
                {option.cycle === "annual" && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-black",
                      active ? "bg-white/20 text-white" : "bg-mm-positive-soft text-mm-positive",
                    )}
                  >
                    Save up to {SAVINGS_BADGE}%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-10 grid items-stretch gap-6 lg:grid-cols-3">
        {/* Free */}
        <article className="flex flex-col rounded-[28px] border border-mm-line bg-white/80 p-7 shadow-[0_18px_50px_-24px_rgba(24,21,31,0.18)]">
          <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-mm-muted">
            {FREE_PLAN.name}
          </p>
          <p className="mt-1 text-sm font-semibold text-mm-muted">Try before you commit.</p>
          <div className="mt-6">
            <p className="flex items-baseline gap-1">
              <span className="text-5xl font-black tracking-[-0.04em] text-mm-ink">A$0</span>
              <span className="text-base font-bold text-mm-muted">forever</span>
            </p>
            <p className="mt-1.5 min-h-5 text-sm font-semibold text-mm-muted">
              {FREE_PLAN.sampleQuestionsPerProgramme} questions per programme
            </p>
          </div>
          <div className="my-6 h-px bg-mm-line-soft" />
          <FeatureList items={FREE_FEATURES} />
          <div className="mt-auto space-y-2 pt-8">
            <Link
              href="/sign-up"
              className={buttonClasses({ variant: "secondary", size: "lg", className: "w-full" })}
            >
              Start free
            </Link>
          </div>
        </article>

        {/* Individual */}
        <article className="flex flex-col rounded-[28px] border border-mm-line bg-white p-7 shadow-[0_18px_50px_-24px_rgba(24,21,31,0.18)]">
          <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-mm-brand">
            {INDIVIDUAL_PLAN.name}
          </p>
          <p className="mt-1 text-sm font-semibold text-mm-muted">For one learner.</p>
          <div className="mt-6">
            <PriceBlock plan={INDIVIDUAL_PLAN} cycle={cycle} />
          </div>
          <div className="my-6 h-px bg-mm-line-soft" />
          <FeatureList items={INDIVIDUAL_FEATURES} />
          <div className="mt-auto space-y-2 pt-8">
            {individualPurchasable ? (
              <SubscribeAction
                label={`Subscribe to ${INDIVIDUAL_PLAN.name}`}
                loading={submitting === "individual"}
                error={error?.tier === "individual" ? error.message : null}
                onClick={() => void handleSubscribe("individual")}
              />
            ) : (
              <RegisterInterest />
            )}
          </div>
        </article>

        {/* Family — featured */}
        <article className="relative flex flex-col overflow-hidden rounded-[28px] bg-[linear-gradient(155deg,var(--mm-brand-deep)_0%,var(--mm-brand)_55%,#7b3fd4_100%)] p-7 text-white shadow-[0_30px_70px_-24px_rgba(89,37,168,0.6)] lg:-my-3 lg:py-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(255,85,90,0.55),transparent_65%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -left-16 h-60 w-60 rounded-full bg-[radial-gradient(circle,rgba(155,114,206,0.55),transparent_65%)]"
          />
          <div className="relative flex flex-1 flex-col">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-white/85">
                {FAMILY_PLAN.name}
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-mm-coral px-3 py-1 text-xs font-black text-white">
                <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
                Best value
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold text-white/80">
              For siblings — up to {FAMILY_PLAN.maxChildren} children.
            </p>
            <div className="mt-6">
              <PriceBlock plan={FAMILY_PLAN} cycle={cycle} inverse />
            </div>
            <div className="my-6 h-px bg-white/20" />
            <FeatureList items={FAMILY_FEATURES} inverse />
            <div className="mt-auto space-y-2 pt-8">
              {familyPurchasable ? (
                <SubscribeAction
                  inverse
                  label={`Subscribe to ${FAMILY_PLAN.name}`}
                  loading={submitting === "family"}
                  error={error?.tier === "family" ? error.message : null}
                  onClick={() => void handleSubscribe("family")}
                />
              ) : (
                <RegisterInterest inverse />
              )}
            </div>
          </div>
        </article>
      </div>

      <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-5 text-mm-muted">
        {PRICE_DISCLAIMER}
      </p>
    </section>
  );
}
