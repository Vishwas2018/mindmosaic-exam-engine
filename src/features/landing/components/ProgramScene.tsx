"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock,
  Layers,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  type LucideIcon,
} from "lucide-react";

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

const SCENE_DETAILS: Record<
  ProgramSceneData["id"],
  {
    icon: LucideIcon;
    badgeTitle: string;
    badgeSubtitle: string;
    photoWash: string;
    haloBg: string;
  }
> = {
  naplan: {
    icon: ShieldCheck,
    badgeTitle: "Official paper structure",
    badgeSubtitle: "35 questions · Timed mode",
    photoWash: "bg-slate-900/10",
    haloBg: "from-purple-600/12 via-indigo-500/8 to-transparent",
  },
  icas: {
    icon: Sparkles,
    badgeTitle: "Higher-order reasoning",
    badgeSubtitle: "Distinction & credit extension",
    photoWash: "bg-amber-900/10",
    haloBg: "from-amber-500/14 via-orange-500/8 to-transparent",
  },
  curriculum: {
    icon: BookOpen,
    badgeTitle: "Concept-first progression",
    badgeSubtitle: "Step-by-step instruction",
    photoWash: "",
    haloBg: "from-teal-500/12 via-indigo-500/8 to-transparent",
  },
  amc: {
    icon: Trophy,
    badgeTitle: "Competition problem solving",
    badgeSubtitle: "Non-routine & pattern discovery",
    photoWash: "bg-indigo-950/15",
    haloBg: "from-indigo-600/14 via-blue-500/10 to-transparent",
  },
  singapore: {
    icon: Layers,
    badgeTitle: "Visual bar model method",
    badgeSubtitle: "Concrete-pictorial-abstract",
    photoWash: "",
    haloBg: "from-rose-500/12 via-orange-500/8 to-transparent",
  },
  selective: {
    icon: Target,
    badgeTitle: "High-yield preparation",
    badgeSubtitle: "4 core test sections",
    photoWash: "bg-purple-950/15",
    haloBg: "from-violet-600/14 via-emerald-500/8 to-transparent",
  },
};

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

function SceneBadge({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute right-3.5 top-3.5 z-10 hidden items-center gap-2.5 rounded-xl border border-white/60 bg-white/90 px-3.5 py-2 shadow-[0_8px_20px_-6px_rgba(24,21,31,0.18)] backdrop-blur-md sm:flex"
    >
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-mm-tint text-mm-brand">
        <Icon className="h-4 w-4" strokeWidth={2.2} />
      </span>
      <div className="flex flex-col text-left leading-tight">
        <span className="text-[12px] font-bold text-mm-ink">{title}</span>
        <span className="text-[11px] font-medium text-mm-ink-soft">{subtitle}</span>
      </div>
    </div>
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

/** The photograph panel: decorative, from the media registry, lazy and mounted on demand while pinned. */
function ScenePhoto({
  slotKey,
  sceneId,
  scale,
  opacity,
  enabled,
}: {
  slotKey: NonNullable<ProgramSceneData["mediaSlot"]>;
  sceneId: ProgramSceneData["id"];
  scale: MotionValue<number> | null;
  /** Background cross-fade while choreographed. */
  opacity: MotionValue<number> | null;
  enabled: boolean;
}) {
  const slot = landingMedia.chapter2[slotKey].primary;
  const detail = SCENE_DETAILS[sceneId];
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
      className="relative aspect-[4/3] overflow-hidden rounded-[clamp(20px,2.4vw,32px)] border border-black/5 bg-mm-tint shadow-[0_20px_50px_-20px_rgba(24,21,31,0.22)] lg:aspect-auto lg:h-[min(76svh,720px)] xl:h-[min(80svh,760px)] 2xl:h-[min(82svh,800px)]"
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
      {/* Directional scrims for readability and seamless visual integration */}
      <div className={`pointer-events-none absolute inset-0 ${detail.photoWash}`} />
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-1/3 bg-gradient-to-r from-mm-page/40 via-mm-page/10 to-transparent lg:block" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-mm-page/70 via-mm-page/20 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black/25 via-transparent to-transparent" />
      <SceneBadge icon={detail.icon} title={detail.badgeTitle} subtitle={detail.badgeSubtitle} />
    </motion.div>
  );
}

function CurriculumBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#18151f12_1px,transparent_1px)] [background-size:20px_20px]" />
      <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-gradient-to-br from-teal-400/15 via-indigo-300/10 to-transparent blur-2xl" />
      <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-gradient-to-tr from-purple-400/10 to-transparent blur-2xl" />
      <div className="absolute left-8 top-0 bottom-0 hidden w-[1px] bg-gradient-to-b from-transparent via-mm-line/60 to-transparent sm:block" />
      <span className="absolute right-8 top-16 h-3 w-3 rotate-45 rounded-[1.5px] bg-mm-brand/30" />
      <span className="absolute right-20 top-24 h-2 w-2 rotate-45 rounded-[1px] bg-mm-coral/40" />
      <span className="absolute bottom-12 left-16 h-3.5 w-3.5 rotate-45 rounded-[2px] bg-mm-lilac/50" />
    </div>
  );
}

function SingaporeBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#18151f0a_1px,transparent_1px),linear-gradient(to_bottom,#18151f0a_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-gradient-to-br from-coral/15 via-amber-400/10 to-transparent blur-2xl" />
      <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-gradient-to-tr from-rose-400/12 to-transparent blur-2xl" />
      <div className="absolute inset-x-8 top-1/3 h-[1px] bg-gradient-to-r from-transparent via-mm-line/50 to-transparent" />
      <span className="absolute right-10 top-14 h-3.5 w-3.5 rotate-45 rounded-[1.5px] bg-mm-coral/50" />
      <span className="absolute right-24 top-20 h-2 w-2 rotate-45 rounded-[1px] bg-mm-brand/30" />
      <span className="absolute bottom-16 left-12 h-3 w-3 rotate-45 rounded-[1.5px] bg-mm-brand-mid/40" />
    </div>
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
  const cardY = useTransform(local, (value) =>
    lerp(18, 0, easeOutCubic(between(value, timing.productScale.window.start, timing.productScale.window.end))),
  );
  const build = useTransform(local, (value) => between(value, timing.build.start, timing.build.end));

  const hasPhoto = Boolean(scene.mediaSlot);
  const detail = SCENE_DETAILS[scene.id];

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
          {/* Ambient stage halo matching programme identity */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-4 -z-10 overflow-hidden rounded-[36px] sm:-inset-6"
          >
            <div
              className={`h-full w-full rounded-full bg-gradient-to-tr ${detail.haloBg} opacity-70 blur-3xl`}
            />
          </div>

          {hasPhoto ? (
            <div className="relative">
              <ScenePhoto
                slotKey={scene.mediaSlot!}
                sceneId={scene.id}
                scale={choreographed ? photoScale : null}
                opacity={choreographed ? opacity : null}
                enabled={imageEnabled}
              />
              <motion.div
                style={choreographed ? { opacity: foreground, y: cardY } : undefined}
                className="relative z-[1] -mt-14 px-2 sm:px-6 lg:absolute lg:-left-8 xl:-left-12 lg:bottom-6 xl:bottom-8 lg:mt-0 lg:w-[min(480px,84%)] xl:w-[min(510px,86%)] lg:px-0"
              >
                <SceneVisual type={scene.visualType} build={choreographed ? build : null} />
              </motion.div>
            </div>
          ) : (
            <div className="relative">
              <motion.div
                aria-hidden="true"
                style={choreographed ? { opacity } : undefined}
                className="relative aspect-[4/3] overflow-hidden rounded-[clamp(20px,2.4vw,32px)] border border-black/5 bg-gradient-to-b from-white via-mm-wash/50 to-mm-tint p-4 shadow-[0_20px_50px_-20px_rgba(24,21,31,0.22)] sm:p-6 lg:aspect-auto lg:h-[min(76svh,720px)] xl:h-[min(80svh,760px)] 2xl:h-[min(82svh,800px)] lg:p-8"
              >
                {scene.id === "curriculum" ? <CurriculumBackdrop /> : <SingaporeBackdrop />}
                <SceneBadge icon={detail.icon} title={detail.badgeTitle} subtitle={detail.badgeSubtitle} />
              </motion.div>
              <motion.div
                style={choreographed ? { opacity: foreground, y: cardY } : undefined}
                className="relative z-[1] -mt-14 px-2 sm:px-6 lg:absolute lg:inset-x-6 xl:inset-x-8 lg:bottom-6 xl:bottom-8 lg:mt-0 lg:px-0"
              >
                <div className="mx-auto w-full max-w-[510px] xl:max-w-[540px]">
                  <SceneVisual type={scene.visualType} build={choreographed ? build : null} />
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
}
