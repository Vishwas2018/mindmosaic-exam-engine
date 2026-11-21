import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const pool = vi.hoisted(() => ({ questions: [] as { id: string; examStyle: string }[], approved: new Set<string>() }));

vi.mock("@/content/questions/practice-bank", async () => {
  const { questionBank } = await import("@/content/questions/question-bank");
  const { loadScholarshipDraftQuestions } = await import("@/tests/helpers/scholarship-published");
  const scholarship = loadScholarshipDraftQuestions("nr");
  pool.questions = [...questionBank.slice(0, 20), ...scholarship];
  pool.approved = new Set(scholarship.map((q) => q.id));
  return { publishedExamBank: pool.questions };
});
vi.mock("@/server/publication-evidence", () => ({
  getPublicationEligibility: () => ({ problems: [], approvals: new Map([...pool.approved].map((id) => [id, {}])) }),
}));

import { GET } from "@/app/api/exam/guest-bank/route";
import { getExamBank, getGuestExamBank } from "@/server/exam-bank";

describe("guest bank", () => {
  it("holds approved scholarship content for signed-in sessions but never for guests", async () => {
    expect(getExamBank("published").filter((q) => q.examStyle === "scholarship_style")).toHaveLength(40);
    expect(getGuestExamBank("published").filter((q) => q.examStyle === "scholarship_style")).toEqual([]);
    expect(getGuestExamBank("curated").filter((q) => q.examStyle === "scholarship_style")).toEqual([]);

    const response = GET();
    expect(response.status).toBe(410);
    expect(await response.json()).toEqual({ error: "guest_bank_retired" });
  });
});
