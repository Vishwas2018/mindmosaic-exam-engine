import { describe, expect, it, vi } from "vitest";
import { publishedExamBank } from "@/content/questions/practice-bank";

vi.mock("@/server/publication-evidence", () => ({
  getPublicationEligibility: () => ({ problems: [], approvals: new Map() }),
}));
vi.mock("@/features/content-governance/gate-config", async importOriginal => {
  const actual = await importOriginal<typeof import("@/features/content-governance/gate-config")>();
  return {
    ...actual,
    selectServedQuestions: (bank: typeof publishedExamBank, approvals: ReadonlySet<string>) =>
      actual.selectServedQuestions(bank, approvals, Object.fromEntries(
        bank.map(question => [actual.programmeIdForQuestion(question), "enforce" as const]),
      )),
  };
});

import { getExamBank, getQuestionById } from "@/server/exam-bank";

describe("historical authoring reads", () => {
  it("retains an existing marking rubric when all programmes enforce and approvals are empty", () => {
    const essay = publishedExamBank.find(question => question.type === "essay")!;
    expect(essay).toBeDefined();
    expect(getExamBank("published")).toEqual([]);
    expect(getQuestionById(essay.id)).toBe(essay);
  });
});
