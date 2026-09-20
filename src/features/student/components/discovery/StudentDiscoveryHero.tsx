import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { StartHereRecommendation } from "./discovery-recommendations";

export function StudentDiscoveryHero({
  firstName,
  recommendation,
}: {
  firstName: string | null;
  yearLevel?: number | null;
  recommendation: StartHereRecommendation;
}) {
  const greetingName = firstName ? firstName : "there";

  return (
    <section aria-labelledby="welcome-heading" className="flex flex-col gap-4 pb-4">
      {/* 1. Greeting header */}
      <div className="pt-2">
        <span className="font-vietnam font-bold text-[11px] uppercase tracking-wider text-primary block mb-1">
          MY LEARNING
        </span>
        <h1
          id="welcome-heading"
          className="font-jakarta font-extrabold text-2xl md:text-3xl lg:text-[34px] text-plum-dark tracking-tight"
        >
          Hi, {greetingName}. What would you like to work on today?
        </h1>
      </div>

      {/* Large Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white border-2 border-primary/20 shadow-warm-card p-6 md:p-10 lg:p-12">
        <div className="hero-pattern absolute inset-0 pointer-events-none" aria-hidden="true" />
        <div
          className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-gradient-to-br from-primary-tint/70 via-purple-50/50 to-coral-light/40 pointer-events-none blur-3xl"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-primary-tint text-primary font-jakarta font-bold text-xs tracking-wider uppercase mb-4">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span>{recommendation.tag}</span>
            </div>

            <h2 className="font-jakarta font-extrabold text-3xl md:text-4xl text-plum-dark leading-tight tracking-tight">
              {recommendation.title}
            </h2>

            {/* Metadata Pills */}
            <div className="flex flex-wrap items-center gap-2.5 mt-4">
              {recommendation.metaChips.map((chip, idx) => (
                <span
                  key={chip}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container-low border border-parchment-border text-xs ${
                    idx === 0 ? "font-semibold text-primary" : "font-medium text-plum-dark"
                  }`}
                >
                  {chip}
                </span>
              ))}
            </div>

            <p className="font-vietnam text-plum-muted text-base md:text-[17px] mt-4 leading-relaxed">
              {recommendation.description}
            </p>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3.5 mt-8">
              <Link
                href={recommendation.href}
                className="h-12 px-7 rounded-xl bg-coral-accent hover:bg-coral-hover text-white font-jakarta font-bold text-base flex items-center justify-center gap-2 shadow-coral-glow hover:translate-y-[-1px] active:translate-y-[0px] transition-all"
              >
                <span>{recommendation.actionLabel}</span>
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link
                href="/student/learn"
                className="h-12 px-5 rounded-xl bg-parchment-subtle hover:bg-surface-container border border-parchment-border text-plum-dark font-jakarta font-semibold text-sm flex items-center justify-center transition-colors"
              >
                Choose another lesson
              </Link>
            </div>
          </div>

          {/* Right Visual: Bespoke SVG showing visual fraction slices (fifths and tenths) and number-line intervals */}
          <div className="w-full lg:w-[440px] shrink-0 p-6 rounded-2xl bg-surface-container-low border border-parchment-border shadow-warm-sm">
            <div className="flex items-center justify-between mb-3 text-xs font-semibold text-plum-muted">
              <span className="flex items-center gap-1.5 font-jakarta text-plum-dark">
                <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
                Fraction &amp; Decimal Equivalence
              </span>
              <span className="text-primary font-bold bg-primary-tint px-2 py-0.5 rounded-md border border-primary/20">2/5 = 0.40 = 4/10</span>
            </div>

            <svg
              className="w-full h-auto rounded-xl bg-white border border-parchment-border/80 p-2.5"
              fill="none"
              viewBox="0 0 360 170"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Fifths row label */}
              <text fill="#564B63" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="10" fontWeight="700" x="8" y="18">
                FIFTHS (2/5)
              </text>
              {/* Fifths bar slices */}
              <g transform="translate(8, 24)">
                <rect fill="#5925A8" height="24" rx="4" width="66" x="0" y="0" />
                <rect fill="#5925A8" height="24" rx="4" width="66" x="69" y="0" />
                <rect fill="#F7F4EC" height="24" rx="4" stroke="#EBE6DC" width="66" x="138" y="0" />
                <rect fill="#F7F4EC" height="24" rx="4" stroke="#EBE6DC" width="66" x="207" y="0" />
                <rect fill="#F7F4EC" height="24" rx="4" stroke="#EBE6DC" width="66" x="276" y="0" />
                <text fill="#FFFFFF" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="10" fontWeight="700" textAnchor="middle" x="33" y="16">
                  1/5
                </text>
                <text fill="#FFFFFF" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="10" fontWeight="700" textAnchor="middle" x="102" y="16">
                  1/5
                </text>
              </g>

              {/* Tenths row label */}
              <text fill="#564B63" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="10" fontWeight="700" x="8" y="66">
                TENTHS &amp; DECIMALS (4/10 = 0.4)
              </text>
              {/* Tenths bar slices */}
              <g transform="translate(8, 72)">
                <rect fill="#5925A8" height="22" rx="3" width="32" x="0" y="0" />
                <rect fill="#5925A8" height="22" rx="3" width="32" x="34.5" y="0" />
                <rect fill="#5925A8" height="22" rx="3" width="32" x="69" y="0" />
                <rect fill="#5925A8" height="22" rx="3" width="32" x="103.5" y="0" />
                <rect fill="#FF555A" height="22" rx="3" width="32" x="138" y="0" />
                <rect fill="#F7F4EC" height="22" rx="3" stroke="#EBE6DC" width="32" x="172.5" y="0" />
                <rect fill="#F7F4EC" height="22" rx="3" stroke="#EBE6DC" width="32" x="207" y="0" />
                <rect fill="#F7F4EC" height="22" rx="3" stroke="#EBE6DC" width="32" x="241.5" y="0" />
                <rect fill="#F7F4EC" height="22" rx="3" stroke="#EBE6DC" width="32" x="276" y="0" />
                <rect fill="#F7F4EC" height="22" rx="3" stroke="#EBE6DC" width="32" x="310.5" y="0" />
              </g>

              {/* Number Line Component */}
              <text fill="#564B63" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="10" fontWeight="700" x="8" y="114">
                NUMBER LINE EQUIVALENCE
              </text>
              <g transform="translate(8, 126)">
                {/* Line axis */}
                <line stroke="#1E152A" strokeLinecap="round" strokeWidth="2" x1="8" x2="334" y1="12" y2="12" />
                {/* Tick marks */}
                <line stroke="#1E152A" strokeWidth="2" x1="8" x2="8" y1="6" y2="18" />
                <line stroke="#564B63" strokeWidth="1.5" x1="73.2" x2="73.2" y1="8" y2="16" />
                <line stroke="#5925A8" strokeWidth="2.5" x1="138.4" x2="138.4" y1="5" y2="19" />
                <line stroke="#564B63" strokeWidth="1.5" x1="203.6" x2="203.6" y1="8" y2="16" />
                <line stroke="#564B63" strokeWidth="1.5" x1="268.8" x2="268.8" y1="8" y2="16" />
                <line stroke="#1E152A" strokeWidth="2" x1="334" x2="334" y1="6" y2="18" />
                {/* Current pointer indicator */}
                <circle cx="138.4" cy="12" fill="#FF555A" r="5" stroke="#FFFFFF" strokeWidth="2" />
                <rect fill="#5925A8" height="15" rx="4" width="41" x="118" y="-12" />
                <text fill="#FFFFFF" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="9" fontWeight="700" textAnchor="middle" x="138.5" y="-2">
                  0.40
                </text>
                {/* Labels */}
                <text fill="#564B63" fontFamily="Be Vietnam Pro, sans-serif" fontSize="9" textAnchor="middle" x="8" y="28">0.0</text>
                <text fill="#564B63" fontFamily="Be Vietnam Pro, sans-serif" fontSize="9" textAnchor="middle" x="73.2" y="28">0.2</text>
                <text fill="#5925A8" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="9" fontWeight="700" textAnchor="middle" x="138.4" y="28">2/5</text>
                <text fill="#564B63" fontFamily="Be Vietnam Pro, sans-serif" fontSize="9" textAnchor="middle" x="203.6" y="28">0.6</text>
                <text fill="#564B63" fontFamily="Be Vietnam Pro, sans-serif" fontSize="9" textAnchor="middle" x="268.8" y="28">0.8</text>
                <text fill="#564B63" fontFamily="Be Vietnam Pro, sans-serif" fontSize="9" textAnchor="middle" x="334" y="28">1.0</text>
              </g>
            </svg>

            <div className="mt-3.5 pt-3 border-t border-parchment-border/70 flex items-center justify-between text-[11px] text-plum-muted">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-primary inline-block" /> 4 tenths
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-coral-accent inline-block" /> 1 target slice
              </span>
              <span className="font-bold text-plum-dark">Equivalent: 4/10 = 0.4</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
