"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { motionValue, useMotionValue, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { cinematicMotion, pinnedTravelFactor } from "../cinematic/config";
import { HERO_SCENE_COUNT, heroActiveScene, heroSceneAnchor } from "../cinematic/heroScenes";
import { clamp01 } from "../cinematic/math";
import { useMinWidth } from "../cinematic/useMinWidth";
import { hero } from "../content";
import { landingMedia } from "../media";
import { useMotionLevel } from "../motion/useMotionLevel";
import { HeroCaptions, HeroSceneNav } from "./HeroSceneNav";
import { HeroScenePhoto } from "./HeroScenePhoto";
import { HeroStoryList } from "./HeroStoryList";
import { MosaicTransition } from "./MosaicTransition";
import { mmButton, underlineLinkClasses, underlineTransition } from "./primitives";

/** Diamond tones for the value strip: the page's small mosaic fragments. */
const DIAMOND_TONES = ["bg-mm-brand", "bg-mm-coral", "bg-mm-lilac", "bg-mm-brand-mid"] as const;

const timing = cinematicMotion.chapter1;

/** Stagger for the copy column, once, on load. */
function rise(index: number): CSSProperties {
  return { "--mm-delay": `${index * timing.copyStaggerMs}ms` } as CSSProperties;
}

/** The scene indices whose photographs may be mounted while `active` is on screen. */
function photoWindow(active: number): number[] {
  const { ahead, behind } = timing.photoWindow;
  const wanted: number[] = [];
  for (let i = Math.max(0, active - behind); i <= Math.min(HERO_SCENE_COUNT - 1, active + ahead); i += 1) wanted.push(i);
  return wanted;
}

/**
 * Chapter 1 of the cinematic landing page: one full-screen photographic stage that
 * the page scroll walks through six scenes (Learn, Practise, Prepare, Understand,
 * Progress, Explore), then hands off to Chapter 2 through the mosaic.
 *
 * Scroll is the only input. There is no autoplay, timer, wheel handling, snapping or
 * forced scroll position: from `pinnedMinWidth` up the section is tall and its inner
 * stage `sticky`, and every frame is a pure function of chapter progress `q`
 * (cinematic/heroScenes.ts), so scrolling back retraces the same frames. Every number
 * (scene boundaries, cross-fade, camera, photograph window, mosaic) is in
 * `cinematicMotion.chapter1` (cinematic/config.ts).
 *
 * The headline, subheading, CTAs and availability line never change or fade: only the
 * small scene caption and the photograph do. The stage is released by ordinary
 * scrolling, with the headline still on screen, so there is no copy-free stretch.
 *
 * Photographs come from `landingMedia.chapter1.scenes` (media.ts), never from a path in
 * this file, and are decorative (empty alt): the copy carries the meaning. Only scene 1
 * is in the server HTML (with `preload`); the next scenes mount once it has decoded,
 * never all six at once, and a photograph covers its predecessor only after it has
 * loaded and decoded (HeroScenePhoto).
 *
 * Below `pinnedMinWidth`, and under reduced motion, nothing is pinned or animated: the
 * first photograph sits behind the copy and the six scenes follow as a compact list
 * (HeroStoryList). Every word and link is present in all modes.
 */
export function ChapterOneIntro() {
  const slots = landingMedia.chapter1.sceneOrder.map((id) => landingMedia.chapter1.scenes[id]);
  const animated = useMotionLevel() !== "off";
  const pinned = useMinWidth(cinematicMotion.pinnedMinWidth);
  const choreographed = pinned && animated;

  // Scroll transforms read pinned state through a motion value so a viewport
  // resize across the breakpoint re-evaluates them.
  const pinnedValue = useMotionValue(pinned ? 1 : 0);
  useEffect(() => pinnedValue.set(pinned ? 1 : 0), [pinned, pinnedValue]);

  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const travel = pinnedTravelFactor(timing.desktopScrollHeightSvh);
  // Pinned travel is only the first part of the tall section; unpinned, it is all of it.
  const q = useTransform([scrollYProgress, pinnedValue], ([scroll, isPinned]: number[]) =>
    clamp01(scroll! * (isPinned ? travel : 1)),
  );

  const [active, setActive] = useState(0);
  useMotionValueEvent(q, "change", (value) => setActive(heroActiveScene(value)));

  // One readiness value per photograph: 0 until it has loaded and decoded. Scene 1 starts "ready" so the
  // server-rendered picture is visible at once; HeroScenePhoto drops it to 0 if that request fails.
  const ready = useMemo(() => Array.from({ length: HERO_SCENE_COUNT }, (_, i) => motionValue(i === 0 ? 1 : 0)), []);
  const [firstSettled, setFirstSettled] = useState(false);
  const onSettled = useCallback((index: number) => {
    if (index === 0) setFirstSettled(true);
  }, []);

  // Photographs mount around the active scene once scene 1 has decoded (so the first paint never competes with them),
  // or at once if the page opened part-way down (a reload or a link restores the scroll position), and stay mounted.
  const [mounted, setMounted] = useState<ReadonlySet<number>>(() => new Set([0]));
  const wanted = choreographed && (firstSettled || active > 0) ? photoWindow(active) : [];
  if (wanted.some((index) => !mounted.has(index))) setMounted(new Set([...mounted, ...wanted]));

  const scrollToScene = useCallback(
    (index: number) => {
      const section = sectionRef.current;
      if (!section) return;
      const top = section.getBoundingClientRect().top + window.scrollY;
      const target = top + (heroSceneAnchor(index) / travel) * section.offsetHeight;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: target, behavior: reduced ? "auto" : "smooth" });
    },
    [travel],
  );

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-heading"
      data-chapter="1"
      style={{ "--chapter-height": `${timing.desktopScrollHeightSvh}svh` } as CSSProperties}
      className="relative -mt-[var(--mm-header-h)] bg-mm-page lg:h-[var(--chapter-height)] motion-reduce:lg:h-auto"
    >
      <div className="relative isolate flex min-h-svh flex-col overflow-hidden lg:sticky lg:top-0 lg:h-svh lg:min-h-0 motion-reduce:lg:static motion-reduce:lg:min-h-svh">
        {/* The photographic canvas. Phones/tablets: a top band that fades into the page; lg+: full bleed. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 -z-10 h-[56svh] min-h-[360px] overflow-hidden md:h-[52svh] lg:inset-0 lg:h-full"
        >
          {slots.map((slot, index) =>
            mounted.has(index) ? (
              <HeroScenePhoto
                key={hero.scenes[index]!.id}
                index={index}
                slot={slot}
                progress={choreographed ? q : null}
                ready={ready[index]!}
                nextReady={index < HERO_SCENE_COUNT - 1 ? ready[index + 1]! : null}
                hot={Math.abs(active - index) <= 1}
                priority={index === 0}
                onSettled={onSettled}
              />
            ) : null,
          )}
          {/* Readability layers: CSS only, never baked into the photographs. Colours derive from --mm-page. */}
          <div className="absolute inset-0 lg:hidden [background:linear-gradient(180deg,rgb(var(--mm-page-rgb)/.5)_0%,rgb(var(--mm-page-rgb)/0)_22%,rgb(var(--mm-page-rgb)/0)_58%,rgb(var(--mm-page-rgb)/.88)_88%,var(--mm-page)_100%)]" />
          <div className="absolute inset-0 hidden lg:block xl:hidden [background:linear-gradient(90deg,rgb(var(--mm-page-rgb)/.98)_0%,rgb(var(--mm-page-rgb)/.94)_34%,rgb(var(--mm-page-rgb)/.78)_50%,rgb(var(--mm-page-rgb)/.35)_62%,transparent_78%)]" />
          <div className="absolute inset-0 hidden xl:block [background:linear-gradient(90deg,rgb(var(--mm-page-rgb)/.97)_0%,rgb(var(--mm-page-rgb)/.9)_24%,rgb(var(--mm-page-rgb)/.62)_38%,rgb(var(--mm-page-rgb)/.2)_52%,transparent_66%)]" />
          <div className="absolute inset-x-0 top-0 hidden h-40 lg:block [background:linear-gradient(180deg,rgb(var(--mm-page-rgb)/.55),transparent)]" />
        </div>

        <div className="mm-width relative flex flex-1 flex-col justify-end pb-[clamp(56px,9vh,96px)] pt-[calc(var(--mm-header-h)+min(34svh,300px))] lg:justify-center lg:pb-[clamp(110px,17vh,168px)] lg:pt-[calc(var(--mm-header-h)+2vh)]">
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
        </div>

        {/* Scene caption and navigator: the pinned stage only. Phones and reduced motion use the list below. */}
        <div className="mm-width pointer-events-none absolute inset-x-0 bottom-[clamp(44px,7vh,72px)] z-10 hidden flex-col gap-1 lg:flex motion-reduce:lg:hidden">
          <HeroCaptions progress={q} />
          <div className="pointer-events-auto -ml-0.5 w-fit">
            <HeroSceneNav progress={q} active={active} onSelect={scrollToScene} />
          </div>
        </div>

        <MosaicTransition progress={choreographed ? q : null} />
      </div>

      <HeroStoryList className="grid grid-cols-1 sm:grid-cols-2 lg:hidden motion-reduce:lg:grid motion-reduce:lg:grid-cols-3 motion-reduce:xl:grid-cols-6" />
    </section>
  );
}
