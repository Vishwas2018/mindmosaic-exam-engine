import { BarChart3, GraduationCap, Star, Target, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { whyLove } from "../content";
import { ColorTile, LpCard, SectionHeading } from "./primitives";

const benefitIcons: Record<string, LucideIcon> = { GraduationCap, Zap, BarChart3, Target, Star };

export function WhyLove() {
  return (
    <section aria-labelledby="why-love-heading" className="site-width py-18 sm:py-24">
      <SectionHeading id="why-love-heading" eyebrow="Why families choose us" title={whyLove.heading} intro={whyLove.subheading} align="center" />
      <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {whyLove.cards.map((card) => {
          const Icon = benefitIcons[card.icon] ?? Target;
          return (
            <li key={card.title}>
              <LpCard className="flex h-full flex-col items-center gap-3 p-6 text-center">
                <ColorTile tone={card.tone} className="h-16 w-16">
                  <Icon aria-hidden="true" className="h-7 w-7" />
                </ColorTile>
                <h3 className="font-body text-[clamp(1.25rem,1.1rem+0.8vw,1.75rem)] font-semibold leading-[1.3] tracking-[-0.01em] text-lp-ink">{card.title}</h3>
                <p className="text-sm leading-[1.6] text-lp-muted">{card.body}</p>
              </LpCard>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
