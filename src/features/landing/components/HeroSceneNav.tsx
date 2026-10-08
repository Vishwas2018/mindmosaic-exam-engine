"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";

import { heroCaptionOpacity, heroSceneLocal } from "../cinematic/heroScenes";
import { hero } from "../content";

type Scene = (typeof hero.scenes)[number];

function sceneNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}

function Caption({ scene, index, progress }: { scene: Scene; index: number; progress: MotionValue<number> }) {
  const opacity = useTransform(progress, (value) => heroCaptionOpacity(value, index));
  return (
    <motion.span
      style={{ opacity }}
      className="col-start-1 row-start-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5"
    >
      <span className="text-xs font-bold uppercase tracking-[0.14em] text-mm-brand">
        {sceneNumber(index)} · {scene.label}
      </span>
      <span className="text-[14.5px] font-medium text-mm-ink-soft">{scene.phrase}</span>
    </motion.span>
  );
}

/**
 * The scene caption: six lines stacked in one grid cell, one per scene. They take turns as the
 * page scrolls, so one is always readable and two are never legible together. Purely visual
 * (aria-hidden): the same words are in the navigator's button names, once.
 */
export function HeroCaptions({ progress }: { progress: MotionValue<number> }) {
  return (
    <p aria-hidden="true" className="m-0 grid min-h-[22px]">
      {hero.scenes.map((scene, index) => (
        <Caption key={scene.id} scene={scene} index={index} progress={progress} />
      ))}
    </p>
  );
}

function Segment({
  scene,
  index,
  active,
  progress,
  onSelect,
}: {
  scene: Scene;
  index: number;
  active: boolean;
  progress: MotionValue<number>;
  onSelect: (index: number) => void;
}) {
  // The fill is the real scroll position inside this scene, not a clock.
  const fill = useTransform(progress, (value) => heroSceneLocal(value, index));
  return (
    <li className="m-0 p-0">
      <button
        type="button"
        aria-label={`Scene ${index + 1} of ${hero.scenes.length}: ${scene.label}. ${scene.phrase}`}
        aria-current={active ? "step" : undefined}
        onClick={() => onSelect(index)}
        className="group/seg flex h-11 w-[clamp(34px,5vw,60px)] items-center rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-mm-page"
      >
        <span
          aria-hidden="true"
          className="relative block h-1 w-full overflow-hidden rounded-full bg-mm-brand/20 transition-[height,background-color] duration-200 group-hover/seg:h-[5px] group-hover/seg:bg-mm-brand/35"
        >
          <motion.span style={{ scaleX: fill }} className="absolute inset-0 origin-left rounded-full bg-mm-brand" />
        </span>
      </button>
    </li>
  );
}

/**
 * Six-segment scene navigator. Each segment fills with the actual scroll position through its
 * scene, and a click scrolls the page there with ordinary native scrolling (no scroll hijack,
 * nothing is locked or snapped). `aria-current` follows the active scene; nothing is announced
 * as the page scrolls.
 */
export function HeroSceneNav({
  progress,
  active,
  onSelect,
}: {
  progress: MotionValue<number>;
  active: number;
  onSelect: (index: number) => void;
}) {
  return (
    <nav aria-label="Hero scenes">
      <ol className="m-0 flex list-none items-center gap-1.5 p-0">
        {hero.scenes.map((scene, index) => (
          <Segment
            key={scene.id}
            scene={scene}
            index={index}
            active={index === active}
            progress={progress}
            onSelect={onSelect}
          />
        ))}
      </ol>
    </nav>
  );
}
