import { DEFAULT_ROUTING_THRESHOLDS } from "./defaults";
import type { DifficultyBand, RoutingThresholds } from "./types";

export { DEFAULT_ROUTING_THRESHOLDS };

/**
 * Strategy doc D1: "Routing testlet -> Stage 2 band from S1 score -> Stage 3
 * band from running score." Both transitions call this same function —
 * only what "running score" means at that point (stage 1 alone, or stage
 * 1+2 combined) differs, which is the simulator's job, not this one's.
 *
 * `runningScore` is a 0-1 proportion correct. At or above `routeUpAt`
 * routes to `challenging`; at or below `routeDownAt` routes to `easy`;
 * otherwise `medium`. Ties go up/down rather than to medium, so a student
 * landing exactly on a threshold is never read as "no signal".
 */
export function routeBand(
  runningScore: number,
  thresholds: RoutingThresholds = DEFAULT_ROUTING_THRESHOLDS,
): DifficultyBand {
  if (thresholds.routeDownAt >= thresholds.routeUpAt) {
    throw new Error(
      `routeDownAt (${thresholds.routeDownAt}) must be less than routeUpAt (${thresholds.routeUpAt}) — otherwise "medium" can never be routed to.`,
    );
  }
  if (runningScore >= thresholds.routeUpAt) return "challenging";
  if (runningScore <= thresholds.routeDownAt) return "easy";
  return "medium";
}
