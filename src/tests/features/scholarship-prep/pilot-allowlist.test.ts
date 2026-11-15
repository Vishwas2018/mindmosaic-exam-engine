import { describe, expect, it } from "vitest";

import { isVihaanScholarshipPrepEnabledFor } from "@/features/scholarship-prep/lib/vihaan-scholarship-prep";

const on = {
  NODE_ENV: "test" as const,
  VERCEL_ENV: "preview",
  VISHAAN_SCHOLARSHIP_PREP_ENABLED: "1",
  NEXT_PUBLIC_SUPABASE_URL: "https://mfglzabnayacssgertat.supabase.co",
  PRODUCTION_SUPABASE_PROJECT_REF: "uermhsptduikehuyceiz",
  VISHAAN_SCHOLARSHIP_PREP_SUPABASE_REF: "mfglzabnayacssgertat",
};

describe("Vihaan pilot per-account allowlist", () => {
  it("keeps deployment-wide behaviour when no allowlist is set", () => {
    expect(isVihaanScholarshipPrepEnabledFor("any-user", on)).toBe(true);
  });

  it("shows the pilot only to listed accounts when an allowlist is set", () => {
    const env = { ...on, VISHAAN_SCHOLARSHIP_PREP_ALLOWED_USER_IDS: " child-1 , parent-1 " };
    expect(isVihaanScholarshipPrepEnabledFor("child-1", env)).toBe(true);
    expect(isVihaanScholarshipPrepEnabledFor("parent-1", env)).toBe(true);
    expect(isVihaanScholarshipPrepEnabledFor("other-family-child", env)).toBe(false);
    expect(isVihaanScholarshipPrepEnabledFor(null, env)).toBe(false);
  });

  it("never enables the pilot when the deployment flag is off, allowlist or not", () => {
    const env = { ...on, VISHAAN_SCHOLARSHIP_PREP_ENABLED: "0", VISHAAN_SCHOLARSHIP_PREP_ALLOWED_USER_IDS: "child-1" };
    expect(isVihaanScholarshipPrepEnabledFor("child-1", env)).toBe(false);
    expect(isVihaanScholarshipPrepEnabledFor("child-1", { ...on, VERCEL_ENV: "production" })).toBe(false);
  });
});
