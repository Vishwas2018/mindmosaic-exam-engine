import { BookOpen, Calculator, PenLine, Shuffle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { FIXED_EXAM_DURATION_SECONDS } from "@/features/exam-engine/selection";

import type { Program } from "./catalogue";

/**
 * The one place subject and assessment-style presentation is defined.
 *
 * Card, filter chip and legend all read from here, so a subject's colour and
 * mark cannot drift between them — the previous code decided "is this ICAS?"
 * and "what colour is numeracy?" inline at each call site.
 *
 * Colour never carries meaning on its own: every card shows the subject's
 * name in its title and its assessment style as a text badge, so the accent
 * is reinforcement, not the signal (WCAG 1.4.1).
 */
export type CatalogueSubject = "numeracy" | "reading" | "language";

export interface SubjectPresentation {
  label: string;
  icon: LucideIcon;
  /** Icon tile: tinted background + accent foreground. */
  tile: string;
  /** Thin accent rule at the top of a card. */
  rule: string;
}

export const SUBJECT_PRESENTATION: Record<CatalogueSubject, SubjectPresentation> = {
  numeracy: {
    label: "Numeracy",
    icon: Calculator,
    tile: "bg-royal/8 text-royal",
    rule: "bg-royal",
  },
  reading: {
    label: "Reading",
    icon: BookOpen,
    tile: "bg-success/10 text-success",
    rule: "bg-success",
  },
  language: {
    label: "Language Conventions",
    icon: PenLine,
    tile: "bg-royal-orange/12 text-warning",
    rule: "bg-royal-orange",
  },
};

/** The unscoped "build your own" pathway — every subject, so no single accent. */
export const BUILD_YOUR_OWN_PRESENTATION: SubjectPresentation = {
  label: "Any subject",
  icon: Shuffle,
  tile: "bg-royal/8 text-royal",
  rule: "bg-[linear-gradient(90deg,var(--royal-purple),var(--success),var(--royal-orange))]",
};

export function subjectPresentation(program: Program): SubjectPresentation {
  const subject = program.scope?.subject;
  if (!subject) return BUILD_YOUR_OWN_PRESENTATION;
  return SUBJECT_PRESENTATION[subject as CatalogueSubject] ?? BUILD_YOUR_OWN_PRESENTATION;
}

export function examStyleLabel(program: Program): string {
  if (!program.scope) return "Build your own";
  return program.scope.examStyle === "icas_style" ? "ICAS-style" : "NAPLAN-style";
}

/** NAPLAN warm/orange, ICAS lavender/purple — one decision, one place. */
export function examStyleBadgeVariant(program: Program): "orange" | "purple" {
  return program.scope?.examStyle === "icas_style" ? "purple" : "orange";
}

/**
 * Approximate sitting length, phrased as the range a student can actually
 * choose between rather than one invented number.
 *
 * Derived from FIXED_EXAM_DURATION_SECONDS (the same table the configurator
 * and the timer use) restricted to the lengths this program's available
 * questions can fill — offering "up to 45 min" for a program with 17
 * questions would promise a 30-question sitting it cannot serve.
 */
export function estimatedDurationLabel(availableQuestions: number): string | null {
  const fillable = (["10", "20", "30"] as const).filter(
    (option) => availableQuestions >= Number(option),
  );
  if (fillable.length === 0) return null;

  const minutes = fillable.map((option) => FIXED_EXAM_DURATION_SECONDS[option] / 60);
  const low = Math.min(...minutes);
  const high = Math.max(...minutes);
  return low === high ? `Approx. ${low} min` : `Approx. ${low}–${high} min`;
}
