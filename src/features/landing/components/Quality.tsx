import { clsx } from "clsx";

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

      <ol className="mt-[clamp(32px,4vw,52px)] grid gap-px overflow-hidden rounded-2xl border border-mm-tint-line-strong bg-mm-tint-line-strong sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {quality.standards.map((standard, index) => {
          const coral = index > 4;
          return (
            <li
              key={standard.title}
              className={clsx("px-[22px] py-[26px]", coral ? "bg-mm-coral" : "bg-white")}
            >
              {/*
                Full-opacity ink on coral, never a faded --mm-ink/NN. Ink at
                100% is 5.75:1 on #FF555A; the /70 this replaced measured
                2.13:1 and the /85 measured 3.68:1, both below AA and both
                reported by axe as serious (6 nodes across this section at
                320-1024px). Audit finding H-04.
              */}
              <p
                className={clsx(
                  "font-display text-[13px] font-extrabold",
                  coral ? "text-mm-ink" : "text-mm-brand",
                )}
              >
                {String(index + 1).padStart(2, "0")}
              </p>
              <p className="mt-2.5 text-[17px] font-bold text-mm-ink">{standard.title}</p>
              <p
                className={clsx(
                  "mt-[7px] text-sm leading-[1.55]",
                  coral ? "text-mm-ink" : "text-mm-muted",
                )}
              >
                {standard.body}
              </p>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
