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
 * Imagery rules (docs/design.md section 27): General rule: landing
 * photography must not contain third-party UI, external branding or baked
 * text relied upon for product meaning. Chapter 2 has a documented
 * owner-approved exception for bespoke photography containing MindMosaic-owned
 * laptop UI and MindMosaic branding; semantic product truth remains in the
 * DOM. See docs/landing-media-guide.md.
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

/**
 * Chapter 1 scene photography: six slots, one per story beat, in story order
 * (Learn, Practise, Prepare, Understand, Progress, Explore). These are the Claude
 * Design concept photographs, native 1672x941, used as INTERIM assets until the owner
 * approves 2560x1440 production renders. They carry no baked-in fade: the left-hand
 * readability scrim is CSS. Photographs never zoom or pan in the scroll story.
 */
export const HERO_SCENE_IDS = ["learn", "practise", "prepare", "understand", "progress", "explore"] as const;
export type HeroSceneId = (typeof HERO_SCENE_IDS)[number];

const chapter1SceneCandidates: Record<HeroSceneId, SlotCandidate> = {
  learn: {
    label: "Scene 01 - Learn",
    basePath: `${CHAPTER_1_DIR}/ch01-scene-01-learn.webp`,
    revision: "v1",
    decorative: true,
    alt: "",
    sceneDescription: "Two students discovering an idea together at a sunlit table",
    focalMobile: "72% 45%",
    focalTablet: "72% 45%",
    focalDesktop: "72% 45%",
    motionPreset: "still",
    treatment: "face-visible",
    assetStatus: "interim",
    notes:
      "Native 1672x941 from the Claude Design Chapter 1 prototype; replace with a 2560x1440 render as a new revision. The only face-visible scene.",
  },
  practise: {
    label: "Scene 02 - Practise",
    basePath: `${CHAPTER_1_DIR}/ch01-scene-02-practise.webp`,
    revision: "v1",
    decorative: true,
    alt: "",
    sceneDescription: "A student seen from behind, writing in a notebook at a desk",
    focalMobile: "75% 50%",
    focalTablet: "75% 50%",
    focalDesktop: "75% 50%",
    motionPreset: "still",
    treatment: "hands-only",
    assetStatus: "interim",
    notes:
      "Native 1672x941 from the Claude Design Chapter 1 prototype; replace with a 2560x1440 render as a new revision.",
  },
  prepare: {
    label: "Scene 03 - Prepare",
    basePath: `${CHAPTER_1_DIR}/ch01-scene-03-prepare.webp`,
    revision: "v1",
    decorative: true,
    alt: "",
    sceneDescription: "An ordered study desk with books, a notebook and a simple timer. No people",
    focalMobile: "75% 50%",
    focalTablet: "75% 50%",
    focalDesktop: "75% 50%",
    motionPreset: "still",
    treatment: "hands-only",
    assetStatus: "interim",
    notes:
      "Native 1672x941 from the Claude Design Chapter 1 prototype; replace with a 2560x1440 render as a new revision. No people.",
  },
  understand: {
    label: "Scene 04 - Understand",
    basePath: `${CHAPTER_1_DIR}/ch01-scene-04-understand.webp`,
    revision: "v1",
    decorative: true,
    alt: "",
    sceneDescription: "Close-up of a hand working through steps and diagrams in a notebook",
    focalMobile: "80% 55%",
    focalTablet: "80% 55%",
    focalDesktop: "80% 55%",
    motionPreset: "still",
    treatment: "hands-only",
    assetStatus: "interim",
    notes:
      "Native 1672x941 from the Claude Design Chapter 1 prototype; replace with a 2560x1440 render as a new revision.",
  },
  progress: {
    label: "Scene 05 - Progress",
    basePath: `${CHAPTER_1_DIR}/ch01-scene-05-progress.webp`,
    revision: "v1",
    decorative: true,
    alt: "",
    sceneDescription: "A parent and child seen from behind, reviewing work together",
    focalMobile: "75% 45%",
    focalTablet: "75% 45%",
    focalDesktop: "75% 45%",
    motionPreset: "still",
    treatment: "hands-only",
    assetStatus: "interim",
    notes:
      "Native 1672x941 from the Claude Design Chapter 1 prototype; replace with a 2560x1440 render as a new revision. No readable statistics in frame.",
  },
  explore: {
    label: "Scene 06 - Explore",
    basePath: `${CHAPTER_1_DIR}/ch01-scene-06-explore.webp`,
    revision: "v1",
    decorative: true,
    alt: "",
    sceneDescription: "A study desk with a globe, an open atlas notebook and books",
    focalMobile: "72% 50%",
    focalTablet: "72% 50%",
    focalDesktop: "72% 50%",
    motionPreset: "still",
    treatment: "hands-only",
    assetStatus: "interim",
    notes:
      "Native 1672x941 from the Claude Design Chapter 1 prototype; replace with a 2560x1440 render as a new revision.",
  },
};

const chapter1Scenes = Object.fromEntries(
  HERO_SCENE_IDS.map((id) => [id, buildChapterSlots<"primary">({ primary: chapter1SceneCandidates[id] }, "primary").primary]),
) as Record<HeroSceneId, LandingMediaSlot>;

const CHAPTER_2_DIR = "/landing/media/chapter-02-programs";

/**
 * Chapter 2 photography: one slot per programme scene.
 * All six programme scenes now use owner-approved bespoke campaign photography.
 * Each scene has a single candidate today, so each is simply "active"; add
 * further candidates the way Chapter 1 does when the owner supplies options.
 *
 * Each image is native 1672x941 WebP and marked "interim" until a 2560x1440
 * production render is supplied.
 */
const chapter2Candidates = {
  naplan: {
    label: "NAPLAN-style: focused study session",
    basePath: `${CHAPTER_2_DIR}/naplan/ch02-naplan-primary.webp`,
    revision: "v1",
    decorative: true,
    alt: "",
    sceneDescription:
      "A student seen from behind at a sunlit wooden desk with an open notebook, pencils and a laptop displaying practice assessment problems",
    focalMobile: "60% 48%",
    focalTablet: "58% 46%",
    focalDesktop: "56% 46%",
    motionPreset: "sceneSettle",
    treatment: "hands-only",
    assetStatus: "interim",
    notes:
      "Owner-approved bespoke campaign photograph. Native 1672x941 WebP. Interim status until 2560x1440 production render.",
  },
  icas: {
    label: "ICAS-style: thoughtful extension practice",
    basePath: `${CHAPTER_2_DIR}/icas/ch02-icas-primary.webp`,
    revision: "v1",
    decorative: true,
    alt: "",
    sceneDescription:
      "A student seen from behind at a desk with stacked books and a laptop showing higher-order extension problems",
    focalMobile: "60% 48%",
    focalTablet: "58% 46%",
    focalDesktop: "56% 46%",
    motionPreset: "sceneDrift",
    treatment: "hands-only",
    assetStatus: "interim",
    notes:
      "Owner-approved bespoke campaign photograph. Native 1672x941 WebP. Interim status until 2560x1440 production render.",
  },
  curriculum: {
    label: "Curriculum learning: structured concept lesson",
    basePath: `${CHAPTER_2_DIR}/curriculum/ch02-curriculum-primary.webp`,
    revision: "v1",
    decorative: true,
    alt: "",
    sceneDescription:
      "A student seen from behind studying a structured mathematics lesson on a laptop at a warm home-study desk",
    focalMobile: "60% 48%",
    focalTablet: "58% 46%",
    focalDesktop: "56% 46%",
    motionPreset: "sceneSettle",
    treatment: "hands-only",
    assetStatus: "interim",
    notes:
      "Owner-approved bespoke campaign photograph. Native 1672x941 WebP. Interim status until 2560x1440 production render.",
  },
  amc: {
    label: "AMC-style: competition problem-solving workspace",
    basePath: `${CHAPTER_2_DIR}/amc/ch02-amc-primary.webp`,
    revision: "v1",
    decorative: true,
    alt: "",
    sceneDescription:
      "A student seen from behind working through multi-step pattern problems on a laptop with notebook and pencils on desk",
    focalMobile: "60% 48%",
    focalTablet: "58% 46%",
    focalDesktop: "56% 46%",
    motionPreset: "sceneSettle",
    treatment: "hands-only",
    assetStatus: "interim",
    notes:
      "Owner-approved bespoke campaign photograph. Native 1672x941 WebP. Interim status until 2560x1440 production render.",
  },
  singapore: {
    label: "Singapore Maths: visual model problem solving",
    basePath: `${CHAPTER_2_DIR}/singapore-maths/ch02-singapore-primary.webp`,
    revision: "v1",
    decorative: true,
    alt: "",
    sceneDescription:
      "A student seen from behind at a desk learning bar model problem-solving on a laptop in warm daylight",
    focalMobile: "60% 48%",
    focalTablet: "58% 46%",
    focalDesktop: "56% 46%",
    motionPreset: "sceneDrift",
    treatment: "hands-only",
    assetStatus: "interim",
    notes:
      "Owner-approved bespoke campaign photograph. Native 1672x941 WebP. Interim status until 2560x1440 production render.",
  },
  selective: {
    label: "Selective & scholarship: dedicated preparation workspace",
    basePath: `${CHAPTER_2_DIR}/selective-scholarships/ch02-selective-primary.webp`,
    revision: "v1",
    decorative: true,
    alt: "",
    sceneDescription:
      "A student seen from behind at a sunlit desk working through selective test preparation on a laptop with notebook and study materials",
    focalMobile: "60% 48%",
    focalTablet: "58% 46%",
    focalDesktop: "56% 46%",
    motionPreset: "sceneDrift",
    treatment: "hands-only",
    assetStatus: "interim",
    notes:
      "Owner-approved bespoke campaign photograph. Native 1672x941 WebP. Interim status until 2560x1440 production render.",
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
    /** The six scroll-story scenes, by id; render them in `HERO_SCENE_IDS` order. */
    scenes: chapter1Scenes,
  },
  chapter2: chapter2Slots,
} as const;
