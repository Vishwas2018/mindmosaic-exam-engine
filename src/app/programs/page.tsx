import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/features/landing/components/Closing";
import { ImageSlot } from "@/features/landing/components/primitives";
import { ProgramsYearPicker } from "@/features/landing/components/programs/ProgramsYearPicker";
import { SiteNav } from "@/features/landing/components/SiteNav";
import { PLANNED_PATHWAYS, getProgrammeAvailability } from "@/features/landing/programme-status";

export const metadata: Metadata = {
  title: "Programs",
  description:
    "Choose a year level to see what's open for it today — NAPLAN-style, ICAS-style, curriculum lessons and what's still being written.",
};

/**
 * Public/Programs.dc.html. Per-subject availability comes from
 * `getProgrammeAvailability()` — the same readiness walk the exam setup
 * screen runs — not from the mockup's own hardcoded placeholder data,
 * which (checked against the served bank, 1 Oct) already called ICAS
 * Digital Technologies "planned" when the bank has served it for a while.
 */
export default function ProgramsPage() {
  const years = getProgrammeAvailability();

  return (
    <div className="lp-root min-h-screen">
      <SiteNav />
      <main id="main-content" className="mm-width grid gap-10 py-[clamp(32px,5vw,72px)]">
        <div className="grid items-end gap-8 lg:grid-cols-2 lg:gap-16">
          <div className="flex min-w-0 flex-col gap-[18px]">
            <nav aria-label="Breadcrumb" className="flex gap-2 text-sm text-mm-ink-soft">
              <Link href="/" className="text-mm-ink-soft hover:text-mm-brand">
                Home
              </Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">Programs</span>
            </nav>
            <h1 className="text-[clamp(40px,5vw,76px)] font-bold leading-none tracking-[-0.04em] text-mm-ink">
              Programs
            </h1>
            <p className="max-w-[560px] text-pretty text-lg leading-[1.6] text-mm-muted">
              Choose a year level to see current subject availability. Each subject shows
              whether a full paper, reduced practice or no practice is available.
            </p>
          </div>
          <ImageSlot
            assetId="MM-PROGRAMS-01"
            alt="A purple arch, a coral circle and wooden shapes beside an open book"
            aspectRatio="16 / 9"
            className="rounded-[24px]"
          />
        </div>

        <ProgramsYearPicker years={years} />

        <div className="grid gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[clamp(26px,2.6vw,36px)] font-bold tracking-[-0.03em] text-mm-ink">
              Planned pathways
            </h2>
            <p className="text-[15px] text-mm-ink-soft">Being written. Year levels to be confirmed.</p>
          </div>
          <ul className="grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-x-8 border-t border-mm-line p-0 m-0">
            {PLANNED_PATHWAYS.map((pathway) => (
              <li
                key={pathway.name}
                className="flex items-start justify-between gap-4 border-b border-mm-line py-[18px]"
              >
                <span className="grid gap-1">
                  <span className="text-[17px] font-semibold text-mm-ink">{pathway.name}</span>
                  <span className="text-[14.5px] leading-[1.5] text-mm-ink-soft">{pathway.blurb}</span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-dashed border-mm-line-quiet px-2.5 py-1 text-[13px] font-semibold text-mm-quiet">
                  Planned
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="max-w-[880px] text-[13.5px] leading-[1.6] text-mm-muted">
          NAPLAN is a registered trade mark of ACARA; ICAS is a registered trade mark of Janison
          Solutions; the Australian Mathematics Competition is run by the Australian Maths Trust.
          MindMosaic is not affiliated with, endorsed by or connected to any of them.
          &ldquo;-style&rdquo; practice contains original questions written by MindMosaic.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
