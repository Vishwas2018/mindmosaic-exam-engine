"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion, useMotionValue, useTransform, animate as animateValue } from "framer-motion";

import { useMotionLevel } from "../motion/useMotionLevel";

/**
 * MOTION_SPEC.md §Tokens/§Effects, "scroll reveals": elements marked
 * `data-st` in the design reveal once through IntersectionObserver
 * (threshold 0.15, rootMargin bottom −8%), staggering in DOM order via
 * `delayMs`. This is that behaviour as a component, one per `kind`.
 *
 * `up` deliberately never animates opacity, unlike the design's literal
 * "opacity 0→1, rise 36px": globals.css's retired `.lp-rise` carries a
 * comment from an earlier pass explaining why — axe's color-contrast
 * check can sample the DOM mid-fade (or before an off-screen element ever
 * enters view) and flag real text as insufficient contrast. Transform-only
 * motion sidesteps that failure mode entirely and looks the same once
 * settled.
 */
export type RevealKind = "up" | "img" | "fill" | "pop" | "count";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
const EASE_SPRING = [0.34, 1.4, 0.5, 1] as const;

export const STAGGER_MS = { expressive: 90, calm: 50 } as const;

const UP_DISTANCE = { expressive: 36, calm: 12 } as const;
const UP_DURATION = { expressive: 0.9, calm: 0.45 } as const;

const VIEWPORT = { once: true, amount: 0.15, margin: "0px 0px -8% 0px" } as const;

type RevealProps = {
  children: ReactNode;
  kind?: RevealKind;
  delayMs?: number;
  className?: string;
  /** Required (and only used) when `kind="count"`: the number to count up to. */
  to?: number;
};

export function Reveal({ children, kind = "up", delayMs = 0, className, to }: RevealProps) {
  const level = useMotionLevel();

  if (level === "off") {
    return kind === "count" ? (
      <span className={className}>{to ?? children}</span>
    ) : (
      <div className={className}>{children}</div>
    );
  }

  const delay = delayMs / 1000;

  if (kind === "count") {
    return <CountUp to={to ?? 0} delay={delay} className={className}>{children}</CountUp>;
  }

  if (kind === "img") {
    if (level === "calm") {
      return <UpReveal level={level} delay={delay} className={className}>{children}</UpReveal>;
    }
    return (
      <motion.div
        className={className}
        style={{ overflow: "hidden" }}
        initial={{ clipPath: "inset(12% 8%)" }}
        whileInView={{ clipPath: "inset(0% 0%)" }}
        viewport={VIEWPORT}
        transition={{ duration: 1.8, delay, ease: EASE_OUT_EXPO }}
      >
        <motion.div
          initial={{ scale: 1.18 }}
          whileInView={{ scale: 1 }}
          viewport={VIEWPORT}
          transition={{ duration: 1.8, delay, ease: EASE_OUT_EXPO }}
        >
          {children}
        </motion.div>
      </motion.div>
    );
  }

  if (kind === "fill") {
    return (
      <motion.div
        className={className}
        style={{ transformOrigin: "left center" }}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={VIEWPORT}
        transition={{ duration: 0.7, delay, ease: EASE_OUT_EXPO }}
      >
        {children}
      </motion.div>
    );
  }

  if (kind === "pop") {
    return (
      <motion.div
        className={className}
        initial={{ scale: 0.4 }}
        whileInView={{ scale: [0.4, 1.12, 1] }}
        viewport={VIEWPORT}
        transition={{ duration: 0.52, delay, ease: EASE_SPRING }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <UpReveal level={level} delay={delay} className={className}>
      {children}
    </UpReveal>
  );
}

function UpReveal({
  level,
  delay,
  className,
  children,
}: {
  level: "expressive" | "calm";
  delay: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      className={className}
      initial={{ y: UP_DISTANCE[level] }}
      whileInView={{ y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: UP_DURATION[level], delay, ease: EASE_OUT_EXPO }}
    >
      {children}
    </motion.div>
  );
}

/**
 * `data-st="count" data-to="14"` in the design: counts up from 0 to `to`
 * once in view. `children` is the static server-rendered number, used
 * as-is until the animation takes over client-side.
 */
function CountUp({
  to,
  delay,
  className,
  children,
}: {
  to: number;
  delay: number;
  className?: string;
  children: ReactNode;
}) {
  const [started, setStarted] = useState(false);
  const value = useMotionValue(0);
  const [display, setDisplay] = useState(0);
  const rounded = useTransform(value, (v) => Math.round(v));

  useEffect(() => rounded.on("change", setDisplay), [rounded]);

  useEffect(() => {
    if (!started) return;
    const controls = animateValue(value, to, { duration: 0.9, delay, ease: EASE_OUT_EXPO });
    return () => controls.stop();
  }, [started, to, delay, value]);

  return (
    <motion.span
      className={className}
      onViewportEnter={() => setStarted(true)}
      viewport={VIEWPORT}
    >
      {started ? display : children}
    </motion.span>
  );
}
