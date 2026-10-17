import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { isLocalReviewPreviewEnabled } from "@/server/local-review-preview";

describe("local review preview gate", () => {
  it("is off unless explicitly enabled", () => {
    expect(isLocalReviewPreviewEnabled({ NODE_ENV: "development" })).toBe(false);
    expect(isLocalReviewPreviewEnabled({ NODE_ENV: "development", MINDMOSAIC_LOCAL_REVIEW_PREVIEW: "0" })).toBe(false);
  });
  it("is on only for a non-production local process with the flag", () => {
    expect(isLocalReviewPreviewEnabled({ NODE_ENV: "development", MINDMOSAIC_LOCAL_REVIEW_PREVIEW: "1" })).toBe(true);
  });
  it("can never be enabled in a production build or on Vercel, flag or not", () => {
    expect(isLocalReviewPreviewEnabled({ NODE_ENV: "production", MINDMOSAIC_LOCAL_REVIEW_PREVIEW: "1" })).toBe(false);
    expect(isLocalReviewPreviewEnabled({ NODE_ENV: "development", VERCEL: "1", MINDMOSAIC_LOCAL_REVIEW_PREVIEW: "1" })).toBe(false);
    expect(isLocalReviewPreviewEnabled({ NODE_ENV: "development", VERCEL_ENV: "preview", MINDMOSAIC_LOCAL_REVIEW_PREVIEW: "1" })).toBe(false);
  });
});
