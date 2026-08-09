import { BookOpen, CalendarCheck, Grid2x2, Sigma, Timer, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { HubCategory } from "../content";

/**
 * How a Learning Hub category presents itself.
 *
 * Two accent families rather than six. The split is not decorative: a guide
 * is either about *what* is being learned (a subject) or about *how* to
 * learn it (a method, a habit, a way of reading a report). Purple carries
 * the subjects, ember carries the skills, and the page reads as two shelves
 * rather than six colours competing at 11px.
 *
 * Colour is never the only signal — every label renders its own icon beside
 * it, and the category is spelled out in words (WCAG 1.4.1). Labels use
 * --mm-ember-ink, not --mm-ember: the accent itself is 2.9:1 on paper and
 * belongs to rules and dots, never to a word.
 */
export type HubTone = "brand" | "ember";

export interface HubCategoryPresentation {
  icon: LucideIcon;
  tone: HubTone;
}

export const HUB_CATEGORY: Record<HubCategory, HubCategoryPresentation> = {
  Maths: { icon: Sigma, tone: "brand" },
  English: { icon: BookOpen, tone: "brand" },
  "Singapore Maths": { icon: Grid2x2, tone: "brand" },
  "Exam skills": { icon: Timer, tone: "ember" },
  "For parents": { icon: Users, tone: "ember" },
  "Study habits": { icon: CalendarCheck, tone: "ember" },
};

/** Label text and its icon. AA on white and on --mm-page at 11px bold. */
export const TONE_TEXT: Record<HubTone, string> = {
  brand: "text-mm-brand",
  ember: "text-mm-ember-ink",
};

/** The 3px rule along the top edge of a guide's picture. Decorative. */
export const TONE_RULE: Record<HubTone, string> = {
  brand: "bg-mm-brand",
  ember: "bg-mm-ember",
};

/** The wash a guide with no photograph falls back to. */
export const TONE_PLATE: Record<HubTone, string> = {
  brand: "bg-[linear-gradient(150deg,var(--mm-tint)_0%,var(--mm-page)_100%)] text-mm-lilac",
  ember: "bg-[linear-gradient(150deg,var(--mm-ember-tint)_0%,var(--mm-page)_100%)] text-mm-ember/45",
};

export function hubCategory(category: HubCategory): HubCategoryPresentation {
  return HUB_CATEGORY[category];
}
