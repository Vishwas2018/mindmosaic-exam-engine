import { describe, expect, it } from "vitest";

import { FALLBACK_SITE_ORIGIN, siteOrigin } from "@/lib/site-url";

describe("siteOrigin", () => {
  it("uses the Vercel production host when present", () => {
    expect(siteOrigin({ VERCEL_PROJECT_PRODUCTION_URL: "mindmosaic-exam-engine.vercel.app" })).toBe(
      "https://mindmosaic-exam-engine.vercel.app",
    );
  });

  it("follows a custom production domain without a code change", () => {
    expect(siteOrigin({ VERCEL_PROJECT_PRODUCTION_URL: "www.example.com" })).toBe("https://www.example.com");
  });

  it("tolerates a scheme or trailing slash", () => {
    expect(siteOrigin({ VERCEL_PROJECT_PRODUCTION_URL: "https://www.example.com/" })).toBe("https://www.example.com");
  });

  it("falls back to the verified production domain outside Vercel", () => {
    expect(siteOrigin({})).toBe(FALLBACK_SITE_ORIGIN);
    expect(siteOrigin({ VERCEL_PROJECT_PRODUCTION_URL: "  " })).toBe(FALLBACK_SITE_ORIGIN);
  });

  it("never returns the non-live mindmosaic.app domain", () => {
    expect(FALLBACK_SITE_ORIGIN).not.toContain("mindmosaic.app");
  });
});
