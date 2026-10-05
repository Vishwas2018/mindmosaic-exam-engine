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
 *
 * Cache safety: a file is addressed as `basePath` + `revision`, e.g.
 * `ch01-hero-primary.webp` + `v1` -> `ch01-hero-primary-v1.webp`. A new
 * picture is a new file with a new revision, so a browser or CDN can never
 * serve the old one under the same URL.
 *
 * Imagery rules (docs/design.md section 27): photography only, never fake
 * interface or burned-in logos or text. The real MindMosaic logo is drawn in
 * the DOM. Alt text describes the scene only.
 */

export type MediaStatus = "active" | "alternate" | "stand-in";

/** Docs/design.md section 39.2 budgets face-visible photographs per page. */
export type MediaTreatment = "face-visible" | "hands-only" | "abstract";

/** Named motion recipes; the chapter component owns the numbers for each. */
export type MotionPreset = "cinematic-zoom" | "still";

export interface LandingMediaSlot {
  /** Owner-facing name. */
  label: string;
  /** File path WITHOUT the revision suffix, relative to the site root. */
  basePath: string;
  /** Appended to the file name: `-v1`, `-v2`... Bump it when the picture changes. */
  revision: string;
  alt: string;
  /** CSS `object-position` per breakpoint: keeps the subject on screen when cropped. */
  focalMobile: string;
  focalTablet: string;
  focalDesktop: string;
  motionPreset: MotionPreset;
  status: MediaStatus;
  treatment: MediaTreatment;
  notes: string;
}

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

const chapter1Candidates: Record<Chapter1Option, Omit<LandingMediaSlot, "status">> = {
  optionA: {
    label: "Option A - solo study scene",
    basePath: `${CHAPTER_1_DIR}/ch01-hero-alt-a.webp`,
    revision: "v1",
    alt: "A student in a purple jumper writes in a notebook at a sunlit desk, seen from behind, with a laptop and a pot of pencils",
    focalMobile: "72% 50%",
    focalTablet: "72% 50%",
    focalDesktop: "74% 50%",
    motionPreset: "cinematic-zoom",
    treatment: "hands-only",
    notes:
      "STAND-IN: the supplied solo-child image was not in the repo, so this is the existing face-free solo desk photograph. Replace by dropping in ch01-hero-alt-a-v2.webp and setting revision to v2.",
  },
  optionB: {
    label: "Option B - two students, collaborative",
    basePath: `${CHAPTER_1_DIR}/ch01-hero-primary.webp`,
    revision: "v1",
    alt: "Two students smile at a laptop together at a sunlit wooden desk, one writing in a notebook",
    focalMobile: "80% 50%",
    focalTablet: "68% 50%",
    focalDesktop: "70% 50%",
    motionPreset: "cinematic-zoom",
    treatment: "face-visible",
    notes:
      "Default Chapter 1 hero. Bright, empty left side holds the headline; both faces sit on the right. Native 1672x941 - replace with a 2560x1440 render of the same scene before launch.",
  },
  optionC: {
    label: "Option C - editorial reflective scene",
    basePath: `${CHAPTER_1_DIR}/ch01-hero-alt-b.webp`,
    revision: "v1",
    alt: "A desk in warm daylight with a globe, stacked books, an open atlas notebook and a tablet",
    focalMobile: "76% 50%",
    focalTablet: "74% 50%",
    focalDesktop: "72% 50%",
    motionPreset: "cinematic-zoom",
    treatment: "hands-only",
    notes:
      "STAND-IN: the supplied editorial image was not in the repo, so this is the existing face-free globe-and-books desk photograph. Replace by dropping in ch01-hero-alt-b-v2.webp and setting revision to v2.",
  },
};

function withStatus(option: Chapter1Option): LandingMediaSlot {
  const candidate = chapter1Candidates[option];
  const isStandIn = candidate.notes.startsWith("STAND-IN");
  const status: MediaStatus = option === CHAPTER_1_ACTIVE_OPTION ? "active" : isStandIn ? "stand-in" : "alternate";
  return { ...candidate, status };
}

export const landingMedia = {
  chapter1: {
    intro: {
      /** The slot the component renders. Always the active option. */
      primary: withStatus(CHAPTER_1_ACTIVE_OPTION),
      /** Stored candidates. Never loaded by the page; they exist so a swap is one word. */
      alternates: {
        optionA: withStatus("optionA"),
        optionB: withStatus("optionB"),
        optionC: withStatus("optionC"),
      },
    },
  },
} as const;
