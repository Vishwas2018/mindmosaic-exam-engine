import { Info } from "lucide-react";

import { howItWorks, socialProof } from "../content";
import { AvatarInitial, ImageSlot, LpCard, SectionHeading, Stars } from "./primitives";

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="site-width scroll-mt-24 py-16 sm:py-24"
    >
      <SectionHeading
        id="how-heading"
        eyebrow="How it works"
        title={howItWorks.heading}
        intro={howItWorks.intro}
        align="center"
      />
      <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {howItWorks.steps.map((step, index) => (
          <li key={step.title} className="relative">
            {/* Connector between steps on wide screens */}
            {index < howItWorks.steps.length - 1 && (
              <span
                aria-hidden="true"
                className="absolute -right-2.5 top-9 hidden h-0.5 w-5 bg-brand/20 lg:block"
              />
            )}
            <LpCard className="h-full p-6">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand font-display text-lg font-bold text-white shadow-[0_10px_24px_rgba(89,37,168,0.28)]">
                {index + 1}
              </span>
              <h3 className="mt-4 font-display text-lg font-bold tracking-[-0.02em] text-lp-ink">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-lp-muted">{step.body}</p>
            </LpCard>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function SocialProof() {
  return (
    <section
      aria-labelledby="proof-heading"
      className="border-y border-brand/10 bg-white py-16 sm:py-24"
    >
      <div className="site-width">
        <SectionHeading
          id="proof-heading"
          eyebrow="Early feedback"
          title={socialProof.heading}
        />

        <p className="mt-6 flex max-w-3xl items-start gap-2.5 rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm leading-6 text-lp-ink">
          <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong" />
          <span>
            <strong className="font-extrabold">Placeholder content: </strong>
            {socialProof.disclaimer}
          </span>
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {socialProof.testimonials.map((testimonial) => (
            <LpCard key={testimonial.name} className="flex flex-col p-6">
              <Stars count={testimonial.stars} />
              <blockquote className="mt-4 flex-1 text-sm leading-6 text-lp-ink">
                “{testimonial.quote}”
              </blockquote>
              <footer className="mt-5 flex items-center gap-3 border-t border-brand/8 pt-3">
                <ImageSlot aspectW={1} aspectH={1} className="h-8 w-8 shrink-0 rounded-full">
                  <AvatarInitial name={testimonial.name} />
                </ImageSlot>
                <span className="text-xs font-bold text-lp-muted">
                  {testimonial.name}
                </span>
              </footer>
            </LpCard>
          ))}
        </div>

        <ul className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
          {socialProof.metrics.map((metric) => (
            <li key={metric.label}>
              <p className="font-display text-3xl font-bold tracking-[-0.03em] text-brand sm:text-4xl">
                {metric.value}
              </p>
              <p className="mt-1 text-sm font-extrabold text-lp-ink">
                {metric.label}
              </p>
              <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-lp-muted">
                {metric.note}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
