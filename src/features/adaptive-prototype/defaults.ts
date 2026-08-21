import type { RoutingThresholds } from "./types";

/**
 * Placeholder spike defaults, NOT a validated psychometric cut score.
 * `docs/adaptive-testlet-strategy.md` §16 explicitly leaves "items per
 * stage" and "the two routing thresholds" as open questions for a future
 * ADR-1 this repo has not written. These numbers exist so the prototype has
 * something concrete to route on; production must replace them with
 * calibrated values, not treat them as inherited decisions.
 */
/* Even, not odd: an alternating (50/50) mock-student pattern can only land
   strictly inside the "medium" band — between routeDownAt and routeUpAt —
   when the stage's item count is even. An odd count always ties exactly
   onto one of the two thresholds instead of demonstrating a stable middle
   route. */
export const DEFAULT_ITEMS_PER_STAGE = 6;

/** Symmetric around 0.5 for a simple demo: >=60% routes up, <=40% routes down. */
export const DEFAULT_ROUTING_THRESHOLDS: RoutingThresholds = {
  routeUpAt: 0.6,
  routeDownAt: 0.4,
};
