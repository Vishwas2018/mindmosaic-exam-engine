import { firstWeek } from "../content";
import { EmptySlot } from "./primitives";

/**
 * "What happens in a first week" — the five-step list on the How It Works
 * screen, beside a screenshot slot for the parent view after a week.
 */
export function FirstWeek() {
  return (
    <section
      aria-labelledby="first-week-heading"
      className="border-t border-mm-line bg-white py-[clamp(40px,4vw,64px)]"
    >
      <div className="mm-width grid items-start gap-[clamp(24px,3vw,56px)] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div>
          <h2
            id="first-week-heading"
            className="text-[clamp(26px,3vw,40px)] font-bold leading-[1.12] text-mm-ink"
          >
            {firstWeek.heading}
          </h2>
          <p className="mt-3.5 text-[16.5px] leading-[1.6] text-mm-muted">{firstWeek.intro}</p>
          <div className="relative mt-[22px] h-[clamp(220px,22vw,300px)] w-full overflow-hidden rounded-2xl border border-mm-line bg-mm-tint">
            <EmptySlot label={firstWeek.slot} />
          </div>
        </div>

        <ol className="grid gap-0.5">
          {firstWeek.steps.map((step, index) => (
            <li
              key={step.title}
              className="grid grid-cols-[52px_minmax(0,1fr)] gap-[18px] border-b border-mm-line-soft py-5"
            >
              <span
                aria-hidden="true"
                className="grid h-11 w-11 place-items-center rounded-[11px] bg-mm-tint font-[family-name:var(--font-display)] text-base font-extrabold text-mm-brand"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="grid min-w-0 gap-[7px]">
                <h3 className="text-[18.5px] font-bold text-mm-ink">{step.title}</h3>
                <p className="text-[15px] leading-[1.6] text-mm-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
