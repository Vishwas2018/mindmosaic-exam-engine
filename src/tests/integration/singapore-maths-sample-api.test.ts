import {describe, expect, it} from "vitest";

import {isSingaporeMathsSampleAllowed} from "@/features/flags/singapore-maths-sample";

describe("sample practice API security posture", () => {
  it("flag is OFF by default — all routes return 404", () => {
    expect(isSingaporeMathsSampleAllowed({})).toBe(false);
  });

  it("flag is OFF in Vercel production even with escape hatch", () => {
    expect(
      isSingaporeMathsSampleAllowed({
        VERCEL_ENV: "production",
        NODE_ENV: "production",
        SINGAPORE_MATHS_SAMPLE_ENABLED: "1",
      }),
    ).toBe(false);
  });

  it("flag can be enabled in non-production with escape hatch", () => {
    expect(
      isSingaporeMathsSampleAllowed({
        NODE_ENV: "development",
        SINGAPORE_MATHS_SAMPLE_ENABLED: "1",
      }),
    ).toBe(true);
  });
});
