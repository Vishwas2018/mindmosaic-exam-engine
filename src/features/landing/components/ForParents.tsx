import Image from "next/image";
import Link from "next/link";
import { LayoutDashboard, ListChecks, Puzzle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { forParents } from "../content";
import { Eyebrow, lpButton } from "./primitives";

const pointIcons: Record<string, LucideIcon> = { LayoutDashboard, Puzzle, ListChecks };

/** "Learning insights" — image left, copy right (see brand/BRAND.md's landing section order). */
export function ForParents() {
  return (
    <section id="audiences" aria-labelledby="for-parents-heading" className="site-width scroll-mt-24 py-18 sm:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-10">
        <Image
          src={forParents.image.src}
          alt={forParents.image.alt}
          width={forParents.image.width}
          height={forParents.image.height}
          loading="lazy"
          className="w-full rounded-4xl object-cover"
        />
        <div>
          <Eyebrow>{forParents.eyebrow}</Eyebrow>
          <h2 id="for-parents-heading" className="mt-4 font-display text-[clamp(1.75rem,1.35rem+2vw,2.25rem)] font-bold leading-[1.3] tracking-[-0.02em] text-lp-ink">
            {forParents.heading}
          </h2>
          <p className="mt-4 max-w-md font-body text-lg leading-[1.6] text-lp-muted">{forParents.body}</p>
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
