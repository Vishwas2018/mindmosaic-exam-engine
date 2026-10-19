/**
 * Chapter 3 story model: "How it works", told as one concept moving through
 * four connected steps (learn, practise, understand, what next).
 *
 * The product samples are NOT copied here. The lesson, the practice question
 * and the skill breakdown are the approved landing samples that already live
 * in content.ts (`learningDemo.learnDemo`, `learningDemo.practiseDemo`,
 * `respondsToStudent.sample`); this file only selects and exposes them, so
 * there is one source for every number and word in the visuals.
 *
 * Product truth for the final scene (src/features/exam-engine/recommendation):
 * suggestions are deterministic and rule-based; only objective questions are
 * considered (manually reviewed writing is excluded); incorrect and
 * unanswered objective questions are grouped by skill; up to three
 * suggestions are ranked; a perfect eligible result, or no eligible missed
 * skills, produces none; the focused set is exactly five published
 * questions and is offered only when enough suitable questions exist.
 * Copy below therefore says "after an eligible test", "can", and "when enough
 * suitable published questions are available", and never "every test".
 * Chapter 3 is DOM/SVG only: it has no photography and no media-registry slots.
 */

import { learningDemo, respondsToStudent, routes } from "./content";

export type JourneyStateId = "lesson" | "question-select" | "question-review" | "results";

export interface JourneySceneData {
  id: "learn" | "practise" | "understand" | "next";
  /** 1-based, shown as "02 / 04". */
  number: number;
  navLabel: string;
  heading: string;
  proposition: string;
  body: string;
  facts: readonly string[];
  /** Short caveat shown under the facts. */
  note?: string;
  cta?: { label: string; href: string };
  /** Which state of the product frame this scene shows. */
  state: JourneyStateId;
}

export const chapterThree = {
  eyebrow: "How it works",
  heading: "One concept. Four connected steps.",
  intro: "Learn the idea, practise it, understand the mistake and see what may be worth working on next.",
  progressLabel: "How it works progress",
  sampleLabel: "Sample",
  frameLabel: "MindMosaic sample view",
  handoff: {
    heading: "See progress clearly.",
    body: "Students can see what to revisit, while parents can understand recent work and where support may help.",
  },
} as const;

export const chapter3Scenes: readonly JourneySceneData[] = [
  {
    id: "learn",
    number: 1,
    navLabel: "Learn",
    heading: "Learn the concept.",
    proposition: "Start with understanding.",
    body: "A clear explanation, a visual model and a worked example before the student moves on.",
    facts: [
      "A learning intention up front",
      "A visual model of the idea",
      "A worked example, step by step",
      "A common mix-up to avoid",
    ],
    cta: { label: "Explore learning", href: routes.learn },
    state: "lesson",
  },
  {
    id: "practise",
    number: 2,
    navLabel: "Practise",
    heading: "Practise it.",
    proposition: "Try the idea for yourself.",
    body: "Original questions let students apply what they have just learned.",
    facts: ["Original questions, never past papers", "Choose an answer, then check it", "Practice by year, subject or skill"],
    cta: { label: "Try practice", href: routes.guestPractice },
    state: "question-select",
  },
  {
    id: "understand",
    number: 3,
    navLabel: "Understand",
    heading: "Understand the mistake.",
    proposition: "A wrong answer should explain something.",
    body: "Instead of a bare red cross, the student sees their answer, the correct answer and the working, step by step.",
    facts: ["Your answer beside the correct answer", "Worked explanations follow practice answers"],
    state: "question-review",
  },
  {
    id: "next",
    number: 4,
    navLabel: "Next",
    heading: "Know what to work on next.",
    proposition: "Results can turn missed skills into a focused next step.",
    body: "After an eligible test, MindMosaic can highlight missed objective skills and offer a focused five-question practice set when enough suitable published questions are available.",
    facts: [
      "Skills named, not just one score",
      "Up to three suggestions, ranked by fixed rules",
      "Objective questions only; written work is reviewed separately",
    ],
    note: "Suggestions follow fixed rules applied to the student's answers.",
    cta: { label: "Explore practice", href: routes.guestPractice },
    state: "results",
  },
] as const;

/** The approved samples the visuals draw from. */
export const journeySamples = {
  lesson: learningDemo.learnDemo,
  practice: learningDemo.practiseDemo,
  results: respondsToStudent.sample,
} as const;

/** The option the sample student picks: wrong on purpose, so the review has something to explain. */
export function selectedSampleOption() {
  const option = learningDemo.practiseDemo.options.find((candidate) => !candidate.correct);
  if (!option) throw new Error("chapter3-journey: practise sample has no incorrect option");
  return option;
}

export function correctSampleOption() {
  const option = learningDemo.practiseDemo.options.find((candidate) => candidate.correct);
  if (!option) throw new Error("chapter3-journey: practise sample has no correct option");
  return option;
}
