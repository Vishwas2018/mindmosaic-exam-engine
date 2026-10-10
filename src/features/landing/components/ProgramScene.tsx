"use client";

import Link from "next/link";
import { motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import { ArrowRight, Check, Clock } from "lucide-react";

import type { ProgramSceneData } from "../chapter2-scenes";
import { cinematicMotion } from "../cinematic/config";
import {
  chapter2LayerStarts,
  layerEnter,
  layerBackdropOpacity,
  layerExit,
  layerForegroundOpacity,
  layerOpacity,
  layerPresence,
} from "../cinematic/sceneProgress";
import { ProgramPreview } from "./program-previews";
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
    <div className="max-w-[560px] lg:max-w-[480px] xl:max-w-[520px]">
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
        className="m-0 mt-5 grid max-w-[34rem] list-none gap-x-5 gap-y-2.5 p-0 text-[14.5px] leading-snug text-mm-ink-soft sm:grid-cols-2 lg:grid-cols-1"
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

/**
 * One programme scene. `progress` is the chapter's progress (0..1) while the
 * pinned stage is choreographed, and `null` otherwise (phones, tablets,
 * reduced motion): then the scene is plain, natural-flow content.
 *
 * The preview window sits on the left and never moves: no scale, no travel.
 * Scenes hand over by opacity alone. The incoming window is opaque and exactly
 * covers the outgoing one before that one fades (`layerBackdropOpacity`), so
 * the frame never dips, and the copy beside it takes turns with its neighbour
 * over the same few percent of scroll. The window is decorative and read-only;
 * every word that matters (heading, status, facts) is DOM text in `SceneCopy`.
 */
export function ProgramScene({
  scene,
  layerIndex,
  progress,
}: {
  scene: ProgramSceneData;
  /** Position in the chapter's layer chain: 0 is the intro, so scenes start at 1. */
  layerIndex: number;
  progress: MotionValue<number> | null;
}) {
  const fallback = useMotionValue(0);
  const q = progress ?? fallback;
  const choreographed = progress !== null;
  const starts = chapter2LayerStarts;

  const layerVisibility = useTransform(q, (value) => layerOpacity(value, starts, layerIndex, timing.crossfade));
  const lastSceneLayer = starts.length - 2;
  const windowOpacity = useTransform(q, (value) =>
    layerBackdropOpacity(value, starts, layerIndex, timing.crossfade, layerIndex < lastSceneLayer),
  );
  const pointerEvents = useTransform(layerVisibility, (value) => (value > 0.5 ? "auto" : "none"));
  // A scene far from the viewport's current layer is skipped by paint entirely (its a11y tree stays).
  const presence = useTransform(q, (value) => layerPresence(value, starts, layerIndex, timing.crossfade));
  // Copy takes turns across a cross-fade; the window stacks instead (see above).
  const foreground = useTransform(q, (value) =>
    layerForegroundOpacity(value, starts, layerIndex, timing.crossfade),
  );
  const copyY = useTransform(
    q,
    (value) =>
      (1 - layerEnter(value, starts, layerIndex, timing.crossfade)) * timing.copyRisePx -
      layerExit(value, starts, layerIndex, timing.crossfade) * timing.copyLiftPx,
  );

  return (
    <motion.section
      aria-labelledby={`chapter-two-${scene.id}-heading`}
      data-scene={scene.id}
      style={choreographed ? { opacity: presence, pointerEvents } : undefined}
      className={`${LAYER_CLASSES} border-t border-mm-line-soft py-[clamp(44px,7vw,88px)] first:border-t-0 lg:border-t-0 lg:py-0 motion-reduce:lg:border-t motion-reduce:lg:py-[clamp(44px,7vw,88px)]`}
    >
      <div className="mm-width grid gap-8 lg:h-full lg:grid-cols-12 lg:items-center lg:gap-12 lg:pb-24 lg:pt-[calc(var(--mm-header-h)+16px)] motion-reduce:lg:h-auto motion-reduce:lg:pb-0 motion-reduce:lg:pt-0">
        <motion.div
          style={choreographed ? { y: copyY, opacity: foreground } : undefined}
          className="lg:order-2 lg:col-span-5"
        >
          <SceneCopy scene={scene} />
        </motion.div>

        <motion.div
          data-preview={scene.id}
          style={choreographed ? { opacity: windowOpacity } : undefined}
          className="relative min-w-0 lg:order-1 lg:col-span-7"
        >
          <ProgramPreview
            sceneId={scene.id}
            className="aspect-[3/4.5] sm:aspect-[1.15] lg:max-h-[min(76svh,720px)] lg:w-full"
          />
        </motion.div>
      </div>
    </motion.section>
  );
}
