import type { PlanTier, Program } from "./catalogue";

/**
 * The signed-in viewer's plan for catalogue gating purposes. "free" is the
 * safe default for guests and any student without a resolved subscription —
 * matching docs/PRIVACY_AND_BILLING_GUARDRAILS.md's stance that billing
 * `hasAccess` is display-only until entitlement enforcement ships
 * (see PlanTier in ./catalogue.ts). This type is the seam that later batch
 * plugs a real subscription-derived value into.
 */
export type StudentPlan = PlanTier;

/**
 * Whether a catalogue program should render as locked for the given plan.
 * A program with no `planTier` (the default for every program today) is
 * never locked — only a program that has explicitly opted into "premium"
 * can be gated, and none currently does.
 */
export function isProgramLocked(program: Program, plan: StudentPlan): boolean {
  return program.planTier === "premium" && plan !== "premium";
}
