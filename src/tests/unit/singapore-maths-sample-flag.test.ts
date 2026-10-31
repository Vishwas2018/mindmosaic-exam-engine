import {describe, expect, it} from "vitest";

import {
  isSingaporeMathsSampleAllowed,
  singaporeMathsSampleAvailability,
} from "@/features/flags/singapore-maths-sample";

const LOCAL = "http://127.0.0.1:54321";
const PREVIEW_PROJECT = "qawbnonprodproject";
const PRODUCTION_PROJECT = "liveprodproject";
const previewUrl = (ref: string) => `https://${ref}.supabase.co`;

/** A Preview deployment configured exactly as the gate requires. */
const GOOD_PREVIEW = {
  VERCEL_ENV: "preview",
  NODE_ENV: "production",
  NEXT_PUBLIC_SUPABASE_URL: previewUrl(PREVIEW_PROJECT),
  SINGAPORE_MATHS_SAMPLE_ENABLED: "1",
  SINGAPORE_MATHS_SAMPLE_SUPABASE_REF: PREVIEW_PROJECT,
  PRODUCTION_SUPABASE_PROJECT_REF: PRODUCTION_PROJECT,
} as const;

/** The same environment minus one variable, for the "unset" cases. */
function without(
  env: Readonly<Record<string, string | undefined>>,
  key: string,
): Record<string, string | undefined> {
  const next = {...env};
  delete next[key];
  return next;
}

describe("singaporeMathsSampleAvailability — Vercel production", () => {
  /*
   * The production refusal is the governance boundary, not a convenience: the
   * 30 pilot items are drafts with no `approvedBy` sign-off. It is asserted
   * against every value that could plausibly be used to try to turn it on.
   */
  for (const [label, override] of [
    ["nothing else set", {}],
    ["a truthy opt-in", {SINGAPORE_MATHS_SAMPLE_ENABLED: "1"}],
    ["a 'true' opt-in", {SINGAPORE_MATHS_SAMPLE_ENABLED: "true"}],
    ["a local Supabase target", {NEXT_PUBLIC_SUPABASE_URL: LOCAL}],
    [
      "a fully valid Preview configuration",
      {...GOOD_PREVIEW, VERCEL_ENV: "production"},
    ],
  ] as const) {
    it(`refuses a real production deployment with ${label}`, () => {
      const result = singaporeMathsSampleAvailability({
        ...override,
        VERCEL_ENV: "production",
      });
      expect(result).toEqual({allowed: false, reason: "vercel_production"});
    });
  }
});

describe("singaporeMathsSampleAvailability — hosted Preview", () => {
  it("allows an opted-in Preview bound to its own non-production project", () => {
    expect(singaporeMathsSampleAvailability(GOOD_PREVIEW)).toEqual({
      allowed: true,
      reason: "preview_opted_in_and_bound",
    });
  });

  it("accepts 'true' as the opt-in as well as '1', and ignores surrounding whitespace", () => {
    expect(
      singaporeMathsSampleAvailability({
        ...GOOD_PREVIEW,
        SINGAPORE_MATHS_SAMPLE_ENABLED: " TRUE ",
        SINGAPORE_MATHS_SAMPLE_SUPABASE_REF: ` ${PREVIEW_PROJECT} `,
      }).allowed,
    ).toBe(true);
  });

  it("refuses when the opt-in is absent — an unset variable never enables Preview", () => {
    expect(
      singaporeMathsSampleAvailability(without(GOOD_PREVIEW, "SINGAPORE_MATHS_SAMPLE_ENABLED")),
    ).toEqual({
      allowed: false,
      reason: "preview_opt_in_missing",
    });
  });

  it("refuses when the opt-in is present but empty", () => {
    expect(
      singaporeMathsSampleAvailability({
        ...GOOD_PREVIEW,
        SINGAPORE_MATHS_SAMPLE_ENABLED: "   ",
      }).reason,
    ).toBe("preview_opt_in_missing");
  });

  it("refuses an opt-in value that is neither the opt-in nor the opt-out", () => {
    expect(
      singaporeMathsSampleAvailability({
        ...GOOD_PREVIEW,
        SINGAPORE_MATHS_SAMPLE_ENABLED: "yes",
      }).reason,
    ).toBe("preview_opt_in_missing");
  });

  it("refuses when the production project ref is not declared, so no comparison is possible", () => {
    expect(
      singaporeMathsSampleAvailability(without(GOOD_PREVIEW, "PRODUCTION_SUPABASE_PROJECT_REF")),
    ).toEqual({
      allowed: false,
      reason: "preview_production_ref_undeclared",
    });
  });

  it("refuses when no project binding is declared", () => {
    expect(
      singaporeMathsSampleAvailability(without(GOOD_PREVIEW, "SINGAPORE_MATHS_SAMPLE_SUPABASE_REF")),
    ).toEqual({
      allowed: false,
      reason: "preview_binding_missing",
    });
  });

  it("refuses when the binding names a different project than the deployment uses", () => {
    expect(
      singaporeMathsSampleAvailability({
        ...GOOD_PREVIEW,
        SINGAPORE_MATHS_SAMPLE_SUPABASE_REF: "someotherproject",
      }),
    ).toEqual({allowed: false, reason: "preview_binding_mismatch"});
  });

  it("refuses when the deployment is pointed at the production project, even bound and opted in", () => {
    expect(
      singaporeMathsSampleAvailability({
        ...GOOD_PREVIEW,
        NEXT_PUBLIC_SUPABASE_URL: previewUrl(PRODUCTION_PROJECT),
        SINGAPORE_MATHS_SAMPLE_SUPABASE_REF: PRODUCTION_PROJECT,
      }),
    ).toEqual({allowed: false, reason: "production_supabase_target"});
  });

  it("refuses when the binding names the production project but the URL does not", () => {
    expect(
      singaporeMathsSampleAvailability({
        ...GOOD_PREVIEW,
        SINGAPORE_MATHS_SAMPLE_SUPABASE_REF: PRODUCTION_PROJECT,
      }).allowed,
    ).toBe(false);
  });

  it("refuses a Preview whose Supabase target cannot be named as a hosted project", () => {
    expect(
      singaporeMathsSampleAvailability({
        ...GOOD_PREVIEW,
        NEXT_PUBLIC_SUPABASE_URL: "https://supabase.internal.example.com",
      }),
    ).toEqual({allowed: false, reason: "supabase_target_unknown"});
  });

  it("refuses a Preview with no Supabase URL at all", () => {
    expect(
      singaporeMathsSampleAvailability(without(GOOD_PREVIEW, "NEXT_PUBLIC_SUPABASE_URL")),
    ).toEqual({
      allowed: false,
      reason: "supabase_target_unknown",
    });
  });

  it("refuses a Preview pointed at a local Supabase host, which it has no business using", () => {
    expect(
      singaporeMathsSampleAvailability({
        ...GOOD_PREVIEW,
        NEXT_PUBLIC_SUPABASE_URL: LOCAL,
      }).allowed,
    ).toBe(false);
  });

  it("honours the opt-out ahead of a valid Preview configuration", () => {
    expect(
      singaporeMathsSampleAvailability({
        ...GOOD_PREVIEW,
        SINGAPORE_MATHS_SAMPLE_ENABLED: "0",
      }),
    ).toEqual({allowed: false, reason: "explicit_opt_out"});
  });
});

describe("singaporeMathsSampleAvailability — off Vercel", () => {
  for (const host of [
    "http://127.0.0.1:54321",
    "http://localhost:54321",
    "https://localhost:54321",
  ]) {
    it(`allows local development against an isolated backend (${host}), with no opt-in`, () => {
      expect(
        singaporeMathsSampleAvailability({NEXT_PUBLIC_SUPABASE_URL: host}),
      ).toEqual({allowed: true, reason: "local_isolated_backend"});
    });
  }

  it("allows a local production build against an isolated backend", () => {
    expect(
      singaporeMathsSampleAvailability({
        NODE_ENV: "production",
        NEXT_PUBLIC_SUPABASE_URL: LOCAL,
      }).allowed,
    ).toBe(true);
  });

  it("refuses local development pointed at a hosted project — including this repo's own .env.local", () => {
    expect(
      singaporeMathsSampleAvailability({
        NEXT_PUBLIC_SUPABASE_URL: previewUrl("somehostedproject"),
      }),
    ).toEqual({allowed: false, reason: "local_backend_not_isolated"});
  });

  it("refuses local development pointed at the production project", () => {
    expect(
      singaporeMathsSampleAvailability({
        NEXT_PUBLIC_SUPABASE_URL: previewUrl(PRODUCTION_PROJECT),
        PRODUCTION_SUPABASE_PROJECT_REF: PRODUCTION_PROJECT,
      }),
    ).toEqual({allowed: false, reason: "production_supabase_target"});
  });

  it("refuses local development with an opt-in but a non-isolated backend", () => {
    expect(
      singaporeMathsSampleAvailability({
        SINGAPORE_MATHS_SAMPLE_ENABLED: "1",
        NEXT_PUBLIC_SUPABASE_URL: previewUrl("somehostedproject"),
      }).allowed,
    ).toBe(false);
  });

  it("honours the opt-out locally", () => {
    expect(
      singaporeMathsSampleAvailability({
        NEXT_PUBLIC_SUPABASE_URL: LOCAL,
        SINGAPORE_MATHS_SAMPLE_ENABLED: "false",
      }),
    ).toEqual({allowed: false, reason: "explicit_opt_out"});
  });
});

describe("singaporeMathsSampleAvailability — fails closed", () => {
  it("refuses an empty environment", () => {
    expect(singaporeMathsSampleAvailability({})).toEqual({
      allowed: false,
      reason: "supabase_target_unknown",
    });
  });

  it("refuses an unparseable Supabase URL", () => {
    expect(
      singaporeMathsSampleAvailability({NEXT_PUBLIC_SUPABASE_URL: "not a url"}),
    ).toEqual({allowed: false, reason: "supabase_target_unknown"});
  });

  for (const deployment of ["development", "staging", "Preview", "PRODUCTION", "prod", "unknown"]) {
    it(`refuses the unrecognised deployment context "${deployment}"`, () => {
      const result = singaporeMathsSampleAvailability({
        ...GOOD_PREVIEW,
        VERCEL_ENV: deployment,
      });
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("unknown_deployment_context");
    });
  }
});

describe("isSingaporeMathsSampleAllowed", () => {
  it("is the boolean of the same decision", () => {
    expect(isSingaporeMathsSampleAllowed(GOOD_PREVIEW)).toBe(true);
    expect(isSingaporeMathsSampleAllowed({NEXT_PUBLIC_SUPABASE_URL: LOCAL})).toBe(true);
    expect(isSingaporeMathsSampleAllowed({})).toBe(false);
    expect(isSingaporeMathsSampleAllowed({VERCEL_ENV: "production"})).toBe(false);
  });
});
