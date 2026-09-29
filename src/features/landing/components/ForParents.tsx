import { Check } from "lucide-react";

import { Reveal } from "./Reveal";
import { forParents } from "../content";
import { ImageSlot, Section, SectionHeading } from "./primitives";

/**
 * Public/Home.dc.html section 4, "Clearer support for parents": photo
 * left, an illustrative weekly summary card right, three short blurbs
 * below. Only used on the home page, so it was safe to rebuild in place
 * rather than add a new component.
 */
export function ForParents() {
  const { summary } = forParents;

  return (
    <Section tone="tint" labelledBy="for-parents-heading">
      <SectionHeading
        id="for-parents-heading"
        eyebrow={forParents.eyebrow}
        title={forParents.heading}
        intro={forParents.intro}
        className="max-w-none"
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-stretch">
        <Reveal kind="img" className="aspect-[16/10] overflow-hidden rounded-[28px] lg:aspect-auto">
          <ImageSlot
            assetId={forParents.image.assetId}
            alt={forParents.image.alt}
            focalDesktop="55% 40%"
            className="h-full w-full"
          />
        </Reveal>

        <Reveal className="flex flex-col gap-4 rounded-[28px] border border-mm-line bg-white p-[clamp(20px,2.4vw,32px)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="m-0 text-lg font-bold text-mm-ink">{summary.name}</p>
              <p className="m-0 mt-0.5 text-sm text-mm-muted">{summary.dateRange}</p>
            </div>
            <span className="rounded-lg border border-mm-line px-2 py-[3px] text-xs text-mm-muted">
              {summary.badge}
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {summary.week.map((day) => (
              <div key={day.day} className="flex flex-col items-center gap-1.5 text-xs text-mm-muted">
                <Reveal
                  kind="pop"
                  className="grid aspect-square w-full max-w-10 place-items-center rounded-[10px]"
                >
                  <span
                    className="grid aspect-square w-full place-items-center rounded-[10px] text-white"
                    style={{ background: day.done ? "#0B6B63" : "var(--mm-track)" }}
                  >
                    {day.done && <Check aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                </Reveal>
                <span>{day.day}</span>
                <span className="sr-only">{day.done ? "practised" : "no session"}</span>
              </div>
            ))}
          </div>

          <div className="grid border-t border-mm-line-soft">
            {summary.rows.map((row) => (
              <div
                key={row.label}
                className="flex justify-between gap-3 border-b border-mm-line-soft py-3 text-[15px]"
              >
                <span>{row.label}</span>
                <span className="whitespace-nowrap text-mm-muted">
                  <Reveal kind="count" to={row.count} className="tabular-nums">
                    {row.count}
                  </Reveal>{" "}
                  of {row.total} · {row.when}
                </span>
              </div>
            ))}
          </div>

          <p className="m-0 rounded-2xl bg-mm-tint p-4 text-[15px] leading-[1.5] text-mm-ink-soft">
            <strong className="text-mm-ink">A next step you could suggest:</strong> {summary.nextStep}
          </p>
        </Reveal>
      </div>

      <div className="mt-8 grid gap-8 sm:grid-cols-3">
        {forParents.blurbs.map((blurb) => (
          <Reveal key={blurb.title} className="grid gap-1.5">
            <p className="m-0 text-[17px] font-bold text-mm-ink">{blurb.title}</p>
            <p className="m-0 text-[15.5px] leading-[1.55] text-mm-ink-soft">{blurb.body}</p>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
