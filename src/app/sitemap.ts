import type { MetadataRoute } from "next";

import { isLiveProgram, PROGRAMS } from "@/features/catalogue/catalogue";

const BASE_URL = "https://mindmosaic.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, priority: 1 },
    { url: `${BASE_URL}/practice`, priority: 0.9 },
    { url: `${BASE_URL}/sign-in`, priority: 0.3 },
    { url: `${BASE_URL}/sign-up`, priority: 0.3 },
    { url: `${BASE_URL}/student-sign-in`, priority: 0.3 },
    { url: `${BASE_URL}/billing`, priority: 0.5 },
    { url: `${BASE_URL}/privacy`, priority: 0.2 },
    { url: `${BASE_URL}/terms`, priority: 0.2 },
    { url: `${BASE_URL}/accessibility`, priority: 0.2 },
  ];

  // Only live programs render a route at all — coming_soon entries are
  // catalogue-only (see resolveLiveProgram in practice/[program]/page.tsx).
  const programRoutes: MetadataRoute.Sitemap = PROGRAMS.filter(
    isLiveProgram,
  ).map((program) => ({
    url: `${BASE_URL}/practice/${program.slug}`,
    priority: 0.8,
  }));

  return [...staticRoutes, ...programRoutes];
}
