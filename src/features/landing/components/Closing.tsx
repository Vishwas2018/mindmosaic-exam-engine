import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { finalCta, footer } from "../content";
import { LandingLogo } from "./Brand";
import { lpButton } from "./primitives";

export function FinalCta() {
  return (
    <section aria-labelledby="final-cta-heading" className="site-width py-16 sm:py-24">
      <div className="lp-grid-dark relative overflow-hidden rounded-[2.5rem] bg-brand-ink px-8 py-14 text-white shadow-[0_36px_90px_rgba(42,16,81,0.4)] sm:px-14 sm:py-18">
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-bright/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-28 -left-16 h-64 w-64 rounded-full bg-accent/15 blur-3xl"
        />
        <div className="relative max-w-2xl">
          <h2
            id="final-cta-heading"
            className="font-display text-3xl font-bold leading-[1.08] tracking-[-0.03em] sm:text-4xl"
          >
            {finalCta.heading}
          </h2>
          <p className="mt-5 text-lg leading-8 text-white/75">{finalCta.body}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={finalCta.primaryCta.href}
              className={lpButton({ variant: "inverse", size: "lg" })}
            >
              {finalCta.primaryCta.label}
              <ArrowRight aria-hidden="true" className="h-5 w-5" />
            </Link>
            <a
              href={finalCta.secondaryCta.href}
              className={lpButton({
                variant: "outline",
                size: "lg",
                className:
                  "border-white/25 bg-transparent text-white shadow-none hover:border-white/50 hover:bg-white/10",
              })}
            >
              {finalCta.secondaryCta.label}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-brand/10 bg-white">
      <div className="site-width py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <LandingLogo />
            <p className="mt-4 max-w-xs text-sm leading-6 text-lp-muted">
              {footer.tagline}
            </p>
          </div>
          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-8 sm:grid-cols-4"
          >
            {footer.columns.map((column) => (
              <div key={column.title}>
                <h3 className="text-xs font-extrabold uppercase tracking-[0.12em] text-lp-ink">
                  {column.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="rounded text-sm font-semibold text-lp-muted hover:text-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <p className="mt-12 border-t border-brand/8 pt-6 text-xs leading-6 text-lp-muted">
          {footer.disclaimer}
        </p>
      </div>
    </footer>
  );
}
