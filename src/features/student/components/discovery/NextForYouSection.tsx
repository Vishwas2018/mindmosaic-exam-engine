import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { NextForYouCard } from "./discovery-recommendations";

export function NextForYouSection({
  cards,
}: {
  cards: readonly NextForYouCard[];
}) {
  if (cards.length === 0) return null;

  return (
    <section aria-labelledby="next-for-you-heading" className="flex flex-col gap-4 pb-4">
      <div>
        <h2
          id="next-for-you-heading"
          className="font-jakarta font-extrabold text-xl md:text-2xl text-plum-dark tracking-tight"
        >
          Next for you
        </h2>
        <p className="font-vietnam text-xs md:text-sm text-plum-muted mt-0.5">
          Personalised starting points based on your recent activity
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Continue / In Progress */}
        <div className="bg-white rounded-2xl border border-parchment-border p-6 shadow-warm-sm hover:border-primary/40 hover:shadow-warm-card flex flex-col justify-between transition-all group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-2.5 py-0.5 rounded-full bg-primary-tint text-primary font-jakarta font-bold text-xs border border-primary/20">
                {cards[0]?.tag ?? "In Progress"}
              </span>
              <div className="w-10 h-10 rounded-xl bg-primary-tint text-primary flex items-center justify-center border border-primary/20 group-hover:scale-105 transition-transform">
                {/* Compass & ruler bespoke SVG */}
                <svg
                  className="w-5 h-5 text-primary"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <polygon
                    fill="#5925A8"
                    fillOpacity="0.2"
                    points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
                  />
                </svg>
              </div>
            </div>
            <h3 className="font-jakarta font-bold text-base md:text-lg text-plum-dark leading-snug">
              {cards[0]?.title ?? "Continue where you left off"}
            </h3>
            <p className="font-vietnam text-xs md:text-sm text-plum-muted mt-2 leading-relaxed">
              {cards[0]?.description ?? "Return to your latest unfinished activity."}
            </p>
          </div>
          <div className="mt-5 pt-3.5 border-t border-parchment-border/70">
            <Link
              className="h-10 px-3.5 rounded-xl bg-parchment-subtle group-hover:bg-primary group-hover:text-white border border-parchment-border text-primary font-jakarta font-bold text-xs md:text-sm flex items-center justify-between transition-colors"
              href={cards[0]?.href ?? "/student/learn"}
            >
              <span>{cards[0]?.actionLabel ?? "Resume lesson"}</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Card 2: Targeted Review */}
        <div className="bg-white rounded-2xl border border-parchment-border p-6 shadow-warm-sm hover:border-coral-accent/40 hover:shadow-warm-card flex flex-col justify-between transition-all group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-2.5 py-0.5 rounded-full bg-coral-light text-coral-accent font-jakarta font-bold text-xs border border-coral-border">
                {cards[1]?.tag ?? "Targeted Review"}
              </span>
              <div className="w-10 h-10 rounded-xl bg-coral-light text-coral-accent flex items-center justify-center border border-coral-border group-hover:scale-105 transition-transform">
                {/* Refresh / Target loop SVG */}
                <svg
                  className="w-5 h-5 text-coral-accent"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                  <path d="M16 2v4h4" />
                </svg>
              </div>
            </div>
            <h3 className="font-jakarta font-bold text-base md:text-lg text-plum-dark leading-snug">
              {cards[1]?.title ?? "Practise what you missed"}
            </h3>
            <p className="font-vietnam text-xs md:text-sm text-plum-muted mt-2 leading-relaxed">
              {cards[1]?.description ?? "Retry questions missed in recent sessions to build mastery."}
            </p>
          </div>
          <div className="mt-5 pt-3.5 border-t border-parchment-border/70">
            <Link
              className="h-10 px-3.5 rounded-xl bg-coral-light/60 group-hover:bg-coral-accent group-hover:text-white border border-coral-border text-coral-accent font-jakarta font-bold text-xs md:text-sm flex items-center justify-between transition-colors"
              href={cards[1]?.href ?? "/practice"}
            >
              <span>{cards[1]?.actionLabel ?? "Practise now"}</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Card 3: Suggested Next */}
        <div className="bg-white rounded-2xl border border-parchment-border p-6 shadow-warm-sm hover:border-teal-accent/40 hover:shadow-warm-card flex flex-col justify-between transition-all group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-light text-teal-accent font-jakarta font-bold text-xs border border-teal-border">
                {cards[2]?.tag ?? "Suggested Next"}
              </span>
              <div className="w-10 h-10 rounded-xl bg-teal-light text-teal-accent flex items-center justify-center border border-teal-border group-hover:scale-105 transition-transform">
                {/* Stepping stones/blocks SVG */}
                <svg
                  className="w-5 h-5 text-teal-accent"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <rect fill="#008579" fillOpacity="0.2" height="7" rx="1" width="7" x="3" y="14" />
                  <rect fill="#008579" fillOpacity="0.2" height="7" rx="1" width="7" x="14" y="3" />
                  <path d="M10 17.5h4a2 2 0 0 0 2-2V7" />
                  <polyline points="14 9 16 7 18 9" />
                </svg>
              </div>
            </div>
            <h3 className="font-jakarta font-bold text-base md:text-lg text-plum-dark leading-snug">
              {cards[2]?.title ?? "Try something next"}
            </h3>
            <p className="font-vietnam text-xs md:text-sm text-plum-muted mt-2 leading-relaxed">
              {cards[2]?.description ?? "A natural step forward: Mixed Numbers & Visual Models."}
            </p>
          </div>
          <div className="mt-5 pt-3.5 border-t border-parchment-border/70">
            <Link
              className="h-10 px-3.5 rounded-xl bg-teal-light/60 group-hover:bg-teal-accent group-hover:text-white border border-teal-border text-teal-accent font-jakarta font-bold text-xs md:text-sm flex items-center justify-between transition-colors"
              href={cards[2]?.href ?? "/practice/mixed-practice"}
            >
              <span>{cards[2]?.actionLabel ?? "Start next"}</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
