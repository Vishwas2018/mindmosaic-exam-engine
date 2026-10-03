"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useMotionValue, useTransform, animate as animateValue } from "framer-motion";

import { useMotionLevel } from "../motion/useMotionLevel";

/**
 * MOTION_SPEC.md §Tokens/§Effects, "scroll reveals": elements marked
 * `data-st` in the design reveal once through IntersectionObserver
 * (threshold 0.15, rootMargin bottom −8%), staggering in DOM order via
 * `delayMs`. This is that behaviour as a component, one per `kind`.
 *
 * Visibility is tracked with a plain `IntersectionObserver` + `animate`
 * rather than framer-motion's own `whileInView`/`viewport` — framer's
 * viewport feature did not reliably fire in this app (elements already
 * inside the initial viewport stayed at their `initial` state
 * indefinitely); this is the same manual-observer approach the Reveal
 * component this one replaces already used successfully.
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

/** Home.dc.html's `this.E` — the one easing every kind() reveal uses. */
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
/** The tab indicator's spring (MOTION_SPEC.md's ease-spring) — not used by Reveal itself. */
export const EASE_SPRING = [0.34, 1.4, 0.5, 1] as const;
/** Home.dc.html's count-up easing: `1 - (1 - p) ** 3`, applied verbatim. */
const EASE_COUNT = (p: number) => 1 - Math.pow(1 - p, 3);

export const STAGGER_MS = { expressive: 90, calm: 50 } as const;

const UP_DISTANCE = { expressive: 36, calm: 12 } as const;
const UP_DURATION = { expressive: 0.9, calm: 0.45 } as const;

const OBSERVER_OPTIONS = { threshold: 0.15, rootMargin: "0px 0px -8% 0px" } as const;

/** Fires `onEnter` once, the first time `ref`'s element intersects the viewport. */
function useOnceInView(onEnter: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      onEnter();
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        onEnter();
        observer.disconnect();
      }
    }, OBSERVER_OPTIONS);
    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onEnter is a state setter, stable by identity
  }, []);
  return ref;
}

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
  const [visible, setVisible] = useState(false);
  const ref = useOnceInView(() => setVisible(true));

  if (level === "off") {
    return kind === "count" ? (
      <span className={className}>{to ?? children}</span>
    ) : (
      <div className={className}>{children}</div>
    );
  }

  const delay = delayMs / 1000;

  if (kind === "count") {
    return (
      <CountUp ref={ref} visible={visible} to={to ?? 0} delay={delay} className={className}>
        {children}
      </CountUp>
    );
  }

  if (kind === "img") {
    if (level === "calm") {
      return (
        <UpReveal ref={ref} visible={visible} level={level} delay={delay} className={className}>
          {children}
        </UpReveal>
      );
    }
    return (
      <motion.div
        ref={ref}
        className={className}
        style={{ overflow: "hidden" }}
        initial={{ opacity: 0, clipPath: "inset(12% 8%)" }}
        animate={visible ? { opacity: 1, clipPath: "inset(0% 0%)" } : undefined}
        transition={{ duration: 1.3, delay, ease: EASE_OUT_EXPO }}
      >
        <motion.div
          initial={{ scale: 1.18 }}
          animate={visible ? { scale: 1 } : undefined}
          transition={{ duration: 1.8, delay, ease: EASE_OUT_EXPO }}
        >
          {children}
        </motion.div>
      </motion.div>
    );
  }

  if (kind === "fill" || kind === "pop") {
    /*
     * The observed node must never be the one that gets scaled to (or
     * toward) zero: IntersectionObserver computes intersection against
     * the element's own transformed bounding box, so a `scaleX(0)` (fill)
     * or `scale(0.4)` (pop, just under the 0.15 area threshold) start
     * state made the element geometrically too small to ever cross the
     * 0.15 threshold — it could never "become visible enough" to trigger
     * its own reveal. The ref goes on a plain, never-transformed wrapper
     * instead; the motion element inside it carries the transform.
     */
    const inner =
      kind === "fill" ? (
        <motion.div
          style={{ transformOrigin: "left center", height: "100%" }}
          initial={{ scaleX: 0 }}
          animate={visible ? { scaleX: 1 } : undefined}
          transition={{ duration: 0.7, delay, ease: EASE_OUT_EXPO }}
        >
          {children}
        </motion.div>
      ) : (
        <motion.div
          style={{ height: "100%" }}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={visible ? { opacity: 1, scale: [0.4, 1.12, 1] } : undefined}
          transition={{ duration: 0.52, delay, ease: EASE_OUT_EXPO }}
        >
          {children}
        </motion.div>
      );
    return (
      <div ref={ref} className={className}>
        {inner}
      </div>
    );
  }

  return (
    <UpReveal ref={ref} visible={visible} level={level} delay={delay} className={className}>
      {children}
    </UpReveal>
  );
}

function UpReveal({
  ref,
  visible,
  level,
  delay,
  className,
  children,
}: {
  ref: React.Ref<HTMLDivElement>;
  visible: boolean;
  level: "expressive" | "calm";
  delay: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ y: UP_DISTANCE[level] }}
      animate={visible ? { y: 0 } : undefined}
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
  ref,
  visible,
  to,
  delay,
  className,
  children,
}: {
  ref: React.Ref<HTMLDivElement>;
  visible: boolean;
  to: number;
  delay: number;
  className?: string;
  children: ReactNode;
}) {
  const value = useMotionValue(0);
  const [display, setDisplay] = useState(0);
  const rounded = useTransform(value, (v) => Math.round(v));

  useEffect(() => rounded.on("change", setDisplay), [rounded]);

  useEffect(() => {
    if (!visible) return;
    const controls = animateValue(value, to, { duration: 0.9, delay, ease: EASE_COUNT });
    return () => controls.stop();
  }, [visible, to, delay, value]);

  return (
    <motion.span ref={ref} className={className}>
      {visible ? display : children}
    </motion.span>
  );
}
