/**
 * Central dynamic media registry for the MindMosaic landing experience.
 *
 * Single source of truth for all campaign photography slots across the landing
 * page. Components must consume media through this registry rather than
 * hardcoding physical filesystem or URL paths.
 *
 * Layout, zoom motion, focal alignments, and proof card collision safeguards
 * are defined per-slot in metadata so assets and treatments can be updated
 * without component code refactoring.
 *
 * Caching & Revision Architecture:
 * Every media slot resolves to a versioned physical asset URL (e.g. `hero-01-learn-v1.webp`).
 * When an asset is replaced in production, incrementing the revision (e.g. `v1` -> `v2`)
 * produces a distinct URL, completely bypassing Next.js image optimizer and CDN edge caches
 * without requiring manual cache purges or disabling optimization.
 */

export type MediaTreatment = "face-visible" | "hands-only" | "abstract";

export type HeroProofPosition = "right-low" | "right-mid" | "hidden";

/**
 * Resolves a versioned physical asset path from a stable base path and revision.
 * Example: `resolveMediaAsset("/landing/media/hero/hero-01-learn", "v1")`
 * -> `"/landing/media/hero/hero-01-learn-v1.webp"`
 */
export function resolveMediaAsset(basePath: string, revision: string = "v1"): string {
  const versionSuffix = revision.startsWith("v") ? revision : `v${revision}`;
  return `${basePath}-${versionSuffix}.webp`;
}

export type HeroMediaSlot = {
  readonly slotId: string;
  readonly basePath: string;
  readonly revision: string;
  readonly src: string;
  readonly alt: string;
  readonly treatment: MediaTreatment;
  readonly focalMobile: string;
  readonly focalTablet: string;
  readonly focalDesktop: string;
  readonly fromScale: number;
  readonly toScale: number;
  readonly proofPosition: HeroProofPosition;
  readonly status: "interim" | "final";
};

export type SectionMediaSlot = {
  readonly slotId: string;
  readonly basePath: string;
  readonly revision: string;
  readonly src: string;
  readonly alt: string;
  readonly treatment: MediaTreatment;
  readonly focalMobile?: string;
  readonly focalTablet?: string;
  readonly focalDesktop?: string;
  readonly status: "interim" | "final";
};

export type LandingMediaRegistry = {
  readonly hero: {
    readonly learn: HeroMediaSlot;
    readonly practise: HeroMediaSlot;
    readonly prepare: HeroMediaSlot;
    readonly understand: HeroMediaSlot;
    readonly progress: HeroMediaSlot;
    readonly explore: HeroMediaSlot;
  };
  readonly productTour: {
    readonly main: SectionMediaSlot;
  };
  readonly programs: {
    readonly main: SectionMediaSlot;
  };
  readonly parents: {
    readonly main: SectionMediaSlot;
  };
};

export const landingMedia: LandingMediaRegistry = {
  hero: {
    learn: {
      slotId: "hero.learn",
      basePath: "/landing/media/hero/hero-01-learn",
      revision: "v1",
      src: resolveMediaAsset("/landing/media/hero/hero-01-learn", "v1"),
      alt: "Two students share a tablet at a sunlit desk, one writing in a notebook",
      treatment: "face-visible",
      focalMobile: "68% 50%",
      focalTablet: "70% 50%",
      focalDesktop: "70% 50%",
      fromScale: 1.035,
      toScale: 1.000,
      proofPosition: "right-low",
      status: "interim",
    },
    practise: {
      slotId: "hero.practise",
      basePath: "/landing/media/hero/hero-02-practise",
      revision: "v1",
      src: resolveMediaAsset("/landing/media/hero/hero-02-practise", "v1"),
      alt: "Over a student's shoulder, a hand writes in a notebook beside a tablet at a bright desk",
      treatment: "hands-only",
      focalMobile: "78% 50%",
      focalTablet: "75% 50%",
      focalDesktop: "75% 50%",
      fromScale: 1.000,
      toScale: 1.025,
      proofPosition: "right-mid",
      status: "interim",
    },
    prepare: {
      slotId: "hero.prepare",
      basePath: "/landing/media/hero/hero-03-prepare",
      revision: "v1",
      src: resolveMediaAsset("/landing/media/hero/hero-03-prepare", "v1"),
      alt: "A calm exam-style study desk with a timer, notebook, books and a laptop",
      treatment: "hands-only",
      focalMobile: "62% 50%",
      focalTablet: "70% 50%",
      focalDesktop: "70% 50%",
      fromScale: 1.030,
      toScale: 1.000,
      proofPosition: "right-low",
      status: "interim",
    },
    understand: {
      slotId: "hero.understand",
      basePath: "/landing/media/hero/hero-04-understand",
      revision: "v1",
      src: resolveMediaAsset("/landing/media/hero/hero-04-understand", "v1"),
      alt: "A hand writing maths working in a spiral notebook beside a pen pot and laptop",
      treatment: "hands-only",
      focalMobile: "78% 50%",
      focalTablet: "75% 50%",
      focalDesktop: "75% 50%",
      fromScale: 1.000,
      toScale: 1.025,
      proofPosition: "right-low",
      status: "interim",
    },
    progress: {
      slotId: "hero.progress",
      basePath: "/landing/media/hero/hero-05-progress",
      revision: "v1",
      src: resolveMediaAsset("/landing/media/hero/hero-05-progress", "v1"),
      alt: "A parent and child sit side by side, seen from behind, looking at a laptop together at a bright desk",
      treatment: "hands-only",
      focalMobile: "74% 50%",
      focalTablet: "68% 50%",
      focalDesktop: "68% 50%",
      fromScale: 1.030,
      toScale: 1.000,
      proofPosition: "right-mid",
      status: "interim",
    },
    explore: {
      slotId: "hero.explore",
      basePath: "/landing/media/hero/hero-06-explore",
      revision: "v1",
      src: resolveMediaAsset("/landing/media/hero/hero-06-explore", "v1"),
      alt: "A desk with a globe, books, an open atlas notebook and a tablet in warm daylight",
      treatment: "hands-only",
      focalMobile: "76% 50%",
      focalTablet: "72% 50%",
      focalDesktop: "72% 50%",
      fromScale: 1.000,
      toScale: 1.025,
      proofPosition: "right-low",
      status: "interim",
    },
  },
  productTour: {
    main: {
      slotId: "productTour.main",
      basePath: "/landing/media/product-tour/product-tour-study",
      revision: "v1",
      src: resolveMediaAsset("/landing/media/product-tour/product-tour-study", "v1"),
      alt: "Over a student's shoulder, a hand writes in a notebook beside a laptop at a bright desk",
      treatment: "hands-only",
      status: "interim",
    },
  },
  programs: {
    main: {
      slotId: "programs.main",
      basePath: "/landing/media/programs/programs-study",
      revision: "v1",
      src: resolveMediaAsset("/landing/media/programs/programs-study", "v1"),
      alt: "",
      treatment: "hands-only",
      status: "interim",
    },
  },
  parents: {
    main: {
      slotId: "parents.main",
      basePath: "/landing/media/parents/parents-progress-review",
      revision: "v1",
      src: resolveMediaAsset("/landing/media/parents/parents-progress-review", "v1"),
      alt: "A parent sits at a laptop while a child writes in a notebook nearby.",
      treatment: "face-visible",
      status: "interim",
    },
  },
} as const;
