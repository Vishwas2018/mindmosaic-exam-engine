import { TrendingUp } from "lucide-react";

import type { SubjectMastery } from "@/features/student/attempt-summary";

/**
 * "Weekly Drill Accuracy" from the Stitch mock, real: the overall figure
 * is the same average of `overview.mastery` Exam Centre's hero tile uses,
 * and the subject rows are real per-subject mastery — not the mock's two
 * fixed categories ("Mental Arithmetic 94%", "Fractions & Decimals 72%"),
 * which don't correspond to a tracked dimension in this codebase. There is
 * no cycle-over-cycle comparison ("+6% vs last cycle") anywhere, so that
 * framing is dropped rather than faked.
 */
export function PracticeStudioAccuracyCard({ mastery }: { mastery: readonly SubjectMastery[] }) {
  if (mastery.length === 0) return null;

  const average = Math.round(mastery.reduce((sum, m) => sum + m.percent, 0) / mastery.length);
  const top = [...mastery].sort((a, b) => b.percent - a.percent).slice(0, 3);

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-mm-line bg-white p-6 shadow-warm-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-mm-tint text-primary">
          <TrendingUp aria-hidden="true" className="h-5 w-5" />
        </div>
        <div>
          <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-mm-ink">{average}%</p>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-mm-muted">
            Average accuracy across subjects
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {top.map((subject) => (
          <div key={subject.subject} className="rounded-xl bg-mm-page/60 p-3">
            <p className="text-sm font-bold text-mm-ink">{subject.percent}%</p>
            <p className="text-xs text-mm-muted">{subject.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
