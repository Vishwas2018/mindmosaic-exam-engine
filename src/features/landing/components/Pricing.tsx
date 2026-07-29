import Link from "next/link";
import { Check } from "lucide-react";

import { pricing } from "../content";
import { LpCard, SectionHeading, lpButton } from "./primitives";

export function Pricing() {
  return (
    <section
      id="plans"
      aria-labelledby="pricing-heading"
      className="scroll-mt-24 bg-[color-mix(in_srgb,var(--brand)_4%,white)] py-[var(--lp-section-py-major)]"
    >
      <div className="site-width">
      <SectionHeading
        id="pricing-heading"
        title={pricing.heading}
        intro={pricing.subheading}
        align="center"
      />

      <div className="mx-auto mt-12 grid max-w-[820px] justify-center gap-8 sm:grid-cols-2">
        {pricing.plans.map((plan) => (
          <LpCard
            key={plan.name}
            className={
              plan.highlighted
                ? "relative flex w-full max-w-[390px] flex-col p-8 ring-2 ring-brand"
                : "relative flex w-full max-w-[390px] flex-col p-8"
            }
          >
            {plan.badge && (
              <span className="absolute -top-3 left-8 rounded-pill bg-brand px-3 py-1 text-sm font-extrabold uppercase tracking-wider text-white">
                {plan.badge}
              </span>
            )}
            <h3 className="font-sans text-xl font-semibold tracking-[-0.01em] text-lp-ink">{plan.name}</h3>
            <p className="mt-4 flex items-baseline gap-1.5">
              <span className="font-sans text-4xl font-bold tracking-[-0.02em] text-lp-ink">
                {plan.price}
              </span>
              {plan.cadence && <span className="text-sm font-semibold text-lp-muted">/ {plan.cadence}</span>}
            </p>
            <p className="mt-2 text-sm leading-[1.5] text-lp-muted">{plan.description}</p>

            <ul className="mt-6 flex flex-1 flex-col gap-3.5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-base text-lp-ink">
                  <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              href={plan.cta.href}
              className={lpButton({ variant: plan.highlighted ? "primary" : "outline", size: "lg", className: "mt-8 w-full" })}
            >
              {plan.cta.label}
            </Link>
          </LpCard>
        ))}
      </div>

      <div className="mx-auto mt-8 max-w-2xl space-y-1.5 text-center text-sm text-lp-muted">
        <p>{pricing.disclaimer}</p>
        <p>{pricing.priceNote}</p>
        <p className="font-semibold text-lp-ink">{pricing.cancelNote}</p>
      </div>
      </div>
    </section>
  );
}
