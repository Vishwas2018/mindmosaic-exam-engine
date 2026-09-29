"use client";

import { useSyncExternalStore } from "react";

export type MotionLevel = "expressive" | "calm" | "off";

const QUERY = "(prefers-reduced-motion: reduce)";

function hasMatchMedia(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function";
}

function subscribe(callback: () => void) {
  if (!hasMatchMedia()) return () => {};
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getSnapshot() {
  return hasMatchMedia() ? window.matchMedia(QUERY).matches : false;
}

function getServerSnapshot() {
  return false;
}

/**
 * MOTION_SPEC.md: approved level is Expressive; `prefers-reduced-motion:
 * reduce` forces Off regardless. There is no in-app Calm toggle yet, so
 * this only ever resolves to `expressive` or `off` — `calm` is a value
 * `<Reveal>` already knows how to render, ready for when one exists.
 */
export function useMotionLevel(): MotionLevel {
  const reduced = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return reduced ? "off" : "expressive";
}
