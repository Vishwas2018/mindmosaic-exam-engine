import type { MetadataRoute } from "next";

import { isLiveProgram, PROGRAMS } from "@/features/catalogue/catalogue";
import { STARTABLE_EXAM_PATTERNS } from "@/features/exam-engine/exam-patterns";

const BASE_URL = "https://mindmosaic.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, priority: 1 },
    { url: `${BASE_URL}/practice`, priority: 0.9 },
    { url: `${BASE_URL}/exams`, priority: 0.9 },
    /* The marketing pages the header and footer link to. */
    { url: `${BASE_URL}/learn`, priority: 0.7 },
    { url: `${BASE_URL}/assessments`, priority: 0.7 },
    { url: `${BASE_URL}/exam-preparation`, priority: 0.7 },
    { url: `${BASE_URL}/methodology`, priority: 0.6 },
    { url: `${BASE_URL}/pricing`, priority: 0.6 },
    { url: `${BASE_URL}/resources`, priority: 0.6 },
    { url: `${BASE_URL}/sign-in`, priority: 0.3 },
    { url: `${BASE_URL}/sign-up`, priority: 0.3 },
    { url: `${BASE_URL}/student-sign-in`, priority: 0.3 },
    { url: `${BASE_URL}/billing`, priority: 0.5 },
    { url: `${BASE_URL}/about`, priority: 0.4 },
    { url: `${BASE_URL}/help`, priority: 0.4 },
    { url: `${BASE_URL}/parent-guide`, priority: 0.4 },
    { url: `${BASE_URL}/student-tips`, priority: 0.4 },
    { url: `${BASE_URL}/contact`, priority: 0.3 },
    { url: `${BASE_URL}/privacy`, priority: 0.2 },
    { url: `${BASE_URL}/terms`, priority: 0.2 },
    { url: `${BASE_URL}/accessibility`, priority: 0.2 },
    { url: `${BASE_URL}/assessment-disclaimer`, priority: 0.2 },
  ];

  // Only live programs render a route at all — coming_soon entries are
  // catalogue-only (see resolveLiveProgram in practice/[program]/page.tsx).
  const programRoutes: MetadataRoute.Sitemap = PROGRAMS.filter(
    isLiveProgram,
  ).map((program) => ({
    url: `${BASE_URL}/practice/${program.slug}`,
    priority: 0.8,
  }));

  /* Deferred patterns (the writing tasks) render a "coming soon" page rather
     than a startable one, so they stay out of the sitemap. */
  const patternRoutes: MetadataRoute.Sitemap = STARTABLE_EXAM_PATTERNS.map((pattern) => ({
    url: `${BASE_URL}/exams/${pattern.id}`,
    priority: 0.8,
  }));

  return [...staticRoutes, ...programRoutes, ...patternRoutes];
}
