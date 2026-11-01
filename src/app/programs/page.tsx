import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/features/landing/components/Closing";
import { ImageSlot } from "@/features/landing/components/primitives";
import { ProgramsYearPicker } from "@/features/landing/components/programs/ProgramsYearPicker";
import { Reveal } from "@/features/landing/components/Reveal";
import { SiteNav } from "@/features/landing/components/SiteNav";
import {
  Eyebrow,
  Section,
  SectionHeading,
  MosaicRule,
  mmButton,
} from "@/features/landing/components/primitives";
import { PLANNED_PATHWAYS, getProgrammeAvailability } from "@/features/landing/programme-status";
import { routes } from "@/features/landing/content";

export const metadata: Metadata = {
  title: "Programs",
  description:
    "Choose a year level to see what's open for it today — NAPLAN-style and ICAS-style practice for Years 3 and 5 is open now; other pathways are in development. Availability is based on checked questions, not guaranteed full-length sets.",
};

export default function ProgramsPage() {
  const years = getProgrammeAvailability();

  return (
    <div className="lp-root min-h-screen">
      <SiteNav />
      <main id="main-content">
        {/* ---------- Editorial hero ---------- */}
        <section
          id="hero"
          aria-labelledby="hero-heading"
          className="bg-mm-page border-b border-mm-line py-[clamp(40px,4vw,64px)]"
        >
          <div className="mm-width">
            <div className="grid items-center gap-[clamp(24px,4vw,64px)] lg:grid-cols-2 lg:gap-16">
              <div className="min-w-0">
                <Reveal kind="up" delayMs={0}>
                  <div className="flex flex-col gap-4">
                    <Eyebrow>Programs</Eyebrow>
                    <h1
                      id="hero-heading"
                      className="text-[clamp(40px,5vw,76px)] font-bold leading-none tracking-[-0.04em] text-mm-ink"
                    >
                      Programs
                    </h1>
                    <p className="max-w-[560px] text-pretty text-lg leading-[1.6] text-mm-muted">
                      Choose a year level to see what&apos;s open for it today. NAPLAN-style and
                      ICAS-style practice is available now for Years 3 and 5; other pathways are in
                      development.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                      <Link
                        href="#open-now"
                        className={mmButton({ size: "lg" })}
                      >
                        Explore available programmes
                      </Link>
                      <Link
                        href="#coming-next"
                        className={mmButton({ variant: "outline", size: "lg" })}
                      >
                        See upcoming pathways
                      </Link>
                    </div>
                    <p className="mt-6 max-w-[540px] text-[14px] leading-[1.6] text-mm-muted">
                      A program is listed as available once enough checked questions exist to run a
                      set — some sets may be shortened.
                    </p>
                  </div>
                </Reveal>

                <Reveal kind="up" delayMs={160}>
                  <div className="mt-10 flex items-center gap-3 text-mm-ink-soft">
                    <span aria-hidden="true" className="h-[3px] w-[26px] shrink-0 rounded-sm bg-mm-coral" />
                    <span className="text-[14px] font-semibold">
                      Years 3 and 5 are open now
                    </span>
                  </div>
                </Reveal>
              </div>

              <div className="min-w-0">
                <Reveal kind="img" delayMs={80}>
                  <ImageSlot
                    assetId="MM-PROGRAMS-01"
                    src="/landing/campaign/programs-hands-laptop.webp"
                    alt="A learner&rsquo;s hands at a laptop with study materials nearby"
                    aspectRatio="16 / 9"
                    priority
                    className="rounded-[24px] shadow-[0_18px_50px_rgba(49,32,86,0.10)]"
                  />
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Open now: year-level discovery ---------- */}
        <Section
          id="open-now"
          className="scroll-mt-[96px]"
          tone="white"
          labelledBy="open-now-heading"
        >
          <SectionHeading
            id="open-now-heading"
            eyebrow="Open now"
            title="Choose a year level"
            intro="NAPLAN-style and ICAS-style practice sets are ready for Year 3 and Year 5. Pick a year to see which subjects are open, then view a programme."
          />
          <ProgramsYearPicker years={years} />
        </Section>

        {/* ---------- Coming next: planned pathways ---------- */}
        <Section
          id="coming-next"
          className="scroll-mt-[96px]"
          tone="page"
          labelledBy="coming-next-heading"
        >
          <SectionHeading
            id="coming-next-heading"
            eyebrow="Coming next"
            title="Pathways in development"
            intro="These programmes are being written and checked. They have no release date yet, and none are shown as available."
          />
          <div className="mt-10 grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-6">
              {PLANNED_PATHWAYS.map((pathway) => (
                <Reveal key={pathway.name} kind="up" delayMs={60}>
                  <article className="rounded-[20px] border border-mm-line bg-white p-[clamp(20px,2.4vw,28px)]">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="text-xl font-bold tracking-[-0.015em] text-mm-ink">
                        {pathway.name}
                      </h3>
                      <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-dashed border-mm-line-quiet px-2.5 py-1 text-[12.5px] font-semibold text-mm-quiet">
                        Planned
                      </span>
                    </div>
                    <p className="text-[15px] leading-[1.55] text-mm-ink-soft">
                      {pathway.blurb}
                    </p>
                    <p className="mt-auto text-[13px] text-mm-muted">
                      Year levels to be confirmed &mdash; no date yet.
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
            <div className="mt-[clamp(32px,4vw,64px)] flex justify-center">
              <MosaicRule
                tiles={["brand", "coral", "lilac", "quiet", "brand", "coral"]}
                className="w-[clamp(180px,20vw,360px)] h-[clamp(16px,2vw,26px)] gap-2"
              />
            </div>
        </Section>

        {/* ---------- Closing CTA ---------- */}
        <section className="bg-mm-tint border-t border-mm-line">
          <div className="mm-width py-[clamp(40px,4vw,64px)]">
            <div className="grid items-center gap-[clamp(24px,4vw,64px)] lg:grid-cols-2 lg:gap-16 text-center lg:text-left">
              <div className="min-w-0 mx-auto lg:mx-0">
                <h2
                  className="text-pretty text-[clamp(30px,3.6vw,48px)] font-bold leading-[1.08] tracking-[-0.035em] text-mm-ink"
                >
                  Ready to start?
                </h2>
                <p className="mt-5 max-w-[520px] text-[17px] leading-[1.6] text-mm-muted">
                  Guest practice is free and needs no account or card. An account is what saves
                  progress across sessions.
                </p>
                <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-3">
                  <Link href={routes.startFree} className={mmButton({ size: "lg" })}>
                    Start free
                  </Link>
                  <Link
                    href={routes.pricing}
                    className={mmButton({ variant: "outline", size: "lg" })}
                  >
                    See plans
                  </Link>
                </div>
              </div>
              <div className="min-w-0 hidden lg:block">
                <ImageSlot
                  assetId="MM-PROGRAMS-02"
                  src="/landing/subject-card/card-girl-reading-book.webp"
                  alt="A student reading independently"
                  aspectRatio="4 / 3"
                  className="rounded-[20px]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Disclaimer ---------- */}
        <p className="mm-width max-w-[880px] mx-auto mt-[clamp(32px,4vw,64px)] mb-10 text-[13.5px] leading-[1.6] text-mm-muted">
          NAPLAN is a registered trade mark of ACARA; ICAS is a registered trade mark of Janison
          Solutions; the Australian Mathematics Competition is run by the Australian Maths Trust.
          MindMosaic is not affiliated with, endorsed by or connected to any of them. &ldquo;-style&rdquo;
          practice contains original questions written by MindMosaic.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
