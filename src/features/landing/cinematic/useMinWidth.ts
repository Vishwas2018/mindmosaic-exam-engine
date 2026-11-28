"use client";

import { useSyncExternalStore } from "react";

/**
 * True while `query` matches. Reactive (updates when the query starts or stops
 * matching, e.g. a resize across a breakpoint), unsubscribes on unmount, and
 * SSR safe: the server and the first client render report `false`.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => {
      if (typeof window.matchMedia !== "function") return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener("change", callback);
      return () => mql.removeEventListener("change", callback);
    },
    () => (typeof window.matchMedia === "function" ? window.matchMedia(query).matches : false),
    () => false,
  );
}

/** True while the viewport is at least `minWidth` px wide. */
export function useMinWidth(minWidth: number): boolean {
  return useMediaQuery(`(min-width: ${minWidth}px)`);
}

/**
 * True while the viewport is wide AND tall enough for a pinned (cinematic) stage: at least
 * `cinematicMotion.pinnedMinWidth` wide and `minHeight` tall. The CSS side of the same decision is the
 * `short` variant in globals.css (height below `pinnedMinHeight`) plus the `lg:` width classes, so the
 * scroll choreography and the layout always agree; below it the chapter is plain natural-flow content.
 */
export function usePinnedViewport(minWidth: number, minHeight: number): boolean {
  return useMediaQuery(`(min-width: ${minWidth}px) and (min-height: ${minHeight}px)`);
}
