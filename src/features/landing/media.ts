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
 */

export type MediaTreatment = "face-visible" | "hands-only" | "abstract";

export type HeroProofPosition = "right-low" | "right-mid" | "hidden";

export type HeroMediaSlot = {
  readonly src: string;
  readonly alt: string;
  readonly treatment: MediaTreatment;
  readonly focalMobile: string;
  readonly focalTablet: string;
  readonly focalDesktop: string;
  readonly fromScale: number;
  readonly toScale: number;
  readonly proofPosition: HeroProofPosition;
  readonly revision: string;
  readonly status: "interim" | "final";
};

export type SectionMediaSlot = {
  readonly src: string;
  readonly alt: string;
  readonly treatment: MediaTreatment;
  readonly focalMobile?: string;
  readonly focalTablet?: string;
  readonly focalDesktop?: string;
  readonly revision: string;
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
      src: "/landing/media/hero/hero-01-learn.webp",
      alt: "Two students share a tablet at a sunlit desk, one writing in a notebook",
      treatment: "face-visible",
      focalMobile: "68% 50%",
      focalTablet: "70% 50%",
      focalDesktop: "70% 50%",
      fromScale: 1.035,
      toScale: 1.000,
      proofPosition: "right-low",
      revision: "2026-10-05-v1",
      status: "interim",
    },
    practise: {
      src: "/landing/media/hero/hero-02-practise.webp",
      alt: "Over a student's shoulder, a hand writes in a notebook beside a tablet at a bright desk",
      treatment: "hands-only",
      focalMobile: "78% 50%",
      focalTablet: "75% 50%",
      focalDesktop: "75% 50%",
      fromScale: 1.000,
      toScale: 1.025,
      proofPosition: "right-mid",
      revision: "2026-10-05-v1",
      status: "interim",
    },
    prepare: {
      src: "/landing/media/hero/hero-03-prepare.webp",
      alt: "A calm exam-style study desk with a timer, notebook, books and a laptop",
      treatment: "hands-only",
      focalMobile: "62% 50%",
      focalTablet: "70% 50%",
      focalDesktop: "70% 50%",
      fromScale: 1.030,
      toScale: 1.000,
      proofPosition: "right-low",
      revision: "2026-10-05-v1",
      status: "interim",
    },
    understand: {
      src: "/landing/media/hero/hero-04-understand.webp",
      alt: "A hand writing maths working in a spiral notebook beside a pen pot and laptop",
      treatment: "hands-only",
      focalMobile: "78% 50%",
      focalTablet: "75% 50%",
      focalDesktop: "75% 50%",
      fromScale: 1.000,
      toScale: 1.025,
      proofPosition: "right-low",
      revision: "2026-10-05-v1",
      status: "interim",
    },
    progress: {
      src: "/landing/media/hero/hero-05-progress.webp",
      alt: "A parent and child sit side by side, seen from behind, looking at a laptop together at a bright desk",
      treatment: "hands-only",
      focalMobile: "74% 50%",
      focalTablet: "68% 50%",
      focalDesktop: "68% 50%",
      fromScale: 1.030,
      toScale: 1.000,
      proofPosition: "right-mid",
      revision: "2026-10-05-v1",
      status: "interim",
    },
    explore: {
      src: "/landing/media/hero/hero-06-explore.webp",
      alt: "A desk with a globe, books, an open atlas notebook and a tablet in warm daylight",
      treatment: "hands-only",
      focalMobile: "76% 50%",
      focalTablet: "72% 50%",
      focalDesktop: "72% 50%",
      fromScale: 1.000,
      toScale: 1.025,
      proofPosition: "right-low",
      revision: "2026-10-05-v1",
      status: "interim",
    },
  },
  productTour: {
    main: {
      src: "/landing/campaign/tour-hands-notebook.webp",
      alt: "Over a student's shoulder, a hand writes in a notebook beside a laptop at a bright desk",
      treatment: "hands-only",
      revision: "2026-10-05-v1",
      status: "interim",
    },
  },
  programs: {
    main: {
      src: "/landing/campaign/programs-hands-laptop.webp",
      alt: "",
      treatment: "hands-only",
      revision: "2026-10-05-v1",
      status: "interim",
    },
  },
  parents: {
    main: {
      src: "/landing/campaign/parent-laptop-clean.webp",
      alt: "A mother and son review learning results together on a laptop at home",
      treatment: "face-visible",
      revision: "2026-10-05-v1",
      status: "interim",
    },
  },
} as const;
