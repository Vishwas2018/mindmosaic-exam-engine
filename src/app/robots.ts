import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/practice", "/privacy", "/terms", "/accessibility"],
      disallow: [
        "/api",
        "/admin",
        "/parent",
        "/student",
        "/teacher",
        "/exam",
        "/results",
      ],
    },
    sitemap: "https://mindmosaic.app/sitemap.xml",
  };
}
