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
    mediaSlot: "selective",
  },
] as const;
