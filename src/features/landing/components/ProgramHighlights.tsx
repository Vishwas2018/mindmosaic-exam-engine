import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, ClipboardList, Mountain, Trophy, type LucideIcon } from "lucide-react";

import { programHighlights } from "../content";
import { Eyebrow, mmButton } from "./primitives";

type Row = (typeof programHighlights.rows)[number];

const ICONS: Record<Row["icon"], LucideIcon> = {
  naplan: ClipboardList,
  icas: Trophy,
  curriculum: BookOpen,
  advanced: Mountain,
};

/** Status is always a word; colour only reinforces it. */
const TONE_STYLES: Record<Row["tone"], string> = {
  available: "border-transparent bg-[#D9EFEC] text-[#0B6B63]",
  limited: "border-transparent bg-[#FFF1E6] text-[#8A4B12]",
  planned: "border-dashed border-[#B9B1C4] bg-transparent text-mm-muted",
};

/**
 * "Find the right program": an editorial split — the campaign photograph
 * on one side, a quiet list of four pathways on the other. Each row is one
 * link; hover and focus tint the row and nudge the arrow 4px, nothing
 * scales. The photo is photography only (no screen content, no program
 * cards): every program and its status comes from the HTML list, so the
 * image can never disagree with it. Below `lg` the image leads and the list follows full width.
 */
export function ProgramHighlights() {
  return (
    <section aria-labelledby="programs-heading" className="bg-mm-page py-[clamp(64px,8vw,120px)]">
      <div className="mm-width">
        <div className="grid items-end gap-5 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <Eyebrow rule className="mb-4">
              {programHighlights.eyebrow}
            </Eyebrow>
            <h2
              id="programs-heading"
              className="m-0 text-pretty text-[clamp(28px,3.2vw,44px)] leading-[1.1] tracking-[-0.034em] text-mm-ink"
            >
              {programHighlights.heading}
            </h2>
          </div>
          <p className="m-0 max-w-[50ch] text-pretty text-[17px] leading-[1.6] text-mm-ink-soft lg:col-span-5">
            {programHighlights.intro}
          </p>
        </div>

        <div className="mt-[clamp(28px,3.4vw,48px)] grid gap-[clamp(24px,3vw,48px)] lg:grid-cols-12 lg:items-stretch">
          <div className="relative min-h-0 self-start overflow-hidden rounded-[clamp(20px,2vw,28px)] bg-mm-tint lg:sticky lg:top-[112px] lg:col-span-6">
            <div className="relative aspect-[4/3]">
              <Image
                src={programHighlights.image.src}
                alt={programHighlights.image.alt}
                fill
                sizes="(max-width: 1024px) calc(100vw - 40px), 640px"
                className="object-cover object-[50%_12%]"
              />
            </div>
          </div>

          <div className="flex min-w-0 flex-col lg:col-span-6">
            <ul className="m-0 list-none border-t border-mm-line p-0">
              {programHighlights.rows.map((row) => {
                const Icon = ICONS[row.icon];
                return (
                  <li key={row.id} className="border-b border-mm-line">
                    <Link
                      href={row.href}
                      className="group -mx-3 flex items-start gap-4 rounded-2xl px-3 py-5 text-mm-ink no-underline transition-colors duration-200 hover:bg-mm-tint-soft focus-visible:bg-mm-tint-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/30 sm:gap-5"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-mm-tint-line bg-white text-mm-brand transition-colors duration-200 group-hover:border-mm-tint-line-strong"
                      >
                        <Icon className="h-[21px] w-[21px]" strokeWidth={1.75} />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                          <span className="text-[18px] font-semibold tracking-[-0.015em] transition-colors duration-200 group-hover:text-mm-brand">
                            {row.name}
                          </span>
                          <span
                            className={`whitespace-nowrap rounded-md border px-2 py-0.5 text-[12.5px] font-semibold ${TONE_STYLES[row.tone]}`}
                          >
                            {row.status}
                          </span>
                        </span>
                        <span className="text-pretty text-[15.5px] leading-[1.55] text-mm-ink-soft">{row.body}</span>
                        <span className="text-[14px] text-mm-muted">{row.meta}</span>
                      </span>
                      <ArrowRight
                        aria-hidden="true"
                        className="mt-3 h-[18px] w-[18px] shrink-0 text-mm-brand transition-transform duration-200 group-hover:translate-x-1 group-focus-visible:translate-x-1"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>

            <Link
              href={programHighlights.primaryCta.href}
              className={mmButton({ size: "lg", className: "mt-8 self-start" })}
            >
              {programHighlights.primaryCta.label}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
