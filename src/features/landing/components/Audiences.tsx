import { audiences } from "../content";
import { Section } from "./primitives";

/** The student column and the parent column, side by side. */
export function Audiences() {
  return (
    <Section tone="page" labelledBy="audiences-heading">
      <h2
        id="audiences-heading"
        className="mb-[clamp(22px,2.2vw,30px)] max-w-[680px] text-[clamp(28px,3.2vw,44px)] font-bold leading-[1.12] tracking-[-0.03em] text-mm-ink"
      >
        {audiences.heading}
      </h2>

      <div className="grid items-stretch gap-[clamp(20px,2.4vw,32px)] lg:grid-cols-2">
        {audiences.columns.map((column) => {
          const tinted = column.tone === "tint";
          return (
            <div
              key={column.eyebrow}
              className={`flex flex-col justify-between rounded-2xl border p-[clamp(26px,3vw,40px)] shadow-sm ${
                tinted ? "border-mm-line/80 bg-mm-tint/60" : "border-mm-line/80 bg-white"
              }`}
            >
              <div>
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className={`h-[3px] w-5 rounded-sm ${tinted ? "bg-mm-coral" : "bg-mm-brand"}`}
                  />
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-mm-brand">{column.eyebrow}</p>
                </div>

                <h3 className="mt-4 font-display text-[clamp(20px,2vw,24px)] font-bold leading-[1.25] tracking-[-0.02em] text-mm-ink">
                  {column.title}
                </h3>

                <div className="mt-6 grid gap-4">
                  {column.points.map((point) => (
                    <div
                      key={point.title}
                      className="border-t border-mm-line/70 pt-3.5"
                    >
                      <p className="text-[15.5px] font-bold text-mm-ink">{point.title}</p>
                      <p className="mt-1 text-[13.5px] leading-[1.55] text-mm-muted">{point.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
