import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const fixture = vi.hoisted(() => ({ bank: [] as unknown[] }));

vi.mock("@/server/exam-bank", async () => {
  const { buildAllPatternReadiness } = await import("@/features/exam-engine/exam-patterns");
  return {
    getExamBank: () => fixture.bank,
    getPatternReadiness: () => buildAllPatternReadiness(fixture.bank as never),
  };
});

import { PROGRAMS } from "@/features/catalogue/catalogue";
import { findPaperForCell } from "@/features/exam-engine/exam-patterns";
import {
  GATED_COVERAGE_THRESHOLD,
  getCoverageCell,
  hasGatedCoverage,
  resetCoverageCacheForTests,
  resolveProgramStatuses,
} from "@/features/taxonomy/coverage";
import { loadScholarshipDraftQuestions } from "@/tests/helpers/scholarship-published";

const nr = loadScholarshipDraftQuestions("nr");
const maths = loadScholarshipDraftQuestions("maths");
const program = (slug: string) => PROGRAMS.find((p) => p.slug === slug)!;

describe("scholarship catalogue cells follow whole-paper readiness, not a count threshold", () => {
  beforeEach(() => {
    resetCoverageCacheForTests();
    fixture.bank = [];
  });

  it("finds exactly one whole paper for each scholarship cell and none for other styles", () => {
    expect(findPaperForCell({ yearLevel: 6, examStyle: "scholarship_style", subject: "numerical_reasoning" })?.id).toBe("scholarship-y6-numerical-reasoning-full");
    expect(findPaperForCell({ yearLevel: 6, examStyle: "scholarship_style", subject: "numeracy" })?.id).toBe("scholarship-y6-mathematics-full");
    expect(findPaperForCell({ yearLevel: 6, examStyle: "scholarship_style", subject: "reading" })?.id).toBe("scholarship-y6-reading-full");
    expect(findPaperForCell({ yearLevel: 6, examStyle: "scholarship_style", subject: "verbal_reasoning" })?.id).toBe("scholarship-y6-verbal-reasoning-full");
    expect(findPaperForCell({ yearLevel: 5, examStyle: "naplan_style", subject: "numeracy" })).toBeUndefined();
  });

  it("keeps a scholarship program coming soon when only part of the paper is approved, even above the old threshold", () => {
    fixture.bank = nr.slice(0, GATED_COVERAGE_THRESHOLD + 5);
    expect(getCoverageCell(6, "scholarship_style", "numerical_reasoning")?.gatedCount).toBe(GATED_COVERAGE_THRESHOLD + 5);
    expect(getCoverageCell(6, "scholarship_style", "numerical_reasoning")?.ready).toBe(false);
    expect(resolveProgramStatuses([program("scholarship-y6-numerical-reasoning")])[0].status).toBe("coming_soon");
    expect(hasGatedCoverage(6)).toBe(false);
  });

  it("promotes exactly the sections whose whole paper is approved", () => {
    fixture.bank = [...nr, ...maths.slice(0, 39)];
    expect(resolveProgramStatuses([program("scholarship-y6-numerical-reasoning")])[0].status).toBe("live");
    expect(resolveProgramStatuses([program("scholarship-y6-numeracy")])[0].status).toBe("coming_soon");
    expect(hasGatedCoverage(6)).toBe(true);
  });

  it("does not change how a non-scholarship cell is promoted", () => {
    fixture.bank = [];
    expect(getCoverageCell(5, "naplan_style", "numeracy")?.ready).toBe(false);
  });
});
