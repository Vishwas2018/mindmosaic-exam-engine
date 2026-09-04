import type { CurriculumLearningArea } from "./types";

/**
 * The one registry mapping a learning area to its `/student/learn/[area]`
 * URL slug and back. Explicit, not derived (e.g. `.toLowerCase()`), so a
 * new learning area is a deliberate one-line addition here rather than an
 * implicit routing rule — matching how `PATHWAY_BUILDERS_BY_YEAR_LEVEL`
 * already registers year levels explicitly rather than branching on the
 * number.
 */
const LEARNING_AREA_SLUGS: Readonly<Record<CurriculumLearningArea, string>> = Object.freeze({
  Mathematics: "mathematics",
  English: "english",
});

const SLUG_TO_LEARNING_AREA: ReadonlyMap<string, CurriculumLearningArea> = new Map(
  Object.entries(LEARNING_AREA_SLUGS).map(([area, slug]) => [slug, area as CurriculumLearningArea]),
);

export function learningAreaHref(area: CurriculumLearningArea): string {
  return `/student/learn/${LEARNING_AREA_SLUGS[area]}`;
}

/** Fails closed: an unrecognised slug returns `undefined` rather than
 *  guessing or defaulting to a particular learning area. */
export function learningAreaForSlug(slug: string): CurriculumLearningArea | undefined {
  return SLUG_TO_LEARNING_AREA.get(slug);
}
