"use client";

import { useSyncExternalStore } from "react";

/**
 * True while the viewport is at least `minWidth` px wide. Reactive (updates
 * when the breakpoint is crossed), unsubscribes on unmount, and SSR safe:
 * the server and the first client render report `false`.
 */
export function useMinWidth(minWidth: number): boolean {
  const query = `(min-width: ${minWidth}px)`;
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
