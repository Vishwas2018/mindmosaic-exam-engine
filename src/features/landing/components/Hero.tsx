import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Lightbulb,
  LineChart,
  PenLine,
  ShieldCheck,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { hero, trustStrip } from "../content";
import { lpButton } from "./primitives";
import { Reveal } from "./Reveal";

const trustIcons: Record<string, LucideIcon> = {
  ShieldCheck,
  BookOpenCheck,
  Zap,
  TrendingUp,
};

const trustBadgeIcons: Record<string, LucideIcon> = {
  Users,
  LineChart,
  PenLine,
  Lightbulb,
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

/*
 * Section signature: the four trust points rendered as the four tiles of
 * the MindMosaic mark — three brand tiles and one orange, the page's only
 * accent moment in this band. Deliberately not `MosaicMark` from
 * primitives.tsx: that one is the 8px chip that pairs with `Eyebrow` type,
 * and its fourth tile uses `bg-accent`, a token this branch no longer
 * defines (see globals.css `@theme inline`), so it renders invisible.
 */
function MosaicSeal() {
  return (
    <span aria-hidden="true" className="inline-grid w-fit grid-cols-2 gap-1">
      <span className="h-2.5 w-2.5 rounded-[3px] bg-brand" />
      <span className="h-2.5 w-2.5 rounded-[3px] bg-brand-bright" />
      <span className="h-2.5 w-2.5 rounded-[3px] bg-brand/35" />
      <span className="h-2.5 w-2.5 rounded-[3px] bg-royal-orange" />
    </span>
  );
}

/*
 * A raised white card on a tinted full-bleed band, rather than text sitting
 * directly on the band: the strip now reads as a deliberate surface between
 * the hero and the first content section instead of an undecided gap. The
 * heading takes the left rail (display face, on the type scale at text-h3),
 * the four claims run as one divided row of equal columns — a rhythm the
 * old `flex-wrap` row could not hold, since at wide viewports it pushed the
 * heading and badges to opposite edges with a dead void between them.
 */
export function TrustStrip() {
  return (
    <section
      aria-labelledby="trust-heading"
      className="border-y border-brand/10 bg-[color-mix(in_srgb,var(--brand)_8%,white)] py-12 sm:py-14"
    >
      <div className="site-width">
        <div className="rounded-card border border-brand/10 bg-white px-6 py-8 shadow-card-rest sm:px-9 lg:px-10 lg:py-9">
          <div className="grid gap-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)] lg:items-center lg:gap-12">
            <Reveal>
              <MosaicSeal />
              <h2
                id="trust-heading"
                className="mt-4 text-balance font-display text-h3 font-bold tracking-[-0.01em] text-lp-ink"
              >
                {trustStrip.heading}
              </h2>
            </Reveal>

            {/* divide-x only from lg, where the row is a single 4-column line —
                at sm (2 columns) a left border would land mid-grid on item 3. */}
            <ul className="grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4 lg:gap-y-0 lg:divide-x lg:divide-brand/10">
              {trustStrip.badges.map((badge, index) => {
                const Icon = trustBadgeIcons[badge.icon] ?? BadgeCheck;
                return (
                  <li key={badge.label} className="lg:px-6 lg:first:pl-0 lg:last:pr-0">
                    {/* Icon beside the label on the narrowest screens (four stacked
                        icon-over-label blocks is a lot of scroll for one strip),
                        stacked from sm up where the columns have room. */}
                    <Reveal delayMs={index * 70} className="flex items-center gap-3.5 sm:block">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/8 text-brand">
                        <Icon aria-hidden="true" className="h-5 w-5" />
                      </span>
                      <p className="text-sm font-semibold leading-[1.45] text-lp-ink sm:mt-3.5">
                        {badge.label}
                      </p>
                    </Reveal>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
