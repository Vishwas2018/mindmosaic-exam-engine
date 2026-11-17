/**
 * A-06 / A-11: approved items found defective after approval are withdrawn from serving without touching their
 * revision-bound approval evidence (editing the content would invalidate the evidence and empty the whole bank).
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("withdrawn approved questions", () => {
  it("never serves man-544d2533ffb571a742b0c691 (answer stated in its stem) in enforce mode", async () => {
    vi.stubEnv("MM_PUBLICATION_GATE", "enforce");
    vi.resetModules();
    const { getExamBank, getGuestExamBank, WITHDRAWN_QUESTION_IDS } = await import("@/server/exam-bank");
    const { getPublicationEligibility } = await import("@/server/publication-evidence");

    const id = "man-544d2533ffb571a742b0c691";
    expect(WITHDRAWN_QUESTION_IDS.has(id)).toBe(true);
    // Its approval evidence is still valid — withdrawal is not a governance failure.
    const report = getPublicationEligibility();
    expect(report.problems).toEqual([]);
    expect(report.approvals.has(id)).toBe(true);

    for (const bank of ["practice", "published", "curated"] as const) {
      expect(getExamBank(bank).some((q) => q.id === id)).toBe(false);
    }
    expect(getGuestExamBank("published").some((q) => q.id === id)).toBe(false);
    // Everything else approved is still served.
    expect(getExamBank("published").length).toBe(report.approvals.size - WITHDRAWN_QUESTION_IDS.size);
    vi.unstubAllEnvs();
  });

  it("never serves vihaan-e500-m069 (no correct option)", async () => {
    const { getVerifiedVihaanAllPublishedQuestions, getVerifiedVihaanExpansionPublication } = await import(
      "@/features/scholarship-prep/content/questions/vihaan-pilot-questions"
    );
    expect(getVerifiedVihaanExpansionPublication().ok).toBe(true);
    expect(getVerifiedVihaanAllPublishedQuestions().some((q) => q.id === "vihaan-e500-m069")).toBe(false);
  });
});
