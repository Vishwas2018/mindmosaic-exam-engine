/**
 * Chapter 2 scene data: the six programme scenes in story order.
 *
 * Availability is NEVER typed here. `status` (available, limited or in
 * development), covered years and the subject
 * list are read from the canonical marketing programme data (`programmes` in
 * content.ts, the same facts the /programs catalogue uses), so a scene cannot
 * claim a programme is open that the catalogue says is in development. Only
 * the presentation copy (heading, proposition, supporting facts) is local.
 *
 * Scene 6 is "Selective & scholarship preparation". The repository has a
 * selective-entry programme (in development) and lists scholarship-style
 * preparation only as a planned pathway, so the scene is anchored on the
 * selective programme and mentions scholarships strictly as a planned
 * direction, never as something a family can use.
 */

import { programmes, routes, type Programme } from "./content";
import type { Chapter2MediaKey } from "./media";

export type SceneVisualType =
  | "exam-paper"
  | "extension-question"
  | "lesson"
  | "problem-card"
  | "bar-model"
  | "skill-categories";

export type SceneStatusTone = "available" | "limited" | "in-development";

export interface ProgramSceneData {
  id: "naplan" | "icas" | "curriculum" | "amc" | "singapore" | "selective";
  /** 1-based position, shown as "03 / 06". */
  number: number;
  /** Canonical id in `programmes.items`. */
  programmeId: string;
  heading: string;
  /** Short name for the progress navigator. */
  navLabel: string;
  /** Name for the intro's six-pathway list. */
  shortName: string;
  /** The one-line proposition. */
  proposition: string;
  /** Status word, from the canonical programme: "Available", "Limited" or "In development". */
  status: "Available" | "Limited" | "In development";
  statusTone: SceneStatusTone;
  /** Status plus scope, e.g. "Available now · Years 3 & 5". */
  statusLine: string;
  /** 2 to 4 supporting facts. */
  facts: readonly string[];
  /** Optional caveat shown under the facts. */
  note?: string;
  cta: { label: string; href: string };
  visualType: SceneVisualType;
  /** Registry key for the photograph. Absent for DOM/SVG-only scenes. */
  mediaSlot?: Chapter2MediaKey;
}

function programme(id: string): Programme {
  const item = programmes.items.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`chapter2-scenes: no programme "${id}" in content.ts`);
  return item;
}

function statusOf(id: string): Pick<ProgramSceneData, "status" | "statusTone"> {
  switch (programme(id).status) {
    case "available":
      return { status: "Available", statusTone: "available" };
    case "limited":
      return { status: "Limited", statusTone: "limited" };
    case "in_development":
      return { status: "In development", statusTone: "in-development" };
  }
}

/** "Years 3 & 5" from the programme's covered years; empty when nothing is live. */
function yearsOf(id: string): string {
  const years = programme(id).coveredYears;
  return years && years.length > 0 ? `Years ${years.join(" & ")}` : "";
}

function statusLine(id: string): string {
  const { status } = statusOf(id);
  if (status === "Available") return `Available now · ${yearsOf(id)}`;
  if (status === "Limited") return `Limited · ${yearsOf(id)}`;
  return "In development";
}

export const chapter2Scenes: readonly ProgramSceneData[] = [
  {
    id: "naplan",
    number: 1,
    programmeId: "naplan-style",
    heading: "NAPLAN-style practice",
    navLabel: "NAPLAN",
    shortName: "NAPLAN-style",
    proposition: "Familiar assessment formats. Original MindMosaic questions.",
    ...statusOf("naplan-style"),
    statusLine: statusLine("naplan-style"),
    facts: [
      `${yearsOf("naplan-style").replace(" & ", " and ")}`,
      "Numeracy, Reading and Language Conventions",
      "Original questions, never past papers",
      "Short sets or a full-length simulation",
    ],
    cta: { label: "Explore NAPLAN-style practice", href: `${routes.programs}/naplan-style` },
    visualType: "exam-paper",
    mediaSlot: "naplan",
  },
  {
    id: "icas",
    number: 2,
    programmeId: "icas-style",
    heading: "ICAS-style practice",
    navLabel: "ICAS",
    shortName: "ICAS-style",
    proposition: "Questions that reward careful reading, reasoning and unfamiliar problem solving.",
    ...statusOf("icas-style"),
    statusLine: statusLine("icas-style"),
    facts: [
      `${yearsOf("icas-style").replace(" & ", " and ")}`,
      "Mathematics, English and Spelling",
      "Extension-style questions",
      "Short exam-style sets",
    ],
    cta: { label: "Explore ICAS-style practice", href: `${routes.programs}/icas-style` },
    visualType: "extension-question",
    mediaSlot: "icas",
  },
  {
    id: "curriculum",
    number: 3,
    programmeId: "australian-curriculum",
    heading: "Curriculum learning",
    navLabel: "Curriculum",
    shortName: "Curriculum learning",
    proposition: "Understand the concept, then practise where it fits.",
    ...statusOf("australian-curriculum"),
    statusLine: statusLine("australian-curriculum"),
    facts: [
      "A clear learning intention for every lesson",
      "Concept explanations with a visual example",
      "A worked example, step by step",
      "Related practice where available",
    ],
    note: "Published Maths and English lessons are available to signed-in students in Years 3 and 5. Broader curriculum coverage and exact mapping are still being developed.",
    cta: { label: "Explore learning", href: routes.learn },
    visualType: "lesson",
    mediaSlot: "curriculum",
  },
  {
    id: "amc",
    number: 4,
    programmeId: "amc-style",
    heading: "AMC-style problem solving",
    navLabel: "AMC",
    shortName: "AMC-style",
    proposition: "Multi-step mathematics that rewards reasoning, pattern recognition and persistence.",
    ...statusOf("amc-style"),
    statusLine: statusLine("amc-style"),
    facts: ["Multi-step reasoning", "Pattern spotting", "Problems designed to be worked, not recalled"],
    note: "Planned scope. No year level is open yet.",
    cta: { label: "See all programs", href: routes.programs },
    visualType: "problem-card",
    mediaSlot: "amc",
  },
  {
    id: "singapore",
    number: 5,
    programmeId: "singapore-maths",
    heading: "Singapore Maths",
    navLabel: "Singapore Maths",
    shortName: "Singapore Maths",
    proposition: "Visual models that make difficult problems easier to see.",
    ...statusOf("singapore-maths"),
    statusLine: statusLine("singapore-maths"),
    facts: ["Bar models and model drawing", "Number relationships", "Fractions and ratio", "Taught step by step, then practised"],
    note: "Planned scope. No year level is open yet.",
    cta: { label: "Explore learning", href: routes.learn },
    visualType: "bar-model",
    mediaSlot: "singapore",
  },
  {
    id: "selective",
    number: 6,
    programmeId: "selective-entry-style",
    heading: "Selective & scholarship preparation",
    navLabel: "Selective",
    shortName: "Selective & scholarship",
    proposition: "Reasoning, reading, writing and test-style preparation.",
    ...statusOf("selective-entry-style"),
    statusLine: statusLine("selective-entry-style"),
    facts: ["Mathematical reasoning", "Reading", "Thinking skills", "Writing"],
    note: "Formats and eligibility vary by state and programme. Scholarship-style preparation is a planned direction, not open.",
    cta: { label: "See all programs", href: routes.programs },
    visualType: "skill-categories",
    mediaSlot: "selective",
  },
] as const;

/**
 * Sample content for the scene visuals. All original and illustrative: none
 * of it is a real exam question, no option is marked as the answer, and the
 * NAPLAN-style and lesson samples reuse the `learningDemo` copy so the page
 * never shows two different "real product" examples.
 */
export const chapter2Demos = {
  extension: {
    label: "Sample ICAS-style extension question",
    meta: "ICAS-style · Mathematics · Year 5",
    tag: "Extension question",
    question:
      "A number machine adds 3 and then doubles. When 4 goes in, 14 comes out. What number goes in to make 22 come out?",
    options: ["6", "8", "9", "11"],
    hintLabel: "Thinking prompt",
    hint: "Work backwards: undo the last step first.",
  },
  problem: {
    label: "Sample AMC-style pattern problem",
    meta: "AMC-style · Pattern problem",
    question: "Each figure adds one more row of dots than the one before. How many dots will Figure 6 have?",
    options: ["15", "18", "21", "24", "28"],
    figures: [1, 2, 3, 4],
  },
  barModel: {
    label: "Sample Singapore Maths bar model",
    meta: "Singapore Maths · Ratio",
    question: "Mia and Ben share 40 stickers in the ratio 3 : 5. How many stickers does Ben get?",
    rows: [
      { name: "Mia", units: 3 },
      { name: "Ben", units: 5 },
    ],
    totalUnits: 8,
    total: 40,
    steps: ["Draw one bar for each person.", "Together they make 8 equal units.", "8 units = 40, so find 1 unit."],
  },
  skills: {
    label: "Sample selective-style practice paper",
    meta: "Selective-style · Practice paper",
    tag: "Timed sections",
    note: "Planned structure. Formats vary by state.",
  },
} as const;
