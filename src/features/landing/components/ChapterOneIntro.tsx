"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useMotionValue, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { cinematicMotion, pinnedTravelFactor } from "../cinematic/config";
import {
  HERO_SCENE_COUNT,
  heroActiveScene,
  heroClock,
  heroCopyState,
  heroLayerVisible,
  heroNavFill,
  heroSceneAnchor,
  heroSceneCover,
  heroTiles,
  heroTileState,
  type HeroTileTone,
} from "../cinematic/heroScenes";
import { clamp01 } from "../cinematic/math";
import { useMinWidth } from "../cinematic/useMinWidth";
import { hero } from "../content";
import { heroScenePreviews } from "../hero-previews";
import { HERO_SCENE_IDS, landingMedia } from "../media";
import { useMotionLevel } from "../motion/useMotionLevel";
import { HeroSceneNav } from "./HeroSceneNav";
import { HeroScenePhoto } from "./HeroScenePhoto";
import { HeroStoryList } from "./HeroStoryList";
import { mmButton, underlineLinkClasses, underlineTransition } from "./primitives";

/** Diamond tones for the value strip: the page's small mosaic fragments. */
const DIAMOND_TONES = ["bg-mm-brand", "bg-mm-coral", "bg-mm-lilac", "bg-mm-brand-mid"] as const;

const TILE_TONES: Record<HeroTileTone, string> = {
  coral: "bg-mm-coral",
  brand: "bg-mm-brand",
  lilac: "bg-mm-lilac",
  wash: "bg-mm-wash",
};

const timing = cinematicMotion.chapter1;

/** Stagger for the persistent copy column, once, on load. */
function rise(index: number): CSSProperties {
  return { "--mm-delay": `${index * timing.copyStaggerMs}ms` } as CSSProperties;
}

/** The scenes whose full photographs may be mounted while `active` is on screen, most urgent first. */
function photoWindow(active: number): number[] {
  const order = [active];
  for (let step = 1; step <= timing.photoLookahead; step += 1) order.push(active + step);
  order.push(active - 1);
  return order.filter((index) => index >= 0 && index < HERO_SCENE_COUNT);
}

/**
 * Photographs are requested one at a time: a scene is added only once every photograph already asked
 * for has settled (decoded, or failed). Browsers hold a handful of connections per host, so several
 * large images in flight at once would queue the page's own navigations behind them on a slow link.
 */
function nextToMount(order: number[], mounted: ReadonlySet<number>, done: ReadonlySet<number>): number | null {
  for (const index of order) {
    if (!mounted.has(index)) return index;
    if (!done.has(index)) return null;
  }
  return null;
}

/** What the stage writes to on every frame; nothing here goes through React state. */
interface StageNodes {
  layers: (HTMLElement | null)[];
  copies: (HTMLElement | null)[];
  fills: (HTMLElement | null)[];
  tiles: (HTMLElement | null)[];
}

/**
 * Chapter 1 of the cinematic landing page: one full-screen photographic stage that the page scroll
 * walks through six scenes (Learn, Practise, Prepare, Understand, Progress, Explore), each with its
 * own photograph AND its own eyebrow, headline and paragraph, then holds on Explore while Chapter 2's
 * stage is revealed over it through the mirror-mosaic seam (ChapterTwoPrograms, cinematic/seamReveal.ts).
 * Designed in Claude Design (MindMosaic-Chapter-1.dc.html and -Chapter-2.dc.html).
 *
 * Scroll is the only input: no autoplay, timer, wheel handling or snapping. From `pinnedMinWidth` up
 * the section is tall and its inner stage `sticky`, and every frame is a pure function of the story
 * clock `t` (cinematic/heroScenes.ts), so scrolling back retraces the same frames. The photographs
 * stay at a fixed scale; only a cross-fade changes the picture. Per-frame writes (layer opacity, the
 * copy wipe, navigator fills, accent tiles) go straight to the DOM from the scroll listener, not
 * through React renders. Every number is in `cinematicMotion.chapter1` (cinematic/config.ts).
 *
 * CTAs, the credibility list, the availability line and the navigator are the same for all six
 * scenes. The six copy blocks share one grid cell, so nothing below them ever moves. A soft ivory
 * scrim keeps type readable on any photograph.
 *
 * Photographs come from `landingMedia.chapter1.scenes` (media.ts). Every scene has an inlined blurred
 * preview, so the stage is never empty and the picture always matches its copy even on a cold cache;
 * the full photograph fades in over it once decoded, and loading never stalls the timeline.
 *
 * Below `pinnedMinWidth`, and under reduced motion, nothing is pinned or animated: scene 1 is a hero
 * band, scenes 2 to 6 follow as a readable list (HeroStoryList), and a fixed Start free / Explore
 * programs bar stays in reach until Chapter 2 arrives. Every word and link is present in all modes.
 */
export function ChapterOneIntro() {
  const slots = HERO_SCENE_IDS.map((id) => landingMedia.chapter1.scenes[id]);
  const animated = useMotionLevel() !== "off";
  const pinned = useMinWidth(cinematicMotion.pinnedMinWidth);
  const choreographed = pinned && animated;

  const pinnedValue = useMotionValue(pinned ? 1 : 0);
  useEffect(() => pinnedValue.set(pinned ? 1 : 0), [pinned, pinnedValue]);

  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  // q runs along the story's own travel; the seam scroll after it holds q at 1 (the Explore scene).
  const travel = pinnedTravelFactor(timing.storyScrollHeightSvh);
  const q = useTransform([scrollYProgress, pinnedValue], ([scroll, isPinned]: number[]) =>
    clamp01(scroll! * (isPinned ? travel : 1)),
  );

  const [active, setActive] = useState(0);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [barHidden, setBarHidden] = useState(false);

  // Photographs: which are mounted, which have settled (decoded or failed), which failed.
  const [mounted, setMounted] = useState<ReadonlySet<number>>(() => new Set([0]));
  const [done, setDone] = useState<ReadonlySet<number>>(() => new Set());
  const [failed, setFailed] = useState<ReadonlySet<number>>(() => new Set());
  const [slowFor, setSlowFor] = useState<number | null>(null);
  const onSettled = useCallback((index: number, ok: boolean) => {
    setDone((current) => (current.has(index) ? current : new Set(current).add(index)));
    if (!ok) setFailed((current) => (current.has(index) ? current : new Set(current).add(index)));
  }, []);
  // Mount around the active scene one at a time, only once scene 1 is done (so first paint never competes),
  // or at once if the page opened part-way down. Once mounted they stay mounted.
  const next = choreographed && (done.has(0) || active > 0) ? nextToMount(photoWindow(active), mounted, done) : null;
  if (next !== null) setMounted(new Set([...mounted, next]));

  useEffect(() => {
    if (!choreographed || done.has(active)) return;
    const timer = window.setTimeout(() => setSlowFor(active), timing.slowLoadMs);
    return () => window.clearTimeout(timer);
  }, [active, choreographed, done]);

  const tiles = useMemo(() => (choreographed && size ? heroTiles(size.width, size.height) : []), [choreographed, size]);

  const nodes = useRef<StageNodes>({ layers: [], copies: [], fills: [], tiles: [] });

  /** Writes frame `t` to the DOM. Pure function of `t`: the same scroll position is always the same picture. */
  const apply = useCallback(
    (t: number) => {
      const n = nodes.current;
      for (let i = 0; i < HERO_SCENE_COUNT; i += 1) {
        const layer = n.layers[i];
        if (layer) {
          layer.style.opacity = String(heroSceneCover(t, i));
          layer.style.visibility = heroLayerVisible(t, i) ? "visible" : "hidden";
        }
        const copy = n.copies[i];
        if (copy) {
          const state = heroCopyState(t, i);
          copy.style.opacity = state.visible ? "1" : "0";
          copy.style.maskImage = state.mask;
          copy.style.webkitMaskImage = state.mask;
          copy.inert = !state.current;
          copy.setAttribute("aria-hidden", state.current ? "false" : "true");
        }
        const fill = n.fills[i];
        if (fill) fill.style.transform = `scaleX(${heroNavFill(t, i).toFixed(4)})`;
      }
      tiles.forEach((tile, i) => {
        const element = n.tiles[i];
        if (!element) return;
        const state = heroTileState(t, tile);
        element.style.opacity = String(state.opacity);
        element.style.transform = `scale(${state.scale.toFixed(3)})`;
      });
    },
    [tiles],
  );

  useMotionValueEvent(q, "change", (value) => {
    if (!choreographed) return;
    const t = heroClock(value);
    apply(t);
    setActive(heroActiveScene(t));
  });
  // Re-apply when the set of nodes changes (tiles measured, a resize, the breakpoint crossed). Outside the
  // choreographed layout the stage is simply the first scene.
  useEffect(() => {
    const t = choreographed ? heroClock(q.get()) : 0;
    apply(t);
    // The navigator's current scene follows the scroll position, including after a reload part-way down.
    const frame = window.requestAnimationFrame(() => setActive(heroActiveScene(t)));
    return () => window.cancelAnimationFrame(frame);
  }, [apply, choreographed, q, mounted]);

  // The stage's size drives the tile grid (square tiles, nine to the height).
  useEffect(() => {
    const stage = stageRef.current;
    if (!choreographed || !stage) return;
    const measure = () => {
      const width = Math.round(stage.clientWidth);
      const height = Math.round(stage.clientHeight);
      setSize((current) => (current && current.width === width && current.height === height ? current : { width, height }));
    };
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [choreographed]);

  // The fixed CTA bar (stacked layout) leaves as soon as Chapter 2 arrives, so it never covers later content.
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", () => {
    const section = sectionRef.current;
    if (!section) return;
    const hide = section.getBoundingClientRect().bottom < window.innerHeight - 8;
    setBarHidden((current) => (current === hide ? current : hide));
  });

  const scrollToScene = useCallback(
    (index: number) => {
      const section = sectionRef.current;
      if (!section) return;
      const top = section.getBoundingClientRect().top + window.scrollY;
      const target = top + (heroSceneAnchor(index) / HERO_SCENE_COUNT / travel) * section.offsetHeight;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: target, behavior: reduced ? "auto" : "smooth" });
    },
    [travel],
  );

  const chip =
    choreographed && slowFor === active && !done.has(active) && mounted.has(active)
      ? "Loading photograph…"
      : choreographed && failed.has(active)
        ? "Photograph unavailable · showing preview"
        : null;

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-heading"
      data-chapter="1"
      style={{ "--chapter-height": `${timing.desktopScrollHeightSvh}svh` } as CSSProperties}
      className="relative -mt-[var(--mm-header-h)] bg-mm-page lg:h-[var(--chapter-height)] motion-reduce:lg:h-auto"
    >
      <div
        ref={stageRef}
        className="relative isolate flex min-h-svh flex-col overflow-hidden lg:sticky lg:top-0 lg:h-svh lg:min-h-0 motion-reduce:lg:static motion-reduce:lg:min-h-svh"
      >
        {/* The photographic canvas. Phones/tablets: a top band that fades into the page; lg+: full bleed. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 -z-10 h-[56svh] min-h-[360px] overflow-hidden md:h-[52svh] lg:inset-0 lg:h-full"
        >
          {slots.map((slot, index) => {
            const id = HERO_SCENE_IDS[index]!;
            return (
              <div
                key={id}
                data-scene-layer={id}
                ref={(element) => {
                  nodes.current.layers[index] = element;
                }}
                style={
                  {
                    opacity: index === 0 ? 1 : 0,
                    visibility: index === 0 ? "visible" : "hidden",
                    "--pos-m": slot.focalMobile,
                    "--pos-t": slot.focalTablet,
                    "--pos-d": slot.focalDesktop,
                  } as CSSProperties
                }
                className={`absolute inset-0 ${index === 0 ? "" : "max-lg:hidden motion-reduce:hidden"}`}
              >
                <div
                  style={{ backgroundImage: `url(${heroScenePreviews[id]})` }}
                  className="absolute inset-0 scale-[1.06] bg-cover blur-[14px] [background-position:var(--pos-m)] md:[background-position:var(--pos-t)] lg:[background-position:var(--pos-d)]"
                />
                {mounted.has(index) && (
                  <HeroScenePhoto index={index} slot={slot} priority={index === 0} onSettled={onSettled} />
                )}
              </div>
            );
          })}
          {/* Readability layers: CSS only, never baked into the photographs. Colours derive from --mm-page. */}
          <div className="absolute inset-0 lg:hidden [background:linear-gradient(180deg,rgb(var(--mm-page-rgb)/.5)_0%,rgb(var(--mm-page-rgb)/0)_22%,rgb(var(--mm-page-rgb)/0)_58%,rgb(var(--mm-page-rgb)/.88)_88%,var(--mm-page)_100%)]" />
          <div className="absolute inset-0 hidden lg:block [background:linear-gradient(90deg,rgb(var(--mm-page-rgb)/.94)_0%,rgb(var(--mm-page-rgb)/.88)_30%,rgb(var(--mm-page-rgb)/.5)_45%,rgb(var(--mm-page-rgb)/0)_60%)]" />
          <div className="absolute inset-x-0 top-0 hidden h-36 lg:block [background:linear-gradient(180deg,rgb(var(--mm-page-rgb)/.45),transparent)]" />
        </div>

        {chip && (
          <span
            role="status"
            className="absolute right-[clamp(20px,4vw,64px)] top-[calc(var(--mm-header-h)+16px)] z-20 rounded-full bg-mm-ink/80 px-2.5 py-1.5 text-[11.5px] font-semibold text-white"
          >
            {chip}
          </span>
        )}

        {/* Accent "seed" tiles: the first pieces of the mosaic the Chapter 2 seam sweeps over. */}
        {choreographed && (
          <div aria-hidden="true" data-mosaic-tiles className="pointer-events-none absolute inset-0">
            {tiles.map((tile, index) => (
              <div
                key={index}
                ref={(element) => {
                  nodes.current.tiles[index] = element;
                }}
                style={{
                  left: tile.x,
                  top: tile.y,
                  width: tile.size + 1,
                  height: tile.size + 1,
                  opacity: 0,
                  borderRadius: 4,
                }}
                className={`absolute will-change-[opacity,transform] ${TILE_TONES[tile.tone]}`}
              />
            ))}
          </div>
        )}

        <div className="mm-width relative flex flex-1 flex-col justify-end pb-[clamp(56px,9vh,96px)] pt-[calc(var(--mm-header-h)+min(34svh,300px))] lg:justify-center lg:pb-[clamp(110px,17vh,168px)] lg:pt-[calc(var(--mm-header-h)+2vh)]">
          <div className="max-w-[640px] lg:max-w-[min(50%,740px)] xl:max-w-[min(54%,740px)]">
            <h1 id="hero-heading" className="sr-only">
              {hero.heading} {hero.headingEmphasis}
            </h1>
            {/* Six copy blocks share one grid cell, so the CTAs below never move. At lg+ only the first is shown
                statically (reduced motion); phones and tablets show the first here and the rest in HeroStoryList. */}
            <div className="grid">
              {hero.scenes.map((scene, index) => (
                <div
                  key={scene.id}
                  data-scene-copy={scene.id}
                  ref={(element) => {
                    nodes.current.copies[index] = element;
                  }}
                  aria-hidden={index === 0 ? undefined : "true"}
                  inert={index === 0 ? undefined : true}
                  style={{ gridArea: "1 / 1", opacity: index === 0 ? 1 : 0 }}
                  className={`flex flex-col will-change-[opacity] ${index === 0 ? "" : "max-lg:hidden motion-reduce:hidden"}`}
                >
                  <p className={`${index === 0 ? "mm-hero-rise " : ""}m-0 mb-4 flex flex-wrap items-center gap-x-3 gap-y-1`} style={rise(0)}>
                    <span aria-hidden="true" className="h-[3px] w-[26px] shrink-0 rounded-sm bg-mm-coral" />
                    <span className="whitespace-nowrap text-xs font-bold uppercase tracking-[0.14em] text-mm-coral-text tabular-nums">
                      {String(index + 1).padStart(2, "0")} / 06
                    </span>
                    <span className="text-xs font-bold uppercase tracking-[0.14em] text-mm-brand">{scene.eyebrow}</span>
                  </p>
                  <h2
                    className="m-0 text-[clamp(38px,min(4.8vw,7.6vh),76px)] leading-[1.02] tracking-[-0.036em] text-mm-ink text-balance max-lg:text-[clamp(38px,9.5vw,64px)]"
                  >
                    <span className={`${index === 0 ? "mm-hero-rise " : ""}block`} style={rise(1)}>
                      {scene.headline[0]}
                    </span>
                    <span className={`${index === 0 ? "mm-hero-rise " : ""}block text-mm-brand`} style={rise(2)}>
                      {scene.headline[1]}
                    </span>
                  </h2>
                  <p
                    className={`${index === 0 ? "mm-hero-rise " : ""}m-0 mt-5 max-w-[46ch] text-pretty text-[clamp(16px,1.35vw,20px)] leading-[1.6] text-mm-ink-soft sm:mt-6`}
                    style={rise(3)}
                  >
                    {scene.body}
                  </p>
                </div>
              ))}
            </div>

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

        {/* The scene navigator: the pinned stage only. Phones, tablets and reduced motion use the list below. */}
        <div className="mm-width pointer-events-none absolute inset-x-0 bottom-[clamp(18px,3.4vh,32px)] z-10 hidden lg:block motion-reduce:lg:hidden">
          <div className="pointer-events-auto w-fit">
            <HeroSceneNav
              active={active}
              onSelect={scrollToScene}
              registerFill={(index, element) => {
                nodes.current.fills[index] = element;
              }}
            />
          </div>
        </div>
      </div>

      <HeroStoryList className="flex lg:hidden motion-reduce:lg:flex" />

      {/* Stacked layouts: Start free and Explore programs stay in reach until Chapter 2 arrives. */}
      <div
        data-cta-bar
        aria-hidden={barHidden ? "true" : undefined}
        inert={barHidden ? true : undefined}
        className={`fixed inset-x-0 bottom-0 z-40 flex gap-2.5 border-t border-mm-line bg-mm-page/90 px-[clamp(16px,4vw,32px)] pb-[calc(10px+env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-[10px] transition-[transform,visibility] duration-[240ms] motion-reduce:transition-none lg:hidden motion-reduce:lg:flex ${
          barHidden ? "invisible translate-y-[110%]" : "visible"
        }`}
      >
        <Link href={hero.primaryCta.href} className={mmButton({ size: "lg", className: "flex-1 justify-center whitespace-nowrap px-3" })}>
          {hero.primaryCta.label}
        </Link>
        <Link
          href={hero.secondaryCta.href}
          className={mmButton({ variant: "outline", size: "lg", className: "flex-1 justify-center whitespace-nowrap bg-white px-3" })}
        >
          {hero.secondaryCta.label}
        </Link>
      </div>
    </section>
  );
}
