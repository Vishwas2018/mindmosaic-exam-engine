"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Bell, CheckCircle2, GraduationCap, Medal, School, Sparkles, X } from "lucide-react";

import {
  COMING_SOON_PROGRAMMES,
  type ComingSoonProgramme,
} from "@/features/student/components/programmes/programme-catalog";

interface LiveCard {
  kind: "live";
  href: string;
  title: string;
  description: string;
  icon: typeof School;
}

const LIVE_CARDS: readonly LiveCard[] = [
  {
    kind: "live",
    href: "/student/learn",
    title: "Curriculum Pathways",
    description: "Victorian Curriculum lessons across Mathematics and English strands.",
    icon: School,
  },
  {
    kind: "live",
    href: "/practice/naplan",
    title: "NAPLAN",
    description: "National assessment-style numeracy, reading, and language practice.",
    icon: GraduationCap,
  },
  {
    kind: "live",
    href: "/practice/icas",
    title: "ICAS",
    description: "Higher-order problem solving and competition-style assessment practice.",
    icon: Medal,
  },
];

/**
 * "Explore everything MindMosaic offers": the 3 live pathways plus the 5
 * not-yet-live programme tracks from the shared COMING_SOON_PROGRAMMES
 * catalogue. The catalogue's own "Notify me" preview modal (ported from
 * the now-unused MoreChallengesSection) is reused here rather than
 * rebuilt.
 */
export function ExploreGridSection() {
  const [active, setActive] = useState<ComingSoonProgramme | null>(null);
  const [notified, setNotified] = useState(false);

  function openTrack(track: ComingSoonProgramme) {
    setNotified(false);
    setActive(track);
  }

  function close() {
    setActive(null);
    setNotified(false);
  }

  function notify() {
    setNotified(true);
    window.setTimeout(close, 1200);
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-mm-ink tracking-tight">
          Explore everything MindMosaic offers
        </h2>
        <p className="text-xs text-mm-muted">A directory of curriculum learning and assessment preparation</p>
      </div>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {LIVE_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group flex flex-col justify-between overflow-hidden rounded-xl border border-mm-line bg-white p-3.5 shadow-xs transition-all hover:shadow-warm-card"
            >
              <div>
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-mm-tint text-primary">
                  <Icon aria-hidden="true" className="h-4 w-4" />
                </div>
                <span className="font-[family-name:var(--font-display)] text-xs font-bold text-mm-ink">
                  {card.title}
                </span>
                <p className="mt-1.5 text-[11px] leading-relaxed text-mm-muted">{card.description}</p>
              </div>
              <div className="mt-3 border-t border-mm-line/50 pt-3">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                  View details
                  <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          );
        })}
        {COMING_SOON_PROGRAMMES.map((track) => {
          const Icon = track.icon;
          return (
            <button
              key={track.slug}
              type="button"
              onClick={() => openTrack(track)}
              className="group flex flex-col justify-between overflow-hidden rounded-xl border border-mm-line bg-white p-3.5 text-left shadow-xs transition-all hover:shadow-warm-card"
            >
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-mm-tint text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="rounded-full border border-mm-line bg-mm-tint-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-mm-muted">
                    Coming Soon
                  </span>
                </div>
                <span className="font-[family-name:var(--font-display)] text-xs font-bold text-mm-ink">
                  {track.cardTitle}
                </span>
                <p className="mt-1.5 text-[11px] leading-relaxed text-mm-muted">{track.cardDescription}</p>
              </div>
              <div className="mt-3 border-t border-mm-line/50 pt-3">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                  Preview track
                  <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div
        role="dialog"
        aria-modal="true"
        // `inert` (not aria-hidden) when closed: aria-hidden alone left the
        // dialog's buttons still keyboard-focusable despite pointer-events-
        // none, tripping axe's aria-hidden-focus rule for a real reason — a
        // Tab-only user could focus an invisible "Notify me" button (audit,
        // 2026-09 e2e repair). `inert` removes focusability too.
        inert={active === null || undefined}
        className={`fixed inset-0 z-50 flex items-center justify-center bg-plum-dark/50 p-4 backdrop-blur-sm transition-opacity duration-200 ${
          active ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div
          className={`relative w-full max-w-md transform rounded-3xl border border-mm-line bg-white p-6 shadow-warm-elevated transition-transform duration-200 md:p-8 ${
            active ? "scale-100" : "scale-95"
          }`}
        >
          <button
            type="button"
            aria-label="Close modal"
            onClick={close}
            className="absolute right-5 top-5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-mm-tint-soft text-mm-ink transition-colors hover:bg-mm-line"
          >
            <X aria-hidden="true" className="h-[18px] w-[18px]" />
          </button>

          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-border bg-amber-light text-amber-accent">
            <Sparkles aria-hidden="true" className="h-6 w-6" />
          </div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-light px-2.5 py-0.5 text-xs font-bold text-amber-accent">
            Not yet available
          </div>
          <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-mm-ink md:text-2xl">
            {active?.fullTitle ?? "Track preview"}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-mm-muted">{active?.about ?? ""}</p>

          <div className="mt-6 flex flex-col gap-3 border-t border-mm-line pt-5">
            <button
              type="button"
              onClick={notify}
              className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white shadow-sm transition-colors ${
                notified ? "bg-teal-accent" : "bg-primary hover:bg-primary-hover"
              }`}
            >
              {notified ? (
                <>
                  <CheckCircle2 aria-hidden="true" className="h-[18px] w-[18px]" />
                  You&rsquo;ll be notified when it&rsquo;s live
                </>
              ) : (
                <>
                  <Bell aria-hidden="true" className="h-[18px] w-[18px]" />
                  Notify me when live
                </>
              )}
            </button>
            {active && (
              <Link
                href={`/practice/${active.slug}`}
                className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-mm-line text-xs font-bold text-mm-ink transition-colors hover:border-primary/40 hover:text-primary"
              >
                View full programme page
                <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
              </Link>
            )}
            <button
              type="button"
              onClick={close}
              className="h-12 w-full rounded-xl bg-mm-tint-soft text-xs font-semibold text-mm-ink transition-colors hover:bg-mm-line"
            >
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
