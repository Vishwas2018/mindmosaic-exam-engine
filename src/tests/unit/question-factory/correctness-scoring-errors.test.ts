import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Verifies that `verifyCandidateCorrectness` never lets a `scoreQuestion()`
 * exception escape as an uncontrolled throw, and never certifies a
 * candidate when scoring fails. Uses `vi.mock` as the narrowest available
 * test seam — `verify-candidate-correctness.ts` intentionally reuses the
 * real scoring engine rather than declaring its own DI parameter, so this
 * is the only way to simulate a scorer failure without weakening
 * production wiring. `vi.mock` is scoped to this test file only: every
 * other test file in the suite still exercises the real `scoreQuestion`.
 */
const scoringMock = vi.hoisted(() => ({
  shouldThrowFor: null as "derived" | "declared" | "all" | null,
  callCount: 0,
}));

vi.mock("@/features/exam-engine/scoring/score-question", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/exam-engine/scoring/score-question")>();
  return {
    ...actual,
    scoreQuestion: vi.fn((question: unknown, response: unknown) => {
      scoringMock.callCount += 1;
      if (scoringMock.shouldThrowFor === "all") {
        throw new Error("simulated scoring engine crash");
      }
      // First invocation inside verifyCandidateCorrectness always scores the
      // declared response; the second (only reached for deterministically
      // verifiable candidates) scores the derived response.
      if (scoringMock.shouldThrowFor === "declared" && scoringMock.callCount === 1) {
        throw new Error("simulated scoring engine crash on declared response");
      }
      if (scoringMock.shouldThrowFor === "derived" && scoringMock.callCount === 2) {
        throw new Error("simulated scoring engine crash on derived response");
      }
      return actual.scoreQuestion(question as never, response as never);
    }),
  };
});

const { verifyCandidateCorrectness } = await import("@/features/question-factory/correctness/verify-candidate-correctness");
const { additionQuestion, buildCorrectnessFixture, VERIFIED_AT } = await import("./correctness-fixtures");

afterEach(() => {
  scoringMock.shouldThrowFor = null;
  scoringMock.callCount = 0;
  vi.clearAllMocks();
});

describe("verifyCandidateCorrectness — scoring-engine exception handling", () => {
  it("produces a scoring_engine_error issue (not an uncaught throw) when scoring the declared response throws", () => {
    scoringMock.shouldThrowFor = "declared";
    const { candidate, structuralEvidence } = buildCorrectnessFixture(additionQuestion());
    const result = verifyCandidateCorrectness(candidate, { verifiedAt: VERIFIED_AT, structuralEvidence });
    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.issues.map((issue) => issue.code)).toContain("scoring_engine_error");
      expect(result.issues.some((issue) => issue.path === "scoring.declared_response")).toBe(true);
    }
  });

  it("produces a scoring_engine_error issue when scoring the derived response throws", () => {
    scoringMock.shouldThrowFor = "derived";
    const { candidate, structuralEvidence } = buildCorrectnessFixture(additionQuestion());
    const result = verifyCandidateCorrectness(candidate, { verifiedAt: VERIFIED_AT, structuralEvidence });
    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.issues.map((issue) => issue.code)).toContain("scoring_engine_error");
      expect(result.issues.some((issue) => issue.path === "scoring.derived_response")).toBe(true);
    }
  });

  it("never certifies a candidate as passed when the scoring engine throws", () => {
    scoringMock.shouldThrowFor = "all";
    const { candidate, structuralEvidence } = buildCorrectnessFixture(additionQuestion());
    const result = verifyCandidateCorrectness(candidate, { verifiedAt: VERIFIED_AT, structuralEvidence });
    expect(result.status).not.toBe("passed");
  });

  it("never leaks the raw exception message or a stack trace into persisted evidence", () => {
    scoringMock.shouldThrowFor = "declared";
    const { candidate, structuralEvidence } = buildCorrectnessFixture(additionQuestion());
    const result = verifyCandidateCorrectness(candidate, { verifiedAt: VERIFIED_AT, structuralEvidence });
    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      for (const issue of result.issues) {
        expect(issue.message).not.toMatch(/at Object\.|at Function\.|\.ts:\d+:\d+/);
      }
    }
  });

  it("does not throw out of verifyCandidateCorrectness itself when scoring fails", () => {
    scoringMock.shouldThrowFor = "all";
    const { candidate, structuralEvidence } = buildCorrectnessFixture(additionQuestion());
    expect(() => verifyCandidateCorrectness(candidate, { verifiedAt: VERIFIED_AT, structuralEvidence })).not.toThrow();
  });
});
