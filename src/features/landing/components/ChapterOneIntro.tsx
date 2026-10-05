"use client";

import { useRef, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { hero } from "../content";
import { landingMedia, resolveSlotSrc, type MotionPreset } from "../media";
import { useMotionLevel } from "../motion/useMotionLevel";
import { MosaicTransition } from "./MosaicTransition";
import { mmButton, underlineLinkClasses, underlineTransition } from "./primitives";

/** Diamond tones for the value strip: the page's small mosaic fragments. */
const DIAMOND_TONES = ["bg-mm-brand", "bg-mm-coral", "bg-mm-lilac", "bg-mm-brand-mid"] as const;

/**
 * Per-preset image zoom, as scale at chapter progress 0 / settled / handoff.
 * The numbers live here, the choice of preset lives on the media slot.
 */
const IMAGE_MOTION: Record<MotionPreset, { from: number; settled: number; handoff: number }> = {
  "cinematic-zoom": { from: 1.05, settled: 1, handoff: 1.025 },
  still: { from: 1, settled: 1, handoff: 1 },
};

/** The stage pins (sticky) from the `lg` breakpoint up, matching the CSS `lg:` classes below. */
const isPinned = () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(min-width: 1024px)").matches;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const between = (value: number, start: number, end: number) => clamp01((value - start) / (end - start));
const easeInOut = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Stagger for the copy column: 70ms apart, once, on load. */
function rise(index: number): CSSProperties {
  return { "--mm-delay": `${index * 70}ms` } as CSSProperties;
}

/**
 * Chapter 1 of the cinematic landing page: one fixed photograph, the
 * two-line promise, and a hand-off into Chapter 2. This is not a slideshow:
 * the picture never changes, it only breathes with scroll.
 *
 * The photograph comes from the media registry slot
 * `landingMedia.chapter1.intro.primary` (src/features/landing/media.ts), never
 * from a path in this file. Swap it there; see docs/landing-media-guide.md.
 *
 * Structure. From `lg` up the section is a 200svh "story stage" and its inner
 * stage is `sticky` for the first 100svh, so the picture is pinned while the
 * scroll plays. Below `lg` (phones, tablets) nothing is pinned: the picture
 * sits above the copy and the section scrolls normally, because the stacked
 * copy would not fit a short screen. `q` is chapter progress 0 to 1 across
 * the pinned travel (or across the whole section when unpinned).
 *
 * Motion, all transform/opacity, driven by `q`:
 *  - image: scale 1.05 -> 1.00 through the chapter, a slight re-expand at the
 *    hand-off; no pan, no parallax.
 *  - copy: rises in once on load (CSS, staggered), then lifts and fades out
 *    from q 0.5 to 0.78 when pinned.
 *  - mosaic: fragments assemble along the bottom edge (MosaicTransition) as
 *    the chapter hands over to Chapter 2.
 *
 * Reduced motion: no zoom, no scroll-driven transforms, no pinning (the
 * `motion-reduce:` classes), mosaic fully assembled and static. Every word
 * and link is present in all modes; nothing relies on animation to be read.
 */
export function ChapterOneIntro() {
  const slot = landingMedia.chapter1.intro.primary;
  const preset = IMAGE_MOTION[slot.motionPreset];
  const animated = useMotionLevel() !== "off";

  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  // Pinned travel is the first half of the 200svh section; unpinned, it is all of it.
  const q = useTransform(scrollYProgress, (value) => clamp01(value * (isPinned() ? 2 : 1)));

  const imageScale = useTransform(q, (value) =>
    value < 0.85
      ? lerp(preset.from, preset.settled, easeInOut(between(value, 0, 0.7)))
      : lerp(preset.settled, preset.handoff, easeInOut(between(value, 0.85, 1))),
  );
  const copyOpacity = useTransform(q, (value) => (isPinned() ? 1 - easeInOut(between(value, 0.5, 0.78)) : 1));
  const copyLift = useTransform(q, (value) => (isPinned() ? -28 * easeInOut(between(value, 0.5, 0.78)) : 0));

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-heading"
      data-chapter="1"
      className="relative -mt-[var(--mm-header-h)] bg-mm-page lg:h-[200svh] motion-reduce:lg:h-auto"
    >
      <div className="relative isolate flex min-h-svh flex-col overflow-hidden lg:sticky lg:top-0 lg:h-svh lg:min-h-0 motion-reduce:lg:static motion-reduce:lg:min-h-svh">
        {/* The one photograph. Phones/tablets: a top band that fades into the page; lg+: full bleed. */}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 overflow-hidden h-[56svh] min-h-[360px] md:h-[52svh] lg:inset-0 lg:h-full">
          <motion.div
            style={animated ? { scale: imageScale, transformOrigin: slot.focalDesktop } : undefined}
            className="absolute inset-0 will-change-transform"
          >
            <Image
              src={resolveSlotSrc(slot)}
              alt=""
              fill
              sizes="100vw"
              quality={85}
              preload
              style={
                {
                  "--pos-m": slot.focalMobile,
                  "--pos-t": slot.focalTablet,
                  "--pos-d": slot.focalDesktop,
                } as CSSProperties
              }
              className="object-cover [object-position:var(--pos-m)] md:[object-position:var(--pos-t)] lg:[object-position:var(--pos-d)]"
            />
          </motion.div>
          {/* Readability layers: CSS only, never baked into the photograph. */}
          <div className="absolute inset-0 lg:hidden [background:linear-gradient(180deg,rgba(252,251,248,.5)_0%,rgba(252,251,248,0)_22%,rgba(252,251,248,0)_58%,rgba(252,251,248,.88)_88%,#fcfbf8_100%)]" />
          <div className="absolute inset-0 hidden lg:block xl:hidden [background:linear-gradient(90deg,rgba(252,251,248,.98)_0%,rgba(252,251,248,.94)_34%,rgba(252,251,248,.78)_50%,rgba(252,251,248,.35)_62%,transparent_78%)]" />
          <div className="absolute inset-0 hidden xl:block [background:linear-gradient(90deg,rgba(252,251,248,.97)_0%,rgba(252,251,248,.9)_24%,rgba(252,251,248,.62)_38%,rgba(252,251,248,.2)_52%,transparent_66%)]" />
          <div className="absolute inset-x-0 top-0 hidden h-40 lg:block [background:linear-gradient(180deg,rgba(252,251,248,.55),transparent)]" />
        </div>

        <motion.div
          style={animated ? { opacity: copyOpacity, y: copyLift } : undefined}
          className="mm-width relative flex flex-1 flex-col justify-end pb-[clamp(56px,9vh,96px)] pt-[calc(var(--mm-header-h)+min(34svh,300px))] lg:justify-center lg:pb-[clamp(72px,12vh,128px)] lg:pt-[calc(var(--mm-header-h)+2vh)]"
        >
          <div className="max-w-[640px] lg:max-w-[min(50%,740px)] xl:max-w-[min(54%,740px)]">
            <p className="mm-hero-rise m-0 mb-4 flex items-center gap-3" style={rise(0)}>
              <span aria-hidden="true" className="h-[3px] w-[26px] shrink-0 rounded-sm bg-mm-coral" />
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-mm-brand">
                For Australian students
              </span>
            </p>

            <h1
              id="hero-heading"
              className="m-0 text-[clamp(38px,3.9vw,60px)] max-lg:text-[clamp(38px,9.5vw,64px)] leading-[1.02] tracking-[-0.036em] text-mm-ink"
            >
              <span className="mm-hero-rise block" style={rise(1)}>
                {hero.heading}
              </span>
              <span className="mm-hero-rise block text-mm-brand" style={rise(2)}>
                {hero.headingEmphasis}
              </span>
            </h1>

            <p
              className="mm-hero-rise m-0 mt-5 max-w-[46ch] text-pretty text-[clamp(16px,1.35vw,20px)] leading-[1.6] text-mm-ink-soft sm:mt-6"
              style={rise(3)}
            >
              {hero.subheadline}
            </p>

            <div className="mm-hero-rise mt-6 flex flex-wrap gap-3 sm:mt-8" style={rise(4)}>
              <Link href={hero.primaryCta.href} className={mmButton({ size: "lg", className: "px-5 sm:px-7" })}>
                {hero.primaryCta.label}
              </Link>
              <Link
                href={hero.secondaryCta.href}
                className={mmButton({
                  variant: "outline",
                  size: "lg",
                  className:
                    "group/cta border-mm-brand/25 bg-mm-page/70 px-5 text-mm-ink backdrop-blur-[6px] hover:bg-white sm:px-7",
                })}
              >
                {hero.secondaryCta.label}
                <ArrowRight
                  aria-hidden="true"
                  className="h-4 w-4 transition-transform duration-200 group-hover/cta:translate-x-[3px]"
                />
              </Link>
            </div>

            <ul
              className="mm-hero-rise m-0 mt-7 grid max-w-[34rem] list-none grid-cols-2 gap-x-5 gap-y-2.5 p-0 text-[14px] font-medium leading-snug text-mm-ink-soft sm:text-[14.5px]"
              style={rise(5)}
              aria-label="What MindMosaic includes"
            >
              {hero.credibility.map((item, index) => (
                <li key={item} className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className={`h-2 w-2 shrink-0 rotate-45 rounded-[1.5px] ${DIAMOND_TONES[index % DIAMOND_TONES.length]}`}
                  />
                  {item}
                </li>
              ))}
            </ul>

            <p
              className="mm-hero-rise m-0 mt-5 text-[14px] leading-[1.55] text-mm-ink-soft sm:text-[14.5px]"
              style={rise(6)}
            >
              <span aria-hidden="true" className="mr-2.5 inline-block h-2 w-2 rounded-full bg-[#0B6B63] align-[1px]" />
              {hero.availability.text}{" "}
              <Link
                href={hero.availability.link.href}
                style={underlineTransition}
                className={underlineLinkClasses({ tone: "brand", className: "font-semibold text-mm-brand" })}
              >
                {hero.availability.link.label}
              </Link>
            </p>
          </div>
        </motion.div>

        <MosaicTransition progress={animated ? q : null} />
      </div>
    </section>
  );
}
