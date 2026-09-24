import Link from "next/link";
import { Check } from "lucide-react";
import { clsx } from "clsx";

import { plans } from "../content";
import { mmButton, SectionHeading } from "./primitives";

/**
 * The three plan cards — design handoff screen 3.
 *
 * `showPricing` is off by default because the handoff records that pricing
 * copy was removed from the landing page's plans section at the client's
 * request: the Plans page carries it. The landing page therefore gets the
 * same three cards, the same features and the same CTAs, without the
 * numbers.
 *
 * Every price shown comes from src/lib/billing/prices.ts via ../content.ts,
 * so this section and the Stripe checkout cannot disagree.
 */
export function Plans({ showPricing = false }: { showPricing?: boolean } = {}) {
  return (
    <section
      id="plans"
      aria-labelledby="plans-heading"
      className="border-t border-mm-line bg-white py-[clamp(40px,4vw,64px)]"
    >
      <div className="mm-width">
        <SectionHeading
          id="plans-heading"
          eyebrow={plans.eyebrow}
          title={plans.heading}
          intro={showPricing ? plans.intro : undefined}
          className="mb-[clamp(22px,2.2vw,30px)]"
        />

        <div className="grid items-stretch gap-[clamp(20px,2.4vw,32px)] lg:grid-cols-3">
          {plans.items.map((plan) => (
            <div
              key={plan.id}
              className={clsx(
                "relative flex flex-col justify-between rounded-2xl bg-white p-[clamp(24px,2.6vw,34px)] shadow-sm transition-all",
                plan.highlighted
                  ? "border-2 border-mm-brand shadow-[0_8px_30px_rgba(89,37,168,0.08)] ring-1 ring-mm-brand/20"
                  : "border border-mm-line/80 hover:border-mm-brand/40",
              )}
            >
              <div>
                {plan.highlighted && (
                  <p className="absolute -top-3 left-[clamp(24px,2.6vw,34px)] rounded-full border border-coral-border bg-coral-light px-3 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em] text-mm-coral-text shadow-xs">
                    {plans.featuredTab}
                  </p>
                )}

                <p
                  className={clsx(
                    "text-xs font-bold uppercase tracking-[0.12em]",
                    plan.tone === "coral"
                      ? "text-mm-coral-text"
                      : plan.highlighted
                        ? "text-mm-brand"
                        : "text-mm-muted",
                  )}
                >
                  {plan.eyebrow}
                </p>

                <p className="mt-1 font-display text-[22px] font-bold tracking-[-0.02em] text-mm-ink">
                  {plan.name}
                </p>

                {showPricing && plan.price && (
                  <p className="mt-2 font-display text-[32px] font-extrabold tracking-[-0.03em] text-mm-ink">
                    {plan.price}
                    {plan.cadence && (
                      <span className="ml-1.5 font-sans text-sm font-semibold text-mm-muted">
                        {plan.cadence}
                      </span>
                    )}
                  </p>
                )}

                <p className="mt-2 text-[14px] leading-[1.6] text-mm-muted">{plan.body}</p>

                <ul className="my-6 grid gap-2.5">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-[14px] leading-[1.5] text-mm-ink-soft"
                    >
                      <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-mm-brand stroke-[2.5]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {showPricing && (
                  <p className="mb-4 text-[12.5px] leading-[1.55] text-mm-muted">{plan.note}</p>
                )}
              </div>

              <Link
                href={plan.cta.href}
                className={mmButton({
                  variant: plan.highlighted ? "primary" : "outline",
                  className: "w-full",
                })}
              >
                {plan.cta.label}
              </Link>
            </div>
          ))}
        </div>

        {!showPricing && (
          <p className="mt-[clamp(18px,2vw,26px)] text-[15px] leading-[1.6] text-mm-muted">
            Prices, the full comparison and the billing questions are on the{" "}
            <Link href="/pricing" className="font-bold text-mm-brand hover:underline">
              Plans page
            </Link>
            .
          </p>
        )}
      </div>
    </section>
  );
}
