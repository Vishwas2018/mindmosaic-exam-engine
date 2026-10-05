"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { cinematicMotion, pinnedTravelFactor } from "../cinematic/config";
import { between, clamp01, easeInOut, lerp } from "../cinematic/math";
import { useMinWidth } from "../cinematic/useMinWidth";
import { hero } from "../content";
import { landingMedia, resolveSlotSrc } from "../media";
import { useMotionLevel } from "../motion/useMotionLevel";
import { MosaicTransition } from "./MosaicTransition";
import { mmButton, underlineLinkClasses, underlineTransition } from "./primitives";

/** Diamond tones for the value strip: the page's small mosaic fragments. */
const DIAMOND_TONES = ["bg-mm-brand", "bg-mm-coral", "bg-mm-lilac", "bg-mm-brand-mid"] as const;

const timing = cinematicMotion.chapter1;

/** Stagger for the copy column, once, on load. */
function rise(index: number): CSSProperties {
  return { "--mm-delay": `${index * timing.copyStaggerMs}ms` } as CSSProperties;
}

/**
 * Chapter 1 of the cinematic landing page: one fixed photograph, the
 * two-line promise, and a hand-off into Chapter 2. This is not a slideshow:
 * the picture never changes, it only breathes with scroll.
 *
 * The photograph comes from the media registry slot
 * `landingMedia.chapter1.intro.primary` (src/features/landing/media.ts), never
 * from a path in this file. It is decorative (empty alt): the headline and
 * copy beside it carry the meaning. Swap it in the registry; see
 * docs/landing-media-guide.md.
 *
 * All timing, zoom and pin numbers live in cinematic/config.ts so later
 * chapters reuse them. From `pinnedMinWidth` up the section is a tall "story
 * stage" whose inner stage is `sticky`, so the picture is pinned while the
 * scroll plays. Below it (phones, tablets) nothing is pinned: the picture sits
 * above the copy and the section scrolls normally, because the stacked copy
 * would not fit a short screen. `q` is chapter progress 0..1.
 *
 * Motion, all transform/opacity, driven by `q`: image zoom (heroBreath), copy
 * entrance on load then exit near the hand-off (pinned only), and the mosaic
 * assembling along the bottom edge (MosaicTransition).
 *
 * Reduced motion: no zoom, no scroll-driven transforms, no pinning (the
 * `motion-reduce:` classes), mosaic fully assembled and static. Every word
 * and link is present in all modes; nothing relies on animation to be read.
 */
export function ChapterOneIntro() {
  const slot = landingMedia.chapter1.intro.primary;
  const zoom = cinematicMotion.presets[slot.motionPreset];
  const animated = useMotionLevel() !== "off";
  const pinned = useMinWidth(cinematicMotion.pinnedMinWidth);
  // Scroll transforms read pinned state through a motion value so a viewport
  // resize across the breakpoint re-evaluates them.
  const pinnedValue = useMotionValue(pinned ? 1 : 0);
  useEffect(() => pinnedValue.set(pinned ? 1 : 0), [pinned, pinnedValue]);

  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  // Pinned travel is only the first part of the tall section; unpinned, it is all of it.
  const q = useTransform([scrollYProgress, pinnedValue], ([scroll, isPinned]: number[]) =>
    clamp01(scroll! * (isPinned ? pinnedTravelFactor(timing.desktopScrollHeightSvh) : 1)),
  );

  const { imageSettle, imageHandoff, copyExit } = timing;
  const imageScale = useTransform(q, (value) =>
    value < imageHandoff.start
      ? lerp(zoom.fromScale, zoom.settledScale, easeInOut(between(value, imageSettle.start, imageSettle.end)))
      : lerp(zoom.settledScale, zoom.handoffScale, easeInOut(between(value, imageHandoff.start, imageHandoff.end))),
  );
  const copyExitProgress = useTransform([q, pinnedValue], ([value, isPinned]: number[]) =>
    isPinned ? easeInOut(between(value!, copyExit.start, copyExit.end)) : 0,
  );
  const copyOpacity = useTransform(copyExitProgress, (value) => 1 - value);
  const copyLift = useTransform(copyExitProgress, (value) => -timing.copyLiftPx * value);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-heading"
      data-chapter="1"
      style={{ "--chapter-height": `${timing.desktopScrollHeightSvh}svh` } as CSSProperties}
      className="relative -mt-[var(--mm-header-h)] bg-mm-page lg:h-[var(--chapter-height)] motion-reduce:lg:h-auto"
    >
      <div className="relative isolate flex min-h-svh flex-col overflow-hidden lg:sticky lg:top-0 lg:h-svh lg:min-h-0 motion-reduce:lg:static motion-reduce:lg:min-h-svh">
        {/* The one photograph. Phones/tablets: a top band that fades into the page; lg+: full bleed. */}
        <div
          aria-hidden={slot.decorative ? "true" : undefined}
          className="absolute inset-x-0 top-0 -z-10 h-[56svh] min-h-[360px] overflow-hidden md:h-[52svh] lg:inset-0 lg:h-full"
        >
          <motion.div
            style={animated ? { scale: imageScale, transformOrigin: slot.focalDesktop } : undefined}
            className="absolute inset-0 will-change-transform"
          >
            <Image
              src={resolveSlotSrc(slot)}
              alt={slot.alt}
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
          {/* Readability layers: CSS only, never baked into the photograph. Colours derive from --mm-page. */}
          <div className="absolute inset-0 lg:hidden [background:linear-gradient(180deg,rgb(var(--mm-page-rgb)/.5)_0%,rgb(var(--mm-page-rgb)/0)_22%,rgb(var(--mm-page-rgb)/0)_58%,rgb(var(--mm-page-rgb)/.88)_88%,var(--mm-page)_100%)]" />
          <div className="absolute inset-0 hidden lg:block xl:hidden [background:linear-gradient(90deg,rgb(var(--mm-page-rgb)/.98)_0%,rgb(var(--mm-page-rgb)/.94)_34%,rgb(var(--mm-page-rgb)/.78)_50%,rgb(var(--mm-page-rgb)/.35)_62%,transparent_78%)]" />
          <div className="absolute inset-0 hidden xl:block [background:linear-gradient(90deg,rgb(var(--mm-page-rgb)/.97)_0%,rgb(var(--mm-page-rgb)/.9)_24%,rgb(var(--mm-page-rgb)/.62)_38%,rgb(var(--mm-page-rgb)/.2)_52%,transparent_66%)]" />
          <div className="absolute inset-x-0 top-0 hidden h-40 lg:block [background:linear-gradient(180deg,rgb(var(--mm-page-rgb)/.55),transparent)]" />
        </div>

        <motion.div
          style={animated ? { opacity: copyOpacity, y: copyLift } : undefined}
          className="mm-width relative flex flex-1 flex-col justify-end pb-[clamp(56px,9vh,96px)] pt-[calc(var(--mm-header-h)+min(34svh,300px))] lg:justify-center lg:pb-[clamp(72px,12vh,128px)] lg:pt-[calc(var(--mm-header-h)+2vh)]"
        >
          <div className="max-w-[640px] lg:max-w-[min(50%,740px)] xl:max-w-[min(54%,740px)]">
            <p className="mm-hero-rise m-0 mb-4 flex items-center gap-3" style={rise(0)}>
              <span aria-hidden="true" className="h-[3px] w-[26px] shrink-0 rounded-sm bg-mm-coral" />
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-mm-brand">For Australian students</span>
            </p>

            <h1
              id="hero-heading"
              className="m-0 text-[clamp(38px,3.9vw,60px)] leading-[1.02] tracking-[-0.036em] text-mm-ink max-lg:text-[clamp(38px,9.5vw,64px)]"
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
              <span aria-hidden="true" className="mr-2.5 inline-block h-2 w-2 rounded-full bg-mm-positive align-[1px]" />
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
