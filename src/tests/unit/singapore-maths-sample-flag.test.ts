import {describe, expect, it} from "vitest";

import {isSingaporeMathsSampleAllowed} from "@/features/flags/singapore-maths-sample";

describe("isSingaporeMathsSampleAllowed", () => {
  it("defaults to OFF with no environment", () => {
    expect(isSingaporeMathsSampleAllowed({})).toBe(false);
  });

  it("is OFF when NODE_ENV is production and no escape hatch", () => {
    expect(isSingaporeMathsSampleAllowed({NODE_ENV: "production"})).toBe(false);
  });

  it("is OFF on real Vercel production even with the escape hatch", () => {
    expect(
      isSingaporeMathsSampleAllowed({
        VERCEL_ENV: "production",
        NODE_ENV: "production",
        SINGAPORE_MATHS_SAMPLE_ENABLED: "1",
      }),
    ).toBe(false);
  });

  it("is ON outside production with the escape hatch", () => {
    expect(
      isSingaporeMathsSampleAllowed({
        NODE_ENV: "development",
        SINGAPORE_MATHS_SAMPLE_ENABLED: "1",
      }),
    ).toBe(true);
  });

  it("is OFF outside production without the escape hatch", () => {
    expect(isSingaporeMathsSampleAllowed({NODE_ENV: "development"})).toBe(false);
  });

  it("is ON in preview (non-production Vercel) with the escape hatch", () => {
    expect(
      isSingaporeMathsSampleAllowed({
        VERCEL_ENV: "preview",
        NODE_ENV: "production",
        SINGAPORE_MATHS_SAMPLE_ENABLED: "1",
      }),
    ).toBe(true);
  });

  it("is OFF in preview without the escape hatch", () => {
    expect(
      isSingaporeMathsSampleAllowed({
        VERCEL_ENV: "preview",
        NODE_ENV: "production",
      }),
    ).toBe(false);
  });
});
