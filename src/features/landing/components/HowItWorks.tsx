import Link from "next/link";
import { BarChart3, FileText, GraduationCap, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { howItWorks } from "../content";
import { lpButton } from "./primitives";
import { Reveal } from "./Reveal";

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
    <section id="how-it-works" aria-labelledby="how-heading" className="site-width scroll-mt-24 py-[var(--lp-section-py-major)]">
      <h2 id="how-heading" className="text-center font-display text-h2 font-bold tracking-[-0.01em] text-lp-ink">
        {howItWorks.heading[0]}
        <span className="text-brand">{howItWorks.heading[1]}</span>
        {howItWorks.heading[2]}
      </h2>

      <ol className="relative mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
        {howItWorks.steps.map((step, index) => {
          const Icon = stepIcons[step.icon] ?? Target;
          return (
            <li key={step.title} className="relative flex flex-col items-center text-center">
              {/* Horizontal connector (tablet/desktop, aligned to circle centres). */}
              {index < howItWorks.steps.length - 1 && (
                <span aria-hidden="true" className="absolute left-[calc(50%+2rem)] top-7 hidden h-px w-[calc(100%-4rem)] bg-brand/20 lg:block" />
              )}
              {/* Vertical connector (mobile, single column — aligned to circle centres). */}
              {index < howItWorks.steps.length - 1 && (
                <span aria-hidden="true" className="absolute left-7 top-7 -z-10 h-full w-px bg-brand/20 sm:hidden" />
              )}
              <Reveal delayMs={index * 60} className="flex flex-col items-center">
                <span className={`relative flex h-14 w-14 items-center justify-center rounded-2xl ${tintClasses[step.dot]}`}>
                  <Icon aria-hidden="true" className="h-7 w-7" />
                  <span
                    className={`absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full font-sans text-sm font-bold text-white ring-4 ring-paper ${dotClasses[step.dot]}`}
                  >
                    {step.number}
                  </span>
                </span>
                <h3 className="mt-5 font-sans text-h3 font-semibold text-lp-ink">{step.title}</h3>
                <p className="mt-2 max-w-[16rem] text-sm leading-[1.5] text-lp-muted">{step.body}</p>
              </Reveal>
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
