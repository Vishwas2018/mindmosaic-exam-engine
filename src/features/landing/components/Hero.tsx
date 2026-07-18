import Link from "next/link";
import { ArrowRight, Check, Flag, Timer } from "lucide-react";

import { hero } from "../content";
import { lpButton, TileMeter } from "./primitives";

/** CSS-drawn Grade 5 number-line question — the product's world, not a stock dashboard. */
function SessionMockup() {
  return (
    <div className="lp-rise lp-rise-2 relative">
      <div
        aria-hidden="true"
        className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-[radial-gradient(circle_at_20%_10%,rgba(124,58,237,0.14),transparent_55%),radial-gradient(circle_at_90%_90%,rgba(239,68,68,0.1),transparent_45%)]"
      />
      <div className="rounded-3xl border border-brand/10 bg-white p-5 shadow-[0_30px_80px_rgba(42,16,81,0.16)] sm:p-6">
        {/* Session chrome */}
        <div className="flex items-center justify-between gap-3 border-b border-brand/8 pb-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/8 px-3 py-1.5 text-xs font-bold text-brand">
              Grade 5 · Numeracy
            </span>
            <span className="hidden items-center gap-1.5 rounded-full bg-paper px-3 py-1.5 text-xs font-bold text-lp-muted sm:inline-flex">
              <Timer aria-hidden="true" className="h-3.5 w-3.5" />
              Untimed
            </span>
          </div>
          <span className="text-xs font-bold tabular-nums text-lp-muted">
            Question 8 of 24
          </span>
        </div>

        {/* Progress tiles */}
        <div aria-hidden="true" className="mt-4 flex gap-1">
          {Array.from({ length: 24 }, (_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i < 7 ? "bg-brand" : i === 7 ? "bg-accent" : "bg-brand/12"}`}
            />
          ))}
        </div>

        {/* Question */}
        <p className="mt-5 font-semibold leading-7 text-lp-ink">
          The number line shows the position of point <strong>P</strong>. What
          number does <strong>P</strong> represent?
        </p>

        {/* Number line */}
        <div aria-hidden="true" className="mt-6 px-2">
          <div className="relative h-14">
            <div className="absolute left-0 right-0 top-6 h-0.5 rounded bg-lp-ink/70" />
            {[0, 1, 2, 3, 4].map((n, i) => (
              <div
                key={n}
                className="absolute top-3"
                style={{ left: `${i * 25}%` }}
              >
                <div className="mx-auto h-4 w-0.5 -translate-x-1/2 bg-lp-ink/70" />
                <div className="-translate-x-1/2 pt-1.5 text-center text-xs font-bold tabular-nums text-lp-muted">
                  {n / 2}
                </div>
              </div>
            ))}
            {/* Point P at 1.25 → 62.5% */}
            <div className="absolute top-0" style={{ left: "62.5%" }}>
              <div className="-translate-x-1/2 text-center">
                <span className="text-sm font-black text-accent-strong">P</span>
                <div className="mx-auto mt-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-accent shadow" />
              </div>
            </div>
          </div>
        </div>

        {/* Answer entry */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-lp-muted">P =</span>
          <span className="inline-flex min-h-11 min-w-24 items-center rounded-xl border-2 border-brand bg-brand/4 px-4 font-display text-lg font-bold text-brand-ink">
            1.25
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-lp-muted">
            <Flag aria-hidden="true" className="h-3.5 w-3.5" />
            Flag for review
          </span>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-brand/8 pt-4">
          {/* On sm+ the floating skill card overlaps the bottom-left corner,
              so the caption clears it. */}
          <span className="text-xs font-semibold text-lp-muted sm:pl-56">
            Skill: number lines
          </span>
          <span className={lpButton({ size: "md", className: "pointer-events-none" })}>
            Next
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </span>
        </div>
      </div>

      {/* Floating skill card */}
      <div className="absolute -bottom-8 -left-4 hidden w-60 rounded-2xl border border-brand/10 bg-white p-4 shadow-[0_20px_50px_rgba(42,16,81,0.18)] sm:block">
        <p className="text-xs font-bold text-lp-muted">After last session</p>
        <p className="mt-1 text-sm font-extrabold text-lp-ink">
          Number lines
        </p>
        <TileMeter label="Number lines skill" value={0.7} className="mt-2" />
        <p className="mt-2 text-xs font-semibold text-success">
          Up 2 tiles this month
        </p>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="lp-grid relative overflow-hidden border-b border-brand/10">
      <div className="site-width grid items-center gap-14 py-16 sm:py-20 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12 lg:py-24">
        <div>
          <p className="lp-rise inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/8 px-4 py-2 text-xs font-extrabold tracking-wide text-accent-strong">
            {hero.eyebrow}
          </p>
          <h1 className="lp-rise lp-rise-1 mt-6 font-display text-[clamp(2.6rem,6vw,4.6rem)] font-bold leading-[1.02] tracking-[-0.035em] text-lp-ink">
            {hero.headline[0]}{" "}
            <span className="text-brand">{hero.headline[1]}</span>
          </h1>
          <p className="lp-rise lp-rise-2 mt-6 max-w-xl text-lg leading-8 text-lp-muted">
            {hero.subheadline}
          </p>

          <div className="lp-rise lp-rise-3 mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={hero.primaryCta.href}
              className={lpButton({ size: "lg" })}
            >
              {hero.primaryCta.label}
              <ArrowRight aria-hidden="true" className="h-5 w-5" />
            </Link>
            <a
              href={hero.secondaryCta.href}
              className={lpButton({ variant: "outline", size: "lg" })}
            >
              {hero.secondaryCta.label}
            </a>
          </div>

          <ul className="lp-rise lp-rise-3 mt-8 space-y-2.5">
            {hero.trustPoints.map((point) => (
              <li
                key={point}
                className="flex items-start gap-2.5 text-sm font-semibold text-lp-ink"
              >
                <Check
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-brand"
                />
                {point}
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-md text-xs leading-5 text-lp-muted">
            {hero.disclaimer}
          </p>
        </div>

        <SessionMockup />
      </div>
    </section>
  );
}
