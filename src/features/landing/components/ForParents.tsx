import Image from "next/image";
import Link from "next/link";
import { History, Puzzle, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { forParents } from "../content";
import { Eyebrow, lpButton } from "./primitives";

const pointIcons: Record<string, LucideIcon> = { Users, Puzzle, History };

export function ForParents() {
  return (
    <section id="audiences" aria-labelledby="for-parents-heading" className="site-width scroll-mt-24 py-16 sm:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-10">
        <Image
          src={forParents.image.src}
          alt={forParents.image.alt}
          width={forParents.image.width}
          height={forParents.image.height}
          loading="lazy"
          className="w-full rounded-4xl object-cover lg:order-2"
        />
        <div>
          <Eyebrow>{forParents.eyebrow}</Eyebrow>
          <h2 id="for-parents-heading" className="mt-4 font-display text-3xl font-bold tracking-[-0.03em] text-lp-ink sm:text-4xl">
            {forParents.heading}
          </h2>
          <p className="mt-4 max-w-md text-lg leading-8 text-lp-muted">{forParents.body}</p>
          <ul className="mt-6 space-y-4">
            {forParents.points.map((point) => {
              const Icon = pointIcons[point.icon] ?? Users;
              return (
                <li key={point.text} className="flex items-start gap-3">
                  <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                  <span className="text-sm font-semibold leading-6 text-lp-ink">{point.text}</span>
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
