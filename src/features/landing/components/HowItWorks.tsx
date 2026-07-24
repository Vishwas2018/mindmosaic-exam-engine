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
    <section id="how-it-works" aria-labelledby="how-heading" className="site-width scroll-mt-24 py-16 sm:py-24">
      <h2 id="how-heading" className="text-center font-display text-3xl font-bold tracking-[-0.03em] text-lp-ink sm:text-4xl">
        {howItWorks.heading[0]}
        <span className="text-brand">{howItWorks.heading[1]}</span>
        {howItWorks.heading[2]}
      </h2>

      <ol className="relative mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {howItWorks.steps.map((step, index) => {
          const Icon = stepIcons[step.icon] ?? Target;
          return (
            <li key={step.title} className="relative flex flex-col items-center text-center">
              {index < howItWorks.steps.length - 1 && (
                <span aria-hidden="true" className="absolute left-[calc(50%+2.75rem)] top-6 hidden h-0.5 w-[calc(100%-5.5rem)] border-t-2 border-dashed border-brand/25 lg:block" />
              )}
              <span className={`flex h-12 w-12 items-center justify-center rounded-full font-display text-lg font-bold text-white ${dotClasses[step.dot]}`}>
                {step.number}
              </span>
              <span className={`mt-4 flex h-14 w-14 items-center justify-center rounded-2xl ${tintClasses[step.dot]}`}>
                <Icon aria-hidden="true" className="h-7 w-7" />
              </span>
              <h3 className="mt-4 font-display text-base font-bold tracking-[-0.02em] text-lp-ink">{step.title}</h3>
              <p className="mt-1.5 max-w-[16rem] text-sm leading-6 text-lp-muted">{step.body}</p>
            </li>
          );
        })}
      </ol>

      <div className="mt-12 flex justify-center">
        <Link href={howItWorks.cta.href} className={lpButton({ variant: "outline", size: "lg" })}>
          {howItWorks.cta.label}
        </Link>
      </div>
    </section>
  );
}
