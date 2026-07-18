import Link from "next/link";
import { Check, ChevronDown, Info } from "lucide-react";

import { faq, pricing } from "../content";
import { LpCard, SectionHeading, lpButton } from "./primitives";

export function Pricing() {
  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="site-width scroll-mt-24 py-16 sm:py-24"
    >
      <SectionHeading
        id="pricing-heading"
        eyebrow="Pricing"
        title={pricing.heading}
        align="center"
      />
      <p className="mx-auto mt-6 flex max-w-2xl items-start gap-2.5 rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm leading-6 text-lp-ink">
        <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong" />
        <span>
          <strong className="font-extrabold">Placeholder pricing: </strong>
          {pricing.disclaimer}
        </span>
      </p>

      <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-3">
        {pricing.tiers.map((tier) => (
          <LpCard
            key={tier.name}
            className={
              tier.highlighted
                ? "relative flex flex-col border-brand/30 p-8 shadow-[0_30px_70px_rgba(42,16,81,0.18)] ring-2 ring-brand/20"
                : "flex flex-col p-8"
            }
          >
            {tier.highlighted && (
              <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 rounded-full bg-accent-strong px-3.5 py-1.5 text-xs font-extrabold text-white shadow">
                Most families
              </span>
            )}
            <h3 className="font-display text-xl font-bold tracking-[-0.02em] text-lp-ink">
              {tier.name}
            </h3>
            <p className="mt-3">
              <span className="font-display text-4xl font-bold tracking-[-0.03em] text-brand">
                {tier.price}
              </span>
              {tier.period && (
                <span className="text-base font-bold text-lp-muted">
                  {tier.period}
                </span>
              )}
            </p>
            <p className="mt-2 text-sm leading-6 text-lp-muted">{tier.audience}</p>
            <ul className="mt-6 flex-1 space-y-3">
              {tier.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2.5 text-sm font-semibold text-lp-ink"
                >
                  <Check
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0 text-brand"
                  />
                  {feature}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs leading-5 text-lp-muted">{tier.limits}</p>
            <Link
              href="/"
              className={lpButton({
                variant: tier.highlighted ? "primary" : "outline",
                className: "mt-6 w-full",
              })}
            >
              {tier.cta}
            </Link>
          </LpCard>
        ))}
      </div>
    </section>
  );
}

export function Faq() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="scroll-mt-24 border-y border-brand/10 bg-white py-16 sm:py-24"
    >
      <div className="site-width grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
        <div>
          <SectionHeading
            id="faq-heading"
            eyebrow="FAQ"
            title={faq.heading}
          />
          <p className="mt-5 text-base leading-7 text-lp-muted">
            Something else on your mind? Write to{" "}
            <a
              href="mailto:hello@mindmosaic.app"
              className="font-bold text-brand underline decoration-brand/30 underline-offset-4 hover:decoration-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25"
            >
              hello@mindmosaic.app
            </a>
            .
          </p>
        </div>
        <div className="space-y-3">
          {faq.items.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-brand/10 bg-paper/70 p-5 open:bg-paper"
            >
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 rounded-xl font-bold text-lp-ink [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown
                  aria-hidden="true"
                  className="h-5 w-5 shrink-0 text-brand transition-transform duration-200 group-open:rotate-180"
                />
              </summary>
              <p className="mt-3 text-sm leading-7 text-lp-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
