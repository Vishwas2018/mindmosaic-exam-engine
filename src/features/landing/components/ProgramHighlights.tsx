import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Reveal } from "./Reveal";
import { programHighlights } from "../content";
import { ImageSlot, mmButton, Section, SectionHeading } from "./primitives";

const TONE_STYLES: Record<(typeof programHighlights.rows)[number]["tone"], string> = {
  available: "border-transparent bg-[#D9EFEC] text-[#0B6B63]",
  limited: "border-transparent bg-[#FFF1E6] text-[#8A4B12]",
  planned: "border-dashed border-[#B9B1C4] bg-transparent text-mm-muted",
};

/**
 * Public/Home.dc.html section 3, "Find the right program": photo left,
 * a compact status-labelled row list right. Distinct from the full
 * `programmes` catalogue (Programmes.tsx, /learn and /exam-preparation)
 * — see programHighlights' own doc comment in content.ts.
 */
export function ProgramHighlights() {
  return (
    <Section labelledBy="programs-heading">
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-[clamp(32px,5vw,80px)]">
        <Reveal kind="img" className="aspect-[4/5] overflow-hidden rounded-[28px]">
          <ImageSlot
            assetId={programHighlights.image.assetId}
            alt={programHighlights.image.alt}
            focalDesktop="72% 60%"
            className="h-full w-full"
          />
        </Reveal>

        <div className="flex min-w-0 flex-col gap-6">
          <SectionHeading
            id="programs-heading"
            eyebrow={programHighlights.eyebrow}
            title={programHighlights.heading}
            intro={programHighlights.intro}
            className="max-w-[520px]"
          />

          <ul className="m-0 list-none border-t border-mm-line p-0">
            {programHighlights.rows.map((row) => (
              <li key={row.name}>
                <Reveal className="border-b border-mm-line">
                  <Link
                    href={row.href}
                    className="flex min-h-[76px] items-center gap-4 py-3.5 text-mm-ink no-underline transition-transform hover:translate-x-2.5 hover:text-mm-brand"
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="text-lg font-bold tracking-[-0.01em]">{row.name}</span>
                      <span className="text-[14.5px] leading-[1.45] text-mm-muted">{row.meta}</span>
                    </span>
                    <span
                      className={`whitespace-nowrap rounded-lg border px-2.5 py-1 text-[13px] font-semibold ${TONE_STYLES[row.tone]}`}
                    >
                      {row.status}
                    </span>
                    <ArrowRight aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>

          <Link href={programHighlights.primaryCta.href} className={mmButton({ size: "lg", className: "self-start" })}>
            {programHighlights.primaryCta.label}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </Section>
  );
}
