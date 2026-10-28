import {describe, expect, it} from "vitest";

import {isSingaporeMathsSampleAllowed} from "@/features/flags/singapore-maths-sample";

describe("isSingaporeMathsSampleAllowed", () => {
  it("is ON by default with no environment — selecting the programme just works", () => {
    expect(isSingaporeMathsSampleAllowed({})).toBe(true);
  });

  it("is ON in local development", () => {
    expect(isSingaporeMathsSampleAllowed({NODE_ENV: "development"})).toBe(true);
  });

  it("is ON for a production build that is not a Vercel production deployment", () => {
    expect(isSingaporeMathsSampleAllowed({NODE_ENV: "production"})).toBe(true);
  });

  it("is ON in a Vercel Preview deployment with nothing configured", () => {
    expect(
      isSingaporeMathsSampleAllowed({
        VERCEL_ENV: "preview",
        NODE_ENV: "production",
      }),
    ).toBe(true);
  });

  /*
   * The production refusal is the governance boundary, not a convenience: the
   * 30 pilot items are drafts with no `approvedBy` sign-off. It must hold
   * whatever else is set, so it is asserted against every value that could
   * plausibly be used to try to turn it on.
   */
  for (const [label, override] of [
    ["nothing else set", {}],
    ["the opt-out absent and NODE_ENV production", {NODE_ENV: "production"}],
    ["an explicit truthy flag", {SINGAPORE_MATHS_SAMPLE_ENABLED: "1"}],
    ["an explicit 'true' flag", {SINGAPORE_MATHS_SAMPLE_ENABLED: "true"}],
  ] as const) {
    it(`is OFF on a real Vercel production deployment with ${label}`, () => {
      expect(
        isSingaporeMathsSampleAllowed({VERCEL_ENV: "production", ...override}),
      ).toBe(false);
    });
  }

  it("honours an explicit opt-out outside production", () => {
    expect(
      isSingaporeMathsSampleAllowed({SINGAPORE_MATHS_SAMPLE_ENABLED: "0"}),
    ).toBe(false);
    expect(
      isSingaporeMathsSampleAllowed({
        VERCEL_ENV: "preview",
        SINGAPORE_MATHS_SAMPLE_ENABLED: "false",
      }),
    ).toBe(false);
  });

  it("treats any other value as not an opt-out", () => {
    expect(
      isSingaporeMathsSampleAllowed({SINGAPORE_MATHS_SAMPLE_ENABLED: ""}),
    ).toBe(true);
    expect(
      isSingaporeMathsSampleAllowed({SINGAPORE_MATHS_SAMPLE_ENABLED: "1"}),
    ).toBe(true);
  });
});
