import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Calculator, ChevronLeft, PenLine, SpellCheck } from "lucide-react";

import { AppHeader } from "@/components/shell/AppHeader";
import { getProgramBySlug, type Program } from "@/features/catalogue/catalogue";

export const metadata: Metadata = {
  title: "NAPLAN practice",
  description: "Numeracy, Reading and Language Conventions practice in the NAPLAN format. No sign-in required.",
};

const YEAR_LEVELS = [3, 5] as const;

function naplanSlug(year: (typeof YEAR_LEVELS)[number], subject: "numeracy" | "reading" | "language") {
  return `naplan-g${year}-${subject}`;
}

const DOMAIN_ICONS: Record<string, typeof Calculator> = {
  numeracy: Calculator,
  reading: BookOpen,
  language: SpellCheck,
};

export default async function NaplanHubPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year: yearParam } = await searchParams;
  const activeYear = yearParam === "5" ? 5 : 3;

  const domains: Array<{ subject: "numeracy" | "reading" | "language"; program: Program | undefined }> = [
    { subject: "numeracy", program: getProgramBySlug(naplanSlug(activeYear, "numeracy")) },
    { subject: "reading", program: getProgramBySlug(naplanSlug(activeYear, "reading")) },
    { subject: "language", program: getProgramBySlug(naplanSlug(activeYear, "language")) },
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-page">
      <AppHeader />
      <main id="main-content" className="site-width py-12 sm:py-16">
        <Link
          href="/practice"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-xl text-sm font-bold text-royal transition hover:gap-2.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          All practice programs
        </Link>

        <div className="mt-8 flex flex-col gap-10">
          {/* Hero */}
          <div className="relative overflow-hidden rounded-3xl border-2 border-coral-border bg-white p-6 shadow-warm-card md:p-10">
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-gradient-to-br from-coral-light/70 to-primary-tint/40 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative z-10 max-w-2xl">
              <span className="mb-3 inline-block rounded-lg bg-coral-light px-3 py-1 font-vietnam text-xs font-bold uppercase tracking-wide text-coral-accent">
                Years 3 &amp; 5 &middot; Format familiarisation
              </span>
              <h1 className="font-jakarta text-2xl font-extrabold tracking-tight text-plum-dark md:text-4xl">
                NAPLAN practice
              </h1>
              <p className="mt-4 font-vietnam text-base leading-relaxed text-plum-muted">
                Calm, unpressured practice in the real NAPLAN domains &mdash; Numeracy, Reading, and
                Language Conventions &mdash; with a worked explanation after every answer.
              </p>
            </div>
          </div>

          {/* Year toggle */}
          <div className="flex items-center gap-2">
            <span className="font-vietnam text-sm font-semibold text-plum-muted">Year level:</span>
            <div className="inline-flex gap-1.5 rounded-2xl bg-surface-container-high p-1.5 shadow-inner">
              {YEAR_LEVELS.map((year) => (
                <Link
                  key={year}
                  href={`/practice/naplan?year=${year}`}
                  className={`rounded-xl px-5 py-2 font-jakarta text-sm font-bold transition-all ${
                    year === activeYear ? "bg-white text-coral-accent shadow-sm" : "text-plum-muted hover:text-plum-dark"
                  }`}
                >
                  Year {year}
                </Link>
              ))}
            </div>
          </div>

          {/* Domain cards */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {domains.map(({ subject, program }) => {
              const Icon = DOMAIN_ICONS[subject];
              return program ? (
                <div
                  key={subject}
                  className="flex flex-col justify-between rounded-2xl border border-parchment-border bg-white p-6 shadow-warm-sm transition-all hover:border-coral-accent/40 hover:shadow-warm-card"
                >
                  <div>
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-coral-light text-coral-accent">
                      <Icon className="h-[22px] w-[22px]" aria-hidden="true" />
                    </div>
                    <h2 className="font-jakarta text-lg font-bold text-plum-dark">{program.name}</h2>
                    <p className="mt-2 font-vietnam text-sm leading-relaxed text-plum-muted">{program.blurb}</p>
                  </div>
                  <Link
                    href={`/practice/${program.slug}`}
                    className="mt-5 flex h-11 items-center justify-center gap-2 rounded-xl bg-coral-accent font-jakarta text-sm font-bold text-white transition-colors hover:bg-coral-hover"
                  >
                    <span>Configure session</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              ) : null;
            })}
          </div>

          {/* Writing callout — no isolated Writing program exists */}
          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-surface-container-low p-6 md:flex-row md:items-center">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-tint text-primary">
                <PenLine className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-jakarta text-base font-bold text-plum-dark">Looking for Writing practice?</h3>
                <p className="mt-1 font-vietnam text-sm text-plum-muted">
                  Writing tasks aren&rsquo;t offered as their own session &mdash; they&rsquo;re practised
                  inside a mixed session you build yourself.
                </p>
              </div>
            </div>
            <Link
              href="/practice/mixed-practice"
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-parchment-border bg-white px-5 font-jakarta text-sm font-bold text-plum-dark transition-colors hover:border-primary/40 hover:text-primary"
            >
              <span>Build your own practice</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
