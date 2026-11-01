import { describe, expect, it } from "vitest";
import { isReviewConsoleAllowed } from "@/features/review-console/preview-gate";

describe("review console dev-only preview gate", () => {
  it("allows access in development mode", () => {
    expect(isReviewConsoleAllowed({ NODE_ENV: "development" })).toBe(true);
    expect(isReviewConsoleAllowed({ NODE_ENV: "test" })).toBe(true);
  });

  it("refuses access in production without the test flag", () => {
    expect(isReviewConsoleAllowed({ NODE_ENV: "production" })).toBe(false);
    expect(isReviewConsoleAllowed({ NODE_ENV: "production", REVIEW_CONSOLE_ENABLED: "0" })).toBe(false);
    expect(isReviewConsoleAllowed({ NODE_ENV: "production", REVIEW_CONSOLE_ENABLED: "false" })).toBe(false);
    expect(isReviewConsoleAllowed({ NODE_ENV: "production", REVIEW_CONSOLE_ENABLED: undefined })).toBe(false);
  });

  it("refuses access whenever VERCEL_ENV is 'production', regardless of flags or NODE_ENV", () => {
    // Real Vercel production deployment must NEVER allow review console
    expect(
      isReviewConsoleAllowed({
        NODE_ENV: "production",
        VERCEL_ENV: "production",
        REVIEW_CONSOLE_ENABLED: "1",
      }),
    ).toBe(false);

    expect(
      isReviewConsoleAllowed({
        NODE_ENV: "development",
        VERCEL_ENV: "production",
      }),
    ).toBe(false);

    expect(
      isReviewConsoleAllowed({
        NODE_ENV: "test",
        VERCEL_ENV: "production",
        REVIEW_CONSOLE_ENABLED: "1",
      }),
    ).toBe(false);
  });

  it("allows access in production builds only when REVIEW_CONSOLE_ENABLED is explicitly '1' and not Vercel production", () => {
    expect(
      isReviewConsoleAllowed({
        NODE_ENV: "production",
        REVIEW_CONSOLE_ENABLED: "1",
      }),
    ).toBe(true);

    expect(
      isReviewConsoleAllowed({
        NODE_ENV: "production",
        VERCEL_ENV: "preview",
        REVIEW_CONSOLE_ENABLED: "1",
      }),
    ).toBe(true);
  });
});
