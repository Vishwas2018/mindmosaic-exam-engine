"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Bell, CheckCircle2, Clock, ExternalLink, Sparkles, X } from "lucide-react";
import {
  COMING_SOON_PROGRAMMES,
  type ComingSoonProgramme,
} from "@/features/student/components/programmes/programme-catalog";

const ACCENT_CLASSES: Record<
  ComingSoonProgramme["accent"],
  { iconBox: string; hoverBorder: string; action: string; actionHover: string }
> = {
  primary: {
    iconBox: "bg-primary-tint text-primary",
    hoverBorder: "hover:border-primary/40",
    action: "text-primary",
    actionHover: "group-hover:text-primary-hover",
  },
  coral: {
    iconBox: "bg-coral-light text-coral-accent",
    hoverBorder: "hover:border-coral-accent/40",
    action: "text-coral-accent",
    actionHover: "group-hover:text-coral-hover",
  },
  teal: {
    iconBox: "bg-teal-light text-teal-accent",
    hoverBorder: "hover:border-teal-accent/40",
    action: "text-teal-accent",
    actionHover: "group-hover:text-teal-accent/80",
  },
};

export function MoreChallengesSection({ firstName }: { firstName?: string | null }) {
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

  const learnerName = firstName ? firstName : "you";

  return (
    <section aria-labelledby="more-challenges-heading" className="flex flex-col gap-4 pb-4">
      <div className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h2
            id="more-challenges-heading"
            className="font-jakarta font-extrabold text-xl md:text-2xl text-plum-dark tracking-tight"
          >
            More challenges
          </h2>
          <p className="font-vietnam text-xs md:text-sm text-plum-muted mt-0.5">
            Enrichment, selective school entry, and contest mathematics
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-light border border-amber-border text-amber-accent font-jakarta font-bold text-xs">
          <Clock className="h-4 w-4" aria-hidden="true" />
          Coming in Term 1 &middot; Register for early access
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {COMING_SOON_PROGRAMMES.map((track) => {
          const accent = ACCENT_CLASSES[track.accent];
          const Icon = track.icon;
          return (
            <button
              key={track.slug}
              type="button"
              onClick={() => openTrack(track)}
              className={`text-left bg-white rounded-2xl border border-parchment-border p-4 shadow-warm-sm flex flex-col justify-between transition-all group relative cursor-pointer ${accent.hoverBorder} hover:shadow-warm-card`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform ${accent.iconBox}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container text-plum-muted font-jakarta font-semibold text-[10px] uppercase tracking-wider border border-parchment-border">
                    Coming Soon
                  </span>
                </div>
                <h4 className="font-jakarta font-bold text-sm text-plum-dark leading-snug">
                  {track.cardTitle}
                </h4>
                <p className="font-vietnam text-xs text-plum-muted mt-2 leading-relaxed">
                  {track.cardDescription}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-parchment-border/60 flex items-center justify-between text-xs">
                <span className={`font-jakarta font-bold inline-flex items-center gap-1 group-hover:gap-1.5 transition-all ${accent.action} ${accent.actionHover}`}>
                  <span>Preview track</span>
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span className="text-[11px] text-plum-muted">Term 1</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Shared Coming-Soon preview modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-hidden={active === null}
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-plum-dark/50 backdrop-blur-sm transition-opacity duration-200 ${
          active ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div
          className={`bg-white rounded-3xl border border-parchment-border max-w-md w-full p-6 md:p-8 shadow-warm-elevated relative transform transition-transform duration-200 ${
            active ? "scale-100" : "scale-95"
          }`}
        >
          <button
            type="button"
            aria-label="Close modal"
            onClick={close}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-surface-container hover:bg-parchment-border text-plum-dark flex items-center justify-center transition-colors"
          >
            <X className="h-4.5 w-4.5" aria-hidden="true" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-amber-light text-amber-accent flex items-center justify-center border border-amber-border mb-4">
            <Sparkles className="h-6.5 w-6.5" aria-hidden="true" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-light text-amber-accent font-jakarta font-bold text-xs mb-2">
            <span>Releasing Term 1</span>
          </div>
          <h3 className="font-jakarta font-bold text-xl md:text-2xl text-plum-dark">
            {active?.fullTitle ?? "Track Preview"}
          </h3>
          <p className="font-vietnam text-sm text-plum-muted mt-2 leading-relaxed">
            {active?.cardDescription ?? "Our team is crafting calm, rigorous scholastic practice modules for this pathway."}
          </p>

          <div className="mt-6 pt-5 border-t border-parchment-border/70 flex flex-col gap-3">
            <button
              type="button"
              onClick={notify}
              className={`h-11 w-full rounded-xl text-white font-jakarta font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors ${
                notified ? "bg-teal-accent" : "bg-primary hover:bg-primary-hover"
              }`}
            >
              {notified ? (
                <>
                  <CheckCircle2 className="h-4.5 w-4.5" aria-hidden="true" />
                  <span>You&rsquo;ll be notified for {learnerName}!</span>
                </>
              ) : (
                <>
                  <Bell className="h-4.5 w-4.5" aria-hidden="true" />
                  <span>Notify me when live</span>
                </>
              )}
            </button>
            {active && (
              <Link
                href={`/practice/${active.slug}`}
                className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-parchment-border font-jakarta text-xs font-bold text-plum-dark transition-colors hover:border-primary/40 hover:text-primary"
              >
                <span>View full programme page</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            )}
            <button
              type="button"
              onClick={close}
              className="h-10 w-full rounded-xl bg-surface-container hover:bg-parchment-border text-plum-dark font-jakarta font-semibold text-xs transition-colors"
            >
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
