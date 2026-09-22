import { FlaskConical } from "lucide-react";

/**
 * "Interactive Visual Lab Spotlight" from the Stitch mock. No interactive
 * fraction-manipulation tool exists in this codebase — entirely
 * placeholder, marked coming-soon rather than a dead "Launch" button.
 */
export function LearningHubLabSpotlight() {
  return (
    <section className="flex flex-col items-center gap-8 rounded-3xl border border-mm-line bg-white p-6 shadow-warm-sm md:flex-row md:p-8">
      <div className="flex max-w-xl flex-col gap-2.5">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
          <FlaskConical aria-hidden="true" className="h-4 w-4" />
          Interactive visual lab spotlight
        </span>
        <h3 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-mm-ink">
          The Fraction Wall &amp; Equi-Angle Gauge
        </h3>
        <p className="text-sm leading-relaxed text-mm-muted">
          Manipulate responsive virtual fraction rods in real time. Drag segments across
          denominators 1 through 12, toggle numeric markers, and observe dynamic simplification
          boundaries with precision readouts.
        </p>
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            title="Interactive lab (coming soon)"
            aria-disabled="true"
            className="flex h-11 cursor-default items-center gap-2 rounded-btn bg-mm-tint px-5 text-[13px] font-semibold text-primary"
          >
            Launch interactive lab
          </button>
          <span className="text-xs text-mm-muted">Not yet available</span>
        </div>
      </div>

      <div className="flex w-full flex-col gap-2 rounded-xl bg-mm-page/70 p-4 md:w-96">
        <div className="flex items-center justify-between text-xs font-semibold text-mm-ink">
          <span>Fraction rod simulator</span>
          <span className="text-primary">Preview</span>
        </div>
        <div className="flex flex-col gap-1.5 pt-1">
          <div className="flex h-6 items-center justify-center rounded bg-primary text-[11px] font-medium text-white">1</div>
          <div className="grid h-6 grid-cols-2 gap-1">
            <div className="flex items-center justify-center rounded bg-primary text-[11px] font-medium text-white">1/2</div>
            <div className="flex items-center justify-center rounded bg-primary text-[11px] font-medium text-white">1/2</div>
          </div>
          <div className="grid h-6 grid-cols-3 gap-1">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex items-center justify-center rounded bg-primary text-[11px] font-medium text-white">
                1/3
              </div>
            ))}
          </div>
          <div className="grid h-6 grid-cols-6 gap-1">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex items-center justify-center rounded bg-teal-accent text-[10px] font-medium text-white">
                1/6
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between pt-1 text-[11px] text-mm-muted">
          <span>Active alignment: 3/6 ≡ 1/2</span>
        </div>
      </div>
    </section>
  );
}
