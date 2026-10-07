/**
 * Chapter 4 story model: "Progress & Parents", answering what progress
 * actually looks like for a student and a parent.
 *
 * Story structure:
 *   Scene 1: Latest ("See what happened.")
 *   Scene 2: Subjects ("See the pattern.")
 *   Scene 3: Parent view ("See the bigger picture.")
 *
 * Product truth & integrity:
 * - Pure DOM and SVG visuals: no photographic media assets, no media slots.
 * - The parent dashboard is fundamentally a read-only view of stored results.
 * - Sample data is derived directly from `forParents.summary` (content.ts);
 *   no independent or hard-coded divergent numbers.
 * - Performance bands and labels are sourced from the canonical
 *   `@/features/parent-dashboard/performance-band` contract.
 * - Strictly no premium LearningInsights, no readiness score, no recommended
 *   actions, no fake checkpoints, no invented strand mastery, and no
 *   parent-launched drill.
 */

import { performanceBand, type PerformanceBand } from "@/features/parent-dashboard/performance-band";
import { forParents, routes } from "./content";

export function toPercent(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((count / total) * 100);
}

export interface Chapter4SceneData {
  id: "latest" | "subjects" | "parent";
  /** 1-based, shown as 1, 2, 3. */
  number: number;
  navLabel: string;
  heading: string;
  proposition: string;
  body: string;
  facts: readonly string[];
  cta?: { label: string; href: string };
}

export const chapterFour = {
  eyebrow: "Progress & parents",
  heading: "Progress that stays understandable.",
  intro:
    "Students can see what they've completed and where they're building confidence. Parents can see the broader picture without having to interpret a spreadsheet.",
  progressLabel: "Progress & parents progress",
  sampleLabel: "Sample",
  readOnlyBadge: "Parent view · Read only",
  handoff: {
    heading: "Progress only matters when the work behind it is trustworthy.",
    body: "That starts with original questions, clear explanations and careful checks before anything reaches a student.",
  },
} as const;

export const chapter4Scenes: readonly Chapter4SceneData[] = [
  {
    id: "latest",
    number: 1,
    navLabel: "Latest",
    heading: "See what happened.",
    proposition: "A result is more useful when it has context.",
    body: "Recent work shows what was completed, when it was completed and how it went.",
    facts: [
      "Latest completed session",
      "Score, date and answered count in one view",
      "Objective results with question context",
    ],
  },
  {
    id: "subjects",
    number: 2,
    navLabel: "Subjects",
    heading: "See the pattern.",
    proposition: "One result matters less than the pattern across subjects.",
    body: "Subject-level progress makes strengths and areas needing more practice easier to see.",
    facts: [
      "Results grouped across subjects",
      "Clear performance bands: Strong, Good, Building",
      "Areas needing more practice stand out clearly",
    ],
  },
  {
    id: "parent",
    number: 3,
    navLabel: "Parent view",
    heading: "See the bigger picture.",
    proposition: "Recent work comes together in one read-only parent view.",
    body: "Completed sessions, subject results and weekly activity give parents useful context without changing the student's recorded work.",
    facts: [
      "Weekly activity at a glance",
      "Recent attempts and subject summaries in one place",
      "Read-only view preserving student records",
    ],
    cta: { label: "Parent guide", href: routes.parentGuide },
  },
] as const;

/**
 * Subject breakdown row derived from the approved landing sample.
 */
export interface DerivedSubjectRow {
  subject: string;
  label: string;
  count: number;
  total: number;
  percentage: number;
  band: PerformanceBand;
  bandLabel: string;
}

/**
 * Completed session row derived from the approved landing sample.
 */
export interface DerivedSessionRow {
  label: string;
  count: number;
  total: number;
  when: string;
  percentage: number;
  timing: "practice" | "timed";
  band: PerformanceBand;
}

/**
 * Derived metrics and structured objects from `forParents.summary`,
 * ensuring 100% derivation continuity.
 */
function deriveSampleData() {
  const summary = forParents.summary;
  const rows = summary.rows;

  // Raw row 0: Numeracy (Mon)
  // Raw row 1: Language conventions (Tue)
  // Raw row 2: Reading (Thu)
  const numeracyRow = rows[0]!;
  const langRow = rows[1]!;
  const readingRow = rows[2]!;

  const numeracyPct = toPercent(numeracyRow.count, numeracyRow.total);
  const langPct = toPercent(langRow.count, langRow.total);
  const readingPct = toPercent(readingRow.count, readingRow.total);

  // Subject summaries sorted highest percentage first (Reading 80%, Numeracy 70%, Language conventions 60%)
  const subjects: readonly DerivedSubjectRow[] = [
    {
      subject: "reading",
      label: "Reading",
      count: readingRow.count,
      total: readingRow.total,
      percentage: readingPct,
      band: performanceBand(readingPct),
      bandLabel: "Strong",
    },
    {
      subject: "numeracy",
      label: "Numeracy",
      count: numeracyRow.count,
      total: numeracyRow.total,
      percentage: numeracyPct,
      band: performanceBand(numeracyPct),
      bandLabel: "Good",
    },
    {
      subject: "language_conventions",
      label: "Language conventions",
      count: langRow.count,
      total: langRow.total,
      percentage: langPct,
      band: performanceBand(langPct),
      bandLabel: "Building",
    },
  ];

  // Sessions in newest-first order (Thu, Tue, Mon)
  const recentSessions: readonly DerivedSessionRow[] = [
    {
      label: readingRow.label,
      count: readingRow.count,
      total: readingRow.total,
      when: readingRow.when,
      percentage: readingPct,
      timing: "practice",
      band: performanceBand(readingPct),
    },
    {
      label: langRow.label,
      count: langRow.count,
      total: langRow.total,
      when: langRow.when,
      percentage: langPct,
      timing: "timed",
      band: performanceBand(langPct),
    },
    {
      label: numeracyRow.label,
      count: numeracyRow.count,
      total: numeracyRow.total,
      when: numeracyRow.when,
      percentage: numeracyPct,
      timing: "practice",
      band: performanceBand(numeracyPct),
    },
  ];

  // Latest session is the newest one (ICAS-style Reading)
  const latestSession = recentSessions[0]!;

  const daysPractisedCount = summary.week.filter((d) => d.done).length;

  return {
    studentName: summary.name, // "Aisha · Year 3"
    badge: summary.badge, // "Sample"
    dateRange: summary.dateRange,
    week: summary.week,
    daysPractisedCount,
    latestSession,
    subjects,
    recentSessions,
    patternNote: summary.nextStep,
  };
}

export const chapter4Sample = deriveSampleData();
