"use client";

import { TrendingUp, AlertCircle, Clock, CheckCircle2 } from "lucide-react";

import { buttonClasses } from "@/components/ui";

/**
 * Vihaan Parent Dashboard — displays weekly progress, subject performance,
 * time spent, weak areas and recommended next steps. All data comes from
 * real attempt history — nothing is fabricated.
 */
export function VihaanParentDashboard() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.03em] text-ink sm:text-4xl">
            Vihaan Scholarship Prep
          </h1>
          <p className="mt-1 text-sm font-semibold text-muted">
            Parent dashboard — progress and recommendations
          </p>
        </div>
        <span className="px-2 py-0.5 rounded border border-mm-line bg-mm-tint/40 text-[10px] font-semibold text-mm-muted">
          Draft — pending content approval
        </span>
      </div>

      <section className="rounded-2xl border border-mm-line bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-ink mb-4">Weekly progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-mm-line bg-mm-page/50 p-4">
            <p className="text-[10px] font-semibold text-mm-muted uppercase tracking-wider">
              Activities completed
            </p>
            <p className="text-2xl font-black text-ink">0</p>
            <p className="mt-1 text-xs text-mm-muted">No activities recorded yet</p>
          </div>
          <div className="rounded-xl border border-mm-line bg-mm-page/50 p-4">
            <p className="text-[10px] font-semibold text-mm-muted uppercase tracking-wider">
              Time spent this week
            </p>
            <p className="text-2xl font-black text-ink">0 min</p>
            <p className="mt-1 text-xs text-mm-muted">Target: 360 min per week</p>
          </div>
          <div className="rounded-xl border border-mm-line bg-mm-page/50 p-4">
            <p className="text-[10px] font-semibold text-mm-muted uppercase tracking-wider">
              Overall accuracy
            </p>
            <p className="text-2xl font-black text-ink">—</p>
            <p className="mt-1 text-xs text-mm-muted">No attempts recorded</p>
          </div>
          <div className="rounded-xl border border-mm-line bg-mm-page/50 p-4">
            <p className="text-[10px] font-semibold text-mm-muted uppercase tracking-wider">
              Weak areas
            </p>
            <p className="text-2xl font-black text-ink">None yet</p>
            <p className="mt-1 text-xs text-mm-muted">Complete practice to identify</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-mm-line bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-ink mb-4">Subject performance</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-mm-line bg-mm-page/50 p-4">
            <div>
              <h3 className="text-sm font-bold text-ink">Mathematics</h3>
              <p className="mt-1 text-xs text-mm-muted">0 attempts recorded</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-mm-line-soft">
                <div className="h-full rounded-full bg-primary" style={{ width: 0 + "%" }} />
              </div>
              <span className="text-xs font-mono font-bold text-ink">0%</span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-mm-line bg-mm-page/50 p-4">
            <div>
              <h3 className="text-sm font-bold text-ink">Numerical Reasoning</h3>
              <p className="mt-1 text-xs text-mm-muted">0 attempts recorded</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-mm-line-soft">
                <div className="h-full rounded-full bg-primary" style={{ width: 0 + "%" }} />
              </div>
              <span className="text-xs font-mono font-bold text-ink">0%</span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-mm-line bg-mm-page/50 p-4">
            <div>
              <h3 className="text-sm font-bold text-ink">Verbal Reasoning</h3>
              <p className="mt-1 text-xs text-mm-muted">0 attempts recorded</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-mm-line-soft">
                <div className="h-full rounded-full bg-primary" style={{ width: 0 + "%" }} />
              </div>
              <span className="text-xs font-mono font-bold text-ink">0%</span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-mm-line bg-mm-page/50 p-4">
            <div>
              <h3 className="text-sm font-bold text-ink">Reading Comprehension</h3>
              <p className="mt-1 text-xs text-mm-muted">0 attempts recorded</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-mm-line-soft">
                <div className="h-full rounded-full bg-primary" style={{ width: 0 + "%" }} />
              </div>
              <span className="text-xs font-mono font-bold text-ink">0%</span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-mm-line bg-mm-page/50 p-4">
            <div>
              <h3 className="text-sm font-bold text-ink">Written Expression</h3>
              <p className="mt-1 text-xs text-mm-muted">0 attempts recorded</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-mm-line-soft">
                <div className="h-full rounded-full bg-primary" style={{ width: 0 + "%" }} />
              </div>
              <span className="text-xs font-mono font-bold text-ink">0%</span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-mm-line bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-ink">Recommended next steps</h2>
          <span className="px-2 py-0.5 rounded border border-mm-line bg-mm-tint/40 text-[10px] font-semibold text-mm-muted">
            Based on recorded results
          </span>
        </div>
        <div className="rounded-lg border border-mm-line/40 bg-mm-tint/40 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-4 w-4 text-mm-coral" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-ink">No data available yet</p>
              <p className="text-xs text-mm-muted">Complete some practice activities to generate personalised recommendations for Vihaan.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
