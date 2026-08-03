import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, BookOpenCheck, ShieldCheck, TrendingUp, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { hero, trustStrip } from "../content";
import { lpButton } from "./primitives";

const trustIcons: Record<string, LucideIcon> = {
  ShieldCheck,
  BookOpenCheck,
  Zap,
  TrendingUp,
};

/* Placed absolutely around the hero photo; index picks the corner. */
const floatingChipPositions = [
  "absolute left-2 top-6 w-36 rounded-card bg-white p-3.5 shadow-card-rest sm:-left-4 sm:w-44",
  "absolute right-2 bottom-8 w-36 rounded-card bg-white p-3.5 shadow-card-rest sm:-right-3 sm:w-44",
  "absolute right-4 top-1/2 hidden w-40 -translate-y-1/2 rounded-card bg-white p-3.5 shadow-card-rest sm:block",
];

export function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="site-width py-18 sm:py-20 lg:py-24">
      <div className="grid items-center gap-12 lg:min-h-[590px] lg:grid-cols-[52fr_48fr] lg:gap-16">
        <div>
          <h1
            id="hero-heading"
            className="lp-rise max-w-[540px] font-display text-hero font-bold tracking-[-0.02em] text-lp-ink"
          >
            {hero.headlineLines.map((line) => (
              <span key={line.text} className={line.tone === "brand" ? "block text-brand" : "block"}>
                {line.text}
              </span>
            ))}
          </h1>
          <p className="lp-rise lp-rise-1 mt-5 max-w-xl font-sans text-lg leading-[1.6] text-lp-muted">
            {hero.subheadline}
          </p>

          <div className="lp-rise lp-rise-2 mt-8 flex flex-wrap items-center gap-3">
            <Link href={hero.primaryCta.href} className={lpButton({ size: "lg" })}>
              {hero.primaryCta.label}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <Link href={hero.secondaryCta.href} className={lpButton({ variant: "outline", size: "lg" })}>
              {hero.secondaryCta.label}
            </Link>
          </div>

          <ul className="lp-rise lp-rise-2 mt-9 flex flex-wrap gap-x-6 gap-y-3">
            {hero.trustChips.map((chip) => {
              const Icon = trustIcons[chip.icon] ?? BookOpenCheck;
              return (
                <li key={chip.label} className="flex items-center gap-2 text-sm font-medium text-lp-muted">
                  <Icon aria-hidden="true" className="h-5 w-5 text-brand" />
                  {chip.label}
                </li>
              );
            })}
          </ul>

          <p className="mt-5 max-w-md text-sm leading-5 text-lp-muted">{hero.disclaimer}</p>
        </div>

        <div className="lp-rise lp-rise-1 relative mx-auto w-full max-w-lg overflow-x-clip lg:max-w-none lg:overflow-visible">
          <Image
            src={hero.image.src}
            alt={hero.image.alt}
            width={hero.image.width}
            height={hero.image.height}
            priority
            className="w-full rounded-4xl object-cover"
          />
          {/* Small positive inset on mobile (no room to spill past the viewport edge), the fuller "floating past the image" treatment from sm: up. */}
          {hero.floatingChips.enabled &&
            hero.floatingChips.chips.map((chip, index) => (
              <div key={chip.label} className={floatingChipPositions[index]}>
                <p className="text-sm font-bold uppercase tracking-[0.06em] text-lp-muted">Illustrative</p>
                <p className="mt-1 text-sm font-bold text-lp-muted">{chip.label}</p>
                <p className="mt-1 font-sans text-base font-bold tracking-[-0.01em] text-lp-ink sm:text-lg">
                  {chip.value}
                </p>
                {"fraction" in chip && (
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-brand/10">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${chip.fraction * 100}%` }} />
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}

export function TrustStrip() {
  return (
    <section
      aria-labelledby="trust-heading"
      className="border-y border-brand/10 bg-[color-mix(in_srgb,var(--brand)_4%,white)] py-7"
    >
      <div className="site-width flex flex-col items-center gap-5 text-center lg:flex-row lg:justify-between lg:text-left">
        <h2 id="trust-heading" className="text-base font-bold text-lp-ink">
          {trustStrip.heading}
        </h2>
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-3">
          {trustStrip.badges.map((badge) => (
            <li key={badge} className="flex items-center gap-2.5 text-sm font-bold text-lp-ink">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/12">
                <BadgeCheck aria-hidden="true" className="h-4 w-4 text-brand" />
              </span>
              {badge}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
