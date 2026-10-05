import "server-only";

import { getPatternReadiness } from "@/server/exam-bank";

export type SubjectStatus = "available" | "reduced_practice" | "not_available";

export interface SubjectRow {
  readonly name: string;
  readonly detail: string;
  readonly status: SubjectStatus;
  readonly note?: string;
}

export interface ProgrammeYearStatus {
  readonly year: 3 | 5;
  readonly naplan: readonly SubjectRow[];
  readonly icas: readonly SubjectRow[];
}

/**
 * Per-subject availability for the two live families, read straight off
 * `getPatternReadiness()` — the same readiness walk the exam setup screen
 * uses — so this page can never claim a subject is open that the bank
 * can't actually fill, or hide one that it can.
 *
 * "ready" reads as "available" and "short" as "reduced_practice": a short paper runs
 * as a real (if reduced) practice set, and the exam-setup screen is where
 * the exact question count belongs, not the marketing page. "unavailable"
 * reads as "not available" whether the pattern is formally `deferred`
 * (Writing) or just has zero gated questions yet (Year 5 ICAS Science) —
 * both mean a visitor cannot sit it today.
 */
function subjectStatus(patternId: string): SubjectStatus {
  const state = getPatternReadiness()[patternId]?.state;
  return state === "ready" ? "available" : state === "short" ? "reduced_practice" : "not_available";
}

function naplanSubjects(year: 3 | 5): readonly SubjectRow[] {
  return [
    {
      name: "Numeracy",
      detail: "Number, measurement, geometry and problem solving.",
      status: subjectStatus(`naplan-y${year}-numeracy-full`),
    },
    {
      name: "Reading",
      detail: "Original passages with reasoning-focused questions.",
      status: subjectStatus(`naplan-y${year}-reading-full`),
    },
    {
      name: "Language Conventions",
      detail: "Spelling, grammar and punctuation.",
      status: subjectStatus(`naplan-y${year}-language-full`),
    },
    {
      name: "Writing",
      detail: "Not a separate program yet.",
      status: "not_available",
      note: "Dedicated writing papers are deferred; existing tasks require manual review.",
    },
  ];
}

function icasSubjects(year: 3 | 5): readonly SubjectRow[] {
  return [
    {
      name: "Mathematics",
      detail: "Mathematical reasoning and problem solving.",
      status: subjectStatus(`icas-y${year}-numeracy-full`),
    },
    {
      name: "English: Reading",
      detail: "Reasoning-focused reading with original passages.",
      status: subjectStatus(`icas-y${year}-reading-module`),
    },
    {
      name: "English: Language",
      detail: "Spelling, grammar and punctuation with a reasoning focus.",
      status: subjectStatus(`icas-y${year}-language-module`),
    },
    {
      name: "Spelling Bee",
      detail: "Spelling delivered as text rather than the official audio format.",
      status: subjectStatus(`icas-y${year}-spelling-full`),
    },
    {
      name: "Science",
      detail: "Science reasoning and problem solving.",
      status: subjectStatus(`icas-y${year}-science-full`),
    },
    {
      name: "Digital Technologies",
      detail: "Computational and digital-systems thinking.",
      status: subjectStatus(`icas-y${year}-digital-technologies-full`),
    },
    {
      name: "Writing",
      detail: "Not a separate program yet.",
      status: "not_available",
      note: "Dedicated writing papers are deferred; existing tasks require manual review.",
    },
  ];
}

/** Computed once per process — the gated bank is a frozen module-level array. */
let cache: readonly [ProgrammeYearStatus, ProgrammeYearStatus] | undefined;

export function getProgrammeAvailability(): readonly [ProgrammeYearStatus, ProgrammeYearStatus] {
  cache ??= [
    { year: 3, naplan: naplanSubjects(3), icas: icasSubjects(3) },
    { year: 5, naplan: naplanSubjects(5), icas: icasSubjects(5) },
  ];
  return cache;
}

/** The six families with no bank content at all yet — shown as "Planned", not dated. */
export const PLANNED_PATHWAYS: ReadonlyArray<{ readonly name: string; readonly blurb: string }> = [
  { name: "Singapore Maths", blurb: "Bar-model and model-method maths, taught step by step." },
  { name: "AMC-style", blurb: "Multi-step competition problem solving." },
  { name: "Olympiad-style", blurb: "Extension and enrichment problems." },
  { name: "Selective-entry-style", blurb: "Reading, mathematical and thinking-skills reasoning. Varies by state." },
  { name: "Scholarship-style", blurb: "Preparation for independent-school scholarship tests." },
  { name: "Learning Hub", blurb: "Guides and short reads for families." },
];
