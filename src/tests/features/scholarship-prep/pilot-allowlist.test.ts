import { describe, expect, it } from "vitest";

import {
  getVihaanAllowedUserIds,
  isVihaanParentAllowedFor,
  isVihaanScholarshipPrepEnabledFor,
  resolveAllowlistedVihaanChildId,
} from "@/features/scholarship-prep/lib/vihaan-scholarship-prep";

const on = {
  NODE_ENV: "test" as const,
  VERCEL_ENV: "preview",
  VISHAAN_SCHOLARSHIP_PREP_ENABLED: "1",
  NEXT_PUBLIC_SUPABASE_URL: "https://mfglzabnayacssgertat.supabase.co",
  PRODUCTION_SUPABASE_PROJECT_REF: "uermhsptduikehuyceiz",
  VISHAAN_SCHOLARSHIP_PREP_SUPABASE_REF: "mfglzabnayacssgertat",
};

describe("Vihaan pilot per-account allowlist", () => {
  it("fails closed and denies access when the account allowlist is missing or blank", () => {
    expect(isVihaanScholarshipPrepEnabledFor("any-user", on)).toBe(false);
    expect(isVihaanScholarshipPrepEnabledFor("any-user", { ...on, VISHAAN_SCHOLARSHIP_PREP_ALLOWED_USER_IDS: "   " })).toBe(false);
    expect(isVihaanParentAllowedFor("parent-1", ["child-1"], on)).toBe(false);
    expect(resolveAllowlistedVihaanChildId(["child-1"], on)).toBeNull();
  });

  it("shows the pilot only to listed accounts when an allowlist is configured", () => {
    const env = { ...on, VISHAAN_SCHOLARSHIP_PREP_ALLOWED_USER_IDS: " Child-1 , parent-1 " };
    expect(getVihaanAllowedUserIds(env)).toEqual(new Set(["child-1", "parent-1"]));
    expect(isVihaanScholarshipPrepEnabledFor("child-1", env)).toBe(true);
    expect(isVihaanScholarshipPrepEnabledFor("Child-1", env)).toBe(true);
    expect(isVihaanScholarshipPrepEnabledFor("parent-1", env)).toBe(true);
    expect(isVihaanScholarshipPrepEnabledFor("other-family-child", env)).toBe(false);
    expect(isVihaanScholarshipPrepEnabledFor(null, env)).toBe(false);
  });

  it("supports VIHAAN_SCHOLARSHIP_PREP_ALLOWED_USER_IDS spelling as fallback", () => {
    const env = { ...on, VIHAAN_SCHOLARSHIP_PREP_ALLOWED_USER_IDS: "vihaan-student-1" };
    expect(isVihaanScholarshipPrepEnabledFor("vihaan-student-1", env)).toBe(true);
    expect(isVihaanScholarshipPrepEnabledFor("other-student", env)).toBe(false);
  });

  it("allows linked parents of an allowlisted student and denies unlinked parents", () => {
    const env = { ...on, VISHAAN_SCHOLARSHIP_PREP_ALLOWED_USER_IDS: "vihaan-student-1" };
    expect(isVihaanParentAllowedFor("linked-parent", ["other-child", "vihaan-student-1"], env)).toBe(true);
    expect(resolveAllowlistedVihaanChildId(["other-child", "vihaan-student-1"], env)).toBe("vihaan-student-1");
    expect(isVihaanParentAllowedFor("unlinked-parent", ["other-child"], env)).toBe(false);
    expect(isVihaanParentAllowedFor("unlinked-parent", [], env)).toBe(false);
    expect(isVihaanParentAllowedFor(null, ["vihaan-student-1"], env)).toBe(false);
  });

  it("requires at least one linked child when only a parent ID is listed", () => {
    const env = { ...on, VISHAAN_SCHOLARSHIP_PREP_ALLOWED_USER_IDS: "parent-1" };
    expect(isVihaanParentAllowedFor("parent-1", ["child-1"], env)).toBe(true);
    expect(isVihaanParentAllowedFor("parent-1", [], env)).toBe(false);
    expect(isVihaanParentAllowedFor("other-parent", ["child-1"], env)).toBe(false);
  });

  it("never enables the pilot when the deployment flag is off or in production", () => {
    const env = { ...on, VISHAAN_SCHOLARSHIP_PREP_ENABLED: "0", VISHAAN_SCHOLARSHIP_PREP_ALLOWED_USER_IDS: "child-1,parent-1" };
    expect(isVihaanScholarshipPrepEnabledFor("child-1", env)).toBe(false);
    expect(isVihaanParentAllowedFor("parent-1", ["child-1"], env)).toBe(false);
    expect(isVihaanScholarshipPrepEnabledFor("child-1", { ...env, VISHAAN_SCHOLARSHIP_PREP_ENABLED: "1", VERCEL_ENV: "production" })).toBe(false);
  });
});
