"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, CheckCircle2, Hourglass, ShieldCheck } from "lucide-react";
import { getComingSoonProgramme, type ComingSoonProgramme } from "./programme-catalog";

const ACCENT_CLASSES: Record<
  ComingSoonProgramme["accent"],
  { tint: string; text: string; border: string; button: string; buttonHover: string }
> = {
  primary: {
    tint: "bg-primary-tint",
    text: "text-primary",
    border: "border-primary/20",
    button: "bg-primary",
    buttonHover: "hover:bg-primary-hover",
  },
  coral: {
    tint: "bg-coral-light",
    text: "text-coral-accent",
    border: "border-coral-border",
    button: "bg-coral-accent",
    buttonHover: "hover:bg-coral-hover",
  },
  teal: {
    tint: "bg-teal-light",
    text: "text-teal-accent",
    border: "border-teal-border",
    button: "bg-teal-accent",
    buttonHover: "hover:bg-teal-accent/90",
  },
};

const LIVE_PROGRAMMES = [
  { label: "Curriculum Learning", detail: "Mathematics & English, Years 3 & 5", href: "/student/learn" },
  { label: "NAPLAN practice", detail: "Numeracy, Reading, Language Conventions", href: "/practice/naplan" },
  { label: "ICAS practice", detail: "Real question banks across six subjects", href: "/practice/icas" },
] as const;

export function ProgrammeComingSoon({
  programme: directProgramme,
  programmeSlug,
}: {
  programme?: ComingSoonProgramme;
  programmeSlug?: string;
}) {
  const [notified, setNotified] = useState(false);
  const programme =
    directProgramme ?? (programmeSlug ? getComingSoonProgramme(programmeSlug) : undefined);

  if (!programme) return null;

  const accent = ACCENT_CLASSES[programme.accent];
  const Icon = programme.icon;

  return (
    <div className="flex flex-col gap-10 pb-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-vietnam text-xs text-plum-muted">
        <Link href="/practice" className="hover:text-primary">
          Practice
        </Link>
        <span className="text-parchment-border">/</span>
        <span className="rounded-lg bg-surface-container-high px-2 py-0.5 font-semibold text-plum-dark">
          {programme.cardTitle}
        </span>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-primary/20 bg-white p-6 shadow-warm-card md:p-10">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-gradient-to-br from-primary-tint/60 to-coral-light/40 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className={`mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 font-vietnam text-xs font-semibold uppercase tracking-wide ${accent.tint} ${accent.text}`}>
              <span>{programme.scopeLabel}</span>
            </div>
            <h1 className="font-jakarta text-2xl font-extrabold tracking-tight text-plum-dark md:text-4xl">
              {programme.fullTitle}
            </h1>
            <p className="mt-4 font-vietnam text-base leading-relaxed text-plum-muted">{programme.about}</p>

            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-surface-container-low p-4">
              <Hourglass className={`mt-0.5 h-5 w-5 shrink-0 ${accent.text}`} aria-hidden="true" />
              <div>
                <p className="font-jakarta text-sm font-bold text-plum-dark">In development</p>
                <p className="mt-0.5 font-vietnam text-sm text-plum-muted">
                  This track has no live practice questions yet. Nothing here can be started today &mdash;
                  when it launches, it will arrive with full worked solutions, the same as every other
                  MindMosaic practice set.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setNotified(true)}
                disabled={notified}
                className={`inline-flex h-12 items-center gap-2 rounded-xl px-6 font-jakarta text-sm font-bold text-white shadow-sm transition-all disabled:cursor-default ${
                  notified ? "bg-teal-accent" : `${accent.button} ${accent.buttonHover}`
                }`}
              >
                {notified ? (
                  <>
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                    <span>You&rsquo;re on the list</span>
                  </>
                ) : (
                  <>
                    <Bell className="h-5 w-5" aria-hidden="true" />
                    <span>Notify me when live</span>
                  </>
                )}
              </button>
              <Link
                href="/practice"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-parchment-border bg-white px-5 font-jakarta text-sm font-semibold text-plum-dark transition-colors hover:border-primary/40 hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span>Return to Practice</span>
              </Link>
            </div>
          </div>

          <div className={`flex w-full shrink-0 items-center justify-center rounded-3xl border ${accent.border} ${accent.tint} p-10 lg:w-64`}>
            <Icon className={`h-20 w-20 ${accent.text}`} />
          </div>
        </div>
      </div>

      {/* Planned focus areas */}
      <section>
        <div className="mb-5">
          <span className="font-vietnam text-xs font-semibold uppercase tracking-wider text-plum-muted">
            Planned focus areas
          </span>
          <h2 className="mt-1 font-jakarta text-xl font-extrabold text-plum-dark md:text-2xl">
            What this track will cover
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {programme.focusAreas.map((area) => (
            <div
              key={area.title}
              className="rounded-2xl border border-parchment-border bg-white p-5 shadow-warm-sm"
            >
              <h3 className="font-jakarta text-sm font-bold text-plum-dark">{area.title}</h3>
              <p className="mt-2 font-vietnam text-xs leading-relaxed text-plum-muted">{area.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Honesty pledge */}
      <div className="flex flex-col gap-4 rounded-2xl bg-surface-container-low p-6 md:flex-row md:items-center md:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-tint">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <p className="font-vietnam text-sm leading-relaxed text-plum-muted">
            <strong className="font-jakarta font-bold text-plum-dark">
              MindMosaic doesn&rsquo;t launch incomplete question banks.
            </strong>{" "}
            We&rsquo;d rather show you an honest &ldquo;coming soon&rdquo; page than a thin set of
            questions dressed up as a finished track.
          </p>
        </div>
      </div>

      {/* What's live now */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-jakarta text-lg font-bold text-plum-dark">You can explore right now</h2>
          <Link href="/practice" className="font-jakarta text-sm font-bold text-primary hover:text-primary-hover">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {LIVE_PROGRAMMES.map((live) => (
            <Link
              key={live.href}
              href={live.href}
              className="rounded-2xl border border-parchment-border bg-white p-4 shadow-warm-sm transition-all hover:border-primary/40 hover:shadow-warm-card"
            >
              <div className="mb-1 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-accent" />
                <span className="font-vietnam text-[11px] font-semibold uppercase tracking-wider text-teal-accent">
                  Live now
                </span>
              </div>
              <h3 className="font-jakarta text-sm font-bold text-plum-dark">{live.label}</h3>
              <p className="mt-0.5 font-vietnam text-xs text-plum-muted">{live.detail}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
