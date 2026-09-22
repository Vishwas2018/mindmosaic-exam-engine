import { Award, Target } from "lucide-react";

import type { SubjectMastery } from "@/features/student/attempt-summary";

/**
 * Top stat row for the Stitch-ported My Progress page. Questions-answered
 * is a real sum over attempt history; "Current focus" is the real weakest
 * subject (overview.recommendedFocus) rather than the mock's fixed
 * "Fractions & Decimals · Checkpoint 2 of 4" example — this codebase has
 * no per-checkpoint tracking within a subject. The assessment-readiness
 * target window is a literal Stitch placeholder: no test-calendar model
 * exists (same class as the dashboard's term/goal pills).
 */
export function MyProgressHero({
  yearLevel,
  questionsAnswered,
  recommendedFocus,
}: {
  yearLevel: number | null;
  questionsAnswered: number;
  recommendedFocus: SubjectMastery | null;
}) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="flex items-center gap-3 rounded-2xl border border-mm-line bg-white p-5 shadow-warm-sm">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mm-tint text-primary">
          <Award aria-hidden="true" className="h-5 w-5" />
        </div>
        <div>
          <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-mm-ink">
            {questionsAnswered}
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-mm-muted">
            Questions answered
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-mm-line bg-white p-5 shadow-warm-sm">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mm-tint text-primary">
          <Target aria-hidden="true" className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-mm-ink">
            {recommendedFocus ? recommendedFocus.label : "Nothing measured yet"}
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-mm-muted">
            {recommendedFocus ? `Current focus · ${recommendedFocus.percent}% mastery` : "Current focus"}
          </p>
        </div>
      </div>

      {/* Placeholder — no test-calendar/target-window model exists. */}
      <div className="flex items-center gap-3 rounded-2xl border border-mm-line bg-white p-5 shadow-warm-sm">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-light text-amber-accent">
          <Award aria-hidden="true" className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-mm-ink">
            {yearLevel !== null ? `NAPLAN Year ${yearLevel}` : "NAPLAN"}
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-mm-muted">
            Target window: May testing cycle
          </p>
        </div>
      </div>
    </section>
  );
}
