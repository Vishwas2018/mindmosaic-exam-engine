import {describe, expect, it} from "vitest";

import {isSingaporeMathsSampleAllowed} from "@/features/flags/singapore-maths-sample";

describe("sample practice API security posture", () => {
  it("is available by default outside production — no variable to configure", () => {
    expect(isSingaporeMathsSampleAllowed({})).toBe(true);
  });

  it("is refused on Vercel production, so every sample route 404s there", () => {
    expect(
      isSingaporeMathsSampleAllowed({
        VERCEL_ENV: "production",
        NODE_ENV: "production",
      }),
    ).toBe(false);
  });

  it("is refused on Vercel production even when something sets the flag on", () => {
    expect(
      isSingaporeMathsSampleAllowed({
        VERCEL_ENV: "production",
        NODE_ENV: "production",
        SINGAPORE_MATHS_SAMPLE_ENABLED: "1",
      }),
    ).toBe(false);
  });

  it("can be opted out of outside production, for QA of the Coming Soon branch", () => {
    expect(
      isSingaporeMathsSampleAllowed({
        NODE_ENV: "development",
        SINGAPORE_MATHS_SAMPLE_ENABLED: "0",
      }),
    ).toBe(false);
  });
});
