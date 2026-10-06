"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMotionValue, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "framer-motion";

import { useMotionLevel } from "../motion/useMotionLevel";
import { pinnedTravelFactor, cinematicMotion } from "./config";
import { clamp01 } from "./math";
import { activeLayer as activeLayerAt, layerAnchor } from "./sceneProgress";
import { useMinWidth } from "./useMinWidth";

/**
 * The scroll plumbing a pinned chapter needs, in one place: whether the stage
 * is choreographed (pinned width AND motion allowed), the chapter progress
 * `q` (0..1 along the pinned travel, plain page scroll), the active layer,
 * and a normal-scrolling `scrollToLayer`. No wheel listeners, no snap, no timers.
 *
 * Chapter 3 uses it; Chapter 2 predates it and keeps its own copy of the same
 * logic (left alone on purpose, to keep that frozen chapter untouched).
 */
export function useChapterScroll({
  scrollHeightSvh,
  starts,
}: {
  scrollHeightSvh: number;
  starts: readonly number[];
}): {
  sectionRef: React.RefObject<HTMLElement | null>;
  choreographed: boolean;
  q: MotionValue<number>;
  active: number;
  scrollToLayer: (layer: number) => void;
} {
  const animated = useMotionLevel() !== "off";
  const pinned = useMinWidth(cinematicMotion.pinnedMinWidth);
  const choreographed = pinned && animated;

  // Scroll transforms read pinned state through a motion value so a resize across the breakpoint re-evaluates them.
  const pinnedValue = useMotionValue(pinned ? 1 : 0);
  useEffect(() => pinnedValue.set(pinned ? 1 : 0), [pinned, pinnedValue]);

  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const travel = pinnedTravelFactor(scrollHeightSvh);
  const q = useTransform([scrollYProgress, pinnedValue], ([scroll, isPinned]: number[]) =>
    clamp01(scroll! * (isPinned ? travel : 1)),
  );

  const [active, setActive] = useState(0);
  useMotionValueEvent(q, "change", (value) => setActive(activeLayerAt(value, starts)));

  const scrollToLayer = useCallback(
    (layer: number) => {
      const section = sectionRef.current;
      if (!section) return;
      const top = section.getBoundingClientRect().top + window.scrollY;
      const target = top + (layerAnchor(starts, layer) / travel) * section.offsetHeight;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: target, behavior: reduced ? "auto" : "smooth" });
    },
    [starts, travel],
  );

  return { sectionRef, choreographed, q, active, scrollToLayer };
}
