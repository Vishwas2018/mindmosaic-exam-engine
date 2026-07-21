import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Lock, Sparkles } from "lucide-react";

import { MindMosaicLogo } from "@/components/branding";
import { AuthNav } from "@/features/auth";
import { Badge, Card } from "@/components/ui";
import { PROGRAMS, type Program } from "@/features/catalogue/catalogue";

export const metadata: Metadata = {
  title: "Practice programs",
  description:
    "Browse original Grade 3 and Grade 5 NAPLAN-style and ICAS-style practice programs. No sign-in required.",
};

const liveScopedPrograms = PROGRAMS.filter(
  (program) => program.status === "live" && program.scope !== undefined,
);
const unscopedLiveProgram = PROGRAMS.find(
  (program) => program.status === "live" && program.scope === undefined,
);
const comingSoonPrograms = PROGRAMS.filter((program) => program.status === "coming_soon");

function ProgramCard({ program }: { program: Program }) {
  return (
    <Link
      href={`/practice/${program.slug}`}
      className="group block h-full rounded-3xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
    >
      <Card
        className="flex h-full flex-col p-6 transition group-hover:-translate-y-0.5 group-hover:shadow-[0_20px_45px_rgba(49,32,86,0.14)]"
        variant="default"
      >
        <Badge variant={program.scope?.examStyle === "icas_style" ? "purple" : "orange"}>
          {program.scope
            ? program.scope.examStyle === "naplan_style"
              ? "NAPLAN-style"
              : "ICAS-style"
            : "Build your own"}
        </Badge>
        <h3 className="mt-4 text-xl font-black tracking-[-0.03em] text-ink">{program.name}</h3>
        <p className="mt-2 flex-1 text-sm leading-6 text-muted">{program.blurb}</p>
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-extrabold text-royal transition group-hover:gap-2.5">
          Start practising
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </span>
      </Card>
    </Link>
  );
}

function ComingSoonCard({ program }: { program: Program }) {
  return (
    <Card
      aria-disabled="true"
      className="flex h-full flex-col p-6 opacity-70"
      variant="soft"
    >
      <Badge variant="neutral">
        <Lock aria-hidden="true" className="h-3 w-3" />
        Coming soon
      </Badge>
      <h3 className="mt-4 text-xl font-black tracking-[-0.03em] text-ink">{program.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-muted">{program.blurb}</p>
    </Card>
  );
}

export default function PracticePage() {
  return (
    <div className="min-h-screen overflow-hidden bg-page">
      <header className="relative z-20 border-b border-royal/8 bg-white/80 backdrop-blur-xl">
        <div className="site-width flex min-h-20 items-center justify-between gap-4 py-3">
          <Link
            href="/"
            aria-label="MindMosaic home"
            className="rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
          >
            <MindMosaicLogo />
          </Link>
          <nav aria-label="Primary navigation" className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/showcase"
              className="hidden min-h-11 items-center rounded-xl px-3 text-sm font-bold text-muted transition hover:bg-royal/5 hover:text-royal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20 sm:inline-flex"
            >
              Renderer showcase
            </Link>
            <AuthNav />
          </nav>
        </div>
      </header>

      <main id="main-content">
        <section className="surface-grid relative border-b border-royal/8 py-16 sm:py-20">
          <span
            aria-hidden="true"
            className="mosaic-halo -left-20 top-28 h-64 w-64 bg-royal/8"
          />
          <span
            aria-hidden="true"
            className="mosaic-halo -right-20 top-0 h-72 w-72 bg-royal-orange/10"
          />

          <div className="site-width relative">
            <Badge variant="orange" className="mb-6">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
              Original Australian practice
            </Badge>
            <h1 className="max-w-3xl text-[clamp(2.75rem,6vw,5.25rem)] font-black leading-[0.98] tracking-[-0.055em] text-ink">
              Practice with purpose. <span className="text-royal">Grow with confidence.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-muted sm:text-xl sm:leading-9">
              Choose a practice program below to jump straight into a Grade 3
              or Grade 5 NAPLAN-style or ICAS-style session — no sign-in
              needed.
            </p>
          </div>
        </section>

        <section
          className="site-width py-16 sm:py-20"
          aria-labelledby="live-programs-heading"
        >
          <h2
            id="live-programs-heading"
            className="text-3xl font-black tracking-[-0.04em] text-ink sm:text-4xl"
          >
            Practice programs
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {liveScopedPrograms.map((program) => (
              <ProgramCard key={program.id} program={program} />
            ))}
            {unscopedLiveProgram && (
              <ProgramCard key={unscopedLiveProgram.id} program={unscopedLiveProgram} />
            )}
          </div>
        </section>

        <section
          className="site-width pb-16 sm:pb-20"
          aria-labelledby="coming-soon-heading"
        >
          <h2
            id="coming-soon-heading"
            className="text-3xl font-black tracking-[-0.04em] text-ink sm:text-4xl"
          >
            Coming soon
          </h2>
          <p className="mt-2 max-w-2xl text-base leading-7 text-muted">
            More practice programs are on the way.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {comingSoonPrograms.map((program) => (
              <ComingSoonCard key={program.id} program={program} />
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-royal/8 bg-white">
        <div className="site-width flex flex-col items-start justify-between gap-4 py-7 text-sm text-muted sm:flex-row sm:items-center">
          <MindMosaicLogo />
          <p>Original practice content · Australian English · Built for thoughtful learning</p>
        </div>
      </footer>
    </div>
  );
}
