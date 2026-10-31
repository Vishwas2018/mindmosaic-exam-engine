import {describe, expect, it} from "vitest";

import {isSingaporeMathsSampleAllowed} from "@/features/flags/singapore-maths-sample";

/*
 * Every sample route — the page, submit, reveal and session — is gated on this
 * one predicate and returns 404 when it is false, so the API's security
 * posture is the gate's posture. The per-reason detail lives in
 * src/tests/unit/singapore-maths-sample-flag.test.ts; this file asserts the
 * postures that matter for the API surface.
 */

const PREVIEW_PROJECT = "qawbnonprodproject";
const PRODUCTION_PROJECT = "liveprodproject";

describe("sample practice API security posture", () => {
  it("routes are closed with no configuration at all", () => {
    expect(isSingaporeMathsSampleAllowed({})).toBe(false);
  });

  it("routes are closed on Vercel production, whatever else is set", () => {
    expect(
      isSingaporeMathsSampleAllowed({
        VERCEL_ENV: "production",
        NODE_ENV: "production",
        NEXT_PUBLIC_SUPABASE_URL: `https://${PREVIEW_PROJECT}.supabase.co`,
        SINGAPORE_MATHS_SAMPLE_ENABLED: "1",
        SINGAPORE_MATHS_SAMPLE_SUPABASE_REF: PREVIEW_PROJECT,
        PRODUCTION_SUPABASE_PROJECT_REF: PRODUCTION_PROJECT,
      }),
    ).toBe(false);
  });

  it("routes are closed on a Preview deployment that was not explicitly opted in", () => {
    expect(
      isSingaporeMathsSampleAllowed({
        VERCEL_ENV: "preview",
        NODE_ENV: "production",
        NEXT_PUBLIC_SUPABASE_URL: `https://${PREVIEW_PROJECT}.supabase.co`,
        SINGAPORE_MATHS_SAMPLE_SUPABASE_REF: PREVIEW_PROJECT,
        PRODUCTION_SUPABASE_PROJECT_REF: PRODUCTION_PROJECT,
      }),
    ).toBe(false);
  });

  it("routes are closed when a deployment points at the production project", () => {
    expect(
      isSingaporeMathsSampleAllowed({
        VERCEL_ENV: "preview",
        NODE_ENV: "production",
        NEXT_PUBLIC_SUPABASE_URL: `https://${PRODUCTION_PROJECT}.supabase.co`,
        SINGAPORE_MATHS_SAMPLE_ENABLED: "1",
        SINGAPORE_MATHS_SAMPLE_SUPABASE_REF: PRODUCTION_PROJECT,
        PRODUCTION_SUPABASE_PROJECT_REF: PRODUCTION_PROJECT,
      }),
    ).toBe(false);
  });

  it("routes are open on a Preview opted in and bound to its own non-production project", () => {
    expect(
      isSingaporeMathsSampleAllowed({
        VERCEL_ENV: "preview",
        NODE_ENV: "production",
        NEXT_PUBLIC_SUPABASE_URL: `https://${PREVIEW_PROJECT}.supabase.co`,
        SINGAPORE_MATHS_SAMPLE_ENABLED: "1",
        SINGAPORE_MATHS_SAMPLE_SUPABASE_REF: PREVIEW_PROJECT,
        PRODUCTION_SUPABASE_PROJECT_REF: PRODUCTION_PROJECT,
      }),
    ).toBe(true);
  });

  it("routes are open against an isolated local backend, as the authenticated e2e suite runs", () => {
    expect(
      isSingaporeMathsSampleAllowed({
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      }),
    ).toBe(true);
  });

  it("routes are closed when a local app is pointed at a remote project", () => {
    expect(
      isSingaporeMathsSampleAllowed({
        NEXT_PUBLIC_SUPABASE_URL: `https://${PREVIEW_PROJECT}.supabase.co`,
      }),
    ).toBe(false);
  });

  it("the opt-out closes the routes where they would otherwise be open", () => {
    expect(
      isSingaporeMathsSampleAllowed({
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
        SINGAPORE_MATHS_SAMPLE_ENABLED: "0",
      }),
    ).toBe(false);
  });
});
