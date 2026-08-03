import { BarChart3, GraduationCap, Star, Target, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { whyLove } from "../content";
import { ColorTile, LpCard, SectionHeading } from "./primitives";
import { Reveal } from "./Reveal";

const benefitIcons: Record<string, LucideIcon> = { GraduationCap, Zap, BarChart3, Target, Star };

export function WhyLove() {
  return (
    <section aria-labelledby="why-love-heading" className="site-width py-[var(--lp-section-py-major)]">
      <SectionHeading id="why-love-heading" title={whyLove.heading} intro={whyLove.subheading} align="center" />
      <ul className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-5">
        {whyLove.cards.map((card, index) => {
          const Icon = benefitIcons[card.icon] ?? Target;
          return (
            <li key={card.title}>
              <Reveal delayMs={index * 60}>
                <LpCard className="lp-card-hover flex h-full min-h-[210px] flex-col items-center gap-3 p-6 text-center">
                  <ColorTile tone={card.tone} className="h-12 w-12">
                    <Icon aria-hidden="true" className="h-6 w-6" />
                  </ColorTile>
                  <h3 className="font-sans text-h3 font-semibold text-lp-ink">{card.title}</h3>
                  <p className="line-clamp-2 text-sm leading-[1.5] text-lp-muted">{card.body}</p>
                </LpCard>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
