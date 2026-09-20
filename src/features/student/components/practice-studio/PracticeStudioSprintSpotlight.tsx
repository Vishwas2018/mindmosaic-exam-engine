import { Flag, PlayCircle, Timer } from "lucide-react";

/**
 * "Daily Speed Sprint" from the Stitch mock — a calibrated 60-second
 * rapid-recall session with a personal-best record and a streak counter.
 * None of that exists in this codebase (no timed-sprint mode, no per-drill
 * personal-best tracking), so the whole card is a self-contained
 * illustrative preview rather than a partially-real destination — see the
 * dashboard audit's D-01 finding on why a real destination behind
 * fictional session mechanics is worse than an honest coming-soon.
 */
export function PracticeStudioSprintSpotlight() {
  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-mm-line bg-white p-6 shadow-warm-sm md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-mm-tint px-2.5 py-0.5 text-[11px] font-semibold text-primary">
          <Timer aria-hidden="true" className="h-3.5 w-3.5" />
          Speed sprint engine · Preview
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-mm-muted">
          <Flag aria-hidden="true" className="h-3.5 w-3.5" />
          Example: daily target 1 of 2 completed
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-mm-ink">
          Daily Speed Sprint — Rapid Recall 60s
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-mm-muted">
          Quick-fire arithmetic battery: 15 questions calibrated for high-pressure recall.
          Emphasising rapid division with remainders and decimal tenths place values.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Sprint time", value: "60 seconds" },
          { label: "Target velocity", value: "4.0s / task" },
          { label: "Best (example)", value: "14 / 15" },
          { label: "Streak (example)", value: "2 of 3 sprints" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl bg-mm-page/70 p-3">
            <p className="font-[family-name:var(--font-display)] text-sm font-bold text-mm-ink">{stat.value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-mm-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          title="Daily Speed Sprint (coming soon)"
          aria-disabled="true"
          className="inline-flex h-11 cursor-default items-center gap-2 rounded-btn bg-mm-tint px-5 text-[13px] font-semibold text-primary"
        >
          <PlayCircle aria-hidden="true" className="h-[17px] w-[17px]" />
          Start daily sprint
        </button>
        <span className="text-xs text-mm-muted">Not yet available</span>
      </div>
    </section>
  );
}
