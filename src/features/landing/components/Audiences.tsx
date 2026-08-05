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

      <div className="grid items-stretch gap-[clamp(18px,2vw,28px)] lg:grid-cols-2">
        {audiences.columns.map((column) => {
          const tinted = column.tone === "tint";
          return (
            <div
              key={column.eyebrow}
              className={`grid content-start gap-6 rounded-[20px] border p-[clamp(26px,3vw,42px)] ${
                tinted ? "border-mm-tint-line-strong bg-mm-tint" : "border-mm-line bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={`h-[3px] w-[26px] rounded-sm ${tinted ? "bg-mm-coral" : "bg-mm-brand"}`}
                />
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-mm-brand">{column.eyebrow}</p>
              </div>

              <p className="font-display text-[clamp(22px,2.2vw,30px)] font-extrabold leading-[1.2] tracking-[-0.03em] text-mm-ink">
                {column.quote}
              </p>

              <div className="grid gap-4">
                {column.points.map((point) => (
                  <div
                    key={point.title}
                    className={`border-t pt-4 ${tinted ? "border-mm-tint-line-strong" : "border-mm-line"}`}
                  >
                    <p className="text-[16.5px] font-bold text-mm-ink">{point.title}</p>
                    <p className="mt-1.5 text-[14.5px] leading-[1.55] text-mm-muted">{point.body}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
