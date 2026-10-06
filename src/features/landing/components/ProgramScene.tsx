"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import { ArrowRight, Check, Clock } from "lucide-react";

import type { ProgramSceneData } from "../chapter2-scenes";
import { cinematicMotion } from "../cinematic/config";
import { between, easeInOut, easeOutCubic, lerp } from "../cinematic/math";
import {
  chapter2LayerStarts,
  layerEnter,
  layerExit,
  layerForegroundOpacity,
  layerLocal,
  layerOpacity,
} from "../cinematic/sceneProgress";
import { landingMedia, resolveSlotSrc } from "../media";
import { SceneVisual } from "./chapter-two-visuals";
import { mmButton, underlineLinkClasses, underlineTransition } from "./primitives";

const timing = cinematicMotion.chapter2;
const SCENE_TOTAL = 6;

/** A scene is one stacked layer from `lg` up (and while motion is on); natural flow otherwise. */
export const LAYER_CLASSES =
  "lg:absolute lg:inset-0 lg:opacity-0 lg:pointer-events-none motion-reduce:lg:static motion-reduce:lg:opacity-100 motion-reduce:lg:pointer-events-auto";

const DIAMOND_TONES = ["bg-mm-brand", "bg-mm-coral", "bg-mm-lilac", "bg-mm-brand-mid"] as const;

/** Status is always a word. Colour, border style and the icon only reinforce it. */
const STATUS_STYLES = {
  available: { icon: Check, classes: "border-transparent bg-mm-positive-soft text-mm-positive" },
  limited: { icon: Clock, classes: "border-mm-tint-line-strong bg-mm-tint text-mm-brand" },
  "in-development": { icon: Clock, classes: "border-dashed border-mm-line-quiet bg-white/70 text-mm-ink-soft" },
} as const;

function StatusPill({ scene }: { scene: ProgramSceneData }) {
  const { icon: Icon, classes } = STATUS_STYLES[scene.statusTone];
  return (
    <p className={`m-0 inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-[13.5px] font-semibold ${classes}`}>
      <Icon aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.4} />
      <span>
        <span className="sr-only">Status: </span>
        {scene.statusLine}
      </span>
    </p>
  );
}

function SceneCopy({ scene }: { scene: ProgramSceneData }) {
  const headingId = `chapter-two-${scene.id}-heading`;
  return (
    <div className="max-w-[560px] lg:max-w-[500px]">
      <p className="m-0 mb-3 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.14em] text-mm-brand">
        <span aria-hidden="true" className="h-[3px] w-[26px] shrink-0 rounded-sm bg-mm-coral" />
        <span className="tabular-nums">
          {String(scene.number).padStart(2, "0")} / {String(SCENE_TOTAL).padStart(2, "0")}
        </span>
      </p>
      <h3
        id={headingId}
        className="m-0 text-balance text-[clamp(30px,3.4vw,52px)] leading-[1.04] tracking-[-0.034em] text-mm-ink"
      >
        {scene.heading}
      </h3>
      <p className="m-0 mt-4 text-pretty text-[clamp(17px,1.4vw,21px)] font-medium leading-[1.45] text-mm-ink">
        {scene.proposition}
      </p>
      <div className="mt-5">
        <StatusPill scene={scene} />
      </div>
      <ul
        aria-label={`${scene.heading}: what it covers`}
        className="m-0 mt-5 grid max-w-[34rem] list-none gap-x-5 gap-y-2 p-0 text-[14.5px] leading-snug text-mm-ink-soft sm:grid-cols-2 lg:grid-cols-1"
      >
        {scene.facts.map((fact, index) => (
          <li key={fact} className="flex items-start gap-2.5">
            <span
              aria-hidden="true"
              className={`mt-[5px] h-2 w-2 shrink-0 rotate-45 rounded-[1.5px] ${DIAMOND_TONES[index % DIAMOND_TONES.length]}`}
            />
            {fact}
          </li>
        ))}
      </ul>
      {scene.note && <p className="m-0 mt-4 max-w-[46ch] text-[13.5px] leading-[1.55] text-mm-muted">{scene.note}</p>}
      <div className="mt-6">
        {scene.statusTone === "available" ? (
          <Link href={scene.cta.href} className={mmButton({ size: "lg", className: "px-5 sm:px-7" })}>
            {scene.cta.label}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        ) : (
          <Link
            href={scene.cta.href}
            style={underlineTransition}
            className={underlineLinkClasses({ tone: "brand", className: "text-[15px] font-semibold text-mm-brand" })}
          >
            {scene.cta.label}
          </Link>
        )}
      </div>
    </div>
  );
}

/** The photograph panel: decorative, from the media registry, lazy and mounted on demand while pinned. */
function ScenePhoto({
  slotKey,
  scale,
  opacity,
  enabled,
}: {
  slotKey: NonNullable<ProgramSceneData["mediaSlot"]>;
  scale: MotionValue<number> | null;
  /** Background cross-fade while choreographed. */
  opacity: MotionValue<number> | null;
  enabled: boolean;
}) {
  const slot = landingMedia.chapter2[slotKey].primary;
  // Once an image has been wanted it stays mounted, so scrolling back never re-fetches or flashes.
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    // One-way latch on a prop: it cannot loop, and it must run after commit so it never re-renders mid-render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (enabled) setSeen(true);
  }, [enabled]);
  return (
    <motion.div
      aria-hidden={slot.decorative ? "true" : undefined}
      style={opacity ? { opacity } : undefined}
      className="relative aspect-[4/3] overflow-hidden rounded-[clamp(20px,2.4vw,32px)] bg-mm-tint lg:aspect-auto lg:h-[min(64svh,600px)]"
    >
      {seen && (
        <motion.div
          style={scale ? { scale, transformOrigin: slot.focalDesktop } : undefined}
          className="absolute inset-0 will-change-transform"
        >
          <Image
            src={resolveSlotSrc(slot)}
            alt={slot.alt}
            fill
            sizes="(min-width: 1024px) 56vw, 100vw"
            quality={80}
            loading="lazy"
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
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-mm-page/25 via-transparent to-transparent" />
    </motion.div>
  );
}

/**
 * One programme scene. `progress` is the chapter's progress (0..1) while the
 * pinned stage is choreographed, and `null` otherwise (phones, tablets,
 * reduced motion): then the scene is plain, fully built, natural-flow content.
 * Photograph and product UI are decorative/read-only; every word that matters
 * (heading, status, facts) is DOM text in `SceneCopy`.
 */
export function ProgramScene({
  scene,
  layerIndex,
  progress,
  imageEnabled,
}: {
  scene: ProgramSceneData;
  /** Position in the chapter's layer chain: 0 is the intro, so scenes start at 1. */
  layerIndex: number;
  progress: MotionValue<number> | null;
  imageEnabled: boolean;
}) {
  const fallback = useMotionValue(0);
  const q = progress ?? fallback;
  const choreographed = progress !== null;
  const starts = chapter2LayerStarts;

  const opacity = useTransform(q, (value) => layerOpacity(value, starts, layerIndex, timing.crossfade));
  const pointerEvents = useTransform(opacity, (value) => (value > 0.5 ? "auto" : "none"));
  // Text and product UI take turns across a cross-fade; only the background (photo/panel) dissolves.
  const foreground = useTransform(q, (value) =>
    layerForegroundOpacity(value, starts, layerIndex, timing.crossfade),
  );
  const copyY = useTransform(
    q,
    (value) =>
      (1 - layerEnter(value, starts, layerIndex, timing.crossfade)) * timing.copyRisePx -
      layerExit(value, starts, layerIndex, timing.crossfade) * timing.copyLiftPx,
  );
  const local = useTransform(q, (value) => layerLocal(value, starts, layerIndex));

  const preset = scene.mediaSlot
    ? cinematicMotion.presets[landingMedia.chapter2[scene.mediaSlot].primary.motionPreset]
    : cinematicMotion.presets.still;
  const photoScale = useTransform(local, (value) =>
    value < timing.photoHandoff.start
      ? lerp(preset.fromScale, preset.settledScale, easeInOut(between(value, timing.photoSettle.start, timing.photoSettle.end)))
      : lerp(preset.settledScale, preset.handoffScale, easeInOut(between(value, timing.photoHandoff.start, timing.photoHandoff.end))),
  );
  const productScale = useTransform(local, (value) =>
    lerp(timing.productScale.from, 1, easeOutCubic(between(value, timing.productScale.window.start, timing.productScale.window.end))),
  );
  const build = useTransform(local, (value) => between(value, timing.build.start, timing.build.end));

  const hasPhoto = Boolean(scene.mediaSlot);

  return (
    <motion.section
      aria-labelledby={`chapter-two-${scene.id}-heading`}
      data-scene={scene.id}
      style={choreographed ? { opacity: 1, pointerEvents } : undefined}
      className={`${LAYER_CLASSES} border-t border-mm-line-soft py-[clamp(44px,7vw,88px)] first:border-t-0 lg:border-t-0 lg:py-0 motion-reduce:lg:border-t motion-reduce:lg:py-[clamp(44px,7vw,88px)]`}
    >
      <div className="mm-width grid gap-8 lg:h-full lg:grid-cols-12 lg:items-center lg:gap-14 lg:pb-24 lg:pt-[calc(var(--mm-header-h)+16px)] motion-reduce:lg:h-auto motion-reduce:lg:pb-0 motion-reduce:lg:pt-0">
        <motion.div style={choreographed ? { y: copyY, opacity: foreground } : undefined} className="lg:col-span-5">
          <SceneCopy scene={scene} />
        </motion.div>

        <motion.div
          style={choreographed ? { scale: productScale } : undefined}
          className="relative min-w-0 lg:col-span-7 lg:origin-center"
        >
          {hasPhoto ? (
            <div className="relative">
              <ScenePhoto
                slotKey={scene.mediaSlot!}
                scale={choreographed ? photoScale : null}
                opacity={choreographed ? opacity : null}
                enabled={imageEnabled}
              />
              <motion.div
                style={choreographed ? { opacity: foreground } : undefined}
                className="relative z-[1] -mt-12 px-3 sm:px-8 lg:absolute lg:-left-6 lg:bottom-8 lg:mt-0 lg:w-[min(430px,70%)] lg:px-0"
              >
                <SceneVisual type={scene.visualType} build={choreographed ? build : null} />
              </motion.div>
            </div>
          ) : (
            <div className="relative p-5 sm:p-8 lg:p-[clamp(28px,3.4vw,56px)]">
              <motion.div
                aria-hidden="true"
                style={choreographed ? { opacity } : undefined}
                className="absolute inset-0 overflow-hidden rounded-[clamp(20px,2.4vw,32px)] border border-mm-tint-line bg-mm-tint"
              >
                <MosaicBackdrop />
              </motion.div>
              <motion.div
                style={choreographed ? { opacity: foreground } : undefined}
                className="relative mx-auto w-full max-w-[560px]"
              >
                <SceneVisual type={scene.visualType} build={choreographed ? build : null} />
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
}

/** Quiet corner diamonds: the page's mosaic motif behind a DOM-only product visual. */
const BACKDROP_DIAMONDS = [
  "right-6 top-6 h-4 w-4 bg-mm-coral/70",
  "right-14 top-12 h-2.5 w-2.5 bg-mm-brand/50",
  "left-6 bottom-8 h-3 w-3 bg-mm-lilac/80",
  "right-10 bottom-6 h-5 w-5 bg-mm-brand-mid/40",
] as const;

function MosaicBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {BACKDROP_DIAMONDS.map((classes) => (
        <span key={classes} className={`absolute rotate-45 rounded-[2px] ${classes}`} />
      ))}
    </div>
  );
}
