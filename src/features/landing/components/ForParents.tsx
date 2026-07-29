import Image from "next/image";
import Link from "next/link";
import { LayoutDashboard, ListChecks, Puzzle, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { forParents } from "../content";
import { Eyebrow, lpButton } from "./primitives";

const pointIcons: Record<string, LucideIcon> = { LayoutDashboard, Puzzle, ListChecks };

function MiniCard({ card }: { card: (typeof forParents.miniCards)[number] }) {
  return (
    <div className="w-44 rounded-2xl bg-white p-3.5 shadow-[0_16px_40px_rgba(42,16,81,0.16)]">
      <p className="text-xs font-bold text-lp-muted">{card.label}</p>
      {card.kind === "progress" ? (
        <>
          <p className="mt-1 font-sans text-lg font-bold tracking-[-0.01em] text-lp-ink">{card.value}</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-brand/10">
            <div className="h-full rounded-full bg-brand" style={{ width: `${card.fraction * 100}%` }} />
          </div>
        </>
      ) : (
        <div className="mt-1.5 flex items-center gap-1.5 text-success">
          <Trophy aria-hidden="true" className="h-4 w-4" />
          <span className="text-sm font-bold">{card.value}</span>
        </div>
      )}
    </div>
  );
}

/**
 * "Learning insights" — the single merged parent-value section (see
 * forParents' doc comment in content.ts for what this replaced). Image
 * left with floating illustrative mini-cards, copy right.
 */
export function ForParents() {
  return (
    <section id="audiences" aria-labelledby="for-parents-heading" className="site-width scroll-mt-24 py-18 sm:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-10">
        <div className="relative mx-auto w-full max-w-md">
          <Image
            src={forParents.image.src}
            alt={forParents.image.alt}
            width={forParents.image.width}
            height={forParents.image.height}
            loading="lazy"
            className="w-full rounded-4xl object-cover"
          />
          <div className="absolute -left-6 top-8 hidden sm:block">
            <MiniCard card={forParents.miniCards[0]} />
          </div>
          <div className="absolute -right-4 top-1/3 hidden sm:block">
            <MiniCard card={forParents.miniCards[1]} />
          </div>
          <div className="absolute -bottom-6 left-1/4 hidden sm:block">
            <MiniCard card={forParents.miniCards[2]} />
          </div>
        </div>
        <div>
          <Eyebrow>{forParents.eyebrow}</Eyebrow>
          <h2 id="for-parents-heading" className="mt-4 font-display text-[clamp(1.75rem,1.35rem+2vw,2.25rem)] font-bold leading-[1.3] tracking-[-0.02em] text-lp-ink">
            {forParents.heading}
          </h2>
          <p className="mt-4 max-w-md font-sans text-lg leading-[1.6] text-lp-muted">{forParents.body}</p>
          <ul className="mt-6 space-y-4">
            {forParents.points.map((point) => {
              const Icon = pointIcons[point.icon] ?? LayoutDashboard;
              return (
                <li key={point.text} className="flex items-start gap-3">
                  <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                  <span className="text-sm font-semibold leading-[1.6] text-lp-ink">{point.text}</span>
                </li>
              );
            })}
          </ul>
          <Link href={forParents.cta.href} className={lpButton({ size: "lg", className: "mt-8" })}>
            {forParents.cta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
