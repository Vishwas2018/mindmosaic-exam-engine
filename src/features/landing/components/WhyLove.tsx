import Image from "next/image";

import { whyLove } from "../content";
import { LpCard, SectionHeading } from "./primitives";

export function WhyLove() {
  return (
    <section aria-labelledby="why-love-heading" className="site-width py-16 sm:py-24">
      <SectionHeading id="why-love-heading" eyebrow="Why families choose us" title={whyLove.heading} intro={whyLove.subheading} align="center" />
      <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {whyLove.cards.map((card) => (
          <li key={card.title}>
            <LpCard className="flex h-full flex-col items-center gap-3 p-6 text-center">
              <Image src={card.icon} alt="" width={whyLove.iconSize.width} height={whyLove.iconSize.height} loading="lazy" className="h-14 w-14 object-contain" />
              <h3 className="font-display text-base font-bold tracking-[-0.02em] text-lp-ink">{card.title}</h3>
              <p className="text-sm leading-6 text-lp-muted">{card.body}</p>
            </LpCard>
          </li>
        ))}
      </ul>
    </section>
  );
}
