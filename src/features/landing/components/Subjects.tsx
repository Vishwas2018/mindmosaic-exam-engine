import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  FlaskConical,
  Languages,
  PenLine,
  Sigma,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { subjectCards, subjectGrid } from "../content";
import { ColorTile, SectionHeading, lpButton } from "./primitives";

const subjectIcons: Record<string, LucideIcon> = {
  Calculator,
  BookOpen,
  PenLine,
  Sigma,
  FlaskConical,
  Languages,
  Sparkles,
};

export function SubjectCards() {
  return (
    <section id="subjects" aria-labelledby="subject-cards-heading" className="site-width scroll-mt-24 py-16 sm:py-24">
      <SectionHeading id="subject-cards-heading" eyebrow="Subjects" title={subjectCards.heading} intro={subjectCards.subheading} align="center" />

      <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
              </div>
              <div className="flex items-center gap-3 p-5">
                <ColorTile tone={card.comingSoon ? "brand-ink" : "brand"}>
                  <Icon aria-hidden="true" className="h-6 w-6" />
                </ColorTile>
                <div>
                  <h3 className="font-display text-base font-bold tracking-[-0.02em] text-lp-ink">{card.name}</h3>
                  <p className="text-xs font-semibold text-lp-muted">
                    {card.comingSoon ? "Coming soon" : subjectCards.yearsLine}
                  </p>
                </div>
                {!card.comingSoon && <ArrowRight aria-hidden="true" className="ml-auto h-4 w-4 shrink-0 text-brand" />}
              </div>
            </>
          );
          return (
            <li key={card.name}>
              {card.comingSoon ? (
                <div aria-disabled="true" className="overflow-hidden rounded-3xl border border-dashed border-lp-muted/30 bg-paper/60 opacity-80">
                  {body}
                </div>
              ) : (
                <Link
                  href={card.href}
                  className="block overflow-hidden rounded-3xl border border-brand/10 bg-white shadow-[0_16px_44px_rgba(42,16,81,0.07)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(42,16,81,0.14)]"
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
    <section aria-labelledby="subject-grid-heading" className="border-y border-brand/10 bg-white py-16 sm:py-24">
      <div className="site-width">
        <SectionHeading id="subject-grid-heading" eyebrow="Explore" title={subjectGrid.heading} intro={subjectGrid.subheading} align="center" />

        <ul className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {subjectGrid.tiles.map((tile) => {
            const Icon = tile.icon ? subjectIcons[tile.icon] ?? Sparkles : undefined;
            return (
              <li key={tile.name} className={tile.comingSoon ? "opacity-70" : undefined}>
                <div
                  aria-disabled={tile.comingSoon}
                  className="flex h-full flex-col items-center gap-3 rounded-3xl border border-brand/10 bg-paper p-5 text-center"
                >
                  {tile.image ? (
                    <Image src={tile.image} alt="" width={subjectGrid.iconSize.width} height={subjectGrid.iconSize.height} loading="lazy" className="h-14 w-14 object-contain" />
                  ) : (
                    Icon && (
                      <ColorTile tone={tile.tone}>
                        <Icon aria-hidden="true" className="h-6 w-6" />
                      </ColorTile>
                    )
                  )}
                  <div>
                    <p className="font-display text-sm font-bold tracking-[-0.01em] text-lp-ink">{tile.name}</p>
                    <p className="mt-0.5 text-xs font-semibold text-lp-muted">
                      {tile.comingSoon ? "Coming Soon" : subjectGrid.gradesLine}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Second-row visual rhythm — decorative, alongside the tile names above. */}
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {subjectGrid.illustratedRow.map((tile) => (
            <li key={tile.name} className="overflow-hidden rounded-2xl">
              <Image
                src={tile.image}
                alt=""
                width={subjectGrid.illustratedSize.width}
                height={subjectGrid.illustratedSize.height}
                loading="lazy"
                className="aspect-3/2 w-full object-cover"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
