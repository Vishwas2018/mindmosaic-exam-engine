import { quality } from "../content";
import { Section, SectionHeading } from "./primitives";

/**
 * The ten review standards, numbered from the array index so the count in
 * the heading and the cards on screen can never disagree.
 *
 * The design fills the second row (items 6-10) solid coral. It sets that
 * row's text to white, which is 3.03:1 on #FF555A and fails AA — the same
 * handoff's own accessibility note says #FF555A is logo-only and that body
 * text meets AA, so the two are in conflict and the note wins. Ink
 * (#18151F) on the same coral is 5.5:1, which keeps the row exactly as
 * striking and actually readable.
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

      <ol className="mt-[clamp(28px,3.5vw,44px)] grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {quality.standards.map((standard, index) => {
          return (
            <li
              key={standard.title}
              className="flex flex-col justify-between rounded-[16px] border border-mm-line/80 bg-white px-5 py-5 shadow-sm transition-all hover:border-mm-brand/40"
            >
              <div>
                <span className="inline-block rounded-md bg-mm-tint px-2 py-0.5 font-display text-xs font-bold text-mm-brand">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="mt-2.5 text-[16px] font-bold text-mm-ink">{standard.title}</p>
                <p className="mt-1.5 text-[13px] leading-[1.55] text-mm-muted">
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
