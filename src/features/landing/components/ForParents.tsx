import Image from "next/image";
import { Check } from "lucide-react";

import { Reveal } from "./Reveal";
import { forParents } from "../content";
import { Eyebrow } from "./primitives";

/**
 * "Clearer support for parents": a reverse split to the programs section —
 * a calm, labelled weekly summary built from the parent view's real
 * structure on one side, the campaign photograph on the other — then the
 * three things a parent can actually do, as a numbered row.
 */
export function ForParents() {
  const { summary } = forParents;

  return (
    <section aria-labelledby="for-parents-heading" className="bg-mm-tint py-[clamp(64px,8vw,120px)]">
      <div className="mm-width">
        <div className="grid items-end gap-5 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-6">
            <Eyebrow rule className="mb-4">
              {forParents.eyebrow}
            </Eyebrow>
            <h2
              id="for-parents-heading"
              className="m-0 text-pretty text-[clamp(28px,3.2vw,44px)] leading-[1.1] tracking-[-0.034em] text-mm-ink"
            >
              {forParents.heading}
            </h2>
          </div>
          <p className="m-0 max-w-[54ch] text-pretty text-[17px] leading-[1.6] text-mm-ink-soft lg:col-span-6">
            {forParents.intro}
          </p>
        </div>

        <div className="mt-[clamp(28px,3.4vw,48px)] grid gap-[clamp(20px,2.4vw,32px)] lg:grid-cols-12 lg:items-stretch">
          <div className="relative overflow-hidden rounded-[clamp(20px,2vw,28px)] bg-mm-tint-line lg:order-2 lg:col-span-7">
            <div className="relative aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[460px]">
              <Image
                src={forParents.image.src}
                alt={forParents.image.alt}
                fill
                sizes="(max-width: 1024px) calc(100vw - 40px), 760px"
                className="object-cover object-[55%_50%]"
              />
            </div>
          </div>

          <article
            aria-label="Sample weekly summary"
            className="flex flex-col gap-5 rounded-[clamp(20px,2vw,28px)] border border-mm-tint-line bg-white p-[clamp(20px,2.4vw,32px)] lg:order-1 lg:col-span-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="m-0 text-[18px] font-semibold text-mm-ink">{summary.name}</p>
                <p className="m-0 mt-0.5 text-sm text-mm-muted">{summary.dateRange}</p>
              </div>
              <span className="rounded-md border border-mm-line px-2 py-[3px] text-xs text-mm-muted">{summary.badge}</span>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {summary.week.map((day) => (
                <div key={day.day} className="flex flex-col items-center gap-1.5 text-xs text-mm-muted">
                  <span
                    className="grid aspect-square w-full max-w-10 place-items-center rounded-[10px] text-white"
                    style={{ background: day.done ? "#0B6B63" : "var(--mm-track)" }}
                  >
                    {day.done && <Check aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  <span aria-hidden="true">{day.day}</span>
                  <span className="sr-only">
                    {day.day}: {day.done ? "practised" : "no session"}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid border-t border-mm-line-soft">
              {summary.rows.map((row) => (
                <div key={row.label} className="flex justify-between gap-3 border-b border-mm-line-soft py-3 text-[15px]">
                  <span className="text-mm-ink-soft">{row.label}</span>
                  <span className="whitespace-nowrap text-mm-muted">
                    <Reveal kind="count" to={row.count} className="tabular-nums">
                      {row.count}
                    </Reveal>{" "}
                    of {row.total} · {row.when}
                  </span>
                </div>
              ))}
            </div>

            <p className="m-0 mt-auto rounded-2xl bg-mm-tint p-4 text-[15px] leading-[1.5] text-mm-ink-soft">
              <strong className="font-semibold text-mm-ink">{summary.nextStepLabel}</strong> {summary.nextStep}
            </p>
          </article>
        </div>

        <ol className="m-0 mt-[clamp(32px,4vw,56px)] grid list-none gap-8 p-0 sm:grid-cols-3 sm:gap-[clamp(20px,3vw,48px)]">
          {forParents.blurbs.map((blurb, index) => (
            <li key={blurb.title} className="grid content-start gap-2 border-t border-mm-tint-line-strong pt-5">
              <span aria-hidden="true" className="text-[13px] font-semibold tabular-nums text-mm-coral-text">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="m-0 text-[19px] font-semibold tracking-[-0.015em] text-mm-ink">{blurb.title}</h3>
              <p className="m-0 max-w-[40ch] text-[15.5px] leading-[1.6] text-mm-ink-soft">{blurb.body}</p>
            </li>
          ))}
        </ol>
        <p className="m-0 mt-8 max-w-[70ch] text-[14.5px] leading-[1.6] text-mm-muted">{forParents.planNote}</p>
      </div>
    </section>
  );
}
