import { AlertTriangle, Check, CheckCircle2, Minus, XCircle } from "lucide-react";
import type { ComponentType } from "react";

/**
 * The one shared vocabulary every question renderer's per-element styling
 * goes through, once a practice question carries a `reveal` (see
 * types/renderer.ts's `QuestionReveal`). Replaces each renderer's own
 * hand-rolled `border-royal/...`/`has-[:checked]:...` Tailwind string with a
 * single reusable mapping, built only from this app's existing semantic
 * design tokens (`src/app/globals.css`'s `primary`/`coral-*`/`teal-*`/
 * `parchment-*`/`plum-*` family — the same one `PracticeSession.tsx`'s own
 * `STATUS_COPY` already uses) — never new raw hex, and never the older
 * `royal`/`ink`/`page` vocabulary the renderers used before this.
 *
 * `incorrect` deliberately borders in ink (`plum-dark`), not red/coral —
 * matching docs/design.md:1167-1177's rule to never rely on colour alone
 * for critical state: every graded element also carries an icon and a
 * short text tag (see STATE_ICON/STATE_TAG_LABEL below), so the ink border
 * plus coral fill is reinforcement, not the sole signal.
 */
export type ElementState =
  | "idle"
  | "selected"
  | "correct"
  | "incorrect"
  | "missed"
  | "disabled"
  | "error";

const CLASSES: Record<ElementState, string> = {
  idle: "border border-parchment-border bg-white",
  selected: "border-2 border-primary bg-primary-tint",
  correct: "border-2 border-teal-accent bg-teal-light",
  incorrect: "border-2 border-plum-dark bg-coral-light",
  missed: "border-2 border-dashed border-teal-accent bg-white",
  disabled: "border border-parchment-border bg-parchment-subtle text-plum-muted",
  error: "border-2 border-plum-dark bg-coral-light",
};

/** The site-standard focus ring (matches PracticeSession.tsx's buttons), layered on top of whichever state above is active — never a second, bespoke ring just for questions. */
export const FOCUS_RING_CLASSES =
  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary";

export function elementStateClasses(state: ElementState): string {
  return CLASSES[state];
}

/** Same tokens as elementStateClasses, as CSS custom-property values — for SVG fill/stroke attributes, which can't take Tailwind classes. Hotspot's only consumer. */
export function elementStateSvgColors(state: ElementState): { fill: string; stroke: string } {
  switch (state) {
    case "selected":
      return { fill: "var(--color-primary-tint)", stroke: "var(--color-primary)" };
    case "correct":
      return { fill: "var(--color-teal-light)", stroke: "var(--color-teal-accent)" };
    case "incorrect":
    case "error":
      return { fill: "var(--color-coral-light)", stroke: "var(--color-plum-dark)" };
    case "missed":
      return { fill: "transparent", stroke: "var(--color-teal-accent)" };
    case "disabled":
      return { fill: "var(--color-parchment-subtle)", stroke: "var(--color-parchment-border)" };
    case "idle":
      return { fill: "white", stroke: "var(--color-parchment-border)" };
  }
}

interface StateSignal {
  readonly icon: ComponentType<{ className?: string; "aria-hidden"?: "true" | "false" | boolean }>;
  readonly label: string;
  readonly textClass: string;
}

/** Icon + short text tag for the 4 graded states — idle/selected/disabled never get a tag (nothing has been graded yet). Every entry pairs colour with both an icon and text, per docs/design.md's critical-state rule. */
const GRADED_SIGNALS: Partial<Record<ElementState, StateSignal>> = {
  correct: { icon: CheckCircle2, label: "Correct", textClass: "text-teal-accent" },
  incorrect: { icon: XCircle, label: "Your answer", textClass: "text-coral-accent" },
  missed: { icon: Check, label: "Correct answer", textClass: "text-teal-accent" },
  error: { icon: AlertTriangle, label: "Answer needed", textClass: "text-coral-accent" },
};

export function stateSignal(state: ElementState): StateSignal | undefined {
  return GRADED_SIGNALS[state];
}

/** For a type with no per-element correctness split (e.g. ordering, hotspot — no "missed" concept), the note shown instead of a tag. */
export const NOT_GRADED_SIGNAL: StateSignal = {
  icon: Minus,
  label: "Not applicable",
  textClass: "text-plum-muted",
};
