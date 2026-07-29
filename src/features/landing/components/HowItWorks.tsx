import Link from "next/link";
import { BarChart3, FileText, GraduationCap, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { howItWorks } from "../content";
import { lpButton } from "./primitives";

const stepIcons: Record<string, LucideIcon> = { GraduationCap, FileText, BarChart3, Target };

const dotClasses: Record<string, string> = {
  brand: "bg-brand",
  accent: "bg-accent",
  "royal-orange": "bg-royal-orange-tint",
  success: "bg-success",
};

const tintClasses: Record<string, string> = {
  brand: "bg-brand/10 text-brand",
  accent: "bg-accent/10 text-accent-strong",
  "royal-orange": "bg-royal-orange-tint/12 text-royal-orange-tint",
  success: "bg-success/10 text-success",
};

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-heading" className="site-width scroll-mt-24 py-18 sm:py-24">
      <h2 id="how-heading" className="text-center font-display text-[clamp(1.75rem,1.35rem+2vw,2.25rem)] font-bold leading-[1.3] tracking-[-0.02em] text-lp-ink">
        {howItWorks.heading[0]}
        <span className="text-brand">{howItWorks.heading[1]}</span>
        {howItWorks.heading[2]}
      </h2>

      <ol className="relative mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {howItWorks.steps.map((step, index) => {
          const Icon = stepIcons[step.icon] ?? Target;
          return (
            <li key={step.title} className="relative flex flex-col items-center text-center">
              {index < howItWorks.steps.length - 1 && (
                <span aria-hidden="true" className="absolute left-[calc(50%+2.25rem)] top-8 hidden h-px w-[calc(100%-4.5rem)] bg-brand/20 lg:block" />
              )}
              <span className={`relative flex h-16 w-16 items-center justify-center rounded-2xl ${tintClasses[step.dot]}`}>
                <Icon aria-hidden="true" className="h-8 w-8" />
                <span
                  className={`absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full font-body text-xs font-bold text-white ring-4 ring-paper ${dotClasses[step.dot]}`}
                >
                  {step.number}
                </span>
              </span>
              <h3 className="mt-5 font-body text-[clamp(1.25rem,1.1rem+0.8vw,1.75rem)] font-semibold leading-[1.3] tracking-[-0.01em] text-lp-ink">{step.title}</h3>
              <p className="mt-2 max-w-[16rem] text-sm leading-[1.6] text-lp-muted">{step.body}</p>
            </li>
          );
        })}
      </ol>

      <div className="mt-14 flex justify-center">
        <Link href={howItWorks.cta.href} className={lpButton({ variant: "outline", size: "lg" })}>
          {howItWorks.cta.label}
        </Link>
      </div>
    </section>
  );
}
