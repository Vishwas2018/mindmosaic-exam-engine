"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { motion, useMotionValue, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { chapter2Scenes } from "../chapter2-scenes";
import { cinematicMotion, pinnedTravelFactor } from "../cinematic/config";
import { clamp01 } from "../cinematic/math";
import { seamClipPath, seamGrid, type SeamGrid } from "../cinematic/seamReveal";
import {
  activeLayer as activeLayerAt,
  chapter2LayerStarts,
  layerAnchor,
  layerForegroundOpacity,
  layerOpacity,
} from "../cinematic/sceneProgress";
import { useMinWidth } from "../cinematic/useMinWidth";
import { chapterTwo } from "../content";
import { useMotionLevel } from "../motion/useMotionLevel";
import { LAYER_CLASSES, ProgramScene } from "./ProgramScene";
import { ProgramSceneProgress } from "./ProgramSceneProgress";
import { mmButton } from "./primitives";

const timing = cinematicMotion.chapter2;
/** Layer 0 is the intro, so the six scenes are layers 1..6. */
const SCENE_LAYER_OFFSET = 1;

/**
 * Chapter 2 of the cinematic landing page: "Choose your pathway." One pinned
 * stage tells six programme scenes (NAPLAN, ICAS, Curriculum, AMC, Singapore
 * Maths, Selective) by cross-fading as the page scrolls normally. There is no
 * wheel handling, snap or timer: scroll position is the only input, and
 * every number lives in `cinematicMotion.chapter2` (cinematic/config.ts).
 *
 * From `pinnedMinWidth` up the section is tall and its inner stage `sticky`.
 * Below it, and under reduced motion, nothing is pinned or hidden: the intro,
 * six scenes and the hand-off simply stack as readable content. Each scene
 * pairs its explanation (right) with a stationary MindMosaic product window
 * (left, program-previews/); there are no photographs, so nothing loads late.
 *
 * Availability and status come from the canonical programme data via
 * chapter2-scenes.ts.
 */
export function ChapterTwoPrograms() {
  const animated = useMotionLevel() !== "off";
  const pinned = useMinWidth(cinematicMotion.pinnedMinWidth);
  const choreographed = pinned && animated;

  // Scroll transforms read pinned state through a motion value so a resize across the breakpoint re-evaluates them.
  const pinnedValue = useMotionValue(pinned ? 1 : 0);
  useEffect(() => pinnedValue.set(pinned ? 1 : 0), [pinned, pinnedValue]);

  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const travel = pinnedTravelFactor(timing.desktopScrollHeightSvh);
  const q = useTransform([scrollYProgress, pinnedValue], ([scroll, isPinned]: number[]) =>
    clamp01(scroll! * (isPinned ? travel : 1)),
  );

  const [active, setActive] = useState(0);
  useMotionValueEvent(q, "change", (value) => setActive(activeLayerAt(value, chapter2LayerStarts)));

  // The Chapter 1 -> 2 seam. While Chapter 1's Explore scene is still pinned, this section rises over it for
  // `seamSvh` of scroll (negative top margin). The stage is held at the top of the viewport (cancelling that
  // rise) and revealed through a grid of growing tiles, so Explore turns into this introduction in place; the
  // sweep finishes exactly as this chapter's own timeline begins. See cinematic/seamReveal.ts.
  const stageRef = useRef<HTMLDivElement>(null);
  const seamGridRef = useRef<SeamGrid | null>(null);
  const { scrollYProgress: seam } = useScroll({ target: sectionRef, offset: ["start end", "start start"] });
  const applySeam = useCallback(
    (u: number) => {
      const stage = stageRef.current;
      if (!stage) return;
      if (!choreographed || u >= 1) {
        stage.style.transform = "";
        stage.style.clipPath = "";
        return;
      }
      const grid = seamGridRef.current;
      stage.style.transform = `translate3d(0,${(-(1 - clamp01(u)) * 100).toFixed(3)}svh,0)`;
      stage.style.clipPath = grid ? seamClipPath(grid, clamp01(u)) : "path('M0 0Z')";
    },
    [choreographed],
  );
  useMotionValueEvent(seam, "change", applySeam);
  useEffect(() => {
    const stage = stageRef.current;
    if (!choreographed || !stage) {
      seamGridRef.current = null;
      applySeam(1);
      return;
    }
    const measure = () => {
      seamGridRef.current = seamGrid(stage.clientWidth, stage.clientHeight);
      applySeam(seam.get());
    };
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [applySeam, choreographed, seam]);

  const scrollToLayer = useCallback(
    (layer: number) => {
      const section = sectionRef.current;
      if (!section) return;
      const top = section.getBoundingClientRect().top + window.scrollY;
      const target = top + (layerAnchor(chapter2LayerStarts, layer) / travel) * section.offsetHeight;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: target, behavior: reduced ? "auto" : "smooth" });
    },
    [travel],
  );

  // A keyboard user tabbing into a scene that is not on screen brings it on screen: plain scrolling.
  const onSceneFocus = useCallback(
    (layer: number) => {
      if (choreographed && layerOpacity(q.get(), chapter2LayerStarts, layer, timing.crossfade) < 0.5) scrollToLayer(layer);
    },
    [choreographed, q, scrollToLayer],
  );

  const handoffLayer = chapter2LayerStarts.length - 1;
  const introOpacity = useTransform(q, (value) => layerOpacity(value, chapter2LayerStarts, 0, timing.crossfade));
  const handoffOpacity = useTransform(q, (value) => layerOpacity(value, chapter2LayerStarts, handoffLayer, timing.crossfade));
  const introForeground = useTransform(q, (value) =>
    layerForegroundOpacity(value, chapter2LayerStarts, 0, timing.crossfade),
  );
  const handoffForeground = useTransform(q, (value) =>
    layerForegroundOpacity(value, chapter2LayerStarts, handoffLayer, timing.crossfade),
  );
  const introPointer = useTransform(introOpacity, (value) => (value > 0.5 ? "auto" : "none"));
  const handoffPointer = useTransform(handoffOpacity, (value) => (value > 0.5 ? "auto" : "none"));

  return (
    <section
      ref={sectionRef}
      aria-labelledby="chapter-two-heading"
      data-chapter="2"
      style={
        {
          "--chapter-height": `${timing.desktopScrollHeightSvh}svh`,
          "--seam-height": cinematicMotion.chapter1.seamSvh,
        } as CSSProperties
      }
      className="relative bg-mm-page lg:-mt-[calc(var(--seam-height)*1svh)] lg:h-[var(--chapter-height)] lg:scroll-mt-[calc(var(--seam-height)*-1svh)] lg:bg-transparent motion-reduce:lg:mt-0 motion-reduce:lg:h-auto motion-reduce:lg:scroll-mt-0 motion-reduce:lg:bg-mm-page"
    >
      <div
        ref={stageRef}
        className="relative isolate overflow-hidden lg:sticky lg:top-0 lg:h-svh lg:bg-mm-page motion-reduce:lg:static motion-reduce:lg:h-auto motion-reduce:lg:overflow-visible"
      >
        <motion.div
          data-layer="intro"
          style={choreographed ? { opacity: introForeground, pointerEvents: introPointer } : undefined}
          className={`${LAYER_CLASSES} lg:opacity-100 lg:pointer-events-auto`}
        >
          <div className="mm-width grid gap-8 pb-6 pt-[clamp(56px,10vw,120px)] lg:h-full lg:grid-cols-12 lg:items-center lg:gap-14 lg:pb-24 lg:pt-[calc(var(--mm-header-h)+16px)] motion-reduce:lg:h-auto motion-reduce:lg:pb-6 motion-reduce:lg:pt-[clamp(56px,10vw,120px)]">
            <div className="flex flex-col gap-4 lg:order-2 lg:col-span-7">
              <p className="m-0 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.14em] text-mm-brand">
                <span aria-hidden="true" className="h-[3px] w-[26px] shrink-0 rounded-sm bg-mm-coral" />
                {chapterTwo.eyebrow}
              </p>
              <h2
                id="chapter-two-heading"
                className="m-0 max-w-[18ch] text-balance text-[clamp(36px,5.2vw,76px)] leading-[1.02] tracking-[-0.038em] text-mm-ink"
              >
                {chapterTwo.heading}
              </h2>
              <p className="m-0 max-w-[52ch] text-pretty text-[clamp(16px,1.35vw,20px)] leading-[1.6] text-mm-ink-soft">
                {chapterTwo.intro}
              </p>
              <p className="m-0 flex max-w-[60ch] items-start gap-2.5 text-[14.5px] leading-[1.55] text-mm-ink-soft">
                <span aria-hidden="true" className="mt-[7px] h-2 w-2 shrink-0 rounded-full bg-mm-positive" />
                {chapterTwo.availability}
              </p>
            </div>
            <ol
              aria-label="The six pathways"
              className="m-0 grid list-none gap-0 rounded-2xl border border-mm-line/80 bg-white/75 p-5 shadow-[0_16px_40px_-16px_rgba(24,21,31,0.12)] backdrop-blur-sm sm:p-6 lg:order-1 lg:col-span-5"
            >
              {chapter2Scenes.map((scene) => (
                <li
                  key={scene.id}
                  className="flex items-baseline justify-between gap-4 border-b border-mm-line/70 py-3.5 first:pt-1 last:border-b-0 last:pb-1"
                >
                  <span className="flex min-w-0 items-baseline gap-3 text-[16px] font-semibold tracking-[-0.01em] text-mm-ink">
                    <span aria-hidden="true" className="text-[13px] font-bold tabular-nums text-mm-brand">
                      {String(scene.number).padStart(2, "0")}
                    </span>
                    <span className="truncate">{scene.shortName}</span>
                  </span>
                  <span
                    className={`shrink-0 whitespace-nowrap text-[13px] font-semibold ${
                      scene.statusTone === "available"
                        ? "text-mm-positive"
                        : scene.statusTone === "limited"
                          ? "text-mm-brand"
                          : "text-mm-muted"
                    }`}
                  >
                    {scene.status}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </motion.div>

        {chapter2Scenes.map((scene, index) => {
          const layer = index + SCENE_LAYER_OFFSET;
          return (
            <div key={scene.id} onFocusCapture={() => onSceneFocus(layer)} className="contents">
              <ProgramScene
                scene={scene}
                layerIndex={layer}
                progress={choreographed ? q : null}
              />
            </div>
          );
        })}

        <motion.div
          data-handoff="chapter-3"
          style={choreographed ? { opacity: handoffForeground, pointerEvents: handoffPointer } : undefined}
          className={`${LAYER_CLASSES} border-t border-mm-line-soft lg:border-t-0 motion-reduce:lg:border-t`}
        >
          <div className="mm-width flex flex-col justify-center py-[clamp(48px,8vw,96px)] lg:h-full lg:pb-24 lg:pt-[calc(var(--mm-header-h)+16px)] motion-reduce:lg:h-auto motion-reduce:lg:py-[clamp(48px,8vw,96px)]">
            <div className="relative max-w-3xl overflow-hidden rounded-3xl border border-mm-line/80 bg-gradient-to-br from-white/95 via-mm-wash/50 to-white/90 p-8 shadow-[0_20px_60px_-20px_rgba(24,21,31,0.14)] backdrop-blur-md sm:p-12">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-mm-brand/10 via-mm-coral/10 to-transparent blur-2xl"
              />
              <span
                aria-hidden="true"
                className="absolute right-8 top-8 h-3 w-3 rotate-45 rounded-[1.5px] bg-mm-coral/60"
              />
              <p className="m-0 max-w-[20ch] text-balance font-[family-name:var(--font-display)] text-[clamp(32px,4.4vw,60px)] font-medium leading-[1.06] tracking-[-0.034em] text-mm-ink">
                {chapterTwo.handoff.heading}
              </p>
              <p className="m-0 mt-4 max-w-[52ch] text-pretty text-[clamp(16px,1.35vw,19px)] leading-[1.6] text-mm-ink-soft">
                {chapterTwo.handoff.body}
              </p>
              <div className="mt-6">
                <Link
                  href={chapterTwo.handoff.cta.href}
                  className={mmButton({ variant: "outline", size: "lg", className: "px-5 sm:px-7" })}
                >
                  {chapterTwo.handoff.cta.label}
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* The navigator belongs to the six scenes: it leaves with the hand-off. */}
        {choreographed && active < handoffLayer && (
          <ProgramSceneProgress
            activeLayer={active}
            onSelect={(sceneIndex) => scrollToLayer(sceneIndex + SCENE_LAYER_OFFSET)}
          />
        )}
      </div>
    </section>
  );
}
