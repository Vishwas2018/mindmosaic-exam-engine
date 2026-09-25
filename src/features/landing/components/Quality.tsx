import { quality } from "../content";
import { Section, SectionHeading } from "./primitives";

/**
 * The four quality and pedagogical pillars.
 */
export function Quality() {
  return (
    <Section tone="tint" labelledBy="quality-heading">
      <SectionHeading
        id="quality-heading"
        eyebrow={quality.eyebrow}
        title={quality.heading}
        intro={quality.intro}
        className="max-w-[720px]"
      />

      <ol className="mt-[clamp(28px,3.5vw,44px)] grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        {quality.standards.map((standard, index) => {
          return (
            <li
              key={standard.title}
              className="flex flex-col justify-between rounded-2xl border border-mm-line/80 bg-white p-6 shadow-sm transition-all hover:border-mm-brand/40"
            >
              <div>
                <span className="inline-block rounded-md bg-mm-tint px-2.5 py-1 font-display text-xs font-bold text-mm-brand">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-[18px] font-bold tracking-[-0.015em] text-mm-ink">{standard.title}</h3>
                <p className="mt-2 text-[14.5px] leading-[1.6] text-mm-muted">
                  {standard.body}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
