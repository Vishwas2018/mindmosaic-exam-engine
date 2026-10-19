"use client";

import { useSyncExternalStore } from "react";

/**
 * False for the server render and the hydration pass, true from the first
 * post-hydration render. It flips in the same batch as `useMinWidth` and
 * `useMotionLevel`, so a component can wait for "the real layout is known".
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
