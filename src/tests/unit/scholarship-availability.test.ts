import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { PROGRAMS } from "@/features/catalogue/catalogue";
import { buildAllPatternReadiness } from "@/features/exam-engine/exam-patterns";
import { getPatternReadiness } from "@/server/exam-bank";
import { loadScholarshipDraftQuestions } from "@/tests/helpers/scholarship-published";

/**
 * Catalogue availability must agree with the content actually eligible for release. Today nothing is approved, so
 * every scholarship program is "coming soon". These couplings fail the moment approved content makes a section
 * startable without the catalogue (and the landing copy named in the release plan) being updated with it.
 */
const SECTIONS = [
  { program: "scholarship-y6-verbal-reasoning", pattern: "scholarship-y6-verbal-reasoning-full", section: "vr" },
  { program: "scholarship-y6-numerical-reasoning", pattern: "scholarship-y6-numerical-reasoning-full", section: "nr" },
  { program: "scholarship-y6-reading", pattern: "scholarship-y6-reading-full", section: "rc" },
  { program: "scholarship-y6-numeracy", pattern: "scholarship-y6-mathematics-full", section: "maths" },
] as const;

const status = (slug: string) => PROGRAMS.find((p) => p.slug === slug)?.status;

describe("scholarship catalogue availability agrees with eligible content", () => {
  it("lists every scholarship section and the aggregate card", () => {
    for (const s of SECTIONS) expect(status(s.program), s.program).toBeDefined();
    expect(status("scholarship-prep")).toBeDefined();
  });

  it("marks a section live exactly when its full paper is startable from the real served bank", () => {
    const readiness = getPatternReadiness();
    for (const s of SECTIONS) {
      const startable = readiness[s.pattern]?.state === "ready";
      expect(status(s.program) === "live", `${s.program} live=${status(s.program)} startable=${startable}`).toBe(startable);
    }
  });

  it("marks the aggregate card live only when at least one section is startable", () => {
    const readiness = getPatternReadiness();
    const anyReady = SECTIONS.some((s) => readiness[s.pattern]?.state === "ready");
    expect(status("scholarship-prep") === "live").toBe(anyReady);
  });

  it("does not claim a section that has only some approved items: a partial section is not startable", () => {
    const partial = buildAllPatternReadiness(loadScholarshipDraftQuestions("nr").slice(0, 26));
    expect(partial["scholarship-y6-numerical-reasoning-full"].state).toBe("unavailable");
  });

  it("has nothing live today because nothing is approved", () => {
    for (const s of SECTIONS) expect(status(s.program)).toBe("coming_soon");
    expect(status("scholarship-prep")).toBe("coming_soon");
  });
});
