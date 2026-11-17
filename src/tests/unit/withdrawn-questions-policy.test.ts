/**
 * Codex P2 on #137: withdrawal must follow the gate POLICY, not array identity. When every authored item is approved,
 * selectServedQuestions() returns the authored array itself even in enforce mode; a withdrawn item must still be
 * excluded from allocation and disclosure.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const pool = vi.hoisted(() => ({ questions: [] as { id: string; examStyle: string }[] }));

vi.mock("@/content/questions/practice-bank", async () => {
  const { questionBank } = await import("@/content/questions/question-bank");
  const { publishedExamBank: real } = await vi.importActual<typeof import("@/content/questions/practice-bank")>(
    "@/content/questions/practice-bank",
  );
  const withdrawn = real.find((q) => q.id === "man-544d2533ffb571a742b0c691")!;
  pool.questions = [...questionBank.slice(0, 5), withdrawn];
  return { publishedExamBank: pool.questions };
});
vi.mock("@/server/publication-evidence", () => ({
  // Every authored item approved: the gate's filter removes nothing.
  getPublicationEligibility: () => ({ problems: [], approvals: new Map(pool.questions.map((q) => [q.id, {}])) }),
}));

describe("withdrawal follows gate policy", () => {
  it("excludes a withdrawn item under enforce even when every item is approved", async () => {
    vi.stubEnv("MM_PUBLICATION_GATE", "enforce");
    const { getExamBank, getGuestExamBank, getResolutionExamBank } = await import("@/server/exam-bank");
    const id = "man-544d2533ffb571a742b0c691";
    for (const bank of ["practice", "published"] as const) {
      expect(getExamBank(bank).some((q) => q.id === id)).toBe(false);
    }
    expect(getGuestExamBank("published").some((q) => q.id === id)).toBe(false);
    expect(getResolutionExamBank("published").some((q) => q.id === id)).toBe(true);
    vi.unstubAllEnvs();
  });
});
