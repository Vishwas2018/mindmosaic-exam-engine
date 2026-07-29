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
    <section id="subjects" aria-labelledby="subject-cards-heading" className="site-width scroll-mt-24 py-[var(--lp-section-py-major)]">
      <SectionHeading id="subject-cards-heading" title={subjectCards.heading} intro={subjectCards.subheading} align="center" />

      <ul className="mt-12 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {subjectCards.cards.map((card) => {
          const Icon = subjectIcons[card.icon] ?? BookOpen;
          const body = (
            <>
              <div className="relative aspect-video w-full overflow-hidden">
                <Image
                  src={card.image.src}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  loading="lazy"
                  className={card.comingSoon ? "object-cover grayscale" : "object-cover"}
                />
                {card.comingSoon && (
                  <span className="absolute right-3 top-3 rounded-pill bg-brand-ink/85 px-3 py-1 text-sm font-extrabold uppercase tracking-wider text-white">
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
                    <h3 className="font-sans text-h3 font-semibold text-lp-ink">{card.name}</h3>
                    <p className="text-sm font-semibold text-lp-muted">
                      {card.comingSoon ? "Not yet available" : subjectCards.yearsLine}
                    </p>
                  </div>
                </div>
                <p className="mt-3 flex-1 text-sm leading-[1.5] text-lp-muted">{card.description}</p>
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
                  className="flex h-full min-h-[360px] flex-col overflow-hidden rounded-card border border-dashed border-lp-muted/30 bg-paper/60 opacity-80"
                >
                  {body}
                </div>
              ) : (
                <Link
                  href={card.href}
                  className="lp-card-hover group flex h-full min-h-[360px] flex-col overflow-hidden rounded-card border border-brand/10 bg-white hover:border-brand/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
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
    <section aria-labelledby="subject-grid-heading" className="border-y border-brand/10 bg-white py-[var(--lp-section-py-major)]">
      <div className="site-width">
        <SectionHeading id="subject-grid-heading" title={subjectGrid.heading} intro={subjectGrid.subheading} align="center" />

        <ul className="mt-12 grid grid-cols-2 items-stretch gap-4 sm:grid-cols-4">
          {subjectGrid.tiles.map((tile) => {
            const Icon = tile.icon ? subjectIcons[tile.icon] ?? BookOpen : undefined;
            const media = tile.image ? (
              <Image src={tile.image} alt="" width={subjectGrid.iconSize.width} height={subjectGrid.iconSize.height} loading="lazy" className="h-14 w-14 rounded-full object-contain" />
            ) : (
              Icon && (
                <ColorTile tone={tile.tone} className="rounded-full">
                  <Icon aria-hidden="true" className="h-8 w-8" />
                </ColorTile>
              )
            );
            const label = (
              <div>
                <p className="font-sans text-sm font-bold tracking-[-0.01em] text-lp-ink">{tile.name}</p>
                <p className="mt-0.5 text-sm font-semibold text-lp-muted">
                  {tile.comingSoon ? "Coming soon" : subjectGrid.gradesLine}
                </p>
              </div>
            );
            return (
              <li key={tile.name} className="h-full">
                {tile.comingSoon ? (
                  <div
                    aria-disabled="true"
                    className="flex h-full min-h-[100px] flex-col items-center gap-3 rounded-card border border-dashed border-lp-muted/30 bg-paper/60 p-6 text-center opacity-75"
                  >
                    {media}
                    {label}
                  </div>
                ) : (
                  <Link
                    href="/practice"
                    className="group relative flex h-full min-h-[100px] flex-col items-center gap-3 rounded-card border border-brand/10 bg-paper p-6 text-center [transition:var(--lp-motion)] hover:-translate-y-1 hover:border-brand/25 hover:bg-white hover:shadow-card-hover focus-visible:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30 focus-visible:ring-offset-2 focus-visible:ring-offset-paper active:translate-y-0"
                  >
                    {media}
                    {label}
                    <ArrowRight
                      aria-hidden="true"
                      className="absolute right-3 top-3 h-4 w-4 text-brand opacity-0 transition-opacity group-hover:opacity-100"
                    />
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
