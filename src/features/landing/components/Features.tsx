import type { LucideIcon } from "lucide-react";
import {
  Accessibility,
  BarChart3,
  BookOpenCheck,
  ClipboardCheck,
  GraduationCap,
  History,
  Puzzle,
  Smile,
  Timer,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

import { audiences, features } from "../content";
import { LpCard, SectionHeading } from "./primitives";

const icons: Record<string, LucideIcon> = {
  Accessibility,
  BarChart3,
  BookOpenCheck,
  ClipboardCheck,
  GraduationCap,
  History,
  Puzzle,
  Smile,
  Timer,
  TrendingUp,
  Users,
  Zap,
};

export function Features() {
  return (
    <section
      aria-labelledby="features-heading"
      className="site-width scroll-mt-24 py-16 sm:py-24"
    >
      <SectionHeading
        id="features-heading"
        eyebrow="What's inside"
        title={features.heading}
        intro={features.intro}
      />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.items.map((feature) => {
          const Icon = icons[feature.icon] ?? Puzzle;
          return (
            <LpCard key={feature.title} className="flex flex-col p-6">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand/8 text-brand">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-bold tracking-[-0.02em] text-lp-ink">
                {feature.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-lp-muted">
                {feature.body}
              </p>
              <p className="mt-4 rounded-xl bg-paper px-3.5 py-2.5 text-xs leading-5 text-lp-muted">
                <span className="font-extrabold text-brand">In practice: </span>
                {feature.example}
              </p>
            </LpCard>
          );
        })}
      </div>
    </section>
  );
}

export function Audiences() {
  return (
    <section
      aria-labelledby="audiences-heading"
      className="border-y border-brand/10 bg-white py-16 sm:py-24"
    >
      <div className="site-width">
        <SectionHeading
          id="audiences-heading"
          eyebrow="Two audiences"
          title={audiences.heading}
          align="center"
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {[audiences.child, audiences.parent].map((group, index) => (
            <LpCard
              key={group.title}
              className={
                index === 0
                  ? "border-brand/15 bg-[linear-gradient(160deg,#FFFFFF_0%,#F5F0FC_100%)] p-8"
                  : "border-accent/15 bg-[linear-gradient(160deg,#FFFFFF_0%,#FDF3F2_100%)] p-8"
              }
            >
              <h3
                className={`font-display text-2xl font-bold tracking-[-0.02em] ${index === 0 ? "text-brand" : "text-accent-strong"}`}
              >
                {group.title}
              </h3>
              <p className="mt-1.5 font-semibold text-lp-ink">{group.subtitle}</p>
              <ul className="mt-6 space-y-3">
                {group.points.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-3 text-sm leading-6 text-lp-muted"
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-[7px] h-2 w-2 shrink-0 rounded-[3px] ${index === 0 ? "bg-brand" : "bg-accent"}`}
                    />
                    {point}
                  </li>
                ))}
              </ul>
            </LpCard>
          ))}
        </div>
      </div>
    </section>
  );
}
