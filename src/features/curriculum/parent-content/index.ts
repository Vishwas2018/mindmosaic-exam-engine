import type {
  CoverageBadgeMeta,
  CoverageBadgeState,
  ParentCurriculumContent,
} from "./types";
import { MATH_LEVEL_3_PARENT_CONTENT } from "./math-level-3";
import { MATH_LEVEL_5_PARENT_CONTENT } from "./math-level-5";
import { ENGLISH_LEVEL_3_PARENT_CONTENT } from "./english-level-3";
import { ENGLISH_LEVEL_5_PARENT_CONTENT } from "./english-level-5";

export * from "./types";
export { MATH_LEVEL_3_PARENT_CONTENT } from "./math-level-3";
export { MATH_LEVEL_5_PARENT_CONTENT } from "./math-level-5";
export { ENGLISH_LEVEL_3_PARENT_CONTENT } from "./english-level-3";
export { ENGLISH_LEVEL_5_PARENT_CONTENT } from "./english-level-5";

export const ALL_PARENT_CURRICULUM_CONTENT: Record<
  string,
  ParentCurriculumContent
> = {
  ...MATH_LEVEL_3_PARENT_CONTENT,
  ...MATH_LEVEL_5_PARENT_CONTENT,
  ...ENGLISH_LEVEL_3_PARENT_CONTENT,
  ...ENGLISH_LEVEL_5_PARENT_CONTENT,
};

/**
 * Retrieve parent-facing presentation content for a given curriculum node code.
 * Falls back to an honest generic presentation model if a code is not yet registered.
 */
export function getParentCurriculumContent(
  officialCode: string,
  nodeLabel?: string,
): ParentCurriculumContent {
  const content = ALL_PARENT_CURRICULUM_CONTENT[officialCode];
  if (content) {
    return content;
  }

  return {
    officialCode,
    whatThisMeans:
      nodeLabel ||
      "This curriculum skill develops foundational knowledge and problem-solving skills for this year level.",
    whyItMatters:
      "Mastering this skill supports overall academic growth and builds confidence in practical problem-solving.",
    homeActivities: [
      {
        title: "Everyday Connection",
        setting: "home",
        description:
          "Discuss where you encounter this skill in everyday home routines, reading, or shopping.",
        estimatedMinutes: 5,
      },
    ],
    isStub: true,
  };
}

/**
 * Resolve official VCAA outbound source URL for a given node code.
 */
export function getVcaaSourceUrl(officialCode: string): string {
  if (officialCode.startsWith("VC2M")) {
    return "https://f10.vcaa.vic.edu.au/learning-areas/mathematics/curriculum";
  }
  if (officialCode.startsWith("VC2E")) {
    return "https://f10.vcaa.vic.edu.au/learning-areas/english/english/curriculum";
  }
  return "https://f10.vcaa.vic.edu.au/";
}

/**
 * Maps the backend coverage count / status to a 6-state parent-facing badge.
 * Honest states:
 * - covered (>=5 questions): "Ready to practise" (success)
 * - partial (1–4 questions): "Partial practice" (warning)
 * - empty (0 questions): "Coming soon" (neutral)
 * - not_assessed: "Not assessed" (neutral)
 * - unverified: "Unverified" (orange)
 * - transitional: "Transitional" (purple)
 */
export function resolveCoverageBadge(
  coverage?: {
    status: "not_assessed" | "none" | "partial" | "covered";
    supportingContentCount: number;
  } | null,
): { state: CoverageBadgeState; meta: CoverageBadgeMeta } {
  if (!coverage) {
    return {
      state: "empty",
      meta: {
        label: "Coming soon",
        description: "Practice questions in development",
        variant: "neutral",
      },
    };
  }

  if (coverage.status === "not_assessed") {
    return {
      state: "not_assessed",
      meta: {
        label: "Not assessed",
        description: "Not directly tested in exam formats",
        variant: "neutral",
      },
    };
  }

  if (coverage.supportingContentCount >= 5 || coverage.status === "covered") {
    return {
      state: "covered",
      meta: {
        label: "Ready to practise",
        description: `${coverage.supportingContentCount} questions available`,
        variant: "success",
      },
    };
  }

  if (coverage.supportingContentCount > 0 || coverage.status === "partial") {
    return {
      state: "partial",
      meta: {
        label: "In development",
        description: `${coverage.supportingContentCount} question${coverage.supportingContentCount === 1 ? "" : "s"} ready`,
        variant: "warning",
      },
    };
  }

  return {
    state: "empty",
    meta: {
      label: "Coming soon",
      description: "No practice questions yet",
      variant: "neutral",
    },
  };
}
