"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { clsx } from "clsx";

/**
 * Triggers the shared .lp-rise entrance animation (globals.css) the moment
 * this element scrolls into view, instead of on mount — which would fire
 * off-screen for anything below the fold and be over before a visitor
 * scrolls down to see it. Reuses .lp-rise's own reduced-motion handling
 * (global `animation-duration: 0.01ms` override) — nothing extra needed
 * here. `delayMs` staggers a group of siblings (e.g. a card grid) without
 * needing a fixed .lp-rise-1/2/3 tier per item.
 */
export function Reveal({
  children,
  delayMs,
  className,
}: {
  children: ReactNode;
  delayMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  /*
   * Always starts false, on both server and client — `typeof
   * IntersectionObserver` differs between the two (undefined in Node,
   * defined in a real browser), so branching the *initial* state on it
   * would render a different className server- vs client-side and trip a
   * hydration mismatch. Environment support is only checked inside the
   * effect below, which runs client-only.
   */
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    /* No IntersectionObserver (very old browser, or a test DOM): leave
       visible false. The content stays fully present and readable, just
       at its 16px-offset resting position — a minor, acceptable
       degradation rather than a broken experience. */
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={clsx(visible ? "lp-rise" : "lp-rise-pending", className)}
      style={visible && delayMs ? { animationDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
