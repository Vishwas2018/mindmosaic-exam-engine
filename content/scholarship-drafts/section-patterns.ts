/**
 * Specification and data definitions for Year 6 Independent School Scholarship Practice papers.
 * Kept strictly as draft data constants in content/scholarship-drafts/ (no runtime or registry edits in Phase 1a).
 * Phase 1b will wire these into exam-pattern-registry.ts after governance lands.
 */

export interface ScholarshipPaperSectionPattern {
  id: string;
  label: string;
  examStyle: "scholarship_style";
  yearLevel: 6;
  presentation: "full_length_practice";
  basis: "internal";
  adaptations: string[];
  questionCount: number;
  timeMinutes: number;
  sources: {
    id: string;
    programmeId: string;
    count: number;
    filters: { typeIn: string[] };
    display: "merged";
  }[];
}

export const SCHOLARSHIP_Y6_SECTION_PATTERNS: readonly ScholarshipPaperSectionPattern[] = [
  {
    id: "scholarship-y6-verbal-reasoning-full",
    label: "Scholarship-style Year 6 Verbal Reasoning — Full-Length Practice",
    examStyle: "scholarship_style",
    yearLevel: 6,
    presentation: "full_length_practice",
    basis: "internal",
    adaptations: ["tight_time_pressure", "unofficial_paper_shape"],
    questionCount: 45, // Labelled engineering assumption (40s / question)
    timeMinutes: 30,
    sources: [
      {
        id: "verbal-reasoning",
        programmeId: "scholarship-y6-verbal-reasoning",
        count: 45,
        filters: { typeIn: ["multiple_choice"] },
        display: "merged",
      },
    ],
  },
  {
    id: "scholarship-y6-numerical-reasoning-full",
    label: "Scholarship-style Year 6 Numerical Reasoning — Full-Length Practice",
    examStyle: "scholarship_style",
    yearLevel: 6,
    presentation: "full_length_practice",
    basis: "internal",
    adaptations: ["tight_time_pressure", "unofficial_paper_shape"],
    questionCount: 40, // Labelled engineering assumption (45s / question)
    timeMinutes: 30,
    sources: [
      {
        id: "numerical-reasoning",
        programmeId: "scholarship-y6-numerical-reasoning",
        count: 40,
        filters: { typeIn: ["multiple_choice"] },
        display: "merged",
      },
    ],
  },
  {
    id: "scholarship-y6-reading-full",
    label: "Scholarship-style Year 6 Reading Comprehension — Full-Length Practice",
    examStyle: "scholarship_style",
    yearLevel: 6,
    presentation: "full_length_practice",
    basis: "internal",
    adaptations: ["tight_time_pressure", "unofficial_paper_shape"],
    questionCount: 35, // Labelled engineering assumption (4 passages)
    timeMinutes: 30,
    sources: [
      {
        id: "reading",
        programmeId: "scholarship-y6-reading",
        count: 35,
        filters: { typeIn: ["reading_comprehension"] },
        display: "merged",
      },
    ],
  },
  {
    id: "scholarship-y6-mathematics-full",
    label: "Scholarship-style Year 6 Mathematics — Full-Length Practice",
    examStyle: "scholarship_style",
    yearLevel: 6,
    presentation: "full_length_practice",
    basis: "internal",
    adaptations: ["tight_time_pressure", "unofficial_paper_shape"],
    questionCount: 40, // Labelled engineering assumption (45s / question)
    timeMinutes: 30,
    sources: [
      {
        id: "mathematics",
        programmeId: "scholarship-y6-mathematics",
        count: 40,
        filters: { typeIn: ["multiple_choice"] },
        display: "merged",
      },
    ],
  },
  {
    id: "scholarship-y6-written-expression-full",
    label: "Scholarship-style Year 6 Written Expression — Timed Practice",
    examStyle: "scholarship_style",
    yearLevel: 6,
    presentation: "full_length_practice",
    basis: "internal",
    adaptations: ["no_planning_screen", "parent_marked_rubric", "print_prompt_default"],
    questionCount: 1,
    timeMinutes: 15,
    sources: [
      {
        id: "writing",
        programmeId: "scholarship-y6-writing",
        count: 1,
        filters: { typeIn: ["essay"] },
        display: "merged",
      },
    ],
  },
] as const;
