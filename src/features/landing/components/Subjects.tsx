import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  BookOpenCheck,
  Calculator,
  FlaskConical,
  Lightbulb,
  PenLine,
  Sigma,
  SpellCheck,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { subjectCards, subjectGrid } from "../content";
import { ColorTile, SectionHeading, lpButton } from "./primitives";

const subjectIcons: Record<string, LucideIcon> = {
  Calculator,
  BookOpen,
  BookOpenCheck,
  PenLine,
  Sigma,
  FlaskConical,
  SpellCheck,
  Lightbulb,
  Trophy,
};

export function SubjectCards() {
  return (
    <section id="subjects" aria-labelledby="subject-cards-heading" className="site-width scroll-mt-24 py-18 sm:py-24">
      <SectionHeading id="subject-cards-heading" eyebrow="Assessments" title={subjectCards.heading} intro={subjectCards.subheading} align="center" />

      <ul className="mt-12 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {subjectCards.cards.map((card) => {
          const Icon = subjectIcons[card.icon] ?? BookOpen;
          const body = (
            <>
              <div className="relative aspect-3/2 w-full overflow-hidden">
                <Image
                  src={card.image.src}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  loading="lazy"
                  className={card.comingSoon ? "object-cover grayscale" : "object-cover"}
                />
                {card.comingSoon && (
                  <span className="absolute right-3 top-3 rounded-full bg-brand-ink/85 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-white">
                    Coming soon
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center gap-3">
                  <ColorTile tone={card.comingSoon ? "brand-ink" : "brand"}>
                    <Icon aria-hidden="true" className="h-6 w-6" />
                  </ColorTile>
                  <div>
                    <h3 className="font-sans text-[clamp(1.25rem,1.1rem+0.8vw,1.5rem)] font-semibold leading-[1.3] tracking-[-0.01em] text-lp-ink">{card.name}</h3>
                    <p className="text-xs font-semibold text-lp-muted">
                      {card.comingSoon ? "Not yet available" : subjectCards.yearsLine}
                    </p>
                  </div>
                </div>
                <p className="mt-3 flex-1 text-sm leading-[1.6] text-lp-muted">{card.description}</p>
                {!card.comingSoon && (
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand">
                    Explore
                    <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </span>
                )}
              </div>
            </>
          );
          return (
            <li key={card.name} className="h-full">
              {card.comingSoon ? (
                <div
                  aria-disabled="true"
                  className="flex h-full flex-col overflow-hidden rounded-3xl border border-dashed border-lp-muted/30 bg-paper/60 opacity-80"
                >
                  {body}
                </div>
              ) : (
                <Link
                  href={card.href}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-brand/10 bg-white shadow-[0_16px_44px_rgba(42,16,81,0.07)] transition hover:-translate-y-1 hover:border-brand/25 hover:shadow-[0_20px_50px_rgba(42,16,81,0.14)] focus-visible:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30 focus-visible:ring-offset-2 focus-visible:ring-offset-paper active:translate-y-0"
                >
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-10 flex justify-center">
        <Link href={subjectCards.viewAllCta.href} className={lpButton({ variant: "outline", size: "lg" })}>
          {subjectCards.viewAllCta.label}
        </Link>
      </div>
    </section>
  );
}

export function SubjectGrid() {
  return (
    <section aria-labelledby="subject-grid-heading" className="border-y border-brand/10 bg-white py-18 sm:py-24">
      <div className="site-width">
        <SectionHeading id="subject-grid-heading" eyebrow="Explore" title={subjectGrid.heading} intro={subjectGrid.subheading} align="center" />

        <ul className="mt-12 grid grid-cols-2 items-stretch gap-4 sm:grid-cols-4">
          {subjectGrid.tiles.map((tile) => {
            const Icon = tile.icon ? subjectIcons[tile.icon] ?? BookOpen : undefined;
            const media = tile.image ? (
              <Image src={tile.image} alt="" width={subjectGrid.iconSize.width} height={subjectGrid.iconSize.height} loading="lazy" className="h-14 w-14 object-contain" />
            ) : (
              Icon && (
                <ColorTile tone={tile.tone}>
                  <Icon aria-hidden="true" className="h-6 w-6" />
                </ColorTile>
              )
            );
            const label = (
              <div>
                <p className="font-sans text-sm font-bold tracking-[-0.01em] text-lp-ink">{tile.name}</p>
                <p className="mt-0.5 text-xs font-semibold text-lp-muted">
                  {tile.comingSoon ? "Coming soon" : subjectGrid.gradesLine}
                </p>
              </div>
            );
            return (
              <li key={tile.name} className="h-full">
                {tile.comingSoon ? (
                  <div
                    aria-disabled="true"
                    className="flex h-full flex-col items-center gap-3 rounded-3xl border border-dashed border-lp-muted/30 bg-paper/60 p-6 text-center opacity-75"
                  >
                    {media}
                    {label}
                  </div>
                ) : (
                  <Link
                    href="/practice"
                    className="flex h-full flex-col items-center gap-3 rounded-3xl border border-brand/10 bg-paper p-6 text-center transition hover:-translate-y-1 hover:border-brand/25 hover:bg-white hover:shadow-[0_16px_36px_rgba(42,16,81,0.1)] focus-visible:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30 focus-visible:ring-offset-2 focus-visible:ring-offset-paper active:translate-y-0"
                  >
                    {media}
                    {label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
