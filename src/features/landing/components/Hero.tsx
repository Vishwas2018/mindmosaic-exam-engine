import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, Heart, TrendingUp, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { hero, trustStrip } from "../content";
import { lpButton } from "./primitives";

const trustIcons: Record<string, LucideIcon> = {
  BookOpenCheck,
  Zap,
  TrendingUp,
  Heart,
};

export function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="site-width py-12 sm:py-16 lg:py-20">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-10">
        <div>
          <h1
            id="hero-heading"
            className="font-display text-4xl font-bold leading-[1.05] tracking-[-0.03em] text-lp-ink sm:text-5xl lg:text-[3.4rem]"
          >
            {hero.headlineLines.map((line) => (
              <span key={line.text} className={line.tone === "brand" ? "block text-brand" : "block"}>
                {line.text}
              </span>
            ))}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-lp-muted">{hero.subheadline}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={hero.primaryCta.href} className={lpButton({ size: "lg" })}>
              {hero.primaryCta.label}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <Link href={hero.secondaryCta.href} className={lpButton({ variant: "outline", size: "lg" })}>
              {hero.secondaryCta.label}
            </Link>
          </div>

          <ul className="mt-9 flex flex-wrap gap-x-7 gap-y-3">
            {hero.trustChips.map((chip) => {
              const Icon = trustIcons[chip.icon] ?? BookOpenCheck;
              return (
                <li key={chip.label} className="flex items-center gap-2 text-sm font-semibold text-lp-muted">
                  <Icon aria-hidden="true" className="h-4 w-4 text-brand" />
                  {chip.label}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-md overflow-x-clip lg:max-w-none lg:overflow-visible">
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
              <div
                key={chip.label}
                className={
                  index === 0
                    ? "absolute left-2 top-6 w-32 rounded-2xl bg-white p-3 shadow-[0_16px_40px_rgba(42,16,81,0.16)] sm:-left-4 sm:w-40 sm:p-3.5"
                    : "absolute right-2 bottom-8 w-32 rounded-2xl bg-white p-3 shadow-[0_16px_40px_rgba(42,16,81,0.16)] sm:-right-3 sm:w-40 sm:p-3.5"
                }
              >
                <p className="text-xs font-bold text-lp-muted">{chip.label}</p>
                <p className="mt-1 font-display text-base font-bold tracking-[-0.02em] text-lp-ink sm:text-lg">
                  {chip.value}
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-brand/10">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${chip.fraction * 100}%` }} />
                </div>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}

export function TrustStrip() {
  return (
    <section aria-labelledby="trust-heading" className="border-y border-brand/10 bg-paper py-10">
      <div className="site-width flex flex-col items-center gap-6 text-center lg:flex-row lg:justify-between lg:text-left">
        <h2 id="trust-heading" className="text-base font-bold text-lp-ink">
          {trustStrip.heading}
        </h2>
        <ul className="flex flex-wrap justify-center gap-x-8 gap-y-3">
          {trustStrip.badges.map((badge) => (
            <li key={badge} className="text-sm font-semibold text-lp-muted">
              {badge}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
