import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/practice",
        "/privacy",
        "/terms",
        "/accessibility",
        "/about",
        "/contact",
        "/help",
        // More specific than the "/parent" disallow below (standard
        // robots.txt longest-match-wins), which would otherwise also
        // prefix-match and silently block this real, public page.
        "/parent-guide",
        "/student-tips",
        "/assessment-disclaimer",
      ],
      disallow: [
        "/api",
        "/admin",
        "/parent",
        "/student",
        "/teacher",
        "/exam",
        "/results",
        "/dev",
      ],
    },
    sitemap: "https://mindmosaic.app/sitemap.xml",
  };
}
