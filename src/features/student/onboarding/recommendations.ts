/**
 * Practice recommendations derived from a five-question diagnostic warm-up.
 *
 * Every recommendation is computed from the child's own recorded answers (the
 * per-skill baseline) and from what Practice Studio can actually serve today.
 * Nothing is recommended for a skill that was answered correctly, nothing is
 * invented for a subject with no open practice, and five questions are a very
 * small sample — so the result is framed as a starting point, never a level.
 *
 * Pure and deterministic: no I/O, no clock, no randomness.
 *
 * @module
 */

import { REGISTRY_SUBJECT_BY_FILTER } from "@/features/exam-engine/selection/selection-config";
import { strandKey, type StudioAvailability, type SubjectAvailability } from "@/features/practice-studio/availability";
import type { DiagnosticBaselineRecord, SkillBaselineEntry } from "./baseline-contract";

import { countLabel } from "@/lib/format-count";
export interface WarmupRecommendation {
  /** Why this is recommended, in terms of the child's own answers. */
  readonly reason: string;
  /** Short title: the skill (or subject) practised. */
  readonly title: string;
  readonly subjectLabel: string;
  readonly kind: "focus_area" | "developing";
  /** Where to go. A direct Practice Studio set when a matching strand is open, else the Practice Studio itself. */
  readonly href: string;
  readonly cta: string;
  /** The set is a direct, ready-to-start practice set (true) or a pointer to the studio (false). */
  readonly direct: boolean;
}

export interface WarmupRecommendations {
  readonly items: readonly WarmupRecommendation[];
  /** Skills answered correctly (strength tier), named so the screen can say what went well. */
  readonly strengths: readonly string[];
  /** Set when there is nothing to practise from this warm-up, with the honest reason. */
  readonly note: string | null;
}

const MAX_RECOMMENDATIONS = 3;
const DEFAULT_SET_SIZE = 10;
const STYLE_PREFERENCE: readonly SubjectAvailability["examStyle"][] = ["naplan_style", "icas_style"];

const SUBJECT_LABEL: Readonly<Record<string, string>> = {
  numeracy: "Numeracy",
  reading: "Reading",
  language_conventions: "Language",
  spelling: "Spelling",
  science: "Science",
  digital_technologies: "Digital Technologies",
};

const FILTER_BY_REGISTRY: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(REGISTRY_SUBJECT_BY_FILTER).map(([filter, registry]) => [registry, filter]),
);

function ordered(skills: readonly SkillBaselineEntry[]): SkillBaselineEntry[] {
  /* Weakest first; more wrong answers first; then a stable alphabetical order so equal skills never reshuffle. */
  return [...skills].sort(
    (a, b) =>
      a.accuracy - b.accuracy ||
      b.incorrectCount - a.incorrectCount ||
      `${a.subject}\0${a.skill}`.localeCompare(`${b.subject}\0${b.skill}`),
  );
}

function openSubject(
  availability: StudioAvailability,
  yearLevel: number,
  subjectFilter: string,
): SubjectAvailability | null {
  for (const style of STYLE_PREFERENCE) {
    const found = availability.subjects.find(
      (s) => s.yearLevel === yearLevel && s.examStyle === style && s.subject === subjectFilter && s.state === "ready",
    );
    if (found) return found;
  }
  return null;
}

export function recommendFromWarmup(
  baseline: DiagnosticBaselineRecord,
  availability: StudioAvailability,
): WarmupRecommendations {
  const strengths = baseline.skills.filter((s) => s.performanceTier === "strength").map((s) => s.skill);
  const needing = ordered(baseline.skills.filter((s) => s.performanceTier !== "strength" && s.marksAvailable > 0));

  if (baseline.skills.every((s) => s.marksAvailable === 0)) {
    return { items: [], strengths, note: "None of the warm-up questions could be marked automatically, so there is nothing to recommend yet." };
  }

  const items: WarmupRecommendation[] = [];
  const usedSubjects = new Set<string>();

  for (const skill of needing) {
    if (items.length >= MAX_RECOMMENDATIONS) break;
    const filter = FILTER_BY_REGISTRY[skill.subject];
    if (!filter) continue;
    const subject = openSubject(availability, baseline.yearLevel, filter);
    if (!subject) continue; // Never point at practice that is not open.

    const subjectLabel = SUBJECT_LABEL[skill.subject] ?? skill.subject;
    const key = strandKey(skill.strand);
    const strand = subject.strands.find((s) => s.strandKey === key && s.eligible && s.uniqueQuestions !== null);
    const kind = skill.performanceTier === "focus_area" ? "focus_area" : "developing";
    const score = `${skill.marksEarned} of ${skill.marksAvailable}`;
    const reason =
      kind === "focus_area"
        ? `You got ${score} on ${skill.skill} in the warm-up, so this is a good place to practise.`
        : `You got ${score} on ${skill.skill} in the warm-up — close, and worth a little more practice.`;

    /* One recommendation per subject: two skills in the same subject point at the same studio set. */
    const dedupeKey = `${subject.subject}:${strand?.strandKey ?? "*"}`;
    if (usedSubjects.has(dedupeKey)) continue;
    usedSubjects.add(dedupeKey);

    if (strand) {
      const size = strand.uniqueQuestions! >= DEFAULT_SET_SIZE ? DEFAULT_SET_SIZE : 5;
      items.push({
        reason,
        title: `${subjectLabel}: ${strand.strand}`,
        subjectLabel,
        kind,
        href: `/practice/session?year=${baseline.yearLevel}&style=${subject.examStyle}&subject=${subject.subject}&count=${size}&strand=${encodeURIComponent(strand.strandKey)}&untimed=1`,
        cta: `Practise ${countLabel(size, "question")}`,
        direct: true,
      });
    } else {
      items.push({
        reason,
        title: `${subjectLabel}: ${skill.skill}`,
        subjectLabel,
        kind,
        href: "/student/practice",
        cta: `Choose ${subjectLabel} in Practice Studio`,
        direct: false,
      });
    }
  }

  if (items.length > 0) return { items, strengths, note: null };

  if (needing.length === 0) {
    return {
      items,
      strengths,
      note: "You answered every warm-up question correctly, so there is no weaker area to point at. A short practice set or a lesson is a good next step.",
    };
  }
  return {
    items,
    strengths,
    note: "There is no open practice for the areas that were harder this time yet. You can still browse everything that is open in Practice Studio.",
  };
}
