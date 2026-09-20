import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Calculator, ChevronLeft, FlaskConical, Laptop2, SpellCheck } from "lucide-react";

import { AppHeader } from "@/components/shell/AppHeader";
import { getProgramBySlug, isLiveProgram, type Program } from "@/features/catalogue/catalogue";
import { resolveProgramStatuses } from "@/features/taxonomy/coverage";

export const metadata: Metadata = {
  title: "ICAS practice",
  description: "Challenge-oriented ICAS-style practice across Mathematics, English, Science, Digital Technologies and Spelling. No sign-in required.",
};

const YEAR_LEVELS = [3, 5] as const;
type Year = (typeof YEAR_LEVELS)[number];

const CORE_DOMAINS: Array<{ key: "numeracy" | "reading" | "language"; icon: typeof Calculator }> = [
  { key: "numeracy", icon: Calculator },
  { key: "reading", icon: BookOpen },
  { key: "language", icon: SpellCheck },
];

const EXPANSION_DOMAINS: Array<{ key: "science" | "digital_technologies" | "spelling"; label: string; icon: typeof Calculator }> = [
  { key: "science", label: "Science", icon: FlaskConical },
  { key: "digital_technologies", label: "Digital Technologies", icon: Laptop2 },
  { key: "spelling", label: "Spelling", icon: SpellCheck },
];

function expansionSlug(year: Year, subjectSlug: string) {
  return `icas-y${year}-${subjectSlug.replaceAll("_", "-")}`;
}

export default async function IcasHubPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year: yearParam } = await searchParams;
  const activeYear: Year = yearParam === "5" ? 5 : 3;

  const core = CORE_DOMAINS.map(({ key, icon }) => ({
    icon,
    program: getProgramBySlug(`icas-g${activeYear}-${key}`),
  }));

  const expansionResolved = resolveProgramStatuses(
    EXPANSION_DOMAINS.map(({ key }) => getProgramBySlug(expansionSlug(activeYear, key))).filter(
      (p): p is Program => p !== undefined,
    ),
  );
  const expansion = EXPANSION_DOMAINS.map(({ key, label, icon }) => {
    const program = expansionResolved.find((p) => p.slug === expansionSlug(activeYear, key));
    return { key, label, icon, program };
  });

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
          <div className="relative overflow-hidden rounded-3xl border-2 border-teal-border bg-white p-6 shadow-warm-card md:p-10">
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-gradient-to-br from-teal-light/70 to-primary-tint/40 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative z-10 max-w-2xl">
              <span className="mb-3 inline-block rounded-lg bg-teal-light px-3 py-1 font-vietnam text-xs font-bold uppercase tracking-wide text-teal-accent">
                Years 3 &amp; 5 &middot; Competition-style practice
              </span>
              <h1 className="font-jakarta text-2xl font-extrabold tracking-tight text-plum-dark md:text-4xl">
                ICAS practice
              </h1>
              <p className="mt-4 font-vietnam text-base leading-relaxed text-plum-muted">
                High-order, reasoning-focused questions in the ICAS style &mdash; your own objective
                marks after every sitting, never a percentile or class ranking.
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
                  href={`/practice/icas?year=${year}`}
                  className={`rounded-xl px-5 py-2 font-jakarta text-sm font-bold transition-all ${
                    year === activeYear ? "bg-white text-teal-accent shadow-sm" : "text-plum-muted hover:text-plum-dark"
                  }`}
                >
                  Year {year}
                </Link>
              ))}
            </div>
          </div>

          {/* Core domains — always live */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {core.map(({ icon: Icon, program }) =>
              program ? (
                <div
                  key={program.slug}
                  className="flex flex-col justify-between rounded-2xl border border-parchment-border bg-white p-6 shadow-warm-sm transition-all hover:border-teal-accent/40 hover:shadow-warm-card"
                >
                  <div>
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-teal-light text-teal-accent">
                      <Icon className="h-[22px] w-[22px]" aria-hidden="true" />
                    </div>
                    <h2 className="font-jakarta text-lg font-bold text-plum-dark">{program.name}</h2>
                    <p className="mt-2 font-vietnam text-sm leading-relaxed text-plum-muted">{program.blurb}</p>
                  </div>
                  <Link
                    href={`/practice/${program.slug}`}
                    className="mt-5 flex h-11 items-center justify-center gap-2 rounded-xl bg-teal-accent font-jakarta text-sm font-bold text-white transition-colors hover:bg-teal-accent/90"
                  >
                    <span>Configure session</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              ) : null,
            )}
          </div>

          {/* Expansion domains — real coverage check, honest when thin */}
          <div>
            <h2 className="mb-4 font-jakarta text-lg font-bold text-plum-dark">Also part of ICAS</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {expansion.map(({ key, label, icon: Icon, program }) => {
                const live = program ? isLiveProgram(program) : false;
                return (
                  <div
                    key={key}
                    className={`rounded-2xl border p-5 ${
                      live
                        ? "border-parchment-border bg-white shadow-warm-sm hover:border-teal-accent/40 hover:shadow-warm-card"
                        : "border-dashed border-parchment-border bg-surface-container-low"
                    }`}
                  >
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container text-plum-muted">
                      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                    </div>
                    <h3 className="font-jakarta text-sm font-bold text-plum-dark">{label}</h3>
                    {live && program ? (
                      <>
                        <p className="mt-1.5 font-vietnam text-xs text-plum-muted">{program.blurb}</p>
                        <Link
                          href={`/practice/${program.slug}`}
                          className="mt-3 inline-flex items-center gap-1 font-jakarta text-xs font-bold text-teal-accent hover:text-teal-accent/80"
                        >
                          <span>Configure session</span>
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                      </>
                    ) : (
                      <p className="mt-1.5 font-vietnam text-xs text-plum-muted">
                        Not enough questions published yet for Year {activeYear} &mdash; not offered as a
                        session today.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
