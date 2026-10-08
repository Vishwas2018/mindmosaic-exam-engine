"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import Image from "next/image";
import { animate, motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";

import { cinematicMotion } from "../cinematic/config";
import { heroLayerOpacity, heroSceneCover, heroSceneScale, HERO_SCENE_COUNT } from "../cinematic/heroScenes";
import { resolveSlotSrc, type LandingMediaSlot } from "../media";

const timing = cinematicMotion.chapter1;

/** How a scene's photograph is doing. Written to `data-photo-state` for tests and support; never rendered. */
export type HeroPhotoState = "loading" | "ready" | "error";

/**
 * One scene's full-bleed photograph layer.
 *
 * Layers stack in story order inside one stable canvas. The layer's opacity is its scroll-driven
 * cover MULTIPLIED by `ready`, which is 0 until the picture has loaded AND decoded. A scene
 * whose picture is not there yet therefore simply leaves the previous photograph on screen,
 * and a failed or undecodable picture never covers anything: `ready` is only ever raised after
 * `HTMLImageElement.decode()` resolves, never on a failed request or a decode error.
 *
 * `progress === null` is the natural-flow form (phones, tablets, reduced motion): a still
 * photograph with no inline opacity or transform at all.
 */
export function HeroScenePhoto({
  index,
  slot,
  progress,
  ready,
  nextReady,
  hot,
  priority,
  onDone,
}: {
  index: number;
  slot: LandingMediaSlot;
  progress: MotionValue<number> | null;
  ready: MotionValue<number>;
  /** The next layer's readiness, or null for the last scene. */
  nextReady: MotionValue<number> | null;
  /** True for the active scene and its neighbours: the only layers that may take a compositor hint. */
  hot: boolean;
  priority: boolean;
  /** Called once this photograph has finished: decoded successfully, or failed. */
  onDone?: (index: number) => void;
}) {
  const preset = cinematicMotion.presets[slot.motionPreset];
  const wrapper = useRef<HTMLDivElement>(null);
  const idleQ = useMotionValue(0);
  const idleReady = useMotionValue(0);
  const q = progress ?? idleQ;

  const opacity = useTransform([q, ready, nextReady ?? idleReady], ([value, own, next]: number[]) =>
    heroLayerOpacity(
      value!,
      index,
      own!,
      index < HERO_SCENE_COUNT - 1 ? heroSceneCover(value!, index + 1) * next! : 0,
    ),
  );
  const scale = useTransform(q, (value) => heroSceneScale(value, index, preset));

  useEffect(() => {
    const element = wrapper.current;
    const photo = element?.querySelector("img");
    if (!element || !photo) return;
    const mark = (state: HeroPhotoState) => {
      element.dataset.photoState = state;
    };
    let cancelled = false;
    const fail = () => {
      if (cancelled) return;
      mark("error");
      ready.set(0);
      onDone?.(index);
    };
    const settle = () => {
      const decoded = typeof photo.decode === "function" ? photo.decode() : Promise.resolve();
      decoded.then(() => {
        if (cancelled) return;
        mark("ready");
        // Eased, not snapped: a picture that arrives after the scroll has already passed its scene fades in.
        if (ready.get() < 1) animate(ready, 1, { duration: timing.photoReadyFadeMs / 1000, ease: "easeOut" });
        onDone?.(index);
      }, fail);
    };
    const onLoad = () => (photo.naturalWidth > 0 ? settle() : fail());
    // A server-rendered photograph may have finished before hydration attached any handler.
    if (photo.complete) onLoad();
    photo.addEventListener("load", onLoad);
    photo.addEventListener("error", fail);
    return () => {
      cancelled = true;
      photo.removeEventListener("load", onLoad);
      photo.removeEventListener("error", fail);
    };
  }, [index, ready, onDone]);

  return (
    <motion.div
      ref={wrapper}
      data-hero-scene={index}
      data-photo-state="loading"
      style={progress ? { opacity } : undefined}
      className="absolute inset-0"
    >
      <motion.div
        style={progress ? { scale, transformOrigin: slot.focalDesktop } : undefined}
        className={`absolute inset-0 ${hot && progress ? "will-change-transform" : ""}`}
      >
        <Image
          src={resolveSlotSrc(slot)}
          alt={slot.alt}
          fill
          sizes="100vw"
          quality={priority ? 85 : 75}
          preload={priority}
          loading={priority ? undefined : "eager"}
          fetchPriority={priority ? undefined : "low"}
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
    </motion.div>
  );
}
