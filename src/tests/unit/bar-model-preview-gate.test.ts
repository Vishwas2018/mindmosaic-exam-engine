import { describe, expect, it } from "vitest";

import { isBarModelPreviewAllowed } from "@/features/visuals/bar-model/preview-gate";

describe("bar-model preview gate", () => {
  it("is open outside production", () => {
    expect(isBarModelPreviewAllowed({ NODE_ENV: "development" })).toBe(true);
    expect(isBarModelPreviewAllowed({ NODE_ENV: "test" })).toBe(true);
  });

  it("is closed in production unless the e2e flag is set", () => {
    expect(isBarModelPreviewAllowed({ NODE_ENV: "production" })).toBe(false);
    expect(isBarModelPreviewAllowed({ NODE_ENV: "production", BAR_MODEL_PREVIEW_ENABLED: "0" })).toBe(false);
    expect(isBarModelPreviewAllowed({ NODE_ENV: "production", BAR_MODEL_PREVIEW_ENABLED: "true" })).toBe(false);
    expect(isBarModelPreviewAllowed({ NODE_ENV: "production", BAR_MODEL_PREVIEW_ENABLED: "1" })).toBe(true);
  });

  it("is closed on Vercel production even with the e2e flag or a non-production NODE_ENV", () => {
    expect(isBarModelPreviewAllowed({ NODE_ENV: "production", VERCEL_ENV: "production", BAR_MODEL_PREVIEW_ENABLED: "1" })).toBe(false);
    expect(isBarModelPreviewAllowed({ NODE_ENV: "development", VERCEL_ENV: "production" })).toBe(false);
    expect(isBarModelPreviewAllowed({ NODE_ENV: "production", VERCEL_ENV: "preview", BAR_MODEL_PREVIEW_ENABLED: "1" })).toBe(true);
  });
});
