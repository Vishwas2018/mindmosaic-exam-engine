import type { ComponentType } from "react";
import {
  AmcIcon,
  OlympiadIcon,
  ScholarshipIcon,
  SelectiveEntryIcon,
  SingaporeMathsIcon,
} from "./programme-icons";

export type ProgrammeAccent = "primary" | "coral" | "teal";

export interface ProgrammeFocusArea {
  title: string;
  description: string;
}

export interface ComingSoonProgramme {
  slug: string;
  /** Short name used on compact cards (Dashboard). */
  cardTitle: string;
  /** Full name used as the hub page's heading. */
  fullTitle: string;
  scopeLabel: string;
  accent: ProgrammeAccent;
  icon: ComponentType<{ className?: string }>;
  cardDescription: string;
  /** One factual paragraph describing the real, external programme/competition. */
  about: string;
  focusAreas: readonly ProgrammeFocusArea[];
}

/**
 * The five programme tracks with no live content in this codebase today —
 * see the repo architecture audit. Each gets the same honest "Coming Soon"
 * treatment: no fabricated authoring-progress percentages, no stock photos,
 * no promise of a working practice session.
 */
export const COMING_SOON_PROGRAMMES: readonly ComingSoonProgramme[] = [
  {
    slug: "australian-maths-competition",
    cardTitle: "AMC (Australian Mathematics Competition)",
    fullTitle: "AMC (Australian Mathematics Competition)",
    scopeLabel: "Years 3–6 · Upper & Middle Primary",
    accent: "primary",
    icon: AmcIcon,
    cardDescription: "Non-routine math puzzles and multi-step logic.",
    about:
      "The Australian Mathematics Competition is one of Australia's longest-running school mathematics events, run nationally by the Australian Maths Trust. It favours non-routine problem solving and logical deduction over speed and rote calculation.",
    focusAreas: [
      { title: "Non-routine arithmetic & patterns", description: "Number sequences, modular arithmetic, and pattern-spotting beyond standard classroom drills." },
      { title: "Geometric reasoning", description: "Spatial logic, dissections, and angle reasoning without relying on a protractor." },
      { title: "Multi-step logic & combinatorics", description: "Problems that need several connected reasoning steps rather than a single formula." },
      { title: "Untimed investigation", description: "Open-ended problems designed to build resilience, not exam-speed pressure." },
    ],
  },
  {
    slug: "maths-olympiad",
    cardTitle: "Olympiad",
    fullTitle: "Primary Maths Olympiad",
    scopeLabel: "Years 4–6 · Advanced Problem Solving",
    accent: "primary",
    icon: OlympiadIcon,
    cardDescription: "Advanced thinking and contest strategies.",
    about:
      "Primary maths olympiad-style competitions extend confident students beyond the standard curriculum with creative, multi-step problems drawn from number theory, combinatorics and geometry, judged on reasoning as much as the final answer.",
    focusAreas: [
      { title: "Invariants & working backwards", description: "Reasoning strategies that don't reduce to a single memorised formula." },
      { title: "Counting techniques", description: "Systematic listing, tree diagrams, and combinatorial reasoning." },
      { title: "Divisibility & prime structure", description: "Number-theory patterns that reward careful, structured exploration." },
      { title: "Spatial reasoning & geometry", description: "Constructions and proofs built from first principles rather than lookup formulas." },
    ],
  },
  {
    slug: "selective-entry",
    cardTitle: "Selective Entry",
    fullTitle: "Selective Entry Preparation",
    scopeLabel: "Year 5–7 · Placement Test Preparation",
    accent: "coral",
    icon: SelectiveEntryIcon,
    cardDescription: "Targeted preparation for selective high school placement exams.",
    about:
      "Selective school entry exams (used by programmes such as the NSW Selective High School Placement Test and Victoria's selective entry exams) assess reading, mathematical, and abstract/verbal reasoning under timed conditions.",
    focusAreas: [
      { title: "Reading comprehension", description: "Literal and inferential comprehension across unfamiliar, exam-style passages." },
      { title: "Mathematical reasoning", description: "Applied, multi-step reasoning rather than routine computation." },
      { title: "Abstract & verbal reasoning", description: "Pattern, analogy and classification tasks distinctive to selective-style tests." },
      { title: "Thinking skills", description: "Combined-format questions that draw on more than one reasoning skill at once." },
    ],
  },
  {
    slug: "scholarship-prep",
    cardTitle: "Scholarship Prep",
    fullTitle: "Independent School Scholarship Preparation",
    scopeLabel: "Year 5–7 · Scholarship Entry",
    accent: "teal",
    icon: ScholarshipIcon,
    cardDescription: "Higher-order reasoning, abstract logic and verbal agility.",
    about:
      "Independent school scholarship exams, such as those set by ACER and Edutest, assess verbal and numerical reasoning together with a written expression task, typically at a higher level of abstraction than school classwork.",
    focusAreas: [
      { title: "Verbal reasoning & vocabulary", description: "Analogies, classification, and precise word relationships." },
      { title: "Abstract & non-verbal logic", description: "Sequence, rotation and spatial-pattern reasoning tasks." },
      { title: "Applied mathematics", description: "Multi-step, worded numerical reasoning problems." },
      { title: "Written expression", description: "Structured short-response writing under timed conditions." },
    ],
  },
  {
    slug: "singapore-maths",
    cardTitle: "Singapore Maths",
    fullTitle: "Singapore Maths (Model Method)",
    scopeLabel: "Years 3–6 · Model-Drawing Method",
    accent: "primary",
    icon: SingaporeMathsIcon,
    cardDescription: "Concrete-Pictorial-Abstract bar models and heuristics.",
    about:
      "Singapore's primary maths approach builds understanding through the Concrete-Pictorial-Abstract sequence and bar-model (“model method”) diagrams, used to represent and solve worded problems before moving to abstract notation.",
    focusAreas: [
      { title: "Part-whole & comparison models", description: "Bar diagrams that make additive and multiplicative relationships visible." },
      { title: "Equal units & before-after models", description: "Structured diagrams for change, transfer and ratio problems." },
      { title: "Practice & rate relationships", description: "Moving from a drawn model to a written proportional equation." },
      { title: "Multi-step heuristics", description: "Combining more than one bar-model technique within a single worded problem." },
    ],
  },
] as const;

export function getComingSoonProgramme(slug: string): ComingSoonProgramme | undefined {
  return COMING_SOON_PROGRAMMES.find((programme) => programme.slug === slug);
}
