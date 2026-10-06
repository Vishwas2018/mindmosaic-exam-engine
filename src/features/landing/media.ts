/**
 * Landing media registry: the single source of truth for the cinematic
 * landing chapters' photography. Components read a logical slot from here and
 * never hold an image path of their own, so swapping a visual is an edit to
 * this file (or a new file dropped into the chapter's folder), never a
 * component change. Owner guide: docs/landing-media-guide.md.
 *
 * Physical layout (one folder per chapter, versioned file names):
 *
 *   public/landing/media/chapter-01-intro/ch01-hero-primary-v1.webp
 *   public/landing/media/chapter-02-programs/<programme>/ch02-<programme>-primary-v1.webp
 *
 * Cache safety: a file is addressed as `basePath` + `revision`, e.g.
 * `ch01-hero-primary.webp` + `v1` -> `ch01-hero-primary-v1.webp`. A new
 * picture is a new file with a new revision, so a browser or CDN can never
 * serve the old one under the same URL.
 *
 * Imagery rules (docs/design.md section 27): photography only, never fake
 * interface or burned-in logos or text. The real MindMosaic logo is drawn in
 * the DOM.
 *
 * Accessibility contract: `sceneDescription` is for the OWNER (what the picture
 * is). It is never rendered. `alt` is what the page actually puts on the
 * <img>. A `decorative` slot must have `alt: ""`: the meaning is already in the
 * page text, so a screen reader should skip the picture.
 */

import type { CinematicPreset } from "./cinematic/config";

/** Which candidate the page renders. Exactly one candidate per chapter is "active". */
export type MediaSelection = "active" | "alternate";

/**
 * How finished the physical file is. Independent of selection: switching a
 * stand-in to active does not make it production-ready.
 *  - "stand-in":   a temporary substitute, not the intended scene.
 *  - "interim":    the intended scene, below the final production specification.
 *  - "production": approved final asset that meets the production requirements.
 */
export type MediaAssetStatus = "stand-in" | "interim" | "production";

/** Docs/design.md section 39.2 budgets face-visible photographs per page. */
export type MediaTreatment = "face-visible" | "hands-only" | "abstract";

interface LandingMediaSlotBase {
  /** Owner-facing name. */
  label: string;
  /** File path WITHOUT the revision suffix, relative to the site root. */
  basePath: string;
  /** Appended to the file name: v1, v2... Bump it when the picture changes. */
  revision: string;
  /** Owner-facing description of the scene. Never rendered as alt text. */
  sceneDescription: string;
  /** CSS object-position per breakpoint: keeps the subject on screen when cropped. */
  focalMobile: string;
  focalTablet: string;
  focalDesktop: string;
  /** Zoom recipe name from cinematic/config.ts. */
  motionPreset: CinematicPreset;
  selection: MediaSelection;
  assetStatus: MediaAssetStatus;
  treatment: MediaTreatment;
  notes: string;
}

/** Decorative: the page text carries the meaning, so the image has an empty alt. */
type DecorativeSlot = LandingMediaSlotBase & { decorative: true; alt: "" };
/** Informative: the image carries meaning of its own and needs real alt text. */
type InformativeSlot = LandingMediaSlotBase & { decorative: false; alt: string };

export type LandingMediaSlot = DecorativeSlot | InformativeSlot;

/**
 * `/landing/media/x/name.webp` + `v1` -> `/landing/media/x/name-v1.webp`.
 * Throws on a path with no extension so a typo fails loudly in tests and
 * build rather than shipping a broken URL.
 */
export function resolveMediaAsset(basePath: string, revision: string): string {
  const dot = basePath.lastIndexOf(".");
  if (dot <= basePath.lastIndexOf("/")) {
    throw new Error(`resolveMediaAsset: "${basePath}" has no file extension`);
  }
  return `${basePath.slice(0, dot)}-${revision}${basePath.slice(dot)}`;
}

export function resolveSlotSrc(slot: LandingMediaSlot): string {
  return resolveMediaAsset(slot.basePath, slot.revision);
}

const CHAPTER_1_DIR = "/landing/media/chapter-01-intro";

type Chapter1Option = "optionA" | "optionB" | "optionC";

/**
 * WHICH PICTURE IS LIVE: change this one word to "optionA" or "optionC" to
 * switch Chapter 1 to another candidate. Nothing else needs to change.
 */
export const CHAPTER_1_ACTIVE_OPTION: Chapter1Option = "optionB";

/** A candidate as written by hand: everything except `selection`, which is derived. */
export type SlotCandidate = LandingMediaSlot extends infer Slot
  ? Slot extends LandingMediaSlot
    ? Omit<Slot, "selection">
    : never
  : never;

const chapter1Candidates: Record<Chapter1Option, SlotCandidate> = {
  optionA: {
    label: "Option A - solo study scene",
    basePath: `${CHAPTER_1_DIR}/ch01-hero-alt-a.webp`,
    revision: "v1",
    decorative: true,
    alt: "",
    sceneDescription: "A student in a purple jumper writes in a notebook at a sunlit desk, seen from behind, with a laptop and a pot of pencils",
    focalMobile: "72% 50%",
    focalTablet: "72% 50%",
    focalDesktop: "74% 50%",
    motionPreset: "heroBreath",
    treatment: "hands-only",
    assetStatus: "stand-in",
    notes:
      "STAND-IN: the supplied solo-child image was not in the repo, so this is the existing face-free solo desk photograph. Replace by dropping in ch01-hero-alt-a-v2.webp and setting revision to v2.",
  },
  optionB: {
    label: "Option B - two students, collaborative",
    basePath: `${CHAPTER_1_DIR}/ch01-hero-primary.webp`,
    revision: "v1",
    decorative: true,
    alt: "",
    sceneDescription: "Two students smile at a laptop together at a sunlit wooden desk, one writing in a notebook",
    focalMobile: "80% 50%",
    focalTablet: "68% 50%",
    focalDesktop: "70% 50%",
    motionPreset: "heroBreath",
    treatment: "face-visible",
    assetStatus: "interim",
    notes:
      "Default Chapter 1 hero. Bright, empty left side holds the headline; both faces sit on the right. Native 1672x941 - replace with a 2560x1440 render of the same scene before launch.",
  },
  optionC: {
    label: "Option C - editorial reflective scene",
    basePath: `${CHAPTER_1_DIR}/ch01-hero-alt-b.webp`,
    revision: "v1",
    decorative: true,
    alt: "",
    sceneDescription: "A desk in warm daylight with a globe, stacked books, an open atlas notebook and a tablet",
    focalMobile: "76% 50%",
    focalTablet: "74% 50%",
    focalDesktop: "72% 50%",
    motionPreset: "heroBreath",
    treatment: "hands-only",
    assetStatus: "stand-in",
    notes:
      "STAND-IN: the supplied editorial image was not in the repo, so this is the existing face-free globe-and-books desk photograph. Replace by dropping in ch01-hero-alt-b-v2.webp and setting revision to v2.",
  },
};

/**
 * Marks which candidate is selected and leaves everything else, including
 * `assetStatus`, exactly as written. Pure, so it is tested directly.
 */
export function buildChapterSlots<Option extends string>(
  candidates: Record<Option, SlotCandidate>,
  activeOption: Option,
): { primary: LandingMediaSlot; alternates: Record<Option, LandingMediaSlot> } {
  const alternates = Object.fromEntries(
    (Object.keys(candidates) as Option[]).map((option) => [
      option,
      { ...candidates[option], selection: option === activeOption ? "active" : "alternate" } as LandingMediaSlot,
    ]),
  ) as Record<Option, LandingMediaSlot>;
  return { primary: alternates[activeOption], alternates };
}

const chapter1Intro = buildChapterSlots<Chapter1Option>(chapter1Candidates, CHAPTER_1_ACTIVE_OPTION);

const CHAPTER_2_DIR = "/landing/media/chapter-02-programs";

/**
 * Chapter 2 photography: one slot per programme scene that uses a picture.
 * Curriculum learning and Singapore Maths are DOM/SVG only and have no slot.
 * Each scene has a single candidate today, so each is simply "active"; add
 * further candidates the way Chapter 1 does when the owner supplies options.
 *
 * Every file below is a STAND-IN: an existing face-free campaign photograph
 * copied into the Chapter 2 folder so the layout can be judged. None is the
 * intended scene yet, so none is "interim" or "production".
 */
const chapter2Candidates = {
  naplan: {
    label: "NAPLAN-style: focused practice at a desk",
    basePath: `${CHAPTER_2_DIR}/naplan/ch02-naplan-primary.webp`,
    revision: "v1",
    decorative: true,
    alt: "",
    sceneDescription: "A student seen from behind writes in a notebook beside a laptop on a sunlit desk, with a pot of pencils and stacked books",
    focalMobile: "78% 50%",
    focalTablet: "78% 50%",
    focalDesktop: "82% 50%",
    motionPreset: "sceneSettle",
    treatment: "hands-only",
    assetStatus: "stand-in",
    notes:
      "STAND-IN: the newly generated NAPLAN study image was not in the repository, so this is the existing face-free 'practise' campaign photograph. Replace by adding ch02-naplan-primary-v2.webp and setting revision to v2 (interim if the new render is the intended scene below 2560x1440).",
  },
  icas: {
    label: "ICAS-style: careful reading and reasoning",
    basePath: `${CHAPTER_2_DIR}/icas/ch02-icas-primary.webp`,
    revision: "v1",
    decorative: true,
    alt: "",
    sceneDescription: "A desk with stacked books, a revision timer, a pencil pot and an open notebook, no people",
    focalMobile: "74% 55%",
    focalTablet: "74% 55%",
    focalDesktop: "78% 55%",
    motionPreset: "sceneDrift",
    treatment: "abstract",
    assetStatus: "stand-in",
    notes:
      "STAND-IN: existing face-free 'prepare' campaign photograph. Replace by adding ch02-icas-primary-v2.webp and setting revision to v2.",
  },
  amc: {
    label: "AMC-style: a problem-solving workspace",
    basePath: `${CHAPTER_2_DIR}/amc/ch02-amc-primary.webp`,
    revision: "v1",
    decorative: true,
    alt: "",
    sceneDescription: "A hand writes with a purple pencil in a notebook beside a laptop, geometry sketches on the page",
    focalMobile: "70% 55%",
    focalTablet: "70% 55%",
    focalDesktop: "76% 55%",
    motionPreset: "sceneSettle",
    treatment: "hands-only",
    assetStatus: "stand-in",
    notes:
      "STAND-IN: existing face-free 'understand' campaign photograph. It carries faint handwritten sketches; the final AMC image must have no readable maths. Replace by adding ch02-amc-primary-v2.webp and setting revision to v2.",
  },
  selective: {
    label: "Selective & scholarship preparation: working through a paper together",
    basePath: `${CHAPTER_2_DIR}/selective-scholarships/ch02-selective-primary.webp`,
    revision: "v1",
    decorative: true,
    alt: "",
    sceneDescription: "A parent and a child seen from behind at a laptop, the child pointing at the screen",
    focalMobile: "72% 50%",
    focalTablet: "72% 50%",
    focalDesktop: "76% 50%",
    motionPreset: "sceneDrift",
    treatment: "hands-only",
    assetStatus: "stand-in",
    notes:
      "STAND-IN: existing face-free 'progress' campaign photograph. Replace by adding ch02-selective-primary-v2.webp and setting revision to v2.",
  },
} satisfies Record<string, SlotCandidate>;

export type Chapter2MediaKey = keyof typeof chapter2Candidates;

const chapter2Slots = Object.fromEntries(
  (Object.keys(chapter2Candidates) as Chapter2MediaKey[]).map((key) => [
    key,
    { primary: buildChapterSlots<"primary">({ primary: chapter2Candidates[key] }, "primary").primary },
  ]),
) as Record<Chapter2MediaKey, { primary: LandingMediaSlot }>;

export const landingMedia = {
  chapter1: {
    intro: {
      /** The slot the component renders. Always the active option. */
      primary: chapter1Intro.primary,
      /** Stored candidates. Never loaded by the page; they exist so a swap is one word. */
      alternates: chapter1Intro.alternates,
    },
  },
  chapter2: chapter2Slots,
} as const;
