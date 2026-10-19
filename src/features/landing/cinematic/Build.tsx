"use client";

import type { ReactNode } from "react";
import { motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";

import { between, easeOutCubic } from "./math";

/**
 * `build` is a scene's progressive-build value (0..1) while a pinned stage is
 * choreographed, or `null` when the visual should simply be complete (phones,
 * tablets, reduced motion). Every visual is fully readable at `null`;
 * animation only reveals it in order.
 */
export type BuildProgress = MotionValue<number> | null;

/**
 * Reveals its children over `from..to` of the build: fade plus a small rise,
 * or a left-anchored grow. The shared progressive-reveal primitive for the
 * cinematic landing chapters' read-only product visuals.
 */
export function Build({
  progress,
  from,
  to,
  grow,
  className,
  children,
}: {
  progress: BuildProgress;
  from: number;
  to: number;
  grow?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const fallback = useMotionValue(1);
  const eased = useTransform(progress ?? fallback, (value) => easeOutCubic(between(value, from, to)));
  const opacity = useTransform(eased, (value) => (grow ? 1 : value));
  const y = useTransform(eased, (value) => (grow ? 0 : (1 - value) * 10));
  const scaleX = useTransform(eased, (value) => (grow ? Math.max(value, 0.001) : 1));
  return (
    <motion.div
      style={progress ? (grow ? { scaleX, transformOrigin: "left center" } : { opacity, y }) : undefined}
      className={className}
    >
      {children}
    </motion.div>
  );
}
