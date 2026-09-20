import Link from "next/link";
import { Rocket, RefreshCw, Timer } from "lucide-react";

export function QuickPracticeSection({ yearLevel }: { yearLevel?: number | null }) {
  const displayYear = yearLevel ?? 5;

  return (
    <section aria-labelledby="quick-practice-heading" className="flex flex-col gap-4 pb-4">
      <div>
        <h2
          id="quick-practice-heading"
          className="font-jakarta font-extrabold text-xl md:text-2xl text-plum-dark tracking-tight"
        >
          Quick practice
        </h2>
        <p className="font-vietnam text-xs md:text-sm text-plum-muted mt-0.5">
          Focused bite-sized sessions when you have 10 minutes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: 10-minute practice */}
        <div className="bg-white rounded-2xl border border-parchment-border p-5 md:p-6 shadow-warm-sm hover:border-primary/40 hover:shadow-warm-card flex flex-col justify-between transition-all group">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-primary-tint text-primary flex items-center justify-center shrink-0">
              <Timer className="w-[24px] h-[24px]" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-jakarta font-bold text-base md:text-lg text-plum-dark leading-snug">
                10-minute practice
              </h3>
              <p className="font-vietnam text-xs md:text-sm text-plum-muted mt-1.5 leading-relaxed">
                Start a short mixed session tailored to Year {displayYear}.
              </p>
            </div>
          </div>
          <div className="mt-5 pt-3.5 border-t border-parchment-border/60 flex items-center justify-end">
            <Link
              href="/practice/mixed-practice"
              className="h-10 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-jakarta font-bold text-xs md:text-sm flex items-center gap-1.5 transition-all shadow-sm"
            >
              <span>Start 10m run</span>
              <span aria-hidden="true">⚡</span>
            </Link>
          </div>
        </div>

        {/* Card 2: Retry missed questions */}
        <div className="bg-white rounded-2xl border border-parchment-border p-5 md:p-6 shadow-warm-sm hover:border-coral-accent/40 hover:shadow-warm-card flex flex-col justify-between transition-all group">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-coral-light text-coral-accent flex items-center justify-center shrink-0">
              <RefreshCw className="w-[24px] h-[24px]" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-jakarta font-bold text-base md:text-lg text-plum-dark leading-snug">
                Retry missed questions
              </h3>
              <p className="font-vietnam text-xs md:text-sm text-plum-muted mt-1.5 leading-relaxed">
                Practise questions missed recently with hints.
              </p>
            </div>
          </div>
          <div className="mt-5 pt-3.5 border-t border-parchment-border/60 flex items-center justify-end">
            <Link
              href="/practice"
              className="h-10 px-4 rounded-xl bg-coral-accent hover:bg-coral-hover text-white font-jakarta font-bold text-xs md:text-sm flex items-center gap-1.5 transition-all shadow-sm"
            >
              <span>Review &amp; retry</span>
              <span aria-hidden="true">↺</span>
            </Link>
          </div>
        </div>

        {/* Card 3: Challenge me */}
        <div className="bg-white rounded-2xl border border-parchment-border p-5 md:p-6 shadow-warm-sm hover:border-teal-accent/40 hover:shadow-warm-card flex flex-col justify-between transition-all group">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-teal-light text-teal-accent flex items-center justify-center shrink-0">
              <Rocket className="w-[24px] h-[24px]" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-jakarta font-bold text-base md:text-lg text-plum-dark leading-snug">
                Challenge me
              </h3>
              <p className="font-vietnam text-xs md:text-sm text-plum-muted mt-1.5 leading-relaxed">
                Start a harder 5-question problem-solving set.
              </p>
            </div>
          </div>
          <div className="mt-5 pt-3.5 border-t border-parchment-border/60 flex items-center justify-end">
            <Link
              href="/practice?timing=timed"
              className="h-10 px-4 rounded-xl bg-teal-accent hover:bg-teal-accent/90 text-white font-jakarta font-bold text-xs md:text-sm flex items-center gap-1.5 transition-all shadow-sm"
            >
              <span>Take challenge</span>
              <span aria-hidden="true">🚀</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
