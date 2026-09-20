import Link from "next/link";
import { ArrowRight, Clock, Gauge, PlayCircle, SlidersHorizontal, Sparkles } from "lucide-react";

import type { StartHereRecommendation } from "../discovery/discovery-recommendations";
import { RadialProgressRing } from "./RadialProgressRing";

/**
 * The progress panel (ring, bar, checkpoint track, "Next up", checkpoint
 * pill) is driven entirely by recommendation.progress /
 * recommendation.estimatedMinutes now — see discovery-recommendations.ts.
 * It renders nothing for unfinished_session/default_activity sources
 * because no honest per-item count exists for those; previously this
 * section showed a fixed fractions example regardless of the real
 * recommendation, which visibly contradicted unrelated subjects (audit
 * finding D-01, e.g. an ICAS Digital Technologies retry rendered next to
 * "Equivalence Model Visualisation: 1/2 = 2/4 = 4/8").
 */
const MAX_CHECKPOINT_SEGMENTS = 12;

export function DashboardHero({ recommendation }: { recommendation: StartHereRecommendation }) {
  const { progress, estimatedMinutes } = recommendation;
  return (
    <section className="relative overflow-hidden rounded-3xl border border-mm-line bg-white p-6 shadow-[0_4px_28px_-6px_rgba(30,11,56,0.07)] lg:p-7">
      <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-mm-tint/60 blur-3xl" />
      <div className="relative z-10 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
        <div className="relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-2xl border border-purple-900/40 bg-gradient-to-br from-plum-dark to-mm-plum p-6 text-white shadow-lg lg:col-span-4">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#d7bafe_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="pointer-events-none absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-primary/40 blur-2xl" />
          <div className="relative z-10 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/10 px-2 py-0.5 font-mono text-[10px] tracking-wide text-primary-tint backdrop-blur-sm">
              {recommendation.tag}
            </span>
          </div>
          <div className="relative z-10 my-4">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary-tint/30 bg-primary/50 shadow-inner backdrop-blur-md">
              <Sparkles aria-hidden="true" className="h-8 w-8 text-white" />
            </div>
            <p className="text-xs leading-snug text-mm-lilac">{recommendation.subtitle}</p>
          </div>
          {/* Placeholder pace/difficulty chips — no adaptive-pacing model yet. */}
          <div className="relative z-10 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/10 px-2 py-1 text-[10px] font-medium text-mm-lilac backdrop-blur-sm">
              <SlidersHorizontal aria-hidden="true" className="h-3 w-3" />
              Adaptive Pace
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/10 px-2 py-1 text-[10px] font-medium text-mm-lilac backdrop-blur-sm">
              <Gauge aria-hidden="true" className="h-3 w-3" />
              Difficulty Level 3
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 py-1 lg:col-span-8">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-mm-muted">
                {recommendation.metaChips.map((chip, index) => (
                  <span key={chip} className="flex items-center gap-2">
                    {index > 0 && <span aria-hidden="true">·</span>}
                    <span className="rounded-md border border-mm-line bg-mm-tint px-2 py-0.5 font-semibold text-primary">
                      {chip}
                    </span>
                  </span>
                ))}
              </div>
              {progress && (
                <span className="rounded-md border border-mm-line bg-mm-page px-2 py-0.5 text-[11px] font-semibold text-mm-muted">
                  {progress.completedLabel}
                </span>
              )}
            </div>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-mm-ink lg:text-2xl">
              {recommendation.title}
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-mm-muted">{recommendation.description}</p>
            {progress?.nextUp && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-mm-muted">
                <PlayCircle aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
                Next up: {progress.nextUp}
              </p>
            )}

            {progress && (
              <div className="grid grid-cols-1 gap-4 rounded-2xl border border-mm-line bg-mm-page/50 p-4 sm:grid-cols-[1fr_auto]">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-mm-muted">
                    <span>Progress</span>
                    <span className="font-mono text-mm-ink">{progress.completedLabel}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-mm-line-soft">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(0, Math.min(100, progress.percent))}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:border-l sm:border-mm-line sm:pl-4">
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
                    <RadialProgressRing percent={progress.percent} size={48} />
                    <span className="absolute font-[family-name:var(--font-display)] text-xs font-bold text-primary">
                      {progress.percent}%
                    </span>
                  </div>
                  <div className="text-[11px] leading-tight text-mm-muted">
                    <p className="font-semibold text-mm-ink">
                      {recommendation.source === "retry_attempt" ? "Score" : "Lesson progress"}
                    </p>
                    <p>{progress.completedLabel}</p>
                  </div>
                </div>
              </div>
            )}

            {progress && progress.total > 1 && progress.total <= MAX_CHECKPOINT_SEGMENTS && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-mm-muted">
                  <span>Sequence Step Checkpoints</span>
                  <span>Stage Progress: {progress.percent}%</span>
                </div>
                <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${progress.total}, minmax(0, 1fr))` }}>
                  {Array.from({ length: progress.total }, (_, index) => index + 1).map((step) => (
                    <div
                      key={step}
                      className={`h-1.5 rounded-full ${
                        step <= progress.completed
                          ? "bg-primary"
                          : step === progress.completed + 1
                            ? "bg-mm-coral-text"
                            : "bg-mm-line-soft"
                      }`}
                      title={`Step ${step}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-2 flex flex-col items-stretch gap-4 border-t border-mm-line pt-4 sm:flex-row sm:items-center">
            <Link
              href={recommendation.href}
              className="flex h-11 items-center justify-center gap-2 rounded-btn bg-primary px-6 text-[13px] font-semibold text-white shadow-[0_4px_14px_rgba(89,37,168,0.28)] transition-all hover:bg-primary-hover active:scale-[0.98]"
            >
              {recommendation.actionLabel}
              <ArrowRight aria-hidden="true" className="h-[17px] w-[17px]" />
            </Link>
            {estimatedMinutes !== undefined && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-mm-muted">
                <Clock aria-hidden="true" className="h-3.5 w-3.5" />
                Estimated time: <span className="font-semibold text-mm-ink">{estimatedMinutes} mins</span>
              </span>
            )}
            <Link
              href="/student/learn"
              className="inline-flex min-h-11 items-center justify-center px-1 text-xs font-semibold text-mm-muted transition-colors hover:text-primary sm:ml-auto"
            >
              Choose another lesson
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
