import { describe, expect, it } from "vitest";

import type { Program } from "@/features/catalogue/catalogue";
import { isProgramLocked } from "@/features/catalogue/entitlement";

const FREE_PROGRAM: Program = {
  id: "free-program",
  slug: "free-program",
  name: "Free program",
  blurb: "blurb",
  status: "live",
};

const PREMIUM_PROGRAM: Program = {
  ...FREE_PROGRAM,
  id: "premium-program",
  slug: "premium-program",
  planTier: "premium",
};

describe("isProgramLocked", () => {
  it("never locks a program with no planTier, regardless of plan", () => {
    expect(isProgramLocked(FREE_PROGRAM, "free")).toBe(false);
    expect(isProgramLocked(FREE_PROGRAM, "premium")).toBe(false);
  });

  it("locks a premium program for a free-plan viewer", () => {
    expect(isProgramLocked(PREMIUM_PROGRAM, "free")).toBe(true);
  });

  it("unlocks a premium program for a premium-plan viewer", () => {
    expect(isProgramLocked(PREMIUM_PROGRAM, "premium")).toBe(false);
  });
});
