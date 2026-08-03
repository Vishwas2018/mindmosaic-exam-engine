import Image from "next/image";
import { FileText, GraduationCap, Layers, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { getPublishedQuestionCount, getPublishedTopicCount } from "@/server/exam-bank";

import { statsBand } from "../content";
import { Reveal } from "./Reveal";

const statIcons: Record<string, LucideIcon> = { FileText, Layers, GraduationCap, Target };

/*
 * StatsBand is a plain server component (no "use client") — the one place
 * in the landing tree allowed to touch the server-only question-bank
 * gateway directly. content.ts leaves the two derived stats' values as
 * `null` and marks them with a `derive` key specifically so this file, not
 * the shared content module every client component also imports, is the one
 * that reads the real counts — see content.ts's statsBand doc comment for
 * exactly which pool getPublishedQuestionCount() / getPublishedTopicCount()
 * count (curated + factory-published, not the auto-generated practice seeds).
 */
export function StatsBand() {
  const derived: Record<string, string> = {
    questions: String(getPublishedQuestionCount()),
    topics: String(getPublishedTopicCount()),
  };
  const stats = statsBand.stats.map((stat) => ({
    ...stat,
    value: stat.derive ? derived[stat.derive] : stat.value,
  }));

  return (
    <section
      aria-labelledby="stats-band-heading"
      className="relative isolate overflow-hidden bg-brand py-16 sm:py-20"
    >
      {/*
       * Was a flat single-value bg-brand fill. A diagonal brand-ink ->
       * brand -> brand-deep ramp plus the house dark mosaic texture gives
       * the band depth to hold a photo and four raised tiles; a solid fill
       * left both looking pasted on.
       */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,var(--brand-ink)_0%,var(--brand)_48%,var(--brand-deep)_100%)]"
      />
      <div aria-hidden="true" className="lp-grid-dark absolute inset-0 -z-10 opacity-70" />

      <div className="site-width grid items-center gap-10 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-14">
        <Reveal className="mx-auto w-full max-w-xs lg:max-w-none">
          {/*
           * Framed, not floated: this asset has a painted purple background
           * (no alpha — see content.ts), so a rounded panel with a hairline
           * ring reads as a deliberate portrait tile, where letting it sit
           * loose on the band would read as a mismatched rectangle.
           */}
          <div className="relative aspect-square overflow-hidden rounded-3xl ring-1 ring-white/15 shadow-[0_24px_60px_rgba(20,8,50,0.45)]">
            <Image
              src={statsBand.image.src}
              alt={statsBand.image.alt}
              width={statsBand.image.width}
              height={statsBand.image.height}
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(to_top,color-mix(in_srgb,var(--brand-ink)_75%,transparent),transparent)]"
            />
          </div>
        </Reveal>

        <div>
          <Reveal>
            <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-white/70">
              {statsBand.eyebrow}
            </p>
            {/*
             * The heading used to be sr-only, leaving the eyebrow to carry
             * the section on its own at 14px. It is visible now — same text,
             * so the section's accessible name is unchanged.
             */}
            <h2
              id="stats-band-heading"
              className="mt-3 font-display text-h2 font-bold tracking-[-0.01em] text-white"
            >
              {statsBand.heading}
            </h2>
          </Reveal>

          <ul className="mt-8 grid grid-cols-2 gap-4 sm:gap-5">
            {stats.map((stat, index) => {
              const Icon = statIcons[stat.icon] ?? Target;
              return (
                <li key={stat.label}>
                  <Reveal delayMs={index * 70}>
                    <div className="h-full rounded-card bg-white/8 p-5 ring-1 ring-white/12 sm:p-6">
                      <span
                        aria-hidden="true"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/12 text-white"
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <p className="mt-4 font-display text-[clamp(1.875rem,1.7rem+0.75vw,2.25rem)] font-bold tracking-[-0.02em] text-white">
                        {stat.value}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white/80">{stat.label}</p>
                    </div>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
